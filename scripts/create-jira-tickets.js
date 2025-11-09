#!/usr/bin/env node

/**
 * Jira Ticket Creation Script
 *
 * This script creates Jira tickets from a JSON file.
 *
 * Requirements:
 * - Node.js 18+
 * - Environment variables set (see .env.jira.example)
 *
 * Usage:
 *   node scripts/create-jira-tickets.js [tickets-file.json]
 *
 * Examples:
 *   node scripts/create-jira-tickets.js scripts/tickets/improvement-backlog.json
 *   node scripts/create-jira-tickets.js scripts/tickets/bugs.json
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const JIRA_URL = process.env.JIRA_URL; // e.g., https://yourcompany.atlassian.net
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY; // e.g., EXP
const ISSUE_TYPE = process.env.JIRA_ISSUE_TYPE || 'Story'; // Story, Task, Bug, etc.

// Validate required environment variables
if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please set: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY');
  console.error('See .env.jira.example for details');
  process.exit(1);
}

// Get tickets file path from command line argument
const ticketsFilePath = process.argv[2] || path.join(__dirname, 'tickets', 'improvement-backlog.json');

// Check if tickets file exists
if (!fs.existsSync(ticketsFilePath)) {
  console.error(`❌ Error: Tickets file not found: ${ticketsFilePath}`);
  console.error('\nUsage:');
  console.error('  node scripts/create-jira-tickets.js [tickets-file.json]');
  console.error('\nExample:');
  console.error('  node scripts/create-jira-tickets.js scripts/tickets/improvement-backlog.json');
  process.exit(1);
}

// Load tickets from JSON file
let tickets;
try {
  const ticketsData = fs.readFileSync(ticketsFilePath, 'utf8');
  tickets = JSON.parse(ticketsData);

  if (!Array.isArray(tickets)) {
    throw new Error('Tickets file must contain an array of ticket objects');
  }

  if (tickets.length === 0) {
    throw new Error('Tickets file is empty');
  }
} catch (error) {
  console.error(`❌ Error loading tickets file: ${error.message}`);
  process.exit(1);
}

/**
 * Convert plain text/markdown description to Atlassian Document Format (ADF)
 * Supports basic formatting: headers, lists, code blocks
 */
function convertToADF(text) {
  const lines = text.split('\n');
  const content = [];
  let currentList = null;
  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('{code')) {
      inCodeBlock = true;
      // Extract language if specified: {code:javascript}
      const match = line.match(/\{code:?(\w+)?\}/);
      codeLanguage = match?.[1] || '';
      continue;
    }
    if (line === '{code}' && inCodeBlock) {
      inCodeBlock = false;
      content.push({
        type: 'codeBlock',
        attrs: codeLanguage ? { language: codeLanguage } : {},
        content: [{ type: 'text', text: codeContent.join('\n') }]
      });
      codeContent = [];
      codeLanguage = '';
      continue;
    }
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Close current list if we're not in a list anymore
    if (currentList && !line.trim().startsWith('*') && !line.trim().startsWith('[ ]')) {
      content.push(currentList);
      currentList = null;
    }

    // Empty lines
    if (line.trim() === '') {
      if (!currentList) {
        content.push({ type: 'paragraph', content: [] });
      }
      continue;
    }

    // Headers: h3. Header Text
    if (line.match(/^h\d\.\s/)) {
      const level = parseInt(line[1]);
      const text = line.substring(4);
      content.push({
        type: 'heading',
        attrs: { level },
        content: [{ type: 'text', text }]
      });
      continue;
    }

    // Bulleted lists with checkboxes: * [ ] Item
    if (line.trim().startsWith('* [ ]')) {
      const text = line.trim().substring(6);
      if (!currentList) {
        currentList = { type: 'bulletList', content: [] };
      }
      currentList.content.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: '☐ ' + text }]
        }]
      });
      continue;
    }

    // Regular bulleted lists: * Item
    if (line.trim().startsWith('*')) {
      const text = line.trim().substring(2);
      if (!currentList) {
        currentList = { type: 'bulletList', content: [] };
      }
      currentList.content.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text }]
        }]
      });
      continue;
    }

    // Regular paragraphs with inline formatting
    const paragraphContent = [];
    let currentText = line;

    // Handle {{monospace}} formatting
    const monoRegex = /\{\{([^}]+)\}\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = monoRegex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: currentText.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'text',
        text: match[1],
        marks: [{ type: 'code' }]
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < currentText.length) {
      parts.push({ type: 'text', text: currentText.substring(lastIndex) });
    }

    content.push({
      type: 'paragraph',
      content: parts.length > 0 ? parts : [{ type: 'text', text: currentText }]
    });
  }

  // Close any remaining list
  if (currentList) {
    content.push(currentList);
  }

  return {
    version: 1,
    type: 'doc',
    content
  };
}

/**
 * Make authenticated request to Jira API
 */
function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const url = new URL(path, JIRA_URL);

    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Create a single Jira issue
 */
async function createIssue(ticket) {
  const issue = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY,
      },
      summary: ticket.summary,
      description: convertToADF(ticket.description),
      issuetype: {
        name: ticket.issueType || ISSUE_TYPE,
      },
    },
  };

  // Add optional fields if present
  if (ticket.priority) {
    issue.fields.priority = { name: ticket.priority };
  }

  if (ticket.labels && Array.isArray(ticket.labels)) {
    issue.fields.labels = ticket.labels;
  }

  if (ticket.assignee) {
    issue.fields.assignee = { name: ticket.assignee };
  }

  if (ticket.reporter) {
    issue.fields.reporter = { name: ticket.reporter };
  }

  if (ticket.components && Array.isArray(ticket.components)) {
    issue.fields.components = ticket.components.map(name => ({ name }));
  }

  // Add story points if field exists (custom field ID varies by Jira instance)
  // Uncomment and update the field ID if you want story points:
  // if (ticket.storyPoints) {
  //   issue.fields['customfield_10016'] = ticket.storyPoints;
  // }

  try {
    const result = await jiraRequest('POST', '/rest/api/3/issue', issue);
    return result;
  } catch (error) {
    throw new Error(`Failed to create ticket "${ticket.summary}": ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating Jira tickets...\n');
  console.log(`📍 Jira URL: ${JIRA_URL}`);
  console.log(`📦 Project: ${JIRA_PROJECT_KEY}`);
  console.log(`📧 User: ${JIRA_EMAIL}`);
  console.log(`📋 Tickets file: ${ticketsFilePath}`);
  console.log(`🎫 Issue type: ${ISSUE_TYPE}`);
  console.log(`📊 Total tickets: ${tickets.length}\n`);

  const results = [];
  const errors = [];

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const num = i + 1;

    try {
      console.log(`[${num}/${tickets.length}] Creating: ${ticket.summary}...`);
      const result = await createIssue(ticket);
      results.push(result);
      console.log(`✅ Created: ${result.key} - ${JIRA_URL}/browse/${result.key}\n`);

      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
      errors.push({ ticket: ticket.summary, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully created: ${results.length}/${tickets.length} tickets`);

  if (errors.length > 0) {
    console.log(`❌ Failed: ${errors.length} tickets\n`);
    errors.forEach(({ ticket, error }) => {
      console.log(`  - ${ticket}`);
      console.log(`    ${error}`);
    });
  }

  if (results.length > 0) {
    console.log('\n📋 Created Tickets:');
    results.forEach(result => {
      console.log(`  ${result.key}: ${JIRA_URL}/browse/${result.key}`);
    });
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

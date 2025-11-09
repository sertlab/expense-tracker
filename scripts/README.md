# Jira Ticket Creation Script

This script automatically creates Jira tickets for the ExpenseTracker improvement backlog.

## Prerequisites

- Node.js 18 or higher
- Jira Cloud account
- Jira API token

## Setup

### 1. Create Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Give it a name (e.g., "ExpenseTracker Script")
4. Copy the generated token (you won't be able to see it again!)

### 2. Configure Environment Variables

Create a `.env.jira` file in the project root:

```bash
cp .env.jira.example .env.jira
```

Edit `.env.jira` and fill in your details:

```bash
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your.email@example.com
JIRA_API_TOKEN=your_api_token_here
JIRA_PROJECT_KEY=EXP
```

**Important:** Never commit `.env.jira` to git (it's already in `.gitignore`)

### 3. Load Environment Variables

Before running the script, load the environment variables:

```bash
# Option 1: Export variables manually
export $(cat .env.jira | xargs)

# Option 2: Use dotenv (if you have it installed)
# node -r dotenv/config scripts/create-jira-tickets.js

# Option 3: Source the file (bash/zsh)
source <(cat .env.jira | sed 's/^/export /')
```

## Usage

Run the script with a tickets JSON file:

```bash
# Make sure environment variables are loaded first!
source scripts/load-env.sh

# Run with default tickets file (improvement-backlog.json)
node scripts/create-jira-tickets.js

# Or specify a custom tickets file
node scripts/create-jira-tickets.js scripts/tickets/bugs.json
node scripts/create-jira-tickets.js scripts/tickets/my-tickets.json
```

### What It Does

The script will:
1. Load tickets from the specified JSON file (or default to `scripts/tickets/improvement-backlog.json`)
2. Connect to your Jira instance
3. Create Story/Task/Bug tickets based on the JSON data
4. Set priority levels, labels, and other fields
5. Include detailed descriptions with acceptance criteria
6. Print the ticket URLs when done
7. Handle errors gracefully and report failed tickets

### Expected Output

```
🚀 Creating Jira tickets for ExpenseTracker improvements...

📍 Jira URL: https://yourcompany.atlassian.net
📦 Project: EXP
📧 User: your.email@example.com

[1/15] Creating: Add Loading States & Error Handling...
✅ Created: EXP-123 - https://yourcompany.atlassian.net/browse/EXP-123

[2/15] Creating: Add Unit and E2E Tests...
✅ Created: EXP-124 - https://yourcompany.atlassian.net/browse/EXP-124

...

✅ Successfully created: 15/15 tickets

📋 Created Tickets:
  EXP-123: https://yourcompany.atlassian.net/browse/EXP-123
  EXP-124: https://yourcompany.atlassian.net/browse/EXP-124
  ...
```

## Creating Your Own Tickets

### Tickets JSON Format

Create a JSON file in `scripts/tickets/` with the following structure:

```json
[
  {
    "summary": "Ticket Title",
    "description": "Jira Wiki Markup formatted description",
    "priority": "High",
    "labels": ["label1", "label2"],
    "issueType": "Story",
    "storyPoints": 5,
    "assignee": "username",
    "components": ["Backend", "Frontend"]
  }
]
```

**Required fields:**
- `summary`: Ticket title (string)
- `description`: Ticket description in Jira Wiki Markup format (string)

**Optional fields:**
- `priority`: "Highest", "High", "Medium", "Low", "Lowest" (default: none)
- `labels`: Array of label strings (default: [])
- `issueType`: "Story", "Task", "Bug", "Epic" (default: from env var or "Story")
- `storyPoints`: Number (default: none, requires custom field configuration)
- `assignee`: Jira username (default: unassigned)
- `reporter`: Jira username (default: API user)
- `components`: Array of component names (default: [])

### Default Tickets (improvement-backlog.json)

The default tickets file creates 15 improvement stories:

**High Priority (4 tickets):**
1. Add Loading States & Error Handling
2. Add Unit and E2E Tests
3. Improve UI/UX with CSS Framework
4. Add Month Navigation to Dashboard

**Medium Priority (5 tickets):**
5. Build Analytics Dashboard with Charts
6. Enhanced Expense Search and Filtering
7. Add Pagination for Expense List
8. Export Expenses to CSV
9. Receipt Upload and Storage

**Nice to Have (6 tickets):**
10. Support Recurring Expenses
11. Budget Limits and Alerts
12. Multi-Currency Support
13. Shared/Split Expenses
14. Add Storybook Component Documentation
15. Implement React Query for API Caching

### Creating Additional Ticket Files

```bash
# Create a new tickets file
cat > scripts/tickets/bugs.json << 'EOF'
[
  {
    "summary": "Fix login redirect issue",
    "description": "h3. Bug Description\nUsers are redirected to wrong page after login",
    "priority": "High",
    "issueType": "Bug",
    "labels": ["authentication", "bug"]
  }
]
EOF

# Run it
source scripts/load-env.sh
node scripts/create-jira-tickets.js scripts/tickets/bugs.json
```

## Customization

### Adding Story Points

If your Jira instance has story points enabled, uncomment and update line 289 in the script:

```javascript
// Find the custom field ID for story points in your Jira
// Usually it's customfield_10016, but check your Jira settings
issue.fields['customfield_10016'] = ticket.storyPoints;
```

To find your custom field ID:
1. Go to Jira → Settings → Issues → Custom fields
2. Find "Story Points" and note the ID

### Changing Default Issue Type

Set the `JIRA_ISSUE_TYPE` environment variable in `.env.jira`:

```bash
# Default is "Story", but you can change it to Task, Bug, etc.
JIRA_ISSUE_TYPE=Task
```

Or override per-ticket in the JSON file using the `issueType` field.

## Troubleshooting

### "Authentication failed"
- Check your email and API token are correct
- Ensure your API token hasn't expired
- Verify you have permission to create issues in the project

### "Project not found"
- Verify your `JIRA_PROJECT_KEY` is correct (must be uppercase)
- Ensure you have access to the project

### "Issue type 'Story' not found"
- Your project might not have the "Story" issue type
- Edit the script and change line 271 to use "Task" instead:
  ```javascript
  issuetype: { name: 'Task' }
  ```

### Rate Limiting
The script includes a 500ms delay between requests to avoid rate limits. If you still hit limits, increase the delay on line 338.

## Security Notes

- **Never commit `.env.jira`** - it contains sensitive credentials
- API tokens have the same permissions as your user account
- Consider creating a dedicated service account for automation
- Revoke API tokens when no longer needed

## Support

For issues with:
- **The script**: Check the error message and verify your credentials
- **Jira API**: See [Jira Cloud REST API docs](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- **ExpenseTracker**: Refer to project documentation

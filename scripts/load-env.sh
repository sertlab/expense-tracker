#!/bin/bash

# Load environment variables from .env.jira file
# Usage: source scripts/load-env.sh

if [ ! -f .env.jira ]; then
  echo "❌ Error: .env.jira file not found"
  echo "Please create it from .env.jira.example:"
  echo "  cp .env.jira.example .env.jira"
  echo "  # Then edit .env.jira with your credentials"
  exit 1
fi

# Export variables, ignoring comments and empty lines
export $(grep -v '^#' .env.jira | grep -v '^$' | xargs)

echo "✅ Environment variables loaded from .env.jira"
echo ""
echo "Loaded variables:"
echo "  JIRA_URL: ${JIRA_URL}"
echo "  JIRA_EMAIL: ${JIRA_EMAIL}"
echo "  JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:10}..." # Show only first 10 chars for security
echo "  JIRA_PROJECT_KEY: ${JIRA_PROJECT_KEY}"
echo ""

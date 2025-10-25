# Expense Tracker GraphQL API

AppSync GraphQL API for expense tracking with DynamoDB backend.

**Infrastructure**: Native CloudFormation resources (no plugins for AppSync)
**Build**: TypeScript compilation with serverless-plugin-typescript

## Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **Node.js 20.x** installed

3. **Dependencies installed**:
   ```bash
   pnpm install
   ```

## Deployment

### Deploy to AWS

```bash
# Deploy to dev stage (default)
npx nx deploy app-graphql-api

# Or from the stack directory
cd stacks/app-graphql-api
serverless deploy --stage dev

# Deploy to other stages
serverless deploy --stage staging
serverless deploy --stage prod
```

### View Deployment Info

```bash
npx nx info app-graphql-api

# Or
cd stacks/app-graphql-api
serverless info --stage dev
```

### Remove Stack

```bash
npx nx remove app-graphql-api

# Or
cd stacks/app-graphql-api
serverless remove --stage dev
```

## After Deployment

The deployment will output:
- **GraphQLEndpoint**: Your AppSync API URL
- **GraphQLApiKey**: API Key for authentication

Example output:
```
GraphQLEndpoint: https://abc123xyz.appsync-api.eu-west-2.amazonaws.com/graphql
GraphQLApiKey: da2-xxxxxxxxxxxxxxxxxxxxx
```

## Testing the API

### Using AWS AppSync Console

1. Go to AWS Console → AppSync
2. Select your API (`expense-tracker-api-dev`)
3. Click "Queries" in the left sidebar
4. Use the GraphQL playground

### Using curl

```bash
# Set your endpoint and API key
export GRAPHQL_ENDPOINT="https://your-api-url.appsync-api.eu-west-2.amazonaws.com/graphql"
export API_KEY="your-api-key"

# Create an expense
curl -X POST $GRAPHQL_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "mutation CreateExpense($input: CreateExpenseInput!) { createExpense(input: $input) { expenseId userId amountMinor currency category note occurredAt monthKey createdAt } }",
    "variables": {
      "input": {
        "userId": "user123",
        "amountMinor": 4500,
        "currency": "USD",
        "category": "Food",
        "note": "Lunch at restaurant",
        "occurredAt": "2025-10-25T12:30:00Z"
      }
    }
  }'

# Query expenses by month
curl -X POST $GRAPHQL_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query GetExpenses($userId: ID!, $month: String!) { expensesByMonth(userId: $userId, month: $month) { expenseId userId amountMinor currency category note occurredAt monthKey createdAt } }",
    "variables": {
      "userId": "user123",
      "month": "2025-10"
    }
  }'
```

### Example GraphQL Queries

**Create Expense:**
```graphql
mutation CreateExpense($input: CreateExpenseInput!) {
  createExpense(input: $input) {
    expenseId
    userId
    amountMinor
    currency
    category
    note
    occurredAt
    monthKey
    createdAt
  }
}

# Variables:
{
  "input": {
    "userId": "user123",
    "amountMinor": 4500,
    "currency": "USD",
    "category": "Food",
    "note": "Lunch at restaurant",
    "occurredAt": "2025-10-25T12:30:00Z"
  }
}
```

**Query Expenses by Month:**
```graphql
query GetExpenses($userId: ID!, $month: String!) {
  expensesByMonth(userId: $userId, month: $month) {
    expenseId
    userId
    amountMinor
    currency
    category
    note
    occurredAt
    monthKey
    createdAt
  }
}

# Variables:
{
  "userId": "user123",
  "month": "2025-10"
}
```

## Architecture Overview

This stack uses:
- **Serverless Framework v3** with TypeScript configuration
- **Native CloudFormation resources** for AppSync (GraphQL API, Schema, API Key, Data Sources, Resolvers)
- **serverless-plugin-typescript** for building Lambda functions
- **IAM roles** for least-privilege access (Lambdas → DynamoDB, AppSync → Lambdas)

### DynamoDB Table Structure

**Table: `expenses-{stage}`**
- **PK**: `userId` (String)
- **SK**: `expenseId` (String, format: `YYYY-MM-DD#uuid`)
- **GSI1**:
  - **GSI1PK**: `userId#monthKey` (e.g., `user123#2025-10`)
  - **GSI1SK**: `occurredAt` (ISO 8601 timestamp)

### Lambda Functions

1. **createExpense**: Creates a new expense
   - Validates input with Zod
   - Generates expenseId and computes monthKey
   - Writes to DynamoDB

2. **listExpensesByMonth**: Lists expenses for a user in a specific month
   - Validates userId and month format
   - Queries GSI1 by userId#monthKey
   - Returns expenses in chronological order

### IAM Permissions

Least-privilege IAM policies:
- `dynamodb:PutItem` (createExpense)
- `dynamodb:GetItem` (both)
- `dynamodb:Query` (listExpensesByMonth on table + GSI1)

## Logs

View Lambda logs:
```bash
# Create expense function logs
npx nx logs app-graphql-api

# Or specific function
cd stacks/app-graphql-api
serverless logs --function createExpense --stage dev --tail

# List expenses function logs
serverless logs --function listExpensesByMonth --stage dev --tail
```

## Troubleshooting

### Deployment fails with authentication error
```bash
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Can't find the API after deployment
```bash
# Get deployment info
serverless info --stage dev
```

### Validation errors
- Ensure `occurredAt` is a valid ISO 8601 date string
- Ensure `month` is in `YYYY-MM` format
- Ensure `currency` is exactly 3 characters
- Ensure `amountMinor` is a positive integer

## Cost Considerations

- **DynamoDB**: PAY_PER_REQUEST (pay per read/write)
- **Lambda**: Free tier: 1M requests/month, 400,000 GB-seconds
- **AppSync**: Free tier: 250,000 query/mutation requests per month
- **API Key**: Free (included with AppSync)

Estimated cost for low usage: ~$0-5/month

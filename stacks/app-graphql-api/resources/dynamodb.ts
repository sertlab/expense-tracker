import type { AWS } from '@serverless/typescript';

export const dynamoDbResources = {
  // DynamoDB Expenses Table
  ExpenseTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: 'expenses-${sls:stage}',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'userId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'expenseId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'GSI1PK',
          AttributeType: 'S',
        },
        {
          AttributeName: 'GSI1SK',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'expenseId',
          KeyType: 'RANGE',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            {
              AttributeName: 'GSI1PK',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'GSI1SK',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    },
  },

  // DynamoDB Users Table
  UsersTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: 'users-${sls:stage}',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'userId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'email',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            {
              AttributeName: 'email',
              KeyType: 'HASH',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    },
  },
};
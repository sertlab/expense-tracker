import type { AWS } from '@serverless/typescript';

export const outputs = {
  GraphQLEndpoint: {
    Description: 'AppSync GraphQL API Endpoint',
    Value: {
      'Fn::GetAtt': ['GraphQLApi', 'GraphQLUrl'],
    },
    Export: {
      Name: 'expense-tracker-api-${sls:stage}-graphql-url',
    },
  },
};
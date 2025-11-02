import type { AWS } from '@serverless/typescript';
import { readFileSync } from 'fs';
import { join } from 'path';

const graphqlSchema = readFileSync(
  join(__dirname, '../schema.graphql'),
  'utf-8'
);

export const appSyncResources = {
  // AppSync GraphQL API
  GraphQLApi: {
    Type: 'AWS::AppSync::GraphQLApi',
    Properties: {
      Name: 'expense-tracker-api-${sls:stage}',
      AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
      UserPoolConfig: {
        UserPoolId: {
          'Fn::ImportValue': 'expense-tracker-${sls:stage}-UserPoolId',
        },
        AwsRegion: '${aws:region}',
        DefaultAction: 'ALLOW',
      },
    },
  },

  // AppSync GraphQL Schema
  GraphQLSchema: {
    Type: 'AWS::AppSync::GraphQLSchema',
    Properties: {
      ApiId: {
        'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
      },
      Definition: graphqlSchema,
    },
  },
};
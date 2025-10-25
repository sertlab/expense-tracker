import type { AWS } from '@serverless/typescript';
import { readFileSync } from 'fs';
import { join } from 'path';

const graphqlSchema = readFileSync(
  join(__dirname, '../schema.graphql'),
  'utf-8'
);

const resources: AWS['resources'] = {
  Resources: {
    // DynamoDB Table
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

    // AppSync GraphQL API
    GraphQLApi: {
      Type: 'AWS::AppSync::GraphQLApi',
      Properties: {
        Name: 'expense-tracker-api-${sls:stage}',
        AuthenticationType: 'API_KEY',
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

    // AppSync API Key
    GraphQLApiKey: {
      Type: 'AWS::AppSync::ApiKey',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Description: 'API Key for ${sls:stage}',
        Expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
      },
    },

    // IAM Role for AppSync to invoke Lambda
    AppSyncLambdaRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'appsync.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Policies: [
          {
            PolicyName: 'AppSyncLambdaInvokePolicy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'lambda:InvokeFunction',
                  Resource: [
                    {
                      'Fn::GetAtt': ['CreateExpenseLambdaFunction', 'Arn'],
                    },
                    {
                      'Fn::GetAtt': ['ListExpensesByMonthLambdaFunction', 'Arn'],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },

    // Data Source for createExpense Lambda
    CreateExpenseDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'CreateExpenseDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['CreateExpenseLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Data Source for listExpensesByMonth Lambda
    ListExpensesByMonthDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'ListExpensesByMonthDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['ListExpensesByMonthLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Resolver for Mutation.createExpense
    CreateExpenseResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Mutation',
        FieldName: 'createExpense',
        DataSourceName: {
          'Fn::GetAtt': ['CreateExpenseDataSource', 'Name'],
        },
      },
    },

    // Resolver for Query.expensesByMonth
    ExpensesByMonthResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Query',
        FieldName: 'expensesByMonth',
        DataSourceName: {
          'Fn::GetAtt': ['ListExpensesByMonthDataSource', 'Name'],
        },
      },
    },
  },
  Outputs: {
    GraphQLEndpoint: {
      Description: 'AppSync GraphQL API Endpoint',
      Value: {
        'Fn::GetAtt': ['GraphQLApi', 'GraphQLUrl'],
      },
      Export: {
        Name: 'expense-tracker-api-${sls:stage}-graphql-url',
      },
    },
    GraphQLApiKey: {
      Description: 'AppSync API Key',
      Value: {
        'Fn::GetAtt': ['GraphQLApiKey', 'ApiKey'],
      },
      Export: {
        Name: 'expense-tracker-api-${sls:stage}-api-key',
      },
    },
  },
};

export default resources;

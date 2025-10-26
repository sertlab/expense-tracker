import type { AWS } from '@serverless/typescript';
import { readFileSync } from 'fs';
import { join } from 'path';

const graphqlSchema = readFileSync(
  join(__dirname, '../schema.graphql'),
  'utf-8'
);

const resources: AWS['resources'] = {
  Resources: {
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
                    {
                      'Fn::GetAtt': ['ListAllExpensesByMonthLambdaFunction', 'Arn'],
                    },
                    {
                      'Fn::GetAtt': ['GetUserProfileLambdaFunction', 'Arn'],
                    },
                    {
                      'Fn::GetAtt': ['UpdateUserProfileLambdaFunction', 'Arn'],
                    },
                    {
                      'Fn::GetAtt': ['DeleteExpenseLambdaFunction', 'Arn'],
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

    // Data Source for listAllExpensesByMonth Lambda
    ListAllExpensesByMonthDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'ListAllExpensesByMonthDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['ListAllExpensesByMonthLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Resolver for Query.allExpensesByMonth
    AllExpensesByMonthResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Query',
        FieldName: 'allExpensesByMonth',
        DataSourceName: {
          'Fn::GetAtt': ['ListAllExpensesByMonthDataSource', 'Name'],
        },
      },
    },

    // Data Source for getUserProfile Lambda
    GetUserProfileDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'GetUserProfileDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['GetUserProfileLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Data Source for updateUserProfile Lambda
    UpdateUserProfileDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'UpdateUserProfileDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['UpdateUserProfileLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Resolver for Query.getUserProfile
    GetUserProfileResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Query',
        FieldName: 'getUserProfile',
        DataSourceName: {
          'Fn::GetAtt': ['GetUserProfileDataSource', 'Name'],
        },
      },
    },

    // Resolver for Mutation.updateUserProfile
    UpdateUserProfileResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Mutation',
        FieldName: 'updateUserProfile',
        DataSourceName: {
          'Fn::GetAtt': ['UpdateUserProfileDataSource', 'Name'],
        },
      },
    },

    // Data Source for deleteExpense Lambda
    DeleteExpenseDataSource: {
      Type: 'AWS::AppSync::DataSource',
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        Name: 'DeleteExpenseDataSource',
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: {
          'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
        },
        LambdaConfig: {
          LambdaFunctionArn: {
            'Fn::GetAtt': ['DeleteExpenseLambdaFunction', 'Arn'],
          },
        },
      },
    },

    // Resolver for Mutation.deleteExpense
    DeleteExpenseResolver: {
      Type: 'AWS::AppSync::Resolver',
      DependsOn: ['GraphQLSchema'],
      Properties: {
        ApiId: {
          'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
        },
        TypeName: 'Mutation',
        FieldName: 'deleteExpense',
        DataSourceName: {
          'Fn::GetAtt': ['DeleteExpenseDataSource', 'Name'],
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
  },
};

export default resources;

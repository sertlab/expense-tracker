export const expenseDataSources = {
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

  // Data Source for getExpense Lambda
  GetExpenseDataSource: {
    Type: 'AWS::AppSync::DataSource',
    Properties: {
      ApiId: {
        'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
      },
      Name: 'GetExpenseDataSource',
      Type: 'AWS_LAMBDA',
      ServiceRoleArn: {
        'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
      },
      LambdaConfig: {
        LambdaFunctionArn: {
          'Fn::GetAtt': ['GetExpenseLambdaFunction', 'Arn'],
        },
      },
    },
  },

  // Data Source for updateExpense Lambda
  UpdateExpenseDataSource: {
    Type: 'AWS::AppSync::DataSource',
    Properties: {
      ApiId: {
        'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
      },
      Name: 'UpdateExpenseDataSource',
      Type: 'AWS_LAMBDA',
      ServiceRoleArn: {
        'Fn::GetAtt': ['AppSyncLambdaRole', 'Arn'],
      },
      LambdaConfig: {
        LambdaFunctionArn: {
          'Fn::GetAtt': ['UpdateExpenseLambdaFunction', 'Arn'],
        },
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
};
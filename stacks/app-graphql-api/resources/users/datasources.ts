export const userDataSources = {
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
};
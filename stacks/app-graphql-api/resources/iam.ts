import { expenseIamPermissions } from './expenses';
import { userIamPermissions } from './users';

export const iamResources = {
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
                  ...expenseIamPermissions,
                  ...userIamPermissions,
                ],
              },
            ],
          },
        },
      ],
    },
  },
};
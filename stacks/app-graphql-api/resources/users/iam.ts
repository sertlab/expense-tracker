export const userIamPermissions = [
  {
    'Fn::GetAtt': ['GetUserProfileLambdaFunction', 'Arn'],
  },
  {
    'Fn::GetAtt': ['UpdateUserProfileLambdaFunction', 'Arn'],
  },
];
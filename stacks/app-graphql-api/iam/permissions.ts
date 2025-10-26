const iamRoleStatements = [
  {
    Effect: 'Allow',
    Action: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:BatchGetItem',
    ],
    Resource: [
      {
        'Fn::GetAtt': ['ExpenseTable', 'Arn'],
      },
      {
        'Fn::Sub': '${ExpenseTable.Arn}/index/GSI1',
      },
      {
        'Fn::GetAtt': ['UsersTable', 'Arn'],
      },
      {
        'Fn::Sub': '${UsersTable.Arn}/index/EmailIndex',
      },
    ],
  },
];

export default iamRoleStatements;

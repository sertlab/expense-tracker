const iamRoleStatements = [
  {
    Effect: 'Allow',
    Action: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
    ],
    Resource: [
      {
        'Fn::GetAtt': ['ExpenseTable', 'Arn'],
      },
      {
        'Fn::Sub': '${ExpenseTable.Arn}/index/GSI1',
      },
    ],
  },
];

export default iamRoleStatements;

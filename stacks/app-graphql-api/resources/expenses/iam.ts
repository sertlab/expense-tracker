export const expenseIamPermissions = [
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
    'Fn::GetAtt': ['GetExpenseLambdaFunction', 'Arn'],
  },
  {
    'Fn::GetAtt': ['UpdateExpenseLambdaFunction', 'Arn'],
  },
  {
    'Fn::GetAtt': ['DeleteExpenseLambdaFunction', 'Arn'],
  },
];
export const expenseResolvers = {
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

  // Resolver for Query.getExpense
  GetExpenseResolver: {
    Type: 'AWS::AppSync::Resolver',
    DependsOn: ['GraphQLSchema'],
    Properties: {
      ApiId: {
        'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
      },
      TypeName: 'Query',
      FieldName: 'getExpense',
      DataSourceName: {
        'Fn::GetAtt': ['GetExpenseDataSource', 'Name'],
      },
    },
  },

  // Resolver for Mutation.updateExpense
  UpdateExpenseResolver: {
    Type: 'AWS::AppSync::Resolver',
    DependsOn: ['GraphQLSchema'],
    Properties: {
      ApiId: {
        'Fn::GetAtt': ['GraphQLApi', 'ApiId'],
      },
      TypeName: 'Mutation',
      FieldName: 'updateExpense',
      DataSourceName: {
        'Fn::GetAtt': ['UpdateExpenseDataSource', 'Name'],
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
};
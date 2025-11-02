export const userResolvers = {
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
};
import type { AWS } from '@serverless/typescript';

const cognitoResources: AWS['resources'] = {
  Conditions: {
    IsProduction: {
      'Fn::Equals': [
        '${sls:stage}',
        'production'
      ]
    }
  },
  Resources: {
    // Cognito User Pool
    UserPool: {
      Type: 'AWS::Cognito::UserPool',
      Properties: {
        UserPoolName: 'expense-tracker-users-${sls:stage}',
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
        EmailVerificationMessage: 'Your verification code is {####}',
        EmailVerificationSubject: 'Verify your email for Expense Tracker',
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
          },
        },
        Schema: [
          {
            Name: 'email',
            AttributeDataType: 'String',
            Required: true,
            Mutable: false,
          },
          {
            Name: 'name',
            AttributeDataType: 'String',
            Required: false,
            Mutable: true,
          },
        ],
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1,
            },
          ],
        },
        UserPoolTags: {
          Environment: '${sls:stage}',
          Application: 'expense-tracker',
        },
      },
    },

    // User Pool Domain for Hosted UI
    UserPoolDomain: {
      Type: 'AWS::Cognito::UserPoolDomain',
      Properties: {
        Domain: 'expense-tracker-${sls:stage}',
        UserPoolId: {
          Ref: 'UserPool',
        },
      },
    },

    // User Pool Client (Public SPA - no secret)
    UserPoolClient: {
      Type: 'AWS::Cognito::UserPoolClient',
      Properties: {
        ClientName: 'expense-tracker-spa-${sls:stage}',
        UserPoolId: {
          Ref: 'UserPool',
        },
        GenerateSecret: false,
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
        TokenValidityUnits: {
          RefreshToken: 'days',
          AccessToken: 'minutes',
          IdToken: 'minutes',
        },
        ExplicitAuthFlows: [
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
        ],
        AllowedOAuthFlows: ['implicit', 'code'],
        AllowedOAuthScopes: ['email', 'openid', 'profile'],
        AllowedOAuthFlowsUserPoolClient: true,
        SupportedIdentityProviders: ['COGNITO'],
        CallbackURLs: [
          'http://localhost:4200/auth/callback',
          'http://localhost:3000/auth/callback',
          'https://localhost:4200/auth/callback',
          'https://expense-tracker-production-red.vercel.app/auth/callback',
        ],
        LogoutURLs: [
          'http://localhost:4200',
          'http://localhost:3000',
          'https://localhost:4200',
          'https://expense-tracker-production-red.vercel.app',
        ],
        PreventUserExistenceErrors: 'ENABLED',
      },
    },
  },

  Outputs: {
    UserPoolId: {
      Description: 'Cognito User Pool ID',
      Value: {
        Ref: 'UserPool',
      },
      Export: {
        Name: 'expense-tracker-${sls:stage}-UserPoolId',
      },
    },
    UserPoolClientId: {
      Description: 'Cognito User Pool Client ID',
      Value: {
        Ref: 'UserPoolClient',
      },
      Export: {
        Name: 'expense-tracker-${sls:stage}-UserPoolClientId',
      },
    },
    HostedUiDomain: {
      Description: 'Cognito Hosted UI Domain',
      Value: {
        'Fn::Sub': 'https://expense-tracker-${sls:stage}.auth.${AWS::Region}.amazoncognito.com',
      },
      Export: {
        Name: 'expense-tracker-${sls:stage}-HostedUiDomain',
      },
    },
    UserPoolArn: {
      Description: 'Cognito User Pool ARN',
      Value: {
        'Fn::GetAtt': ['UserPool', 'Arn'],
      },
      Export: {
        Name: 'expense-tracker-${sls:stage}-UserPoolArn',
      },
    },
  },
};

export default cognitoResources;

import type { AWS } from '@serverless/typescript';

const config: AWS = {
  service: 'expense-tracker-github-oidc',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'eu-west-2',
    stage: "${opt:stage, 'dev'}",
  },

  resources: {
    Resources: {
      // GitHub OIDC Provider
      GitHubOIDCProvider: {
        Type: 'AWS::IAM::OIDCProvider',
        Properties: {
          Url: 'https://token.actions.githubusercontent.com',
          ClientIdList: ['sts.amazonaws.com'],
          ThumbprintList: [
            '6938fd4d98bab03faadb97b34396831e3780aea1',
            '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
          ],
        },
      },

      // IAM Role for GitHub Actions - Dev (existing)
      GitHubActionsRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'GitHubActionsDeployRole-dev',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Federated: {
                    'Fn::GetAtt': ['GitHubOIDCProvider', 'Arn'],
                  },
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                  },
                  StringLike: {
                    'token.actions.githubusercontent.com:sub':
                      'repo:sertlab/expense-tracker:ref:refs/heads/dev',
                  },
                },
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/AdministratorAccess',
          ],
        },
      },

      // IAM Role for GitHub Actions - Production
      GitHubActionsRoleProduction: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'GitHubActionsDeployRole-production',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Federated: {
                    'Fn::GetAtt': ['GitHubOIDCProvider', 'Arn'],
                  },
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                  },
                  StringLike: {
                    'token.actions.githubusercontent.com:sub':
                      'repo:sertlab/expense-tracker:ref:refs/heads/main',
                  },
                },
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/AdministratorAccess',
          ],
        },
      },
    },

    Outputs: {
      GitHubActionsRoleArn: {
        Description: 'ARN of the GitHub Actions IAM Role for Dev',
        Value: {
          'Fn::GetAtt': ['GitHubActionsRole', 'Arn'],
        },
        Export: {
          Name: 'expense-tracker-github-actions-role-arn-${sls:stage}',
        },
      },
      GitHubActionsRoleArnProduction: {
        Description: 'ARN of the GitHub Actions IAM Role for Production',
        Value: {
          'Fn::GetAtt': ['GitHubActionsRoleProduction', 'Arn'],
        },
        Export: {
          Name: 'expense-tracker-github-actions-role-arn-production',
        },
      },
    },
  },
};

module.exports = config;

import type { AWS } from '@serverless/typescript';
import createExpense from './functions/createExpense';
import listExpensesByMonth from './functions/listExpensesByMonth';
import resources from './resources';
import iamRoleStatements from './iam/permissions';

const config: AWS = {
  service: 'expense-tracker-api',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'eu-west-2',
    stage: "${opt:stage, 'dev'}",
    iam: {
      role: {
        statements: iamRoleStatements,
      },
    },
    environment: {
      TABLE_NAME: 'expenses-${sls:stage}',
      GSI1_NAME: 'GSI1',
    },
  },

  functions: {
    ...createExpense,
    ...listExpensesByMonth,
  },

  package: {
    individually: true,
  },

  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['@aws-sdk/*'],
      target: 'node20',
      platform: 'node',
      concurrency: 10,
    },
  },

  resources: {
    ...resources,
  },
};

module.exports = config;

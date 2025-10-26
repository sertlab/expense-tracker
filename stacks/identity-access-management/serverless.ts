import type { AWS } from '@serverless/typescript';
import cognitoResources from './resources/cognito';

const config: AWS = {
  service: 'expense-tracker-iam',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'eu-west-2',
    stage: "${opt:stage, 'dev'}",
  },

  resources: {
    ...cognitoResources,
  },
};

module.exports = config;

import type { AWS } from '@serverless/typescript';
import cognitoResources from './resources/cognito';

const config: AWS = {
  service: 'expense-tracker-iam',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'eu-west-2',
    stage: "${opt:stage, 'dev'}",
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
    ...cognitoResources,
  },
};

module.exports = config;

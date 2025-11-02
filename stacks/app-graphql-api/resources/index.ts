import type { AWS } from '@serverless/typescript';
import { dynamoDbResources } from './dynamodb';
import { appSyncResources } from './appsync';
import { iamResources } from './iam';
import { dataSourceResources } from './datasources';
import { resolverResources } from './resolvers';
import { outputs } from './outputs';

const resources: AWS['resources'] = {
  Resources: {
    ...dynamoDbResources,
    ...appSyncResources,
    ...iamResources,
    ...dataSourceResources,
    ...resolverResources,
  },
  Outputs: outputs,
};

export default resources;
/**
 * Debug script to test the query
 * Run with: npx tsx scripts/debug-query.ts <userId> <month>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'expenses-dev';
const GSI1_NAME = 'GSI1';

async function debugQuery() {
  const userId = process.argv[2];
  const month = process.argv[3] || '2025-10';

  console.log(`\n=== Scanning all items in table ===`);
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  console.log(`Found ${scanResult.Items?.length} items:`);
  scanResult.Items?.forEach((item) => {
    console.log(JSON.stringify(item, null, 2));
  });

  if (!userId) {
    console.log(
      '\n⚠️  No userId provided. Usage: npx tsx scripts/debug-query.ts <userId> [month]'
    );
    return;
  }

  console.log(`\n=== Testing query ===`);
  console.log(`userId: ${userId}`);
  console.log(`month: ${month}`);

  const GSI1PK = `${userId}#${month}`;
  console.log(`GSI1PK: ${GSI1PK}`);

  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': GSI1PK,
      },
      ScanIndexForward: true,
    })
  );

  console.log(`\nQuery result: ${queryResult.Items?.length} items`);
  queryResult.Items?.forEach((item) => {
    console.log(JSON.stringify(item, null, 2));
  });
}

debugQuery().catch(console.error);

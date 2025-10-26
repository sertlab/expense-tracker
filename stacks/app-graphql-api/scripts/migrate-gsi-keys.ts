/**
 * Migration script to add GSI1PK and GSI1SK to existing expense items
 * Run with: npx tsx scripts/migrate-gsi-keys.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'expenses-dev';

interface ExpenseItem {
  userId: string;
  expenseId: string;
  occurredAt: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

/**
 * Compute monthKey from occurredAt ISO string
 * Returns YYYY-MM
 */
function computeMonthKey(occurredAt: string): string {
  const date = new Date(occurredAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function migrateGSIKeys() {
  console.log('Starting GSI key migration...');

  // Scan all items in the table
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const items = (scanResult.Items || []) as ExpenseItem[];
  console.log(`Found ${items.length} items in table`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    // Skip if GSI keys already exist
    if (item.GSI1PK && item.GSI1SK) {
      console.log(
        `Skipping item ${item.userId}#${item.expenseId} - GSI keys already exist`
      );
      skippedCount++;
      continue;
    }

    // Compute GSI keys
    const monthKey = computeMonthKey(item.occurredAt);
    const GSI1PK = `${item.userId}#${monthKey}`;
    const GSI1SK = item.occurredAt;

    console.log(
      `Updating item ${item.userId}#${item.expenseId} with GSI1PK=${GSI1PK}, GSI1SK=${GSI1SK}`
    );

    // Update the item
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: item.userId,
          expenseId: item.expenseId,
        },
        UpdateExpression:
          'SET GSI1PK = :gsi1pk, GSI1SK = :gsi1sk, monthKey = :monthKey',
        ExpressionAttributeValues: {
          ':gsi1pk': GSI1PK,
          ':gsi1sk': GSI1SK,
          ':monthKey': monthKey,
        },
      })
    );

    updatedCount++;
  }

  console.log('\nMigration complete!');
  console.log(`Updated: ${updatedCount} items`);
  console.log(`Skipped: ${skippedCount} items`);
}

migrateGSIKeys().catch(console.error);

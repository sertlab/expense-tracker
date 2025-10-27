import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'expenses-dev';

const UpdateExpenseInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  expenseId: z.string().min(1, 'expenseId is required'),
  amountMinor: z.number().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  occurredAt: z.string().optional(),
});

type UpdateExpenseInput = z.infer<typeof UpdateExpenseInputSchema>;

interface Expense {
  expenseId: string;
  userId: string;
  amountMinor: number;
  currency: string;
  category: string;
  note?: string;
  occurredAt: string;
  monthKey: string;
  createdAt: string;
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Handler for updating an expense
 */
export async function handler(event: {
  arguments: { input: UpdateExpenseInput };
}): Promise<Expense> {
  try {
    const input = UpdateExpenseInputSchema.parse(event.arguments.input);

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (input.amountMinor !== undefined) {
      updateExpressions.push('#amountMinor = :amountMinor');
      expressionAttributeNames['#amountMinor'] = 'amountMinor';
      expressionAttributeValues[':amountMinor'] = input.amountMinor;
    }

    if (input.category !== undefined) {
      updateExpressions.push('#category = :category');
      expressionAttributeNames['#category'] = 'category';
      expressionAttributeValues[':category'] = input.category;
    }

    if (input.note !== undefined) {
      updateExpressions.push('#note = :note');
      expressionAttributeNames['#note'] = 'note';
      expressionAttributeValues[':note'] = input.note;
    }

    if (input.occurredAt !== undefined) {
      const occurredDate = new Date(input.occurredAt);
      const monthKey = `${occurredDate.getFullYear()}-${String(
        occurredDate.getMonth() + 1
      ).padStart(2, '0')}`;

      updateExpressions.push('#occurredAt = :occurredAt');
      updateExpressions.push('#monthKey = :monthKey');
      updateExpressions.push('#GSI1PK = :GSI1PK');
      updateExpressions.push('#GSI1SK = :GSI1SK');

      expressionAttributeNames['#occurredAt'] = 'occurredAt';
      expressionAttributeNames['#monthKey'] = 'monthKey';
      expressionAttributeNames['#GSI1PK'] = 'GSI1PK';
      expressionAttributeNames['#GSI1SK'] = 'GSI1SK';

      expressionAttributeValues[':occurredAt'] = input.occurredAt;
      expressionAttributeValues[':monthKey'] = monthKey;
      expressionAttributeValues[':GSI1PK'] = `${input.userId}#${monthKey}`;
      expressionAttributeValues[':GSI1SK'] = input.occurredAt;
    }

    if (updateExpressions.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: input.userId,
          expenseId: input.expenseId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return result.Attributes as Expense;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

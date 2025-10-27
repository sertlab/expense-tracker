import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'expenses-dev';

const GetExpenseInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  expenseId: z.string().min(1, 'expenseId is required'),
});

type GetExpenseInput = z.infer<typeof GetExpenseInputSchema>;

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
}

/**
 * Handler for getting a single expense by userId and expenseId
 */
export async function handler(event: {
  arguments: GetExpenseInput;
}): Promise<Expense | null> {
  try {
    const input = GetExpenseInputSchema.parse(event.arguments);

    // Get expense from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: input.userId,
          expenseId: input.expenseId,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as Expense;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

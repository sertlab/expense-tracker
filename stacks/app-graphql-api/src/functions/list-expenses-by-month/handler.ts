import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'ExpenseTable';
const GSI1_NAME = process.env.GSI1_NAME || 'GSI1';

// Zod schema for validation
const ListExpensesByMonthInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
});

type ListExpensesByMonthInput = z.infer<typeof ListExpensesByMonthInputSchema>;

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
 * Handler for listing expenses by month for a user
 */
export async function handler(event: {
  arguments: ListExpensesByMonthInput;
}): Promise<Expense[]> {
  try {
    // Validate input with Zod
    const input = ListExpensesByMonthInputSchema.parse(event.arguments);

    // Construct GSI1PK for the query
    const GSI1PK = `${input.userId}#${input.month}`;

    // Query DynamoDB GSI1
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI1_NAME,
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': GSI1PK,
        },
        ScanIndexForward: true, // Ascending order by GSI1SK (occurredAt)
      })
    );

    // Return the items (empty array if no items found)
    return (result.Items || []) as Expense[];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

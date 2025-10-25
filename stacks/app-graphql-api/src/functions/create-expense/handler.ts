import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'ExpenseTable';

// Zod schema for validation
const CreateExpenseInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  amountMinor: z.number().int().positive('amountMinor must be a positive integer'),
  currency: z.string().length(3, 'currency must be a 3-letter code (e.g., USD)'),
  category: z.string().min(1, 'category is required'),
  note: z.string().optional(),
  occurredAt: z.string().datetime('occurredAt must be a valid ISO 8601 date-time string'),
});

type CreateExpenseInput = z.infer<typeof CreateExpenseInputSchema>;

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
 * Compute monthKey from ISO 8601 date string (YYYY-MM format)
 */
function computeMonthKey(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Generate expenseId in format: YYYY-MM-DD#<uuid>
 */
function generateExpenseId(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}-${day}`;
  const uuid = randomUUID();
  return `${datePrefix}#${uuid}`;
}

/**
 * Handler for creating an expense
 */
export async function handler(event: {
  arguments: { input: CreateExpenseInput };
}): Promise<Expense> {
  try {
    // Validate input with Zod
    const input = CreateExpenseInputSchema.parse(event.arguments.input);

    // Compute derived fields
    const expenseId = generateExpenseId(input.occurredAt);
    const monthKey = computeMonthKey(input.occurredAt);
    const createdAt = new Date().toISOString();

    // Construct GSI1 keys
    const GSI1PK = `${input.userId}#${monthKey}`;
    const GSI1SK = input.occurredAt;

    // Build the expense item
    const expense: Expense = {
      userId: input.userId, // PK
      expenseId, // SK
      amountMinor: input.amountMinor,
      currency: input.currency,
      category: input.category,
      note: input.note,
      occurredAt: input.occurredAt,
      monthKey,
      createdAt,
      GSI1PK,
      GSI1SK,
    };

    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: expense,
      })
    );

    // Return the saved item
    return expense;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
}

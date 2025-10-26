import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'ExpenseTable';
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME || 'users-dev';

// Zod schema for validation
const ListAllExpensesByMonthInputSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
});

type ListAllExpensesByMonthInput = z.infer<typeof ListAllExpensesByMonthInputSchema>;

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

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
  user?: User;
}

/**
 * Handler for listing all expenses by month (all users)
 */
export async function handler(event: {
  arguments: ListAllExpensesByMonthInput;
}): Promise<Expense[]> {
  try {
    // Validate input with Zod
    const input = ListAllExpensesByMonthInputSchema.parse(event.arguments);

    // Scan DynamoDB table for all expenses in the given month
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'monthKey = :month',
        ExpressionAttributeValues: {
          ':month': input.month,
        },
      })
    );

    const expenses = (result.Items || []) as Expense[];

    if (expenses.length === 0) {
      return [];
    }

    // Sort by occurredAt ascending
    expenses.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    // Get unique user IDs
    const userIds = [...new Set(expenses.map((e) => e.userId))];

    // Batch get user data
    const usersResult = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [USERS_TABLE_NAME]: {
            Keys: userIds.map((userId) => ({ userId })),
          },
        },
      })
    );

    const users = (usersResult.Responses?.[USERS_TABLE_NAME] || []) as User[];
    const usersMap = new Map(users.map((u) => [u.userId, u]));

    // Attach user data to expenses
    return expenses.map((expense) => ({
      ...expense,
      user: usersMap.get(expense.userId),
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

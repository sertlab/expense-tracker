import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'expenses-dev';

const FindExpensesByDateInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  date: z.string().min(1, 'date is required'), // Expected format: YYYY-MM-DD
});

type FindExpensesByDateInput = z.infer<typeof FindExpensesByDateInputSchema>;

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
  user?: User;
}

/**
 * Handler for finding expenses by userId and date
 * Uses begins_with on expenseId to find expenses for a specific date
 */
export async function handler(event: {
  arguments: FindExpensesByDateInput;
}): Promise<Expense[]> {
  try {
    const input = FindExpensesByDateInputSchema.parse(event.arguments);
    console.log('FindExpensesByDate request:', { userId: input.userId, date: input.date });

    // Query expenses for the user where expenseId begins with the date
    // This assumes expenseId format includes date prefix (e.g., "2024-01-15_uuid")
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId AND begins_with(expenseId, :datePrefix)',
        ExpressionAttributeValues: {
          ':userId': input.userId,
          ':datePrefix': input.date,
        },
      })
    );

    const expenses = (result.Items || []) as Expense[];
    console.log('Found expenses:', { count: expenses.length, userId: input.userId, date: input.date });
    
    return expenses;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', { issues: error.issues, input: event.arguments });
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    console.error('FindExpensesByDate error:', { 
      error: error instanceof Error ? error.message : String(error), 
      userId: event.arguments?.userId,
      date: event.arguments?.date 
    });
    throw error;
  }
}
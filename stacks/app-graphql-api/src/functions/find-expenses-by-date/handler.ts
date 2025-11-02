import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'expenses-dev';

const FindExpensesByDateInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
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
 * Uses the expenseId format YYYY-MM-DD#<uuid> to find all expenses for a specific date
 */
export async function handler(event: {
  arguments: FindExpensesByDateInput;
}): Promise<Expense[]> {
  try {
    const input = FindExpensesByDateInputSchema.parse(event.arguments);
    console.log('FindExpensesByDate request:', { userId: input.userId, date: input.date });

    // Query expenses using begins_with on the sort key (expenseId)
    // ExpenseId format is YYYY-MM-DD#<uuid>, so we can search by date prefix
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
    console.log('Found expenses:', { count: expenses.length, date: input.date });
    
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
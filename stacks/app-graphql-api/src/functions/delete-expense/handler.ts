import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'expenses-dev';

const DeleteExpenseInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  expenseId: z.string().min(1, 'expenseId is required'),
});

type DeleteExpenseInput = z.infer<typeof DeleteExpenseInputSchema>;

/**
 * Handler for deleting an expense
 */
export async function handler(event: {
  arguments: { input: DeleteExpenseInput };
}): Promise<boolean> {
  try{
    const input = DeleteExpenseInputSchema.parse(event.arguments.input);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: input.userId,
          expenseId: input.expenseId,
        },
      })
    );

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.USERS_TABLE_NAME || 'users-dev';

const GetUserProfileInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

type GetUserProfileInput = z.infer<typeof GetUserProfileInputSchema>;

interface User {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Handler for getting user profile
 */
export async function handler(event: {
  arguments: GetUserProfileInput;
  identity: { sub: string; claims?: { email?: string } };
}): Promise<User | null> {
  try {
    const input = GetUserProfileInputSchema.parse(event.arguments);

    // Get user from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: input.userId,
        },
      })
    );

    if (!result.Item) {
      // User doesn't exist, create a new profile with email from Cognito (if available)
      const now = new Date().toISOString();
      const newUser: User = {
        userId: input.userId,
        email: event.identity?.claims?.email || undefined,
        createdAt: now,
        updatedAt: now,
      };

      return newUser;
    }

    return result.Item as User;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

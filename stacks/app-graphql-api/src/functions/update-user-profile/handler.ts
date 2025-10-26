import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.USERS_TABLE_NAME || 'users-dev';

const UpdateUserProfileInputSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileInputSchema>;

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

/**
 * Handler for updating user profile
 */
export async function handler(event: {
  arguments: { input: UpdateUserProfileInput };
  identity: { sub: string; claims: { email: string } };
}): Promise<User> {
  try {
    const input = UpdateUserProfileInputSchema.parse(event.arguments.input);

    // Check if user exists
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: input.userId,
        },
      })
    );

    const now = new Date().toISOString();

    const user: User = {
      userId: input.userId,
      email: existingUser.Item?.email || event.identity.claims.email,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      phone: input.phone,
      createdAt: existingUser.Item?.createdAt || now,
      updatedAt: now,
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      })
    );

    return user;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

// User types
export interface User {
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

// Expense types
export interface Expense {
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

// Input types for mutations
export interface CreateExpenseInput {
  userId: string;
  amountMinor: number;
  currency: string;
  category: string;
  note?: string;
  occurredAt: string;
}

export interface UpdateExpenseInput {
  userId: string;
  expenseId: string;
  amountMinor?: number;
  currency?: string;
  category?: string;
  note?: string;
  occurredAt?: string;
}

export interface DeleteExpenseInput {
  userId: string;
  expenseId: string;
}

export interface UpdateUserProfileInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
}

// Validation input types
export interface GetExpenseInput {
  userId: string;
  expenseId: string;
}

export interface FindExpensesByDateInput {
  userId: string;
  date: string;
}

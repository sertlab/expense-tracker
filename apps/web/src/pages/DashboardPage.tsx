import { useEffect, useState } from 'react';
import { request } from '../api/graphql';
import { getUserId } from '../auth/cognito';

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

const EXPENSES_BY_MONTH_QUERY = `
  query ExpensesByMonth($userId: ID!, $month: String!) {
    expensesByMonth(userId: $userId, month: $month) {
      expenseId
      userId
      amountMinor
      currency
      category
      note
      occurredAt
      monthKey
      createdAt
      user {
        userId
        email
        firstName
        lastName
      }
    }
  }
`;

const DELETE_EXPENSE_MUTATION = `
  mutation DeleteExpense($input: DeleteExpenseInput!) {
    deleteExpense(input: $input)
  }
`;

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        // Get current month in YYYY-MM format
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const result = await request<{ expensesByMonth: Expense[] }>(
          EXPENSES_BY_MONTH_QUERY,
          {
            userId,
            month,
          }
        );

        setExpenses(result.expensesByMonth);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Calculate totals per user
  const userTotals = expenses.reduce((acc, expense) => {
    const key = expense.userId;
    if (!acc[key]) {
      acc[key] = {
        userId: expense.userId,
        user: expense.user,
        total: 0,
      };
    }
    acc[key].total += expense.amountMinor;
    return acc;
  }, {} as Record<string, { userId: string; user?: User; total: number }>);

  // Calculate monthly total
  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);

  // Format amount in £
  const formatAmount = (amountMinor: number) => {
    const pounds = amountMinor / 100;
    return `£${pounds.toFixed(2)}`;
  };

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format user name
  const formatUserName = (user?: User) => {
    if (!user) return 'Unknown';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email;
  };

  // Handle delete
  const handleDelete = async (expenseId: string) => {
    const userId = getUserId();
    if (!userId) return;

    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingId(expenseId);
    try {
      await request(DELETE_EXPENSE_MUTATION, {
        input: { userId, expenseId },
      });

      // Remove from local state
      setExpenses((prev) => prev.filter((e) => e.expenseId !== expenseId));
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(`Failed to delete expense: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  const userId = getUserId();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Total: {formatAmount(monthlyTotal)}
        </p>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          User ID: {userId}
        </p>
      </div>

      {Object.keys(userTotals).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Totals by User</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.values(userTotals).map(({ userId, user, total }) => (
              <div
                key={userId}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{formatUserName(user)}</span>
                <span style={{ fontSize: '1.125rem', color: '#333' }}>
                  {formatAmount(total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <p>No expenses for this month.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  User
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  Note
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #ddd',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.expenseId}
                  style={{ borderBottom: '1px solid #eee' }}
                >
                  <td style={{ padding: '0.75rem' }}>
                    {formatDate(expense.occurredAt)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{formatUserName(expense.user)}</td>
                  <td style={{ padding: '0.75rem' }}>{expense.category}</td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {expense.note || '-'}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontWeight: 'bold',
                    }}
                  >
                    {formatAmount(expense.amountMinor)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(expense.expenseId)}
                      disabled={deletingId === expense.expenseId}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: deletingId === expense.expenseId ? 'not-allowed' : 'pointer',
                        opacity: deletingId === expense.expenseId ? 0.6 : 1,
                      }}
                    >
                      {deletingId === expense.expenseId ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

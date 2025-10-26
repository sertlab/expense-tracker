import { useEffect, useState } from 'react';
import { request } from '../api/graphql';
import { getUserId } from '../auth/cognito';

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
    }
  }
`;

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ALL_EXPENSES_BY_MONTH_QUERY = `
  query AllExpensesByMonth($month: String!) {
    allExpensesByMonth(month: $month) {
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

const GET_USER_PROFILE_QUERY = `
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      userId
      email
      firstName
      lastName
    }
  }
`;

const DELETE_EXPENSE_MUTATION = `
  mutation DeleteExpense($input: DeleteExpenseInput!) {
    deleteExpense(input: $input)
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // null means "All Users"

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch expenses and user profile in parallel
        const [expensesResult, profileResult] = await Promise.all([
          request<{ allExpensesByMonth: Expense[] }>(ALL_EXPENSES_BY_MONTH_QUERY, { month }),
          request<{ getUserProfile: User }>(GET_USER_PROFILE_QUERY, { userId }),
        ]);

        setAllExpenses(expensesResult.allExpensesByMonth);
        setCurrentUser(profileResult.getUserProfile);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter expenses based on selected user
  const filteredExpenses = useMemo(() => {
    if (selectedUserId === null) {
      return allExpenses; // Show all
    }
    return allExpenses.filter((e) => e.userId === selectedUserId);
  }, [allExpenses, selectedUserId]);

  // Get unique users from expenses
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, User>();
    allExpenses.forEach((expense) => {
      if (expense.user && !usersMap.has(expense.userId)) {
        usersMap.set(expense.userId, expense.user);
      }
    });
    return Array.from(usersMap.values());
  }, [allExpenses]);

  // Calculate totals per user
  const userTotals = useMemo(() => {
    return allExpenses.reduce((acc, expense) => {
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
  }, [allExpenses]);

  // Calculate total for filtered expenses
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
  }, [filteredExpenses]);

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
  const handleDelete = async (expenseId: string, expenseUserId: string) => {
    const currentUserId = getUserId();

    // Only allow deleting own expenses
    if (currentUserId !== expenseUserId) {
      alert('You can only delete your own expenses');
      return;
    }

    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingId(expenseId);
    try {
      await request(DELETE_EXPENSE_MUTATION, {
        input: { userId: expenseUserId, expenseId },
      });

      // Remove from local state
      setAllExpenses((prev) => prev.filter((e) => e.expenseId !== expenseId));
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(`Failed to delete expense: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Check if current user can edit/delete the expense
  const canManageExpense = (expenseUserId: string) => {
    const currentUserId = getUserId();
    return currentUserId === expenseUserId;
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

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Dashboard</h1>
        {currentUser && currentUser.firstName && (
          <div style={{ fontSize: '1.125rem', color: '#333' }}>
            Hi {currentUser.firstName}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {selectedUserId === null ? 'Total (All Users)' : 'Total'}: {formatAmount(filteredTotal)}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedUserId(null)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: selectedUserId === null ? '3px solid #3b82f6' : '3px solid transparent',
              fontWeight: selectedUserId === null ? 'bold' : 'normal',
              color: selectedUserId === null ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Users ({allExpenses.length})
          </button>
          {uniqueUsers.map((user) => (
            <button
              key={user.userId}
              onClick={() => setSelectedUserId(user.userId)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: selectedUserId === user.userId ? '3px solid #3b82f6' : '3px solid transparent',
                fontWeight: selectedUserId === user.userId ? 'bold' : 'normal',
                color: selectedUserId === user.userId ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {formatUserName(user)} ({allExpenses.filter((e) => e.userId === user.userId).length})
            </button>
          ))}
        </div>
      </div>

      {/* Totals by User */}
      {selectedUserId === null && Object.keys(userTotals).length > 0 && (
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

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <p>No expenses {selectedUserId !== null ? 'for this user' : 'for this month'}.</p>
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
              {filteredExpenses.map((expense) => (
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
                    {canManageExpense(expense.userId) ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/edit/${expense.expenseId}`)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.expenseId, expense.userId)}
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
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                    )}
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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../api/graphql';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';

const editExpenseSchema = z.object({
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be positive')
    .max(999999.99, 'Amount too large'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
  currency: z.string().min(3, 'Currency is required').max(3, 'Currency must be 3 characters'),
});

type EditExpenseFormData = z.infer<typeof editExpenseSchema>;

const GET_EXPENSE_QUERY = `
  query GetExpense($userId: ID!, $expenseId: ID!) {
    getExpense(userId: $userId, expenseId: $expenseId) {
      expenseId
      userId
      amountMinor
      currency
      category
      note
      occurredAt
    }
  }
`;

const UPDATE_EXPENSE_MUTATION = `
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) {
      expenseId
      userId
      amountMinor
      currency
      category
      note
      occurredAt
    }
  }
`;

export default function EditExpensePage() {
  const navigate = useNavigate();
  const { expenseId: rawExpenseId } = useParams<{ expenseId: string }>();
  const expenseId = rawExpenseId ? decodeURIComponent(rawExpenseId) : undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditExpenseFormData>({
    resolver: zodResolver(editExpenseSchema),
  });

  const { userId } = useAuth();

  useEffect(() => {
    const fetchExpense = async () => {
      if (!userId || !expenseId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Fetch the expense directly by userId and expenseId
        console.log('Fetching expense with:', { userId, expenseId });
        const result = await request<{ getExpense: any | null }>(
          GET_EXPENSE_QUERY,
          { userId, expenseId }
        );

        console.log('Got result:', result);
        const expense = result.getExpense;

        if (!expense) {
          console.warn('Expense not found:', { userId, expenseId });
          toast.error('Expense not found. It may have been deleted or you may not have permission to view it.');
          navigate('/dashboard');
          return;
        }

        if (expense.userId !== userId) {
          console.warn('Unauthorized expense access attempt:', { userId, expenseUserId: expense.userId });
          toast.error('You can only edit your own expenses');
          navigate('/dashboard');
          return;
        }

        // Pre-fill the form
        setValue('amount', expense.amountMinor / 100);
        setValue('category', expense.category);
        setValue('date', expense.occurredAt.split('T')[0]);
        setValue('note', expense.note || '');
        setValue('currency', expense.currency);
      } catch (error) {
        console.error('Error fetching expense:', error);
        toast.error('Failed to load expense');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [expenseId, navigate, setValue]);

  const onSubmit = async (data: EditExpenseFormData) => {
    if (!userId || !expenseId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert amount (£ decimal) to amountMinor (pence)
      const amountMinor = Math.round(data.amount * 100);

      // Convert date to ISO occurredAt
      const occurredAt = new Date(data.date).toISOString();

      await toast.promise(
        request(UPDATE_EXPENSE_MUTATION, {
          input: {
            userId,
            expenseId,
            amountMinor,
            currency: data.currency.toUpperCase(),
            category: data.category,
            note: data.note || undefined,
            occurredAt,
          },
          delay: 1000
        }),
        {
          loading: 'Updating expense...',
          success: 'Expense updated successfully',
          error: 'Failed to update expense',
        }
      );
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Edit Expense</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Edit Expense</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 2 }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: errors.amount ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            {errors.amount && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {errors.amount.message}
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="currency" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Currency
            </label>
            <input
              id="currency"
              type="text"
              placeholder="GBP"
              maxLength={3}
              {...register('currency')}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: errors.currency ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            />
            {errors.currency && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {errors.currency.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Category
          </label>
          <input
            id="category"
            type="text"
            placeholder="e.g., Food, Transport"
            {...register('category')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.category ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.category && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.category.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="date" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Date
          </label>
          <input
            id="date"
            type="date"
            {...register('date')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.date ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.date && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.date.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="note" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Note (optional)
          </label>
          <textarea
            id="note"
            placeholder="Add a note..."
            rows={3}
            {...register('note')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: isSubmitting ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api/graphql';
import { useAuth } from '../auth/AuthContext';

const addExpenseSchema = z.object({
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be positive')
    .max(999999.99, 'Amount too large'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

type AddExpenseFormData = z.infer<typeof addExpenseSchema>;

const CREATE_EXPENSE_MUTATION = `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      expenseId
      userId
      amountMinor
      currency
      category
      note
      occurredAt
      createdAt
    }
  }
`;

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    },
  });

  const { userId } = useAuth();

  const onSubmit = async (data: AddExpenseFormData) => {
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert amount (£ decimal) to amountMinor (pence)
      const amountMinor = Math.round(data.amount * 100);

      // Convert date to ISO occurredAt
      const occurredAt = new Date(data.date).toISOString();

      await request(CREATE_EXPENSE_MUTATION, {
        input: {
          userId,
          amountMinor,
          currency: 'GBP',
          category: data.category,
          note: data.note || undefined,
          occurredAt,
        },
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Add Expense</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div>
          <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Amount (£)
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

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: isSubmitting ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { request } from '../api/graphql';
import { useAuth } from '../auth/AuthContext';

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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

const GET_USER_PROFILE_QUERY = `
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      userId
      email
      firstName
      lastName
      dateOfBirth
      address
      phone
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      userId
      email
      firstName
      lastName
      dateOfBirth
      address
      phone
      createdAt
      updatedAt
    }
  }
`;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const { userId } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const result = await request<{ getUserProfile: User }>(
          GET_USER_PROFILE_QUERY,
          {
            userId,
          }
        );

        setUser(result.getUserProfile);
        reset({
          firstName: result.getUserProfile.firstName || '',
          lastName: result.getUserProfile.lastName || '',
          dateOfBirth: result.getUserProfile.dateOfBirth || '',
          address: result.getUserProfile.address || '',
          phone: result.getUserProfile.phone || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await request<{ updateUserProfile: User }>(
        UPDATE_USER_PROFILE_MUTATION,
        {
          input: {
            userId,
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
            dateOfBirth: data.dateOfBirth || undefined,
            address: data.address || undefined,
            phone: data.phone || undefined,
          },
        }
      );

      setUser(result.updateUserProfile);

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Profile</h1>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Profile</h1>

      {user && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Email:</strong> {user.email}
          </p>
          <p style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}>
            User ID: {user.userId}
          </p>
        </div>
      )}

      {showToast && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          Profile updated successfully!
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div>
          <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem' }}>
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            {...register('firstName')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.firstName ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.firstName && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.firstName.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            {...register('lastName')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.lastName ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.lastName && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.lastName.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="dateOfBirth" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.dateOfBirth ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.dateOfBirth && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.dateOfBirth.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            {...register('phone')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.phone ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {errors.phone && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.phone.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="address" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Address
          </label>
          <textarea
            id="address"
            placeholder="Enter your address"
            rows={3}
            {...register('address')}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: errors.address ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
          {errors.address && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.address.message}
            </span>
          )}
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
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseAndStoreIdTokenFromHash } from '../auth/cognito';

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const success = parseAndStoreIdTokenFromHash();
    if (success) {
      navigate('/dashboard');
    } else {
      // No token found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <p>Signing you in…</p>
    </div>
  );
}

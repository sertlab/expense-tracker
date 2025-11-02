import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseAndStoreIdTokenFromHash } from '../auth/cognito';
import { useAuth } from '../auth/AuthContext';

export default function CallbackPage() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    // Only run if we're actually on the callback page
    if (window.location.pathname !== '/auth/callback') {
      console.log('CallbackPage: Not on callback route, skipping');
      return;
    }

    console.log('CallbackPage: Current URL:', window.location.href);
    console.log('CallbackPage: Hash:', window.location.hash);
    console.log('CallbackPage: Search:', window.location.search);

    const success = parseAndStoreIdTokenFromHash();
    console.log('CallbackPage: Token parse success:', success);

    if (success) {
      console.log('CallbackPage: Refreshing auth state');
      refreshAuth(); // Refresh auth state after storing token
      console.log('CallbackPage: Redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    } else {
      console.log('CallbackPage: No token found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [navigate, refreshAuth]);

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <p>Signing you in…</p>
    </div>
  );
}

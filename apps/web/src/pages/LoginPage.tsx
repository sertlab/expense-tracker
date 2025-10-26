import { buildLoginUrl } from '../auth/cognito';

export default function LoginPage() {
  const handleSignIn = () => {
    try {
      console.log('=== DEBUG ENV VARS ===');
      console.log('VITE_COGNITO_DOMAIN:', import.meta.env.VITE_COGNITO_DOMAIN);
      console.log('VITE_COGNITO_CLIENT_ID:', import.meta.env.VITE_COGNITO_CLIENT_ID);
      console.log('VITE_REDIRECT_URI:', import.meta.env.VITE_REDIRECT_URI);
      console.log('VITE_GRAPHQL_URL:', import.meta.env.VITE_GRAPHQL_URL);
      console.log('=====================');

      const loginUrl = buildLoginUrl();
      console.log('Redirecting to:', loginUrl);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error building login URL:', error);
      alert('Error: ' + error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1>Expense Tracker</h1>
      <p>Sign in to track your expenses</p>
      <button
        onClick={handleSignIn}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '2rem',
        }}
      >
        Sign in with Cognito
      </button>
    </div>
  );
}

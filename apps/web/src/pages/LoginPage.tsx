import { buildLoginUrl } from '../auth/cognito';

export default function LoginPage() {
  const handleSignIn = () => {
    try {
      const loginUrl = buildLoginUrl();
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

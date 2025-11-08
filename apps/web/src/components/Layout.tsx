import { Link, Outlet, useLocation } from 'react-router-dom';
import { signOut } from '../auth/cognito';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { isAuthenticated, refreshAuth } = useAuth();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    refreshAuth(); // Refresh auth state after sign out
  };

  return (
    <div>
      {/* Navbar */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          backgroundColor: '#333',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                Dashboard
              </Link>
              <Link to="/add" style={{ color: 'white', textDecoration: 'none' }}>
                Add
              </Link>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                Profile
              </Link>
            </>
          )}
        </div>

        <div>
          {isAuthenticated ? (
            <span style={{ color: 'white' }}>
              Signed in •{' '}
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 'inherit',
                }}
              >
                Sign out
              </button>
            </span>
          ) : location.pathname !== '/login' ? (
            <Link
              to="/login"
              style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                border: '1px solid white',
                borderRadius: '4px',
              }}
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Outlet } from 'react-router-dom';
import { isSignedIn, signOut } from '../auth/cognito';

export default function Layout() {
  const signedIn = isSignedIn();

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
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
            Expense Tracker
          </Link>
          {signedIn && (
            <>
              <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                Dashboard
              </Link>
              <Link to="/add" style={{ color: 'white', textDecoration: 'none' }}>
                Add
              </Link>
            </>
          )}
        </div>

        <div>
          {signedIn ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#aaa' }}>Signed in</span>
              <button
                onClick={signOut}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isSignedIn } from '../auth/cognito';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import CallbackPage from '../pages/CallbackPage';
import DashboardPage from '../pages/DashboardPage';
import AddExpensePage from '../pages/AddExpensePage';
import EditExpensePage from '../pages/EditExpensePage';
import ProfilePage from '../pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isSignedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/callback" element={<CallbackPage />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="add"
            element={
              <ProtectedRoute>
                <AddExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit/:expenseId"
            element={
              <ProtectedRoute>
                <EditExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

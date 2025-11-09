import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isSignedIn as checkIsSignedIn, getUserId as getStoredUserId } from './cognito';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  refreshAuth: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = () => {
    const authenticated = checkIsSignedIn();
    const currentUserId = getStoredUserId();

    setIsAuthenticated(authenticated);
    setUserId(currentUserId);
    setIsLoading(false);

    console.log('Auth state refreshed:', { authenticated, userId: currentUserId });
  };

  useEffect(() => {
    // Initial auth check
    refreshAuth();

    // Listen for storage changes (in case user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, refreshAuth, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
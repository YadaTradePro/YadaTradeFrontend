
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status whenever the route changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = isAuthenticated();
      console.log('🔍 AuthContext: Checking auth status:', authenticated);
      setIsAuth(authenticated);
      setIsLoading(false);
    };

    // Initial check when component mounts
    checkAuthStatus();

    // Check auth status on route changes
    const handleRouteChange = () => {
      checkAuthStatus();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const login = (token) => {
    console.log('🔐 AuthContext: User logged in');
    setIsAuth(true);
    // Token is already set by the API service, just update state
  };

  const logout = () => {
    console.log('🔐 AuthContext: User logged out');
    clearAuthToken();
    setIsAuth(false);
    router.push('/login');
  };

  const value = {
    isAuth,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
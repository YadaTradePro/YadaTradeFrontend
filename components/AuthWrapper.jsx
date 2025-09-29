import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '../services/api';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register'];

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

      console.log('🔍 Auth check:', { 
        isAuth: authenticated, 
        pathname: router.pathname, 
        isPublicRoute 
      });

      setIsAuth(authenticated);

      // Redirect logic
      if (!authenticated && !isPublicRoute) {
        console.log('🔒 User not authenticated, redirecting to login');
        router.push('/login');
      } else if (authenticated && (router.pathname === '/login' || router.pathname === '/register')) {
        console.log('✅ User authenticated, redirecting to home');
        router.push('/');
      }

      setIsLoading(false);
    };

    // Wait for router to be ready before checking auth
    if (router.isReady) {
      checkAuth();
    }
  }, [router.isReady, router.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        <div className="loading-spinner"></div>
        <p>در حال بررسی احراز هویت...</p>
      </div>
    );
  }

  return <>{children}</>;
}
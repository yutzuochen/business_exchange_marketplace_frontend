'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use async authentication check for HttpOnly cookies
        const authenticated = await apiClient.isAuthenticatedAsync();
        
        if (authenticated) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, clear any session data and redirect
          apiClient.clearAuthToken();
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.warn('Authentication check failed:', error);
        // On error, clear session and redirect
        apiClient.clearAuthToken();
        router.push(redirectTo);
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 等待跳转
  }

  return <>{children}</>;
}

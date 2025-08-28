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
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push(redirectTo);
        return;
      }

      // 检查token是否有效
      if (apiClient.isAuthenticated()) {
        setIsAuthenticated(true);
      } else {
        // Token无效，清除并跳转
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

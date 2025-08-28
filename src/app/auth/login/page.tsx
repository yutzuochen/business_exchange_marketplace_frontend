'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 使用API客户端进行登录
      const response = await apiClient.login(formData.email, formData.password);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.token) {
        // 解析JWT token获取用户信息
        try {
          const tokenParts = response.data.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.email) {
              sessionStorage.setItem('userEmail', payload.email);
              sessionStorage.setItem('userName', payload.email.split('@')[0]);
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse JWT token:', parseError);
        }
        
        // 设置登录成功标志
        sessionStorage.setItem('loginSuccess', 'true');
        sessionStorage.setItem('userAvatar', ''); // No avatar for now
        
        // 显示成功页面
        setShowSuccess(true);
        
        // 2秒后跳转到市场页面
        setTimeout(() => {
          window.location.href = '/market';
        }, 2000);
      } else {
        throw new Error('登录响应格式错误');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : '登入失敗，請檢查您的帳號和密碼');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen if login is successful
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            {/* Success checkmark animation */}
            <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg 
                className="w-12 h-12 text-green-500 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">
            Login Successful. Welcome :))
          </h1>
          <p className="text-xl text-white/80">
            正在為您跳轉到市場頁面...
          </p>
          <div className="mt-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              登入您的帳戶
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              還沒有帳戶？{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                立即註冊
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  電子信箱
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="請輸入您的電子信箱"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="請輸入您的密碼"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  記住我
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/auth/forgot-password" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  忘記密碼？
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登入中...' : '登入'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

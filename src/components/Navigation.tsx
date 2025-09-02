'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: 'User', avatar: '' });

  // Check login status on component mount
  useEffect(() => {
    // 使用API客户端检查认证状态
    const checkAuthStatus = async () => {
      console.log('🔍 Navigation: Checking authentication status...');
      try {
        // Check if we have a valid token by making an API call
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/me`, {
          credentials: 'include', // Include cookies
        });
        
        console.log('🔍 Navigation: Auth check response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Navigation: User authenticated:', userData);
          setIsLoggedIn(true);
          setUser({ 
            name: userData.data?.name || userData.data?.email?.split('@')[0] || 'User', 
            avatar: userData.data?.avatar || '' 
          });
        } else {
          console.log('❌ Navigation: User not authenticated');
          setIsLoggedIn(false);
          setUser({ name: 'User', avatar: '' });
        }
      } catch (error) {
        console.warn('❌ Navigation: Failed to check auth status:', error);
        setIsLoggedIn(false);
        setUser({ name: 'User', avatar: '' });
      }
    };

    checkAuthStatus();
  }, []);
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser({ name: 'User', avatar: '' });
    // 使用API客户端清除认证数据
    apiClient.clearAuthToken();
    // 跳转到首页
    window.location.href = '/';
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4">
            <h1 className="text-6xl font-bold text-orange-500 drop-shadow-lg">567</h1>
            <span className="text-2xl font-bold text-orange-500">我來接</span>
          </Link>
          
          {/* Center - Platform Name */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">企業互惠平台</p>
          </div>
          
          {/* Right - Navigation Links */}
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              // Login/Signup buttons when not logged in
              <>
                <Link 
                  href="/auth/login"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  登入
                </Link>
                <Link 
                  href="/auth/signup"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  註冊
                </Link>
              </>
            ) : (
              // User menu when logged in
              <div className="flex items-center space-x-4">
                {/* English Auction button */}
                <Link 
                  href="/auction_english"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  英式拍賣
                </Link>
                
                {/* Dashboard button */}
                <Link 
                  href="/dashboard"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  管理後台
                </Link>
                
                {/* Profile avatar button */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="User Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700 font-medium">{user.name}</span>
                </div>
                
                {/* Logout button */}
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

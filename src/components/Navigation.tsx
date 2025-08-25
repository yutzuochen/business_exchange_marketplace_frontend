'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: 'User', avatar: '' });

  // Check login status on component mount
  useEffect(() => {
    // Check if user just came from successful login
    const loginSuccess = sessionStorage.getItem('loginSuccess');
    const userName = sessionStorage.getItem('userName');
    const userAvatar = sessionStorage.getItem('userAvatar');
    
    if (loginSuccess) {
      setIsLoggedIn(true);
      setUser({ 
        name: userName || 'User', 
        avatar: userAvatar || '' 
      });
      // Don't remove loginSuccess here - keep it for persistence
    }
  }, []);
  
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
                  onClick={() => {
                    setIsLoggedIn(false);
                    setUser({ name: 'User', avatar: '' });
                    // Clear all session data
                    sessionStorage.removeItem('loginSuccess');
                    sessionStorage.removeItem('userName');
                    sessionStorage.removeItem('userAvatar');
                    // Optionally redirect to home page
                    window.location.href = '/';
                  }}
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

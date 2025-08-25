'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NavigationDemo() {
  const [demoState, setDemoState] = useState<'logged-out' | 'logged-in'>('logged-out');

  // Mock Navigation Component for Demo
  const DemoNavigation = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
    const user = { name: 'john.doe', avatar: '' }; // Example username from email

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
                    onClick={() => setDemoState('logged-out')}
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Navigation */}
      <DemoNavigation isLoggedIn={demoState === 'logged-in'} />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            導航欄狀態演示
          </h1>
          <p className="text-xl text-gray-600">
            查看登入前後導航欄的不同顯示狀態
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">未登入狀態</h3>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600">顯示按鈕：</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 登入 (藍色)</li>
                  <li>• 註冊 (綠色)</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoState('logged-out')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  demoState === 'logged-out' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                切換到未登入狀態
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">已登入狀態</h3>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600">顯示按鈕：</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 管理後台 (藍色)</li>
                  <li>• 用戶頭像 + 用戶名稱</li>
                  <li>• 登出 (紅色)</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoState('logged-in')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  demoState === 'logged-in' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                切換到已登入狀態
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">實際使用流程</h3>
            <p className="text-blue-700 text-sm">
              在實際應用中，用戶登入成功後會自動切換到已登入狀態的導航欄。
              導航欄會隱藏「登入」和「註冊」按鈕，並顯示「管理後台」、用戶頭像（顯示真實用戶名稱，從登入的電子信箱提取）和「登出」按鈕。
              用戶名稱會從電子信箱的 @ 符號前面部分提取（例如：john.doe@example.com → john.doe）。
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="space-x-4">
            <Link 
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
            >
              前往登入頁面測試
            </Link>
            <Link 
              href="/market"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block"
            >
              前往市場頁面
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

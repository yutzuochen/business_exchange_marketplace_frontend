'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function SuccessDemo() {
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Login Success Screen
  if (showLoginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
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
          <button 
            onClick={() => setShowLoginSuccess(false)}
            className="mt-8 bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            返回演示
          </button>
        </div>
      </div>
    );
  }

  // Signup Success Screen
  if (showSignupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
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
            註冊成功！歡迎加入 567 :))
          </h1>
          <p className="text-xl text-white/80">
            正在為您跳轉到登入頁面...
          </p>
          <div className="mt-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <button 
            onClick={() => setShowSignupSuccess(false)}
            className="mt-8 bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            返回演示
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            成功畫面演示
          </h1>
          <p className="text-xl text-gray-600">
            點擊下方按鈕查看登入/註冊成功後的畫面效果
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">登入成功畫面</h3>
              <p className="text-gray-600 mb-6">
                顯示 "Login Successful. Welcome :))" 訊息，並在 2 秒後跳轉到市場頁面
              </p>
              <button
                onClick={() => setShowLoginSuccess(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                查看登入成功畫面
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">註冊成功畫面</h3>
              <p className="text-gray-600 mb-6">
                顯示註冊成功訊息，並在 2 秒後跳轉到登入頁面
              </p>
              <button
                onClick={() => setShowSignupSuccess(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                查看註冊成功畫面
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">使用說明</h3>
            <p className="text-blue-700">
              在實際的登入/註冊頁面中，當用戶成功提交表單後，系統會自動顯示成功畫面 2 秒鐘，然後自動跳轉到相應的頁面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

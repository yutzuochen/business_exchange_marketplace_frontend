'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function UsernameDemo() {
  const [testEmail, setTestEmail] = useState('john.doe@example.com');
  const [extractedUsername, setExtractedUsername] = useState('');

  const extractUsername = (email: string) => {
    const username = email.includes('@') 
      ? email.split('@')[0] 
      : email;
    return username;
  };

  const handleTest = () => {
    const username = extractUsername(testEmail);
    setExtractedUsername(username);
  };

  const testCases = [
    { email: 'john.doe@example.com', expected: 'john.doe' },
    { email: 'alice.smith@gmail.com', expected: 'alice.smith' },
    { email: 'bob123@company.org', expected: 'bob123' },
    { email: 'mary_wilson@domain.net', expected: 'mary_wilson' },
    { email: 'testuser', expected: 'testuser' }, // No @ symbol
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            用戶名稱提取演示
          </h1>
          <p className="text-xl text-gray-600">
            查看系統如何從電子信箱提取用戶名稱顯示在導航欄
          </p>
        </div>

        {/* Interactive Test */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">互動測試</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                輸入電子信箱：
              </label>
              <input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入電子信箱"
              />
            </div>
            
            <button
              onClick={handleTest}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              提取用戶名稱
            </button>
            
            {extractedUsername && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>提取結果：</strong> <span className="font-mono bg-green-100 px-2 py-1 rounded">{extractedUsername}</span>
                </p>
                <p className="text-green-600 text-sm mt-2">
                  這就是會在導航欄中顯示的用戶名稱
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">測試案例</h2>
          
          <div className="space-y-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-mono text-blue-600">{testCase.email}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">→</span>
                  <span className="font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {testCase.expected}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">工作原理</h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <p>1. 用戶在登入頁面輸入電子信箱和密碼</p>
            <p>2. 登入成功後，系統提取電子信箱中 @ 符號前面的部分作為用戶名稱</p>
            <p>3. 用戶名稱儲存在 sessionStorage 中，供導航欄組件使用</p>
            <p>4. 導航欄在所有頁面中顯示相同的用戶名稱</p>
            <p>5. 登出時清除所有 session 資料</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="space-x-4">
            <a 
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
            >
              前往登入測試
            </a>
            <a 
              href="/demo/navigation"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block"
            >
              查看導航欄演示
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

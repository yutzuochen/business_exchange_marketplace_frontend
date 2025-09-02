'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { auctionApi } from '@/lib/auctionApi';

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [token, setToken] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const getTokenFromCookie = () => {
      const name = "authToken=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return null;
    };
    
    const authToken = getTokenFromCookie();
    const loginSuccess = sessionStorage.getItem('loginSuccess');
    const userName = sessionStorage.getItem('userName');
    
    setToken(authToken || 'No token found');
    
    if (authToken && (loginSuccess || userName)) {
      setAuthStatus('Authenticated');
      try {
        const tokenParts = authToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setUserInfo(payload);
        }
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    } else {
      setAuthStatus('Not authenticated');
    }
  };

  const testBackendAuth = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      let responseData = null;
      if (response.ok) {
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = { error: 'Failed to parse response' };
        }
      }
      
      setTestResults((prev: any) => ({
        ...prev,
        backend: {
          status: response.status,
          ok: response.ok,
          data: responseData
        }
      }));
    } catch (error) {
      setTestResults((prev: any) => ({
        ...prev,
        backend: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const testAuctionAuth = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/v1/auctions/1/my-bids', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      let responseData = null;
      if (response.ok) {
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = { error: 'Failed to parse response' };
        }
      }
      
      setTestResults((prev: any) => ({
        ...prev,
        auction: {
          status: response.status,
          ok: response.ok,
          data: responseData
        }
      }));
    } catch (error) {
      setTestResults((prev: any) => ({
        ...prev,
        auction: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const testWebSocket = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setTestResults((prev: any) => ({
          ...prev,
          websocket: { error: 'No token available' }
        }));
        return;
      }

      const ws = new WebSocket(`ws://localhost:8081/ws/auctions/1?token=${encodeURIComponent(token)}`);
      
      ws.onopen = () => {
        setTestResults((prev: any) => ({
          ...prev,
          websocket: { status: 'Connected successfully' }
        }));
        ws.close();
      };
      
      ws.onerror = (error) => {
        setTestResults((prev: any) => ({
          ...prev,
          websocket: { error: 'WebSocket connection failed' }
        }));
      };
      
      ws.onclose = () => {
        setTestResults((prev: any) => ({
          ...prev,
          websocket: { status: 'Connection closed' }
        }));
      };
    } catch (error) {
      setTestResults((prev: any) => ({
        ...prev,
        websocket: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const runAllTests = () => {
    testBackendAuth();
    testAuctionAuth();
    testWebSocket();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {authStatus}</p>
            <p><strong>Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">{token}</code></p>
            {userInfo && (
              <div>
                <p><strong>User Info:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(userInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <button
            onClick={runAllTests}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Run All Tests
          </button>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Backend API (Port 8080)</h3>
              <button
                onClick={testBackendAuth}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2"
              >
                Test
              </button>
              {testResults.backend && (
                <pre className="bg-gray-100 p-2 rounded text-sm mt-2">{JSON.stringify(testResults.backend, null, 2)}</pre>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">Auction API (Port 8081)</h3>
              <button
                onClick={testAuctionAuth}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2"
              >
                Test
              </button>
              {testResults.auction && (
                <pre className="bg-gray-100 p-2 rounded text-sm mt-2">{JSON.stringify(testResults.auction, null, 2)}</pre>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">WebSocket (Port 8081)</h3>
              <button
                onClick={testWebSocket}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2"
              >
                Test
              </button>
              {testResults.websocket && (
                <pre className="bg-gray-100 p-2 rounded text-sm mt-2">{JSON.stringify(testResults.websocket, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p><strong>NEXT_PUBLIC_AUCTION_API_URL:</strong> {process.env.NEXT_PUBLIC_AUCTION_API_URL || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

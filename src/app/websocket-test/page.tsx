'use client';

import { useState, useEffect } from 'react';

export default function WebSocketTestPage() {
  const [status, setStatus] = useState<string>('Not connected');
  const [messages, setMessages] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [auctionId, setAuctionId] = useState<string>('1');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Get token from cookies
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
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  const connect = () => {
    if (!token) {
      setStatus('No token available');
      return;
    }

    try {
      const wsUrl = `ws://localhost:8081/ws/auctions/${auctionId}?token=${encodeURIComponent(token)}`;
      setStatus(`Connecting to ${wsUrl}...`);
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setStatus('Connected successfully!');
        setMessages(prev => [...prev, '✅ Connection opened']);
      };
      
      websocket.onmessage = (event) => {
        setMessages(prev => [...prev, `📨 Received: ${event.data}`]);
      };
      
      websocket.onerror = (error) => {
        setStatus('Connection error');
        setMessages(prev => [...prev, `❌ Error: ${error}`]);
        console.error('WebSocket error:', error);
      };
      
      websocket.onclose = (event) => {
        setStatus(`Disconnected (code: ${event.code}, reason: ${event.reason})`);
        setMessages(prev => [...prev, `🔌 Closed: ${event.code} - ${event.reason}`]);
      };
      
      setWs(websocket);
    } catch (error) {
      setStatus(`Failed to create WebSocket: ${error}`);
      console.error('Failed to create WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setStatus('Disconnected');
    }
  };

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping',
        timestamp: Date.now()
      };
      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `📤 Sent: ${JSON.stringify(message)}`]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">WebSocket Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auction ID:
              </label>
              <input
                type="text"
                value={auctionId}
                onChange={(e) => setAuctionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your JWT token"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={connect}
                disabled={!!ws}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              
              <button
                onClick={disconnect}
                disabled={!ws}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!ws || ws?.readyState !== WebSocket.OPEN}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send Ping
              </button>
              
              <button
                onClick={clearMessages}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-lg">
            <strong>Status:</strong> <span className="text-blue-600">{status}</span>
          </p>
          {ws && (
            <p className="text-sm text-gray-600 mt-2">
              Ready State: {ws.readyState} ({getReadyStateText(ws.readyState)})
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded text-sm font-mono">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getReadyStateText(readyState: number): string {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'OPEN';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
}

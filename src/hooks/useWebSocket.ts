import { useEffect, useRef, useState, useCallback } from 'react';
import { AuctionWebSocketMessage, WebSocketStatus } from '@/types/auction';
import { getAuthToken } from '@/lib/cookies';

interface UseWebSocketOptions {
  onMessage?: (message: AuctionWebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onBidAccepted?: (data: any) => void;
  onAuctionExtended?: (data: any) => void;
  onAuctionClosed?: (data: any) => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(auctionId: number | null, options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<AuctionWebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  const {
    onMessage,
    onStatusChange,
    onBidAccepted,
    onAuctionExtended,
    onAuctionClosed,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const updateStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: AuctionWebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);
      onMessage?.(message);

      // 處理特定類型的消息
      switch (message.type) {
        case 'bid_accepted':
          onBidAccepted?.(message.data);
          break;
        case 'extended':
          onAuctionExtended?.(message.data);
          break;
        case 'closed':
          onAuctionClosed?.(message.data);
          break;
        case 'error':
          setError(message.data?.message || 'WebSocket error');
          onError?.(message.data?.message || 'WebSocket error');
          break;
        case 'hello':
          // 連接成功確認
          console.log('WebSocket connected successfully');
          reconnectAttemptsRef.current = 0;
          break;
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      setError('Failed to parse message');
      onError?.('Failed to parse message');
    }
  }, [onMessage, onBidAccepted, onAuctionExtended, onAuctionClosed, onError]);

  const connect = useCallback(() => {
    if (!auctionId || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        onError?.('No authentication token found');
        return;
      }

      updateStatus(WebSocketStatus.CONNECTING);
      const baseURL = process.env.NEXT_PUBLIC_AUCTION_API_URL || 'http://127.0.0.1:8081';
      const wsUrl = `${baseURL.replace('http', 'ws')}/ws/auctions/${auctionId}?token=${encodeURIComponent(token)}`;
      
      console.log('🔧 WebSocket Debug Info:');
      console.log('  - baseURL:', baseURL);
      console.log('  - wsUrl:', wsUrl);
      console.log('  - auctionId:', auctionId);
      console.log('  - token preview:', token ? `${token.slice(0, 20)}...` : 'null');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus(WebSocketStatus.CONNECTED);
        setError(null);
        console.log(`WebSocket connected to auction ${auctionId}`);
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        updateStatus(WebSocketStatus.DISCONNECTED);
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        updateStatus(WebSocketStatus.ERROR);
        const errorMsg = 'WebSocket connection error';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('WebSocket error:', event);
      };

    } catch (err) {
      updateStatus(WebSocketStatus.ERROR);
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [auctionId, handleMessage, updateStatus, onError, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    updateStatus(WebSocketStatus.DISCONNECTED);
  }, [updateStatus]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (auctionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [auctionId, connect, disconnect]);

  return {
    status,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === WebSocketStatus.CONNECTED,
  };
}
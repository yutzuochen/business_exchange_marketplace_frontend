import { useEffect, useRef, useState, useCallback } from 'react';
import { AuctionWebSocketMessage, WebSocketStatus } from '@/types/auction';
import { auctionApi } from '@/lib/auctionApi';

interface UseWebSocketOptions {
  onMessage?: (message: AuctionWebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onBidAccepted?: (data: any) => void;
  onPriceChanged?: (data: any) => void;
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
    onPriceChanged,
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
        case 'price_changed':
          onPriceChanged?.(message.data);
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
  }, [onMessage, onBidAccepted, onPriceChanged, onAuctionExtended, onAuctionClosed, onError]);

  const connect = useCallback(async () => {
    if (!auctionId) {
      console.log('🚫 Cannot connect: no auctionId provided');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🔄 WebSocket already connecting...');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }
    
    // Clean up any existing connection
    if (wsRef.current) {
      console.log('🧹 Cleaning up existing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      updateStatus(WebSocketStatus.CONNECTING);
      
      // Create WebSocket connection (now asynchronous)
      const ws = await auctionApi.createWebSocketConnection(auctionId);
      wsRef.current = ws;
      
      console.log('🔧 WebSocket Debug Info:');
      console.log('  - auctionId:', auctionId);
      console.log('  - WebSocket authenticated with token');

      ws.onopen = () => {
        updateStatus(WebSocketStatus.CONNECTED);
        setError(null);
        console.log(`WebSocket connected to auction ${auctionId}`);
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        updateStatus(WebSocketStatus.DISCONNECTED);
        console.log('🔌 WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          auctionId,
        });
        
        // Only reconnect for unexpected closures (not code 1000 = normal closure)
        if (autoReconnect && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (event.code === 1000) {
          console.log('✅ WebSocket closed normally (code 1000)');
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
  }, [auctionId]); // 移除 connect, disconnect 依賴項以避免重複連接

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
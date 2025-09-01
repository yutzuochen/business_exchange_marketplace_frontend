'use client';

import { useState, useEffect, useCallback } from 'react';
import { auctionApi } from '@/lib/auctionApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Auction, Bid, WebSocketStatus } from '@/types/auction';

interface BiddingPanelProps {
  auction: Auction;
  onAuctionUpdate?: (auction: Auction) => void;
}

export default function BiddingPanel({ auction, onAuctionUpdate }: BiddingPanelProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [clientSeq, setClientSeq] = useState(1);

  const isActive = ['active', 'extended'].includes(auction.status_code);

  // WebSocket 連接
  const {
    status: wsStatus,
    error: wsError,
    lastMessage
  } = useWebSocket(
    isActive ? auction.auction_id : null,
    {
      onBidAccepted: (data) => {
        setSuccessMessage('出價成功！');
        loadMyBids();
        setTimeout(() => setSuccessMessage(''), 3000);
      },
      onAuctionExtended: (data) => {
        setSuccessMessage('⚡ 拍賣已延長！');
        if (onAuctionUpdate) {
          const updatedAuction = {
            ...auction,
            extended_until: data.extended_until,
            extension_count: data.extension_count || auction.extension_count + 1,
            status_code: 'extended' as const,
          };
          onAuctionUpdate(updatedAuction);
        }
        setTimeout(() => setSuccessMessage(''), 5000);
      },
      onAuctionClosed: (data) => {
        setSuccessMessage('拍賣已結束');
        if (onAuctionUpdate) {
          const updatedAuction = {
            ...auction,
            status_code: 'ended' as const,
          };
          onAuctionUpdate(updatedAuction);
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    }
  );

  const loadMyBids = useCallback(async () => {
    try {
      const bids = await auctionApi.getMyBids(auction.auction_id);
      setMyBids(bids);
    } catch (err) {
      console.error('Failed to load my bids:', err);
    }
  }, [auction.auction_id]);

  useEffect(() => {
    loadMyBids();
  }, [loadMyBids]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount);
  };

  const validateBidAmount = (amount: number): string | null => {
    if (amount < auction.allowed_min_bid) {
      return `出價金額不能低於 ${formatCurrency(auction.allowed_min_bid)}`;
    }
    if (amount > auction.allowed_max_bid) {
      return `出價金額不能高於 ${formatCurrency(auction.allowed_max_bid)}`;
    }
    return null;
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setError('請輸入有效的金額');
      return;
    }

    const validationError = validateBidAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await auctionApi.placeBid(auction.auction_id, {
        amount,
        client_seq: clientSeq,
      });

      if (response.accepted) {
        setBidAmount('');
        setClientSeq(prev => prev + 1);
        setSuccessMessage('出價提交成功！');
        
        if (response.soft_close?.extended) {
          setSuccessMessage('出價成功！拍賣時間已延長');
        }
        
        loadMyBids();
      } else {
        setError(response.reject_reason || '出價被拒絕');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '出價失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const getWebSocketStatusColor = () => {
    switch (wsStatus) {
      case WebSocketStatus.CONNECTED:
        return 'text-green-600';
      case WebSocketStatus.CONNECTING:
        return 'text-yellow-600';
      case WebSocketStatus.ERROR:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getWebSocketStatusText = () => {
    switch (wsStatus) {
      case WebSocketStatus.CONNECTED:
        return '即時連接中';
      case WebSocketStatus.CONNECTING:
        return '連接中...';
      case WebSocketStatus.ERROR:
        return '連接錯誤';
      default:
        return '未連接';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">競標出價</h2>
        {isActive && (
          <div className={`flex items-center text-sm ${getWebSocketStatusColor()}`}>
            <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
            {getWebSocketStatusText()}
          </div>
        )}
      </div>

      {/* Price Range Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">最低出價</span>
            <div className="font-semibold text-lg text-gray-900">
              {formatCurrency(auction.allowed_min_bid)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">最高出價</span>
            <div className="font-semibold text-lg text-gray-900">
              {formatCurrency(auction.allowed_max_bid)}
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Form */}
      {isActive ? (
        <form onSubmit={handleBidSubmit} className="space-y-4">
          <div>
            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
              出價金額
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">NT$</span>
              </div>
              <input
                type="number"
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入出價金額"
                min={auction.allowed_min_bid}
                max={auction.allowed_max_bid}
                step="1"
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              請輸入 {formatCurrency(auction.allowed_min_bid)} - {formatCurrency(auction.allowed_max_bid)} 之間的金額
            </p>
          </div>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              auction.allowed_min_bid,
              Math.round((auction.allowed_min_bid + auction.allowed_max_bid) / 2),
              auction.allowed_max_bid
            ].map((amount, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setBidAmount(amount.toString())}
                className="py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {wsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">連接問題: {wsError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !bidAmount || wsStatus === WebSocketStatus.ERROR}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                提交中...
              </div>
            ) : (
              '提交出價'
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">⏰</div>
          <p className="text-gray-600">
            {auction.status_code === 'draft' ? '拍賣尚未開始' :
             auction.status_code === 'ended' ? '拍賣已結束' : '拍賣不可用'}
          </p>
        </div>
      )}

      {/* My Bids History */}
      {myBids.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium text-gray-900 mb-3">我的出價記錄</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {myBids.slice(-5).reverse().map((bid) => (
              <div
                key={bid.bid_id}
                className={`flex justify-between items-center p-3 rounded-lg text-sm ${
                  bid.accepted ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div>
                  <span className={bid.accepted ? 'text-green-800' : 'text-red-800'}>
                    {formatCurrency(bid.amount)}
                  </span>
                  {!bid.accepted && bid.reject_reason && (
                    <div className="text-red-600 text-xs mt-1">{bid.reject_reason}</div>
                  )}
                </div>
                <div className={`text-xs ${bid.accepted ? 'text-green-600' : 'text-red-600'}`}>
                  {new Date(bid.created_at).toLocaleString('zh-TW')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
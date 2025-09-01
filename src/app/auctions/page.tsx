'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auctionApi } from '@/lib/auctionApi';
import { Auction, AuctionStatusColors } from '@/types/auction';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAuctions();
  }, [filter]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await auctionApi.getAuctions(params);
      setAuctions(response.auctions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount);
  };

  const getTimeRemaining = (endTime: string, extendedUntil?: string) => {
    const end = new Date(extendedUntil || endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: '已結束' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { expired: false, text: `${days}天 ${hours}小時` };
    } else if (hours > 0) {
      return { expired: false, text: `${hours}小時 ${minutes}分鐘` };
    } else {
      return { expired: false, text: `${minutes}分鐘`, urgent: minutes <= 10 };
    }
  };

  const isActive = (auction: Auction) => {
    return ['active', 'extended'].includes(auction.status_code);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">企業拍賣</h1>
              <p className="text-gray-600 mt-1">探索優質商機，參與競標投資</p>
            </div>
            <Link
              href="/auctions/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              創建拍賣
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: '全部' },
              { key: 'active', label: '進行中' },
              { key: 'draft', label: '草稿' },
              { key: 'ended', label: '已結束' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Auction Grid */}
        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到拍賣</h3>
            <p className="text-gray-600">目前沒有符合條件的拍賣項目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => {
              const timeRemaining = getTimeRemaining(auction.end_at, auction.extended_until);
              const statusColor = AuctionStatusColors[auction.status_code] || AuctionStatusColors.draft;
              
              return (
                <Link
                  key={auction.auction_id}
                  href={`/auctions/${auction.auction_id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border"
                >
                  <div className="p-6">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {auction.status_code === 'active' ? '進行中' :
                         auction.status_code === 'extended' ? '延長中' :
                         auction.status_code === 'ended' ? '已結束' :
                         auction.status_code === 'draft' ? '草稿' : '已取消'}
                      </span>
                      {auction.is_anonymous && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          匿名
                        </span>
                      )}
                    </div>

                    {/* Auction Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">
                        拍賣 #{auction.auction_id}
                      </h3>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>商機編號: {auction.listing_id}</div>
                        {auction.extension_count > 0 && (
                          <div className="text-yellow-600 font-medium">
                            已延長 {auction.extension_count} 次
                          </div>
                        )}
                      </div>

                      {/* Price Range */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">最低出價</span>
                          <span className="font-medium text-gray-900">{formatCurrency(auction.allowed_min_bid)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">最高出價</span>
                          <span className="font-medium text-gray-900">{formatCurrency(auction.allowed_max_bid)}</span>
                        </div>
                      </div>

                      {/* Time Information */}
                      <div className="border-t pt-3 space-y-1">
                        {isActive(auction) ? (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">剩餘時間</span>
                            <span className={`font-medium text-sm ${
                              timeRemaining.urgent ? 'text-red-600 animate-pulse' : 
                              timeRemaining.expired ? 'text-gray-500' : 'text-green-600'
                            }`}>
                              {timeRemaining.text}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">開始時間</span>
                              <span className="text-gray-900">{formatDateTime(auction.start_at)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">結束時間</span>
                              <span className="text-gray-900">{formatDateTime(auction.end_at)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t">
                      {isActive(auction) ? (
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                          參與競標
                        </button>
                      ) : auction.status_code === 'draft' ? (
                        <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium">
                          查看詳情
                        </button>
                      ) : (
                        <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium">
                          查看結果
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
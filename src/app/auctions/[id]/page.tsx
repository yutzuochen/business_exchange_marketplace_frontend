'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auctionApi } from '@/lib/auctionApi';
import { Auction, AuctionStatusColors, AuctionResults } from '@/types/auction';
import BiddingPanel from '@/components/BiddingPanel';
import AuctionTimer from '@/components/AuctionTimer';

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = parseInt(params.id as string);
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [results, setResults] = useState<AuctionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (auctionId) {
      loadAuction();
    }
  }, [auctionId]);

  const loadAuction = async () => {
    try {
      setLoading(true);
      const auctionData = await auctionApi.getAuction(auctionId);
      setAuction(auctionData);
      
      // 如果拍賣已結束，載入結果
      if (auctionData.status_code === 'ended') {
        try {
          const resultsData = await auctionApi.getAuctionResults(auctionId);
          setResults(resultsData);
        } catch (err) {
          console.error('Failed to load auction results:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAuction = async () => {
    if (!auction) return;
    
    setActivating(true);
    try {
      await auctionApi.activateAuction(auction.auction_id);
      await loadAuction(); // 重新載入更新狀態
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate auction');
    } finally {
      setActivating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
            <p className="text-gray-600 mb-4">{error || 'Auction not found'}</p>
            <Link 
              href="/auctions"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              返回拍賣列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = AuctionStatusColors[auction.status_code] || AuctionStatusColors.draft;
  const isActive = ['active', 'extended'].includes(auction.status_code);
  const isEnded = auction.status_code === 'ended';
  const isDraft = auction.status_code === 'draft';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/auctions"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  拍賣 #{auction.auction_id}
                </h1>
                <p className="text-gray-600">商機編號: {auction.listing_id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {auction.status_code === 'active' ? '進行中' :
                 auction.status_code === 'extended' ? '延長中' :
                 auction.status_code === 'ended' ? '已結束' :
                 auction.status_code === 'draft' ? '草稿' : '已取消'}
              </span>
              
              {auction.is_anonymous && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  匿名拍賣
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Auction Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <AuctionTimer
              endTime={auction.end_at}
              extendedUntil={auction.extended_until}
              status={auction.status_code}
              extensionCount={auction.extension_count}
              onTimeExpired={() => loadAuction()}
            />

            {/* Auction Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">拍賣資訊</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">拍賣類型</span>
                  <div className="font-medium">密封投標 (盲標)</div>
                </div>
                <div>
                  <span className="text-gray-600">商機編號</span>
                  <div className="font-medium text-gray-900">{auction.listing_id}</div>
                </div>
                <div>
                  <span className="text-gray-600">最低出價</span>
                  <div className="font-medium text-green-600">
                    {formatCurrency(auction.allowed_min_bid)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">最高出價</span>
                  <div className="font-medium text-blue-600">
                    {formatCurrency(auction.allowed_max_bid)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">開始時間</span>
                  <div className="font-medium text-gray-900">{formatDateTime(auction.start_at)}</div>
                </div>
                <div>
                  <span className="text-gray-600">結束時間</span>
                  <div className="font-medium text-gray-900">{formatDateTime(auction.end_at)}</div>
                </div>
                {auction.extended_until && (
                  <>
                    <div>
                      <span className="text-gray-600">延長至</span>
                      <div className="font-medium text-yellow-600">
                        {formatDateTime(auction.extended_until)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">延長次數</span>
                      <div className="font-medium text-yellow-600">
                        {auction.extension_count} 次
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-600">軟關閉機制</span>
                  <div className="font-medium">
                    最後 {Math.floor(auction.soft_close_trigger_sec / 60)} 分鐘內出價延長 {Math.floor(auction.soft_close_extend_sec / 60)} 分鐘
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">匿名設定</span>
                  <div className="font-medium">
                    {auction.is_anonymous ? '匿名拍賣' : '公開拍賣'}
                  </div>
                </div>
              </div>

              {/* Draft Actions */}
              {isDraft && (
                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={handleActivateAuction}
                    disabled={activating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {activating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        啟用中...
                      </div>
                    ) : (
                      '啟用拍賣'
                    )}
                  </button>
                  <p className="text-gray-600 text-sm mt-2">
                    啟用後拍賣將開始接受出價
                  </p>
                </div>
              )}
            </div>

            {/* Auction Results */}
            {isEnded && results && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">拍賣結果</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">總參與人數</span>
                      <div className="font-medium text-lg">{results.total_participants}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">得標人數</span>
                      <div className="font-medium text-lg text-green-600">{results.winner_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">排行榜</span>
                      <div className="font-medium text-lg">{results.top_bidders.length}</div>
                    </div>
                  </div>

                  {results.top_bidders.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">前 7 名得標者</h3>
                      <div className="space-y-2">
                        {results.top_bidders.map((bidder, index) => (
                          <div
                            key={index}
                            className={`flex justify-between items-center p-3 rounded-lg ${
                              index < results.winner_count ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                                index < results.winner_count ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                              }`}>
                                {bidder.rank}
                              </div>
                              <span className="font-medium text-gray-900">{bidder.alias}</span>
                            </div>
                            {bidder.amount && (
                              <span className="font-semibold text-green-600">
                                {formatCurrency(bidder.amount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="lg:col-span-1">
            <BiddingPanel 
              auction={auction} 
              onAuctionUpdate={(updatedAuction) => setAuction(updatedAuction)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auctionApi } from '@/lib/auctionApi';
import { apiClient } from '@/lib/api';
import { Auction } from '@/types/auction';

// 工具函數
const twd = (n: number) => new Intl.NumberFormat('zh-TW', { 
  style: 'currency', 
  currency: 'TWD', 
  maximumFractionDigits: 0 
}).format(n);

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 倒數計時
function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { 
    const t = setInterval(() => setNow(Date.now()), 1000); 
    return () => clearInterval(t); 
  }, []);
  
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  let tone: "safe" | "warn" | "danger" = "safe";
  if (remaining <= 60) tone = "danger"; 
  else if (remaining <= 300) tone = "warn";
  return { remaining, tone };
}

function RemainingText({ remaining }: { remaining: number }) {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return <span>{h} 小時 {mm} 分 {s} 秒</span>;
  if (m > 0) return <span>{m} 分 {s} 秒</span>;
  return <span>{s} 秒</span>;
}

// 拍賣卡片組件
function AuctionCard({ 
  auction, 
  onOpen 
}: { 
  auction: any; 
  onOpen: (id: number) => void 
}) {
  const endTime = new Date(auction.end_at).getTime();
  const { remaining, tone } = useCountdown(endTime);
  const currentPrice = auction.current_price || auction.allowed_min_bid;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div 
        className="h-40 w-full" 
        style={{ background: "linear-gradient(135deg,#e9d5ff,#eef2ff)" }} 
      />
      <div className="p-4 space-y-2">
        <div className="text-sm text-gray-500">賣家 ID: {auction.seller_id}</div>
        <h3 className="font-semibold line-clamp-1">拍賣商品 #{auction.auction_id}</h3>
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="text-gray-500">目前出價</div>
            <div className="font-bold text-lg">{twd(currentPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500">剩餘</div>
            <div className={classNames(
              "font-semibold", 
              tone === "danger" && "text-red-600", 
              tone === "warn" && "text-amber-600", 
              tone === "safe" && "text-gray-700"
            )}>
              <RemainingText remaining={remaining} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>英式拍賣</span>
          <span className={classNames(
            "px-2 py-0.5 rounded-full border",
            auction.reserve_met ? "border-emerald-200 text-emerald-700" : "border-gray-200"
          )}>
            {auction.reserve_met ? "已達保留價" : "未達保留價"}
          </span>
        </div>
        <button 
          onClick={() => onOpen(auction.auction_id)} 
          className="mt-2 w-full rounded-xl bg-blue-600 text-white py-2 font-medium hover:bg-blue-700"
        >
          參與競標
        </button>
      </div>
    </div>
  );
}

export default function EnglishAuctionListPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 認證狀態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 檢查認證狀態
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await apiClient.isAuthenticatedAsync();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userResponse = await apiClient.getUserProfile();
          if (userResponse.data) {
            setUserInfo(userResponse.data);
          }
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserInfo(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        const response = await auctionApi.getAuctions();
        
        // 過濾出英式拍賣
        const allAuctions = response.auctions || [];
        
        // 只保留 auction_type 為 'english' 的拍賣
        const englishAuctions = allAuctions.filter(auction => 
          auction.auction_type === 'english'
        );
        
        setAuctions(englishAuctions);
      } catch (err: any) {
        setError(err.message || '載入拍賣列表失敗');
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  // 登出處理
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    apiClient.clearAuthToken();
    router.push('/');
  };

  const handleOpenAuction = (auctionId: number) => {
    router.push(`/auction_english/${auctionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <div className="mt-4 text-gray-600">載入拍賣列表中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">載入失敗</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* 頂部導覽 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/market" className="flex items-center space-x-4">
              <h1 className="text-6xl font-bold text-orange-500 drop-shadow-lg">567</h1>
              <span className="text-2xl font-bold text-orange-500">我來接</span>
            </Link>
            
            {/* Center - Platform Name */}
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">企業互惠平台</p>
            </div>
            
            {/* Right - Navigation Buttons */}
            <div className="flex items-center space-x-4">
              {/* Return to Market Button */}
              <Link 
                href="/market"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                返回市場
              </Link>

              {!authLoading && (
                !isAuthenticated ? (
                  // Login button when not authenticated
                  <Link 
                    href="/auth/login"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    登入
                  </Link>
                ) : (
                  // User info and logout when authenticated
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {userInfo?.avatar ? (
                          <img 
                            src={userInfo.avatar} 
                            alt="User Avatar" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">
                        {userInfo?.name || userInfo?.email?.split('@')[0] || 'User'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium"
                    >
                      登出
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">英式拍賣</h1>
          <p className="text-gray-600">透明競價，即時出價，公開競標</p>
        </div>

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard 
                key={auction.auction_id} 
                auction={auction} 
                onOpen={handleOpenAuction} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暫無英式拍賣</h3>
            <p className="text-gray-600">請稍後再來查看最新的拍賣項目</p>
          </div>
        )}
      </main>
    </div>
  );
}
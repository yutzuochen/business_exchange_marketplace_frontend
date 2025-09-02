'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auctionApi } from '@/lib/auctionApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiClient } from '@/lib/api';
import { Auction, Bid } from '@/types/auction';

// 工具函數
const twd = (n: number) => new Intl.NumberFormat('zh-TW', { 
  style: 'currency', 
  currency: 'TWD', 
  maximumFractionDigits: 0 
}).format(n);

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function maskUser(id: string) {
  if (id.length <= 2) return id + "*";
  return id[0] + "***" + id[id.length - 1];
}

// 倒數計時與緊急色彩
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

// 價格分布直方圖
function Histogram({ 
  buckets, 
  p50, 
  p90, 
  p99 
}: { 
  buckets: { min: number; max: number; count: number }[]; 
  p50: number; 
  p90: number; 
  p99: number 
}) {
  const width = 560, height = 180, pad = 24;
  const maxCount = Math.max(...buckets.map(b => b.count));
  const minX = buckets[0]?.min || 0;
  const maxX = buckets[buckets.length - 1]?.max || 1;
  const x = (v: number) => pad + ((v - minX) / (maxX - minX)) * (width - pad * 2);
  const y = (c: number) => height - pad - (c / maxCount) * (height - pad * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[200px]">
      <rect x={0} y={0} width={width} height={height} rx={12} className="fill-white" />
      {/* 軸線 */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} className="stroke-gray-200" />
      {/* 桶狀 */}
      {buckets.map((b, i) => {
        const barW = (x(b.max) - x(b.min)) * 0.8;
        const cx = (x(b.min) + x(b.max)) / 2 - barW / 2;
        const top = y(b.count);
        return (
          <rect 
            key={i} 
            x={cx} 
            y={top} 
            width={barW} 
            height={(height - pad) - top} 
            className="fill-blue-500/70 hover:fill-blue-600 transition-colors" 
            rx={6} 
          />
        );
      })}
      {/* 分位線 */}
      {[
        { v: p50, c: "stroke-emerald-500" }, 
        { v: p90, c: "stroke-amber-500" }, 
        { v: p99, c: "stroke-red-500" }
      ].map((l, i) => (
        <g key={i}>
          <line 
            x1={x(l.v)} 
            x2={x(l.v)} 
            y1={pad} 
            y2={height - pad} 
            className={classNames(l.c, "stroke-[2]")} 
          />
        </g>
      ))}
    </svg>
  );
}

// 出價紀錄組件
function BidHistory({ 
  bids, 
  anonymize 
}: { 
  bids: Bid[] | null | undefined; 
  anonymize: boolean 
}) {
  // 確保 bids 是數組
  const safeBids = Array.isArray(bids) ? bids : [];
  
  if (safeBids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        尚無出價記錄
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {safeBids.map((b) => (
        <div key={b.bid_id} className="flex items-center justify-between py-2 text-sm">
          <div className="text-gray-500 w-40">
            {new Date(b.created_at).toLocaleTimeString()}
          </div>
          <div className="flex-1">
            <span className="text-gray-700">
              {anonymize ? maskUser(`bidder_${b.bidder_id}`) : `Bidder #${b.bidder_id}`}
            </span>
            {b.max_proxy_amount && (
              <span className="ml-2 text-xs text-blue-600 rounded px-2 py-0.5 bg-blue-50">
                代理出價
              </span>
            )}
          </div>
          <div className="font-semibold">{twd(b.amount)}</div>
        </div>
      ))}
    </div>
  );
}

// 即時出價面板
function LiveBidPanel({
  auction,
  onPlaceBid,
  onBuyItNow,
  disabled,
  lastExtendedAt,
}: {
  auction: Auction;
  onPlaceBid: (amount: number, maxProxy?: number) => Promise<void>;
  onBuyItNow: () => Promise<void>;
  disabled: boolean;
  lastExtendedAt?: number | null;
}) {
  const currentPrice = auction.current_price || auction.allowed_min_bid;
  const minIncrement = auction.min_increment || 10000;
  const { remaining, tone } = useCountdown(new Date(auction.end_at).getTime());
  
  const [amount, setAmount] = useState(currentPrice + minIncrement);
  const [maxProxy, setMaxProxy] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    setAmount(currentPrice + minIncrement); 
  }, [currentPrice, minIncrement]);

  const handlePlaceBid = async () => {
    if (isSubmitting || disabled) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const proxyAmount = maxProxy ? parseFloat(maxProxy) : undefined;
      await onPlaceBid(amount, proxyAmount);
      setMaxProxy('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyItNow = async () => {
    if (isSubmitting || disabled) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onBuyItNow();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = auction.status_code === 'active' ? 'RUNNING' : 
                 auction.status_code === 'draft' ? 'SCHEDULED' : 'ENDED';

  return (
    <div className="sticky top-4 rounded-2xl border border-gray-200 p-5 bg-white shadow-sm space-y-4">
      <div className="text-sm text-gray-500">目前出價</div>
      <div className="text-3xl font-bold tracking-tight">{twd(currentPrice)}</div>

      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500">結束倒數</div>
        <div className={classNames(
          "text-sm font-semibold px-2 py-1 rounded-md",
          tone === "danger" && "bg-red-50 text-red-600",
          tone === "warn" && "bg-amber-50 text-amber-700",
          tone === "safe" && "bg-gray-50 text-gray-700"
        )}>
          <RemainingText remaining={remaining} />
        </div>
        {lastExtendedAt && Date.now() - lastExtendedAt < 5000 && (
          <div className="ml-auto text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg animate-pulse">
            已延長 +60s
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-gray-500">最小加價</div>
          <div className="font-semibold">{twd(minIncrement)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-gray-500">保留價</div>
          <div className={classNames(
            "font-semibold",
            auction.reserve_met ? "text-emerald-700" : "text-gray-700"
          )}>
            {auction.reserve_met ? "已達" : "未達"}
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-gray-500">匿名出價</div>
          <div className="font-semibold">{auction.is_anonymous ? "是" : "否"}</div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-gray-700">出價金額</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={amount} 
            onChange={e => setAmount(Number(e.target.value))}
            min={currentPrice + minIncrement}
            max={auction.allowed_max_bid}
          />
          <button 
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" 
            onClick={() => setAmount(currentPrice + minIncrement)}
          >
            填入最低
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-700">代理出價上限（選填）</label>
          <input 
            type="number" 
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={maxProxy} 
            onChange={e => setMaxProxy(e.target.value)}
            placeholder="系統將自動為您出價到此上限"
          />
        </div>

        <div className="flex gap-2 text-xs">
          {[1, 2, 5].map(x => (
            <button 
              key={x} 
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200" 
              onClick={() => setAmount((v) => v + minIncrement * x)}
            >
              +{x} 檔
            </button>
          ))}
        </div>
      </div>

      <button 
        disabled={disabled || isSubmitting} 
        onClick={handlePlaceBid} 
        className={classNames(
          "w-full rounded-xl py-3 font-semibold",
          (disabled || isSubmitting) 
            ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700"
        )}
      >
        {isSubmitting ? "出價中..." : 
         status === "RUNNING" ? "出價" : 
         status === "SCHEDULED" ? "尚未開始" : "已結束"}
      </button>

      {auction.buy_it_now && status === "RUNNING" && (
        <button 
          disabled={disabled || isSubmitting} 
          onClick={handleBuyItNow}
          className={classNames(
            "w-full rounded-xl py-2 font-semibold border",
            (disabled || isSubmitting) 
              ? "border-gray-200 text-gray-400" 
              : "border-blue-200 text-blue-700 hover:bg-blue-50"
          )}
        >
          {isSubmitting ? "處理中..." : `直購 ${twd(auction.buy_it_now)}`}
        </button>
      )}

      <div className="text-xs text-gray-500">
        出價即表示同意拍賣規則，並受反狙擊條款影響（臨近結束將自動延長）。
      </div>
    </div>
  );
}

// 主頁面組件
export default function EnglishAuctionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const auctionId = parseInt(id);
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]); // 確保初始化為空數組
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anonymize, setAnonymize] = useState(false);
  const [lastExtendedAt, setLastExtendedAt] = useState<number | null>(null);
  
  // 認證狀態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // WebSocket 處理
  const { status: wsStatus } = useWebSocket(
    auction?.status_code === 'active' ? auctionId : null,
    {
      onBidAccepted: (data) => {
        loadMyBids();
        if (data.current_price) {
          setAuction(prev => prev ? {
            ...prev,
            current_price: data.current_price,
            reserve_met: data.reserve_met,
          } : null);
        }
      },
      onPriceChanged: (data) => {
        console.log('💰 Price changed:', data);
        setAuction(prev => prev ? {
          ...prev,
          current_price: data.current_price,
          reserve_met: data.reserve_met || false,
        } : null);
        // 重新載入我的出價記錄，因為可能有新的代理出價
        loadMyBids();
      },
      onAuctionExtended: (data) => {
        setLastExtendedAt(Date.now());
        setAuction(prev => prev ? {
          ...prev,
          end_at: data.extended_until,
          extension_count: (prev.extension_count || 0) + 1,
        } : null);
      },
      onAuctionClosed: (data) => {
        setAuction(prev => prev ? {
          ...prev,
          status_code: 'ended',
        } : null);
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    }
  );

  // 載入拍賣資料
  const loadAuction = useCallback(async () => {
    try {
      setLoading(true);
      const auctionData = await auctionApi.getAuction(auctionId);
      setAuction(auctionData);
      
      // 假設通過 /auction_english 路由訪問的都是英式拍賣
      // 如果後端沒有返回 auction_type，我們默認設置為 english
      if (!auctionData.auction_type) {
        auctionData.auction_type = 'english';
      }
      
      if (auctionData.auction_type !== 'english') {
        setError('此拍賣不是英式拍賣');
      }
    } catch (err: any) {
      setError(err.message || '載入拍賣資料失敗');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // 載入出價記錄
  const loadMyBids = useCallback(async () => {
    try {
      const bidData = await auctionApi.getMyBids(auctionId);
      console.log('Bid data received:', bidData); // Debug log
      
      // 處理不同的 API 響應格式
      if (Array.isArray(bidData)) {
        setBids(bidData);
      } else if (bidData && Array.isArray(bidData.data)) {
        setBids(bidData.data);
      } else {
        setBids([]);
      }
    } catch (err) {
      console.error('載入出價記錄失敗:', err);
      setBids([]); // 確保錯誤時設置為空數組
    }
  }, [auctionId]);

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
    loadAuction();
    loadMyBids();
  }, [loadAuction, loadMyBids]);

  // 登出處理
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    apiClient.clearAuthToken();
    router.push('/');
  };

  // 出價處理
  const handlePlaceBid = async (amount: number, maxProxy?: number) => {
    try {
      await auctionApi.placeBid(auctionId, {
        amount,
        max_proxy_amount: maxProxy,
        client_seq: Date.now(),
      });
      await loadMyBids();
    } catch (error) {
      throw error;
    }
  };

  // 直購處理
  const handleBuyItNow = async () => {
    try {
      await auctionApi.buyItNow(auctionId);
      await loadAuction();
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <div className="mt-4 text-gray-600">載入拍賣資料中...</div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">載入失敗</div>
          <div className="text-gray-600 mb-4">{error || '拍賣不存在'}</div>
          <button 
            onClick={() => router.refresh()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  const status = auction.status_code;
  const isActive = status === 'active';
  
  // 模擬價格分布數據
  const mockBuckets = [
    { min: auction.allowed_min_bid, max: auction.allowed_min_bid + 10000, count: 2 },
    { min: auction.allowed_min_bid + 10000, max: auction.allowed_min_bid + 20000, count: 4 },
    { min: auction.allowed_min_bid + 20000, max: auction.allowed_min_bid + 30000, count: 6 },
  ];

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
            
            {/* Right - Navigation Buttons and WebSocket Status */}
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

              {/* WebSocket Status */}
              <div className={classNames(
                "text-xs px-2 py-1 rounded-full",
                wsStatus === 'connected' && "bg-green-100 text-green-800",
                wsStatus === 'connecting' && "bg-yellow-100 text-yellow-800",
                wsStatus === 'error' && "bg-red-100 text-red-800"
              )}>
                {wsStatus === 'connected' ? '即時連線' : 
                 wsStatus === 'connecting' ? '連線中...' : '連線錯誤'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* 左側主內容 */}
          <div className="xl:col-span-8 space-y-6">
            {/* 商品信息 */}
            <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
              <div className="grid grid-cols-3 gap-1 h-80">
                <div 
                  className="col-span-2 h-full" 
                  style={{ background: "linear-gradient(135deg,#e9d5ff,#eef2ff)" }} 
                />
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1" 
                      style={{ 
                        background: i % 2 
                          ? "linear-gradient(135deg,#fee2e2,#fff7ed)" 
                          : "linear-gradient(135deg,#dcfce7,#eff6ff)" 
                      }} 
                    />
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500">賣家 ID: {auction.seller_id}</div>
                <h1 className="text-2xl font-bold tracking-tight">
                  拍賣商品 #{auction.auction_id}
                </h1>
                <p className="mt-2 text-gray-600">
                  英式拍賣，透明競價。起標價 {twd(auction.allowed_min_bid)}，
                  {auction.reserve_price && `保留價 ${twd(auction.reserve_price)}`}
                </p>
              </div>
            </div>

            {/* Tabs 區域：出價紀錄 / 價格分布 / 規則 */}
            <div className="rounded-3xl border border-gray-200 bg-white">
              <div className="flex gap-6 px-6 pt-4 text-sm">
                <a className="font-medium border-b-2 border-blue-500 text-blue-600 cursor-default">
                  出價紀錄
                </a>
                <a className="font-medium border-b-2 border-transparent hover:border-gray-300 cursor-default">
                  價格分布
                </a>
                <a className="font-medium border-b-2 border-transparent hover:border-gray-300 cursor-default">
                  規則
                </a>
                <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={anonymize} 
                      onChange={e => setAnonymize(e.target.checked)} 
                    /> 
                    匿名顯示
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                <div>
                  <BidHistory bids={bids} anonymize={anonymize} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">價格分布（每 5 分鐘更新）</div>
                    <div className="text-xs text-gray-400">
                      上次更新：{new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                  <Histogram 
                    buckets={mockBuckets} 
                    p50={auction.allowed_min_bid + 15000} 
                    p90={auction.allowed_min_bid + 25000} 
                    p99={auction.allowed_min_bid + 30000} 
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    分位數：p50 {twd(auction.allowed_min_bid + 15000)}｜
                    p90 {twd(auction.allowed_min_bid + 25000)}｜
                    p99 {twd(auction.allowed_min_bid + 30000)}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 text-sm text-gray-600">
                <ul className="list-disc pl-5 space-y-1">
                  <li>英式（明標）加價競標，最小加價檔 {twd(auction.min_increment || 10000)}。</li>
                  <li>反狙擊：結束前 3 分鐘內有出價，結束時間自動延長 1 分鐘。</li>
                  <li>賣家設定保留價：未達則可能流標或協商。</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 右側出價面板 */}
          <div className="xl:col-span-4">
            <LiveBidPanel
              auction={auction}
              onPlaceBid={handlePlaceBid}
              onBuyItNow={handleBuyItNow}
              disabled={!isActive}
              lastExtendedAt={lastExtendedAt}
            />
            
            {/* 狀態說明 */}
            {!isActive && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                {status === 'draft' && <p>此拍賣尚未開始。請於開始時間回來或設定提醒。</p>}
                {status === 'ended' && <p>拍賣已結束。若已達保留價，系統已通知得標者與賣家。</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
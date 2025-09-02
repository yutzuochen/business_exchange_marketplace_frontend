// 拍賣服務 API 客戶端
import { Auction, Bid, BidRequest, BidResponse, AuctionResults } from '@/types/auction';

// Re-export types from main types file
export type { Auction, Bid, BidRequest, BidResponse, AuctionResults };

export interface CreateAuctionRequest {
  listing_id: number;
  allowed_min_bid: number;
  allowed_max_bid: number;
  start_at: string;
  end_at: string;
  is_anonymous: boolean;
}

class AuctionApiService {
  // Use the auction service directly on port 8081
  private baseURL = process.env.NEXT_PUBLIC_AUCTION_API_URL || 'http://localhost:8081';

  // 拍賣列表
  async getAuctions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ auctions: Auction[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    // Debug: Log cookies being sent
    console.log('🔍 Auction API: Cookies available:', document.cookie);
    console.log('🔍 Auction API: Requesting:', `${this.baseURL}/api/v1/auctions?${searchParams}`);

    const response = await fetch(`${this.baseURL}/api/v1/auctions?${searchParams}`, {
      credentials: 'include', // Include cookies for authentication
    });

    console.log('🔍 Auction API: Response status:', response.status);
    console.log('🔍 Auction API: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Auction API: Error response:', errorText);
      throw new Error('Failed to fetch auctions');
    }
    const data = await response.json();
    
    // Transform backend response format {items: [], next_page_token: ""} 
    // to expected frontend format {auctions: [], total: number}
    return {
      auctions: data.items || [],
      total: (data.items || []).length
    };
  }

  // 拍賣詳情
  async getAuction(id: number): Promise<Auction> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${id}`, {
      credentials: 'include', // Include cookies for authentication
    });
    if (!response.ok) throw new Error('Failed to fetch auction');
    const data = await response.json();
    // Type assertion to ensure status_code is one of the allowed values
    return data.data.auction as Auction;
  }

  // 創建拍賣
  async createAuction(auctionData: CreateAuctionRequest): Promise<Auction> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(auctionData),
    });

    if (!response.ok) throw new Error('Failed to create auction');
    const data = await response.json();
    return data.data as Auction;
  }

  // 啟用拍賣
  async activateAuction(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${id}/activate`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) throw new Error('Failed to activate auction');
  }

  // 提交出價
  async placeBid(auctionId: number, bidData: BidRequest): Promise<BidResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(bidData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to place bid');
    }
    
    return response.json();
  }

  // 獲取我的出價
  async getMyBids(auctionId: number): Promise<Bid[]> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${auctionId}/my-bids`, {
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) throw new Error('Failed to fetch my bids');
    const data = await response.json();
    return data.data;
  }

  // 獲取拍賣結果
  async getAuctionResults(auctionId: number): Promise<AuctionResults> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${auctionId}/results`, {
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) throw new Error('Failed to fetch auction results');
    const data = await response.json();
    return data.data;
  }

  // English auction: Buy it now
  async buyItNow(auctionId: number): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/auctions/${auctionId}/buy-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      credentials: 'include',
      body: JSON.stringify({
        client_seq: Date.now(),
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to buy it now');
    }
    
    return response.json();
  }

  // 獲取 WebSocket token
  async getWebSocketToken(): Promise<{ token: string; expires_in: number }> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/ws-token`, {
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) throw new Error('Failed to fetch WebSocket token');
    const data = await response.json();
    return data.data;
  }

  // WebSocket 連接 - 使用 token 進行認證
  async createWebSocketConnection(auctionId: number): Promise<WebSocket> {
    try {
      // 先獲取 WebSocket token
      const { token } = await this.getWebSocketToken();
      
      const baseWsUrl = this.baseURL.replace('http', 'ws');
      // 在 URL 查詢參數中添加 token
      const wsUrl = `${baseWsUrl}/ws/auctions/${auctionId}?token=${token}`;
      
      console.log('🔗 WebSocket URL with token:', wsUrl.replace(token, 'TOKEN_HIDDEN'));
      console.log('🎫 Using WebSocket token for authentication');
      
      return new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      throw error;
    }
  }
}

export const auctionApi = new AuctionApiService();
// 拍賣服務 API 客戶端

export interface Auction {
  auction_id: number;
  listing_id: number;
  seller_id: number;
  auction_type: string;
  status_code: string;
  allowed_min_bid: number;
  allowed_max_bid: number;
  start_at: string;
  end_at: string;
  extended_until?: string;
  extension_count: number;
  is_anonymous: boolean;
  soft_close_trigger_sec: number;
  soft_close_extend_sec: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  bid_id: number;
  auction_id: number;
  bidder_id: number;
  amount: number;
  client_seq: number;
  accepted: boolean;
  reject_reason?: string;
  created_at: string;
}

export interface BidRequest {
  amount: number;
  client_seq: number;
}

export interface BidResponse {
  accepted: boolean;
  reject_reason?: string;
  server_time: string;
  soft_close?: {
    extended: boolean;
    extended_until?: string;
  };
  event_id: number;
}

export interface AuctionResults {
  top_bidders: Array<{
    rank: number;
    alias: string;
    amount?: number;
  }>;
  total_participants: number;
  winner_count: number;
}

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
    
    const response = await fetch(`${this.baseURL}/api/v1/auctions?${searchParams}`, {
      credentials: 'include', // Include cookies for authentication
    });
    if (!response.ok) throw new Error('Failed to fetch auctions');
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
    return data.data.auction; // Return only the auction object, not the wrapper
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
    return data.data;
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

  // WebSocket 連接 - HttpOnly cookies are automatically sent with WebSocket handshake
  createWebSocketConnection(auctionId: number): WebSocket {
    const baseWsUrl = this.baseURL.replace('http', 'ws');
    // WebSocket will automatically include HttpOnly cookies during handshake
    const wsUrl = `${baseWsUrl}/ws/auctions/${auctionId}`;
    
    console.log('🔗 WebSocket URL (cookies sent automatically):', wsUrl);
    console.log('🍪 HttpOnly cookies will be sent automatically during handshake');
    
    return new WebSocket(wsUrl);
  }
}

export const auctionApi = new AuctionApiService();
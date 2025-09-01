// 拍賣相關類型定義

export interface Auction {
  auction_id: number;
  listing_id: number;
  seller_id: number;
  auction_type: string;
  status_code: 'draft' | 'active' | 'extended' | 'ended' | 'cancelled';
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

export interface AuctionWebSocketMessage {
  type: 'hello' | 'state' | 'bid_accepted' | 'extended' | 'closed' | 'resume_ok' | 'error';
  data?: any;
  event_id?: number;
  server_time: string;
}

export interface BidderAlias {
  rank: number;
  alias: string;
  amount?: number;
}

export interface AuctionResults {
  top_bidders: BidderAlias[];
  total_participants: number;
  winner_count: number;
}

export interface AuctionStats {
  total_auctions: number;
  active_auctions: number;
  total_bids: number;
  avg_bid_amount: number;
}

export interface CreateAuctionForm {
  listing_id: number;
  allowed_min_bid: number;
  allowed_max_bid: number;
  start_at: Date;
  end_at: Date;
  is_anonymous: boolean;
}

// WebSocket 連接狀態
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// 拍賣狀態顏色映射
export const AuctionStatusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  extended: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};
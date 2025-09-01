// API客户端，用于处理所有API调用和JWT token管理

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 获取认证token (从cookie中获取)
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try to get token from cookie first
      const name = "authToken=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
    }
    return null;
  }

  // Cookie-based auth doesn't require manual token setting
  setAuthToken(token: string): void {
    // No longer needed - cookies are set by the server
    console.log('Token management now handled by server-side cookies');
  }

  // 清除认证token (通过调用logout API)
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('loginSuccess');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userAvatar');
      sessionStorage.removeItem('userId');
      
      // Call logout endpoint to clear cookie
      fetch(`${this.baseURL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.warn('Logout request failed:', err));
    }
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 如果有token，添加到Authorization header
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Essential for cookies to work
      });

      // 如果返回401，清除token并跳转到登录页
      if (response.status === 401) {
        this.clearAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return { error: '认证失败，请重新登录' };
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `请求失败: ${response.status}` };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: '网络请求失败' };
    }
  }

  // 登录
  async login(email: string, password: string): Promise<ApiResponse<{ message: string; user_id: number }>> {
    const response = await this.request<{ message: string; user_id: number }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // With cookie-based auth, the token is automatically set by the server
    // No need to manually handle token storage
    
    return response;
  }

  // 注册
  async register(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  // 获取用户资料
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/user/profile');
  }

  // 获取商品列表
  async getListings(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
  }): Promise<ApiResponse<{listings: any[], pagination: any}>> {
    let url = '/api/v1/listings';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.location) searchParams.append('location', params.location);
      
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.request(url);
  }

  // 获取分类列表
  async getCategories(): Promise<ApiResponse<string[]>> {
    return this.request('/api/v1/categories');
  }

  // 获取商品详情
  async getListing(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/listings/${id}`);
  }

  // 创建商品
  async createListing(listingData: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  // 更新商品
  async updateListing(id: string, listingData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  }

  // 删除商品
  async deleteListing(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/listings/${id}`, {
      method: 'DELETE',
    });
  }

  // 获取收藏列表
  async getFavorites(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/favorites');
  }

  // 添加收藏
  async addFavorite(listingId: string): Promise<ApiResponse<any>> {
    return this.request('/api/v1/favorites', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    });
  }

  // 移除收藏
  async removeFavorite(favoriteId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/favorites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  // 获取消息列表
  async getMessages(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/messages');
  }

  // 发送消息
  async sendMessage(messageData: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // 检查认证状态
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      // 简单检查token是否过期（实际项目中应该验证签名）
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const exp = payload.exp * 1000; // 转换为毫秒
        return Date.now() < exp;
      }
    } catch (error) {
      console.warn('Failed to parse token:', error);
    }

    return false;
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

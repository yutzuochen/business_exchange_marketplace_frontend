// API客户端，用于处理所有API调用和JWT token管理

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  // 获取认证token
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // 设置认证token
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // 清除认证token
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('loginSuccess');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userAvatar');
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
  async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setAuthToken(response.data.token);
    }

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
  async getListings(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/listings');
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

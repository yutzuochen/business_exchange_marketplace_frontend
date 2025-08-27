'use client';

import { useState, useEffect } from 'react';
import { Listing } from '@/types/listing';
import { apiClient } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function MarketPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      console.log('🚀 Starting data fetch...');
      setLoading(true);
      setError(null);
      
      try {
        console.log('📡 Calling API...');
        
        // Log API configuration for debugging
        console.log('🔧 API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'fallback URL');
        
        // Use API client with parameters
        const [listingsResult, categoriesResult] = await Promise.allSettled([
          apiClient.getListings({
            page: currentPage,
            limit: 20,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            location: selectedCounty !== 'all' ? selectedCounty : undefined
          }),
          apiClient.getCategories(),
        ]);
        
        console.log('📊 Results:', { listingsResult, categoriesResult });
        
        // 處理 listings 結果
        if (listingsResult.status === 'fulfilled') {
          setListings(listingsResult.value.listings || []);
          setPagination(listingsResult.value.pagination);
          console.log('✅ Listings loaded:', listingsResult.value.listings?.length || 0);
          console.log('📄 Pagination:', listingsResult.value.pagination);
        } else {
          console.error('❌ Listings failed:', listingsResult.reason);
        }
        
        // 處理 categories 結果
        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value || []);
          console.log('✅ Categories loaded:', categoriesResult.value?.length || 0);
        } else {
          console.error('❌ Categories failed:', categoriesResult.reason);
        }
        
        // 如果兩個都失敗了才設置錯誤
        if (listingsResult.status === 'rejected' && categoriesResult.status === 'rejected') {
          setError('無法載入數據');
        }
        
      } catch (err) {
        console.error('💥 Unexpected error:', err);
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    // 添加延遲確保組件完全掛載
    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [currentPage, selectedCategory, selectedCounty]);

  // Server-side filtering is now handled by the API
  const filteredListings = listings;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">載入失敗</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>請檢查：</p>
            <ul className="list-disc list-inside mt-2">
              <li>後端服務是否運行在 http://localhost:8080</li>
              <li>API 端點是否正常響應</li>
              <li>網絡連接是否正常</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 分類篩選 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">分類篩選</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部
            </button>
            {Array.isArray(categories) && categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 縣市篩選 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3">縣市篩選</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCounty('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCounty === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部縣市
            </button>
            {['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'].map((county) => (
              <button
                key={county}
                onClick={() => {
                  setSelectedCounty(county);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCounty === county
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {county}
              </button>
            ))}
          </div>
        </div>

        {/* 結果統計 */}
        <div className="mb-6">
          <p className="text-gray-600">
            顯示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 個結果，共 {pagination.total} 個
            {selectedCategory !== 'all' && ` (${selectedCategory} 分類)`}
            {selectedCounty !== 'all' && ` (${selectedCounty})`}
          </p>
        </div>

        {/* Listings 網格 */}
        {filteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {/* 分頁控制 */}
            {pagination.total_pages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  {/* 上一頁 */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    上一頁
                  </button>
                  
                  {/* 頁碼 */}
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const pageNum = startPage + i;
                    if (pageNum > pagination.total_pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* 下一頁 */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === pagination.total_pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到結果</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? '目前沒有任何 listings' 
                : `在 ${selectedCategory} 分類中沒有找到結果`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


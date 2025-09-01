'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auctionApi } from '@/lib/auctionApi';
import { CreateAuctionForm } from '@/types/auction';

export default function CreateAuctionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState<CreateAuctionForm>({
    listing_id: 0,
    allowed_min_bid: 0,
    allowed_max_bid: 0,
    start_at: new Date(),
    end_at: new Date(),
    is_anonymous: true,
  });

  const formatDateTimeLocal = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'datetime-local') {
      setFormData(prev => ({ ...prev, [name]: new Date(value) }));
    } else {
      const numericFields = ['listing_id', 'allowed_min_bid', 'allowed_max_bid'];
      setFormData(prev => ({
        ...prev,
        [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (formData.listing_id <= 0) {
      return '請輸入有效的商機編號';
    }
    
    if (formData.allowed_min_bid <= 0) {
      return '最低出價必須大於0';
    }
    
    if (formData.allowed_max_bid <= formData.allowed_min_bid) {
      return '最高出價必須大於最低出價';
    }
    
    if (formData.start_at <= new Date()) {
      return '開始時間必須晚於現在時間';
    }
    
    if (formData.end_at <= formData.start_at) {
      return '結束時間必須晚於開始時間';
    }
    
    const durationDays = (formData.end_at.getTime() - formData.start_at.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < 1 || durationDays > 61) {
      return '拍賣期間必須在1-61天之間';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const auctionData = {
        listing_id: formData.listing_id,
        allowed_min_bid: formData.allowed_min_bid,
        allowed_max_bid: formData.allowed_max_bid,
        start_at: formData.start_at.toISOString(),
        end_at: formData.end_at.toISOString(),
        is_anonymous: formData.is_anonymous,
      };

      const createdAuction = await auctionApi.createAuction(auctionData);
      router.push(`/auctions/${createdAuction.auction_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '創建拍賣失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount);
  };

  // 設置預設時間（現在時間 + 1小時開始，+ 8天結束）
  const setDefaultTimes = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1小時
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7天
    
    setFormData(prev => ({
      ...prev,
      start_at: startTime,
      end_at: endTime,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
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
              <h1 className="text-2xl font-bold text-gray-900">創建新拍賣</h1>
              <p className="text-gray-600">設定拍賣參數並發布商機競標</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Listing ID */}
            <div>
              <label htmlFor="listing_id" className="block text-sm font-medium text-gray-700 mb-2">
                商機編號 *
              </label>
              <input
                type="number"
                id="listing_id"
                name="listing_id"
                value={formData.listing_id || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="輸入要拍賣的商機編號"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                請輸入有效的商機編號，該商機將進行拍賣
              </p>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="allowed_min_bid" className="block text-sm font-medium text-gray-700 mb-2">
                  最低出價 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">NT$</span>
                  </div>
                  <input
                    type="number"
                    id="allowed_min_bid"
                    name="allowed_min_bid"
                    value={formData.allowed_min_bid || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0"
                    min="1"
                    step="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="allowed_max_bid" className="block text-sm font-medium text-gray-700 mb-2">
                  最高出價 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">NT$</span>
                  </div>
                  <input
                    type="number"
                    id="allowed_max_bid"
                    name="allowed_max_bid"
                    value={formData.allowed_max_bid || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0"
                    min={formData.allowed_min_bid + 1}
                    step="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Price Range Preview */}
            {formData.allowed_min_bid > 0 && formData.allowed_max_bid > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">
                  出價區間: {formatCurrency(formData.allowed_min_bid)} - {formatCurrency(formData.allowed_max_bid)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  投標者只能在此區間內出價
                </div>
              </div>
            )}

            {/* Time Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">拍賣時間設定</h3>
                <button
                  type="button"
                  onClick={setDefaultTimes}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  使用預設時間
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_at" className="block text-sm font-medium text-gray-700 mb-2">
                    開始時間 *
                  </label>
                  <input
                    type="datetime-local"
                    id="start_at"
                    name="start_at"
                    value={formatDateTimeLocal(formData.start_at)}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="end_at" className="block text-sm font-medium text-gray-700 mb-2">
                    結束時間 *
                  </label>
                  <input
                    type="datetime-local"
                    id="end_at"
                    name="end_at"
                    value={formatDateTimeLocal(formData.end_at)}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Duration Info */}
              {formData.start_at && formData.end_at && formData.end_at > formData.start_at && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-800 font-medium">
                    拍賣期間: {Math.ceil((formData.end_at.getTime() - formData.start_at.getTime()) / (1000 * 60 * 60 * 24))} 天
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    拍賣期間必須在1-61天之間
                  </div>
                </div>
              )}
            </div>

            {/* Auction Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">拍賣設定</h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_anonymous" className="ml-2 block text-sm text-gray-700">
                    匿名拍賣
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  啟用後，投標者身份將以匿名方式顯示（例如：Bidder #23）
                </p>
              </div>

              {/* Soft-close Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-blue-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">軟關閉機制</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      在拍賣結束前3分鐘內如有人出價，拍賣時間將自動延長1分鐘。此機制防止狙擊出價，確保公平競爭。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    創建中...
                  </div>
                ) : (
                  '創建拍賣'
                )}
              </button>
              
              <Link
                href="/auctions"
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                取消
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              創建後，拍賣將處於草稿狀態，您可以在拍賣詳情頁面中啟用它
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
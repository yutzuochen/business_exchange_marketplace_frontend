/** @type {import('next').NextConfig} */
const nextConfig = {
  // 啟用獨立輸出，用於 Docker 部署
  output: 'standalone',
  
  // 禁用圖片優化（在 Cloud Run 中可能會有問題）
  images: {
    unoptimized: true,
  },
  
  // 環境變量 - 確保在構建時被正確處理
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://business-exchange-backend-430730011391.us-central1.run.app',
  },
  
  // 關閉 React Strict Mode 以避免水合問題
  reactStrictMode: false,
  
  // 使用 SWC minify 以獲得更好的性能
  swcMinify: true,
  
  // 優化構建配置
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Cloud Run 優化配置
  experimental: {
    // 啟用 PPR（Partial Prerendering）如果需要
    // ppr: true,
  },
  
  // 壓縮配置
  compress: true,
  
  // 輸出追蹤
  outputFileTracing: true,
  
  // 確保環境變數在客戶端可用
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://business-exchange-backend-430730011391.us-central1.run.app',
  },
}

module.exports = nextConfig

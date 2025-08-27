# 🚀 前端部署指南

## 📋 項目概述

- **技術棧**: Next.js 14.2.5 + React 18 + TypeScript + Tailwind CSS
- **部署平台**: Google Cloud Run
- **容器化**: Docker 多階段構建
- **輸出模式**: Standalone（獨立模式）

## ✅ 已配置的文件

### 1. **Dockerfile.production**
- 多階段構建優化
- 使用 Node.js 20 Alpine
- 非 root 用戶運行
- 健康檢查配置
- 生產環境優化

### 2. **next.config.js**
- 啟用 `standalone` 輸出模式
- 優化 Cloud Run 配置
- 禁用圖片優化（避免 Cloud Run 問題）
- 生產環境移除 console.log

### 3. **deploy-frontend.sh**
- 自動獲取後端 API URL
- 完整的部署流程
- 健康檢查驗證
- 錯誤處理

### 4. **.dockerignore**
- 排除開發文件
- 優化構建大小
- 保留必要的生產文件

## 🚀 部署步驟

### 1. 準備環境
```bash
# 切換到前端目錄
cd /home/mason/Documents/bex567/business_exchange_marketplace_frontend

# 確保已登入 Google Cloud
gcloud auth login
gcloud auth configure-docker

# 設置專案
gcloud config set project businessexchange-468413
```

### 2. 確保後端已部署
前端需要連接到後端 API，請先確保後端服務已成功部署：
```bash
# 檢查後端服務狀態
gcloud run services describe business-exchange --region=us-central1

# 測試後端健康檢查
curl https://your-backend-url/health
```

### 3. 部署前端
```bash
# 運行部署腳本
./deploy-frontend.sh
```

### 4. 驗證部署
```bash
# 腳本會自動進行健康檢查，但你也可以手動測試：

# 測試健康檢查端點
curl https://your-frontend-url/api/healthz

# 在瀏覽器中訪問
open https://your-frontend-url
```

## 🔧 關鍵配置說明

### Docker 配置
- **多階段構建**: 優化最終映像大小
- **非 root 用戶**: 提高安全性
- **健康檢查**: Cloud Run 自動監控
- **端口配置**: 綁定到 `0.0.0.0:3000`

### Next.js 配置
- **Standalone 模式**: 包含所有依賴的獨立可執行文件
- **輸出追蹤**: 只包含必要的文件
- **環境變數**: 自動注入 `NEXT_PUBLIC_API_URL`

### Cloud Run 配置
- **內存**: 1GB
- **CPU**: 1 vCPU
- **並發**: 80 個請求
- **超時**: 300 秒
- **自動縮放**: 0-10 實例

## 🌐 環境變數

### 部署時自動設置
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL`: 自動從後端服務獲取
- `NEXT_TELEMETRY_DISABLED=1`

### 手動配置（可選）
在 `env.production` 文件中添加其他環境變數：
```bash
NEXT_PUBLIC_APP_NAME=Business Exchange Marketplace
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 🔍 故障排除

### 構建失敗
```bash
# 檢查依賴安裝
npm install

# 本地測試構建
npm run build

# 檢查 Docker 構建
docker build -f Dockerfile.production -t test-frontend .
```

### 部署失敗
```bash
# 查看部署日誌
gcloud logs read --service=business-exchange-frontend --limit=50

# 檢查服務狀態
gcloud run services describe business-exchange-frontend --region=us-central1
```

### 健康檢查失敗
```bash
# 確保健康檢查端點存在
curl https://your-frontend-url/api/healthz

# 檢查 Next.js 路由配置
# 確保 src/app/api/healthz/route.ts 存在且正確
```

### API 連接問題
```bash
# 檢查環境變數
gcloud run services describe business-exchange-frontend --region=us-central1 --format="export"

# 驗證後端 URL 可訪問
curl https://your-backend-url/health

# 檢查 CORS 設置
```

## 📊 性能優化

### 已啟用的優化
- ✅ SWC 編譯器
- ✅ 生產環境移除 console.log
- ✅ 輸出文件追蹤
- ✅ 壓縮啟用
- ✅ Docker 多階段構建

### 可選優化
- 啟用 CDN（Cloud CDN）
- 配置緩存策略
- 啟用 PPR（Partial Prerendering）
- 圖片優化服務

## 🔒 安全考慮

- ✅ 非 root 用戶運行
- ✅ 最小化 Docker 映像
- ✅ 環境變數安全管理
- ✅ HTTPS 強制（Cloud Run 自動）

## 📝 部署檢查清單

- [ ] 後端服務已部署並可訪問
- [ ] Google Cloud 認證已配置
- [ ] Docker 已安裝並運行
- [ ] 前端代碼已更新
- [ ] 環境變數已正確設置
- [ ] 運行 `./deploy-frontend.sh`
- [ ] 驗證健康檢查通過
- [ ] 在瀏覽器中測試功能
- [ ] 檢查前後端通信正常

## 🎯 後續步驟

1. **設置自定義域名** (可選)
2. **配置 SSL 證書** (自動)
3. **設置 CDN** (可選)
4. **配置監控和告警**
5. **設置 CI/CD 流程**

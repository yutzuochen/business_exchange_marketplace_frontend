# 🔧 API URL 修復驗證

## 問題
前端在瀏覽器中調用 API 時仍然使用 `http://localhost:8080` 而不是正確的後端 URL。

## 修復內容

### 1. **修復 API 客戶端**
**文件**: `src/lib/api.ts`
- 移除了複雜的條件邏輯
- 簡化為直接使用環境變數或 fallback
- 添加了調試日誌

### 2. **更新 Next.js 配置**
**文件**: `next.config.js`
- 更新了預設的 API URL
- 確保環境變數正確傳遞

### 3. **構建時環境變數**
在 Docker 構建時設置環境變數：
```bash
NEXT_PUBLIC_API_URL=https://business-exchange-backend-430730011391.us-central1.run.app docker build ...
```

## 驗證步驟

### 1. 檢查瀏覽器控制台
打開 https://business-exchange-frontend-430730011391.us-central1.run.app/market
查看控制台是否顯示：
```
🔧 API_BASE_URL: https://business-exchange-backend-430730011391.us-central1.run.app
🔧 NEXT_PUBLIC_API_URL: https://business-exchange-backend-430730011391.us-central1.run.app
```

### 2. 檢查網絡請求
在瀏覽器開發者工具的 Network 選項卡中，確認 API 請求使用：
- ✅ `https://business-exchange-backend-430730011391.us-central1.run.app/api/v1/listings`
- ✅ `https://business-exchange-backend-430730011391.us-central1.run.app/api/v1/categories`

而不是：
- ❌ `http://localhost:8080/api/v1/listings`
- ❌ `http://localhost:8080/api/v1/categories`

## 部署信息
- **版本**: business-exchange-frontend-00016-56n
- **構建時間**: 2025-08-27 08:51:56
- **環境變數**: 已正確設置
- **狀態**: ✅ 運行中

## 測試 URL
https://business-exchange-frontend-430730011391.us-central1.run.app/market

如果仍然看到 localhost URL，請：
1. 清除瀏覽器快取
2. 強制刷新頁面 (Ctrl+F5)
3. 檢查瀏覽器開發者工具的控制台和網絡選項卡

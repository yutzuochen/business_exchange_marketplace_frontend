#!/bin/bash

# 🚀 前端 Next.js 部署到 Google Cloud Run 腳本
# 專案 ID: businessexchange-468413

set -e

echo "🚀 開始部署前端到 Google Cloud Run..."

# 檢查必要的環境變數
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "❌ 錯誤: 請設置 GOOGLE_APPLICATION_CREDENTIALS 環境變數"
    echo "   例如: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
    exit 1
fi

# 設置專案變數
PROJECT_ID="businessexchange-468413"
REGION="us-central1"
FRONTEND_SERVICE_NAME="business-exchange-frontend"
FRONTEND_IMAGE_NAME="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE_NAME}"

# 後端 API URL（從後端服務獲取或手動設置）
BACKEND_SERVICE_NAME="business-exchange"
BACKEND_URL=""

echo "📋 專案資訊:"
echo "   專案 ID: ${PROJECT_ID}"
echo "   地區: ${REGION}"
echo "   前端服務名稱: ${FRONTEND_SERVICE_NAME}"
echo "   前端映像名稱: ${FRONTEND_IMAGE_NAME}"

# 嘗試獲取後端服務 URL
echo "🔍 獲取後端服務 URL..."
if gcloud run services describe ${BACKEND_SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="value(status.url)" &>/dev/null; then
    BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="value(status.url)")
    echo "   後端 URL: ${BACKEND_URL}"
else
    echo "⚠️  無法獲取後端服務 URL，使用預設值"
    BACKEND_URL="https://business-exchange-placeholder.a.run.app"
fi

# 1. 構建 Docker 映像
echo "🔨 構建前端 Docker 映像..."
docker build -f Dockerfile.production -t ${FRONTEND_IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo "❌ Docker 映像構建失敗"
    exit 1
fi

echo "✅ 前端 Docker 映像構建成功"

# 2. 推送到 Google Container Registry
echo "📤 推送前端映像到 Google Container Registry..."
docker push ${FRONTEND_IMAGE_NAME}

if [ $? -ne 0 ]; then
    echo "❌ Docker 映像推送失敗"
    exit 1
fi

echo "✅ 前端 Docker 映像推送成功"

# 3. 部署到 Cloud Run
echo "🚀 部署前端到 Cloud Run..."
gcloud run deploy ${FRONTEND_SERVICE_NAME} \
    --image ${FRONTEND_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    --set-env-vars "NEXT_TELEMETRY_DISABLED=1"

if [ $? -ne 0 ]; then
    echo "❌ 前端部署失敗"
    exit 1
fi

echo "✅ 前端部署成功！"

# 4. 獲取前端服務 URL
FRONTEND_URL=$(gcloud run services describe ${FRONTEND_SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="value(status.url)")

echo "🎉 部署完成!"
echo "🌐 前端 URL: ${FRONTEND_URL}"
echo "🔗 後端 URL: ${BACKEND_URL}"
echo ""
echo "📝 重要配置說明:"
echo "   ✅ Next.js 獨立模式: 已啟用"
echo "   ✅ 服務器綁定: 0.0.0.0:3000"
echo "   ✅ 環境變數: NEXT_PUBLIC_API_URL=${BACKEND_URL}"
echo ""
echo "📝 下一步:"
echo "   1. 測試前端: curl ${FRONTEND_URL}/api/healthz"
echo "   2. 瀏覽器訪問: ${FRONTEND_URL}"
echo "   3. 檢查日誌: gcloud logs read --service=${FRONTEND_SERVICE_NAME}"

# 5. 顯示服務狀態
echo ""
echo "📊 服務狀態:"
gcloud run services describe ${FRONTEND_SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="table(metadata.name,status.url,status.conditions[0].status,status.conditions[0].message)"

# 6. 測試健康檢查
echo ""
echo "🔍 測試健康檢查..."
sleep 15
if curl -f "${FRONTEND_URL}/api/healthz" 2>/dev/null; then
    echo "✅ 前端健康檢查通過"
else
    echo "⚠️  前端健康檢查失敗，請檢查日誌"
    echo "   查看日誌: gcloud logs read --service=${FRONTEND_SERVICE_NAME} --limit=50"
fi

echo ""
echo "🎯 測試完整應用:"
echo "   前端: ${FRONTEND_URL}"
echo "   後端 API: ${BACKEND_URL}/health"

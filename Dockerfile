# syntax=docker/dockerfile:1.7

# Development image for Next.js — 快速、穩定 Hot Reload、避免 chown node_modules
FROM node:20-alpine AS dev
WORKDIR /app

# 健康檢查與部分套件會用到
RUN apk add --no-cache libc6-compat curl

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true

# 先安裝依賴以利用建置快取（注意：執行時 node_modules 會掛 volume，
# 因此我們還會在 entrypoint 再檢查一次並自動 npm ci）
COPY package*.json ./
RUN npm ci

# 程式碼（開發時會被 bind mount 覆蓋，但保留可單獨啟動能力）
COPY . .

# 入口腳本：若 volume 為空，首次啟動時自動 npm ci
COPY docker/entrypoint.dev.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "run", "dev"]

# 短網址與 QR Code 服務

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-brightgreen)](https://www.mongodb.com/)

一個基於 Node.js 和 MongoDB 的短網址服務，支援短網址生成、QR Code 生成和點擊統計。

## 功能特點

- 將長網址轉換為短網址
- 生成短網址對應的 QR Code
- 短網址轉址（302 重定向）
- 點擊統計
- RESTful API 介面
- 持久化儲存（MongoDB）

## 快速開始

### 環境要求

- Node.js 16.0 或更高版本
- MongoDB 6.0 或更高版本（或 MongoDB Atlas）
- npm 或 yarn

### 安裝步驟

1. 克隆存儲庫：
   ```bash
   git clone https://github.com/yourusername/express-qrcode-shortner.git
   cd express-qrcode-shortner
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 配置環境變數：
   ```bash
   cp .env.example .env
   ```
   然後編輯 `.env` 文件，設置您的 MongoDB 連接字串和其他配置。

4. 啟動服務：
   ```bash
   # 開發模式
   npm run dev
   
   # 生產模式
   npm start
   ```

5. 服務將在 `http://localhost:3000` 上運行

## API 文檔

### 創建短網址

```http
POST /api/short-urls
Content-Type: application/json

{
  "url": "https://example.com/very/long/url"
}
```

**成功響應 (201 Created):**
```json
{
  "code": "abc123",
  "shortUrl": "http://localhost:3000/abc123",
  "longUrl": "https://example.com/very/long/url",
  "createdAt": "2025-08-14T04:00:00.000Z"
}
```

### 獲取短網址信息

```http
GET /api/short-urls/{code}
```

**成功響應 (200 OK):**
```json
{
  "code": "abc123",
  "longUrl": "https://example.com/very/long/url",
  "hitCount": 42,
  "createdAt": "2025-08-14T04:00:00.000Z"
}
```

### 使用短網址轉址

```http
GET /{code}
```

**響應:**
- 302 重定向到原始網址
- 如果短碼不存在，返回 404 錯誤

## 測試

使用 VS Code 的 REST Client 擴展來測試 API：

1. 安裝 [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) 擴展
2. 打開 `test.http` 文件
3. 點擊 "Send Request" 按鈕發送請求

## 部署

### 環境變數

| 變數名稱 | 必填 | 預設值 | 說明 |
|---------|------|--------|------|
| PORT | 否 | 3000 | 服務監聽端口 |
| NODE_ENV | 否 | development | 運行環境 |
| MONGODB_URI | 是 | - | MongoDB 連接字串 |

### 使用 PM2 部署

```bash
# 全局安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start index.js --name "url-shortener"

# 設置開機自啟
pm2 startup
pm2 save

# 查看日誌
pm2 logs url-shortener
```

## 貢獻

歡迎提交 Issue 和 Pull Request。對於重大變更，請先開 Issue 討論您想要更改的內容。

## 授權

[MIT](LICENSE) © 2025

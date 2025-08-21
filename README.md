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

### 本地開發部署

#### 直接運行
```bash
# 開發模式（使用 nodemon 自動重啟）
npm run dev

# 生產模式
npm start
```

#### 使用 PM2 進程管理器

PM2 是一個 Node.js 應用程序的**進程管理器**，它可以：
- 自動重啟崩潰的應用程序
- 提供負載均衡（多實例運行）
- 監控應用程序狀態和資源使用
- 管理應用程序日誌
- 設置開機自啟動

**注意**：PM2 本身不是部署平台，而是在服務器上管理 Node.js 應用程序的工具。

```bash
# 全局安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start index.js --name "url-shortener"

# 查看運行狀態
pm2 status

# 查看日誌
pm2 logs url-shortener

# 重啟應用
pm2 restart url-shortener

# 停止應用
pm2 stop url-shortener

# 設置開機自啟（僅限 Linux/macOS 服務器）
pm2 startup
pm2 save

# 刪除應用
pm2 delete url-shortener
```

### 生產環境部署

要讓其他人能夠訪問你的短網址服務，你需要將應用部署到公網服務器上：

#### 1. 雲服務器部署
- **AWS EC2**：Amazon 的雲服務器
- **Google Cloud Compute Engine**：Google 的雲服務器
- **DigitalOcean Droplets**：簡單易用的 VPS
- **Linode**：高性能 VPS
- **Vultr**：全球分佈的 VPS

#### 2. 平台即服務 (PaaS)
- **Heroku**：簡單的應用部署平台
- **Railway**：現代化的部署平台
- **Render**：全棧雲平台
- **Vercel**：主要用於前端，但也支援 Node.js API

#### 3. 容器化部署
- **Docker + Docker Hub**
- **Kubernetes**
- **AWS ECS/EKS**

#### 部署步驟示例（以 Ubuntu 服務器為例）

```bash
# 1. 在服務器上安裝 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆專案
git clone https://github.com/yourusername/express-qrcode-shortner.git
cd express-qrcode-shortner

# 3. 安裝依賴
npm install

# 4. 設置環境變數
cp .env.example .env
# 編輯 .env 文件，設置 MONGODB_URI 等

# 5. 安裝 PM2
npm install -g pm2

# 6. 啟動應用
pm2 start index.js --name "url-shortener"

# 7. 設置開機自啟
pm2 startup
pm2 save

# 8. 配置防火牚牆（開放 3000 端口或你設置的端口）
sudo ufw allow 3000
```

#### 域名和反向代理

在生產環境中，通常會：
1. 購買域名（如 `yourdomain.com`）
2. 使用 Nginx 作為反向代理
3. 配置 SSL 證書（Let's Encrypt）

```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 監控和維護

```bash
# 查看應用狀態
pm2 monit

# 查看詳細信息
pm2 show url-shortener

# 重載應用（零停機時間）
pm2 reload url-shortener

# 查看錯誤日誌
pm2 logs url-shortener --err
```

## 貢獻

歡迎提交 Issue 和 Pull Request。對於重大變更，請先開 Issue 討論您想要更改的內容。

## 授權

[MIT](LICENSE) © 2025

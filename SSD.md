# 軟體設計文件 (Software Design Document) - Express QR Code 短網址服務

本文檔旨在說明「Express QR Code 短網址服務」的設計與架構。

## 1. 專案概覽

本專案是一個使用 Node.js 和 Express 框架開發的 Web 應用程式。其主要目標是提供一個簡單、快速的服務，讓使用者可以將冗長的 URL 網址轉換為簡短的短網址。

為了提升實用性與便利性，系統在生成短網址的同時，也會為其產生對應的 QR Code，方便使用者在行動裝置上進行掃描和分享。

## 2. 核心功能

- **短網址生成**：使用者可以透過 Web 介面或 API，提交一個原始的長網址。系統會為此網址生成一個獨一無二、長度較短的代碼。
- **網址重定向**：當使用者存取一個生成的短網址時 (例如 `http://your-domain.com/xxxxxx`)，系統會以 HTTP 302 狀態碼將使用者重定向到原始的長網址。
- **QR Code 產生**：在成功生成短網址後，系統會提供一個 API 端點，能動態生成該短網址對應的 QR Code 圖片。前端介面會直接顯示此圖片供使用者掃描或下載。
- **點擊次數追蹤**：系統會記錄每一個短網址被存取（點擊）的次數，可用於未來的功能擴充，例如數據分析。

## 3. 技術棧

- **後端框架**：Express.js
- **執行環境**：Node.js
- **資料庫**：MongoDB
- **資料庫模型工具 (ODM)**：Mongoose
- **短碼生成**：`nanoid`
- **QR Code 生成**：`qrcode`
- **環境變數管理**：`dotenv`
- **跨域資源共享**：`cors`
- **前端**：HTML, CSS, JavaScript (無框架)

## 4. API 端點

| 方法   | 路由                       | 說明                                                               |
| :----- | :------------------------- | :----------------------------------------------------------------- |
| `POST` | `/api/short-urls`          | 建立一個新的短網址。需要傳入包含 `url` 的 JSON 物件。               |
| `GET`  | `/api/short-urls/:code`    | 查詢指定 `code` 的詳細資訊，包含長網址、建立時間和點擊次數。       |
| `GET`  | `/:code`                   | 存取短網址，觸發重定向到原始長網址，並增加點擊次數。               |
| `GET`  | `/api/qrcode/:code`        | 產生指定 `code` 對應的 QR Code 圖片 (PNG 格式)。                   |

## 5. 資料庫結構

本專案使用 MongoDB 資料庫，並定義了一個名為 `Url` 的 Mongoose 模型。

- **集合 (Collection)**: `urls`

- **文檔結構 (Schema)**:
  ```javascript
  {
    code: {
      type: String,
      required: true,
      unique: true // 建立唯一索引，確保 code 不重複
    },
    longUrl: {
      type: String,
      required: true
    },
    hitCount: {
      type: Number,
      default: 0 // 點擊次數，預設為 0
    },
    createdAt: {
      type: Date,
      default: Date.now // 文件建立時間
    }
  }
  ```
- **索引 (Indexes)**:
    - 在 `code` 欄位上建立唯一索引以加速查詢並確保唯一性。
    - 在 `createdAt` 欄位上建立 TTL (Time-To-Live) 索引，可選用以讓文件在一年後自動過期。
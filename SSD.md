

# 系統設計文件（SDD）

## 專案概覽

**專案名稱**：短網址與 QR Code 服務  
**版本**：v2.0  
**最後更新**：2025-08-14  
**技術棧**：
- **後端**：Node.js (Express 4.x)
- **資料庫**：MongoDB 6.0+ with Mongoose ODM
- **開發工具**：
  - VS Code 推薦擴展：REST Client, ESLint, MongoDB for VS Code
  - Postman (API 測試)
  - MongoDB Compass (資料庫可視化)

## 專案結構

```
/
├── config/               # 配置文件
│   └── db.js            # 資料庫連接配置
├── controllers/         # 控制器
│   ├── urlController.js # URL 相關邏輯
│   └── qrController.js  # QR Code 生成邏輯
├── middleware/          # 中間件
│   ├── errorHandler.js  # 錯誤處理
│   └── validator.js     # 請求驗證
├── models/              # 資料模型
│   └── Url.js          # URL 模型
├── routes/              # 路由定義
│   ├── api.js          # API 路由
│   └── web.js          # Web 路由
├── services/            # 業務邏輯
│   ├── urlService.js   # URL 服務
│   └── qrService.js    # QR Code 服務
├── utils/               # 工具函數
│   ├── logger.js       # 日誌工具
│   └── validator.js    # 驗證工具
├── .env.example        # 環境變數示例
├── .gitignore          # Git 忽略文件
├── app.js              # Express 應用入口
├── package.json        # 項目配置
└── README.md           # 項目文檔
```

## 環境要求

- Node.js 16.0+
- MongoDB 6.0+ (或 MongoDB Atlas)
- npm 8.0+ 或 yarn 1.22+

## 快速啟動

```bash
# 1. 克隆倉庫
git clone https://github.com/yourusername/express-qrcode-shortner.git
cd express-qrcode-shortner

# 2. 安裝依賴
npm install

# 3. 配置環境變數
cp .env.example .env
# 編輯 .env 文件設置您的配置

# 4. 啟動開發服務器
npm run dev
```

## 數據模型

---

### 1. 系統簡介

本系統提供使用者將長網址轉換為短網址，並可生成對應的 QR Code。
同時支援查詢短碼資訊與短碼轉址功能，適合做教學與快速 Demo。
採用 MongoDB 進行持久化儲存，確保資料在伺服器重啟後仍然存在。

---

### 2. 功能需求

1. **產生短碼**

   * 接收長網址，驗證合法性後生成短碼
   * 儲存 `{code, longUrl, createdAt, hitCount}`
   * 回傳短碼與短網址完整連結
2. **短碼轉址**

   * 依短碼轉址至原始網址（HTTP 302）
   * 命中計數器 `hitCount` +1
3. **查詢短碼資訊**

   * 回傳原始網址、建立時間、命中次數
4. **錯誤處理**

   * URL 無效 → 400 `ERR_INVALID_URL`
   * 短碼不存在 → 404 `ERR_NOT_FOUND`
5. **（選配）生成 QR Code**

   * 基於短網址生成 PNG 或 Base64 圖片

---

### 3. API 規格

#### 3.1 建立短碼

**Method / Path**：`POST /api/short-urls`
**Request Body**：

```json
{
  "url": "https://example.com/hello-world"
}
```

**Response 201**：

```json
{
  "code": "abc123",
  "shortUrl": "http://localhost:3000/abc123",
  "longUrl": "https://example.com/hello-world",
  "createdAt": "2025-08-06T01:23:45.678Z"
}
```

**錯誤 400**：

```json
{
  "error": { "code": "ERR_INVALID_URL", "message": "無效的網址" }
}
```

---

#### 3.2 查詢短碼資訊

**Method / Path**：`GET /api/short-urls/:code`
**Response 200**：

```json
{
  "code": "abc123",
  "longUrl": "https://example.com/hello-world",
  "createdAt": "2025-08-06T01:23:45.678Z",
  "hitCount": 5
}
```

**錯誤 404**：

```json
{
  "error": { "code": "ERR_NOT_FOUND", "message": "短碼不存在" }
}
```

---

#### 3.3 短碼轉址

**Method / Path**：`GET /:code`
**Response**：HTTP 302，Header:

```
Location: https://example.com/hello-world
```

**錯誤 404**：

```json
{
  "error": { "code": "ERR_NOT_FOUND", "message": "短碼不存在" }
}
```

---

## 數據模型

### 1. URL 模型 (models/Url.js)

```javascript
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  // 短碼：6位隨機字串，不區分大小寫
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 6,
    match: /^[A-Z0-9]{6}$/
  },
  
  // 原始網址
  longUrl: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // URL 驗證正則表達式
        return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/.test(v);
      },
      message: props => `${props.value} 不是有效的 URL`
    }
  },
  
  // 點擊計數
  hitCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 創建時間
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '365d' } // 文檔在 1 年後過期
  },
  
  // 元數據
  meta: {
    createdBy: String,    // 創建者 ID 或 IP
    lastAccessed: Date,   // 最後訪問時間
    userAgent: String     // 創建時的使用者代理
  }
}, {
  timestamps: true,      // 自動添加 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 添加虛擬屬性：短網址
urlSchema.virtual('shortUrl').get(function() {
  return `${process.env.BASE_URL || 'http://localhost:3000'}/${this.code}`;
});

// 添加靜態方法：生成唯一短碼
urlSchema.statics.generateUniqueCode = async function() {
  const { nanoid } = await import('nanoid');
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = nanoid(6).toUpperCase();
    const existing = await this.findOne({ code });
    if (!existing) isUnique = true;
  }
  
  return code;
};

// 添加實例方法：增加點擊計數
urlSchema.methods.incrementHits = async function() {
  this.hitCount += 1;
  this.meta.lastAccessed = new Date();
  return this.save();
};

// 複合索引
urlSchema.index({ code: 1 }, { unique: true });
urlSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1年後過期

module.exports = mongoose.model('Url', urlSchema);
```

### 2. 數據驗證

#### 2.1 URL 驗證規則
- 必須是有效的 HTTP/HTTPS URL
- 必須包含協議頭（http:// 或 https://）
- 必須是公開可訪問的網址

#### 2.2 短碼生成規則
- 長度：6個字符
- 字符集：大寫字母 A-Z 和數字 0-9
- 不區分大小寫（存儲時轉為大寫）
- 必須全局唯一

## API 端點規範

---

### 5. 系統架構

* **前端**（可選）：HTML + CSS + JS，提供輸入長網址、生成短碼與 QR Code、點擊複製功能
* **後端**：Express + nanoid（生成短碼）
* **儲存層**：In-Memory Map（教學用，無持久化）

---

### 6. 測試與驗收

使用 `.http` 測試檔進行：

1. 建立短碼（應回 201 並有 `code`）
2. 查詢短碼（應回 200 並顯示命中數）
3. 轉址（應回 302 並 `Location` 正確）
4. 空網址測試（應回 400 `ERR_INVALID_URL`）
5. 不存在短碼測試（應回 404 `ERR_NOT_FOUND`）

---

### 7. 限制與注意事項

* 所有資料儲存在記憶體中，伺服器重啟資料會消失
* 未實作防短碼碰撞策略（教學可省略，正式需處理）
* QR Code 功能需額外安裝套件（如 `qrcode`）

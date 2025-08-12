

## 系統設計文件（SDD）

**專案名稱**：In-Memory 短網址與 QR Code 服務
**版本**：v1.0
**日期**：2025-08-06
**開發語言 / 框架**：Node.js (Express)
**資料儲存方式**：記憶體 Map（非持久化）

---

### 1. 系統簡介

本系統提供使用者將長網址轉換為短網址，並可生成對應的 QR Code。
同時支援查詢短碼資訊與短碼轉址功能，適合做教學與快速 Demo。
由於採用 In-Memory 儲存，伺服器重啟後資料會清空。

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

### 4. 資料模型

```js
{
  code: String,          // 短碼
  longUrl: String,       // 原始網址
  createdAt: Date,       // 建立時間
  hitCount: Number       // 命中次數
}
```

儲存在伺服器記憶體的 Map：

```js
const store = new Map();
```

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

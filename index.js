
require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const Url = require('./models/Url');

const app = express();
const port = process.env.PORT || 3000;

// 配置 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON 請求體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供靜態文件
app.use(express.static(path.join(__dirname, 'public')));

// 連接到 MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener';
console.log('正在連接到 MongoDB...', mongoURI);

// 啟用 Mongoose 調試日誌
mongoose.set('debug', (collectionName, method, query, doc) => {
  console.log(`Mongoose: ${collectionName}.${method}`, JSON.stringify(query), doc);
});

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
  .then(async () => {
    console.log('成功連接到 MongoDB');

    try {
      // 檢查資料庫連接狀態
      console.log('MongoDB 連接狀態:', mongoose.connection.readyState);

      // 列出所有資料庫
      const dbs = await mongoose.connection.db.admin().listDatabases();
      console.log('可用的資料庫:', dbs.databases.map(db => db.name));

      // 檢查 url-shortener 資料庫
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log('url-shortener 資料庫中的集合:', collections.map(c => c.name));

      // 檢查 urls 集合
      const urlsCollection = db.collection('urls');
      const count = await urlsCollection.countDocuments();
      console.log(`urls 集合中的文檔數量: ${count}`);

      // 檢查索引
      const indexes = await urlsCollection.indexes();
      console.log('urls 集合的索引:', JSON.stringify(indexes, null, 2));
    } catch (err) {
      console.error('檢查資料庫時出錯:', err);
    }
  })
  .catch(err => {
    console.error('MongoDB 連接錯誤:', err);
    console.error('連線字串:', mongoURI.replace(/:([^:]+)@/, ':******@'));
    process.exit(1);
  });

// 驗證 URL 的輔助函式
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 建立短碼
app.post('/api/short-urls', async (req, res) => {
  console.log('收到請求:', req.body);
  const { url } = req.body;

  if (!url) {
    console.log('缺少 URL 參數');
    return res.status(400).json({
      error: { code: 'ERR_MISSING_URL', message: '請提供要縮短的網址' },
    });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: { code: 'ERR_INVALID_URL', message: '無效的網址' },
    });
  }

  try {
    const { nanoid } = await import('nanoid');
    const code = nanoid(6);

    const newUrl = new Url({
      code,
      longUrl: url
    });

    console.log('準備儲存新的 URL:', { code, url });

    try {
      const savedUrl = await newUrl.save();
      console.log('URL 已儲存到資料庫:', savedUrl);

      // 確認文檔是否真的存在於集合中
      const foundDoc = await mongoose.connection.db.collection('urls').findOne({ _id: savedUrl._id });
      console.log('從資料庫查詢到的文檔:', foundDoc);

      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      res.status(201).json({
        code,
        shortUrl: `${baseUrl}/${code}`,
        longUrl: url,
        createdAt: savedUrl.createdAt,
      });
    } catch (saveError) {
      console.error('儲存 URL 時出錯:', saveError);
      res.status(500).json({
        error: { code: 'ERR_SAVE_FAILED', message: '儲存短網址時發生錯誤' },
      });
    }
  } catch (error) {
    console.error('創建短網址時出錯:', error);
    res.status(500).json({
      error: { code: 'ERR_SERVER_ERROR', message: '伺服器錯誤' },
    });
  }
});

// 查詢短碼資訊
app.get('/api/short-urls/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const url = await Url.findOne({ code });

    if (!url) {
      return res.status(404).json({
        error: { code: 'ERR_NOT_FOUND', message: '短碼不存在' },
      });
    }

    res.status(200).json({
      code: url.code,
      longUrl: url.longUrl,
      createdAt: url.createdAt,
      hitCount: url.hitCount,
    });
  } catch (error) {
    console.error('查詢短網址時出錯:', error);
    res.status(500).json({
      error: { code: 'ERR_SERVER_ERROR', message: '伺服器錯誤' },
    });
  }
});

// 測試路由：手動寫入數據到數據庫
app.get('/test-write', async (req, res) => {
  console.log('\n=== 開始測試寫入 ===');

  try {
    const { nanoid } = await import('nanoid');
    const code = nanoid(6);
    const testData = {
      code,
      longUrl: 'https://example.com/test',
      hitCount: 0
    };

    console.log('準備寫入測試數據:', testData);

    // 方法1：使用 create()
    console.log('方法1: 使用 create()');
    const createdUrl = await Url.create(testData);
    console.log('使用 create() 創建的文檔:', createdUrl);

    // 方法2：使用 save()
    console.log('\n方法2: 使用 save()');
    const testUrl = new Url(testData);
    const savedUrl = await testUrl.save();
    console.log('使用 save() 保存的文檔:', savedUrl);

    // 方法3：直接使用 MongoDB 驅動程序
    console.log('\n方法3: 使用 MongoDB 原生驅動');
    const db = mongoose.connection.db;
    const insertResult = await db.collection('urls').insertOne({
      ...testData,
      code: `${code}_direct`,
      createdAt: new Date()
    });
    console.log('原生驅動插入結果:', insertResult);

    // 從數據庫讀取以確認
    console.log('\n查詢數據庫中的文檔...');
    const urls = await Url.find({}).lean();
    console.log('數據庫中的所有文檔:', JSON.stringify(urls, null, 2));

    const found = await Url.findOne({ _id: savedUrl._id });
    console.log('使用 findOne 查詢的結果:', found);

    res.json({
      success: true,
      message: '測試數據已寫入數據庫',
      stats: {
        totalDocuments: urls.length,
        testDocument: found
      },
      allDocuments: urls
    });
  } catch (error) {
    console.error('測試寫入時出錯:', error);

    // 檢查錯誤類型
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('重複鍵錯誤 - 文檔已存在');
    }

    res.status(500).json({
      success: false,
      message: '寫入測試數據時出錯',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      },
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 短碼轉址
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const url = await Url.findOneAndUpdate(
      { code },
      { $inc: { hitCount: 1 } },
      { new: true }
    );

    if (!url) {
      return res.status(404).send('短碼不存在');
    }

    // 重定向到原始網址
    res.redirect(url.longUrl);
  } catch (error) {
    console.error('轉址時出錯:', error);
    res.status(500).send('伺服器錯誤');
  }
});

// 生成 QR Code
app.get('/api/qrcode/:code', async (req, res) => {
  const { code } = req.params;
  const shortUrlData = await Url.findOne({ code });

  if (!shortUrlData) {
    return res.status(404).json({
      error: { code: 'ERR_NOT_FOUND', message: '短碼不存在' },
    });
  }

  const shortUrl = `http://localhost:${port}/${code}`;
  try {
    const qrCodeImage = await qrcode.toBuffer(shortUrl);
    res.setHeader('Content-Type', 'image/png');
    res.send(qrCodeImage);
  } catch (err) {
    console.error('生成 QR Code 時出錯:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

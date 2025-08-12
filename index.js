
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const store = new Map();

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
  const { url } = req.body;

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: { code: 'ERR_INVALID_URL', message: '無效的網址' },
    });
  }

  const { nanoid } = await import('nanoid');
  const code = nanoid(6);
  const shortUrlData = {
    code,
    longUrl: url,
    createdAt: new Date(),
    hitCount: 0,
  };

  store.set(code, shortUrlData);

  res.status(201).json({
    code,
    shortUrl: `http://localhost:${port}/${code}`,
    longUrl: url,
    createdAt: shortUrlData.createdAt,
  });
});

// 查詢短碼資訊
app.get('/api/short-urls/:code', (req, res) => {
  const { code } = req.params;
  const shortUrlData = store.get(code);

  if (!shortUrlData) {
    return res.status(404).json({
      error: { code: 'ERR_NOT_FOUND', message: '短碼不存在' },
    });
  }

  res.status(200).json({
    code: shortUrlData.code,
    longUrl: shortUrlData.longUrl,
    createdAt: shortUrlData.createdAt,
    hitCount: shortUrlData.hitCount,
  });
});

// 短碼轉址
app.get('/:code', (req, res) => {
  const { code } = req.params;
  const shortUrlData = store.get(code);

  if (!shortUrlData) {
    return res.status(404).json({
      error: { code: 'ERR_NOT_FOUND', message: '短碼不存在' },
    });
  }

  shortUrlData.hitCount++;
  res.redirect(302, shortUrlData.longUrl);
});

// (選配) 生成 QR Code
app.get('/api/qrcode/:code', async (req, res) => {
    const { code } = req.params;
    const shortUrlData = store.get(code);

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
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

app.get('/favicon.ico', (req, res) => res.status(204));

// 短碼轉址
app.get('/:code', (req, res) => {
  const { code } = req.params;
  const shortUrlData = store.get(code);

  if (!shortUrlData) {
    return res.status(404).json({
      error: { code: 'ERR_NOT_FOUND', message: '短碼不存在' },
    });
  }

  shortUrlData.hitCount++;
  res.redirect(302, shortUrlData.longUrl);
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

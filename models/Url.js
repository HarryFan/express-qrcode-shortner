const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  longUrl: {
    type: String,
    required: true
  },
  hitCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // 在這裡定義索引，避免重複
  autoIndex: true
});

// 只定義一次索引
urlSchema.index({ code: 1 }, { unique: true });
urlSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 可選：設定文檔一年後過期

module.exports = mongoose.model('Url', urlSchema);

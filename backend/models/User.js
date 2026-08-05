const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  username: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  
  // Coins & Balances
  mainCoins: { type: Number, default: 0 },
  weeklyCoins: { type: Number, default: 0 },
  bonusBalanceUSD: { type: Number, default: 0.0 },
  
  // Referral System
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Ad Counters
  adsWatched: { type: Number, default: 0 },
  adsWatchedForReferral: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ weeklyCoins: -1 });

module.exports = mongoose.model('User', userSchema);

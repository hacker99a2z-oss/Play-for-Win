const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const { Telegraf } = require('telegraf'); // Telegraf library
require('dotenv').config();

const authRoutes = require('./routes/auth');
const User = require('./models/User'); // User model path

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Server is alive!');
});

// ================= TELEGRAM BOT SETUP =================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-vercel-app.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/your_official_channel';
const GROUP_URL = process.env.GROUP_URL || 'https://t.me/your_official_group';

const bot = new Telegraf(BOT_TOKEN);

// /start কমান্ড দিলে ১. Open App, ২. Official Channel, ৩. Official Group আসবে
bot.start((ctx) => {
  ctx.reply('Welcome! Click below to open the app or join our community:', {
    reply_markup: {
      inline_keyboard: [
        [
          { 
            text: '🎮 Open App', 
            web_app: { url: WEB_APP_URL } 
          }
        ],
        [
          { 
            text: '📢 Official Channel', 
            url: CHANNEL_URL 
          }
        ],
        [
          { 
            text: '💬 Official Group', 
            url: GROUP_URL 
          }
        ]
      ]
    }
  });
});

// Webhook সেটআপ (Polling ছাড়া বোট রিপ্লাই এবং চ্যানেলে মেসেজ দেওয়ার সেরা উপায়)
if (process.env.BOT_TOKEN) {
  const WEBHOOK_URL = `https://play-for-win.onrender.com/telegram-webhook`;
  bot.telegram.setWebhook(WEBHOOK_URL)
    .then(() => console.log('🤖 Webhook Configured Successfully'))
    .catch((err) => console.error('Webhook Error:', err.message));

  app.use(bot.webhookCallback('/telegram-webhook'));
}
// =======================================================

// Routes
app.use('/api/auth', authRoutes);

// ================= API ENDPOINTS FOR FRONTEND =================

// ১. ইউজারের তথ্য আনবে অথবা না থাকলে ডাটাবেজে তৈরি করবে
app.post('/api/user/sync', async (req, res) => {
  const { telegramId, firstName, username, photoUrl, referrerId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID required' });
  }

  try {
    let user = await User.findOne({ telegramId }).populate('referrals', 'firstName username photoUrl adsWatchedForReferral');

    if (!user) {
      user = new User({
        telegramId,
        firstName: firstName || 'User',
        username: username || '',
        photoUrl: photoUrl || '',
        referredBy: referrerId || null
      });
      await user.save();

      if (referrerId && referrerId !== telegramId) {
        await User.findOneAndUpdate(
          { telegramId: referrerId },
          {
            $inc: { referralCount: 1 },
            $push: { referrals: user._id }
          }
        );
      }
    } else {
      // ইউজারের নাম বা ছবি পরিবর্তন হলে আপডেট রাখা
      user.firstName = firstName || user.firstName;
      user.username = username || user.username;
      user.photoUrl = photoUrl || user.photoUrl;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. অ্যাড দেখলে ব্যালেন্স বাড়ানো এবং রেফারকারীকে ২০ অয়াডে ৫০০ কয়েন বোনাস দেওয়া
app.post('/api/user/watch-ad', async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID required' });
  }

  try {
    let user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.mainCoins += 100;
    user.weeklyCoins += 100;
    user.adsWatched += 1;
    user.adsWatchedForReferral += 1;

    // যদি রেফার করা ইউজার ২০টি অ্যাড দেখে ফেলে
    if (user.referredBy && user.adsWatchedForReferral === 20) {
      await User.findOneAndUpdate(
        { telegramId: user.referredBy },
        { 
          $inc: { 
            mainCoins: 500,
            weeklyCoins: 500
          } 
        }
      );
    }

    await user.save();

    res.json({
      success: true,
      mainCoins: user.mainCoins,
      weeklyCoins: user.weeklyCoins,
      adsWatched: user.adsWatched,
      adsWatchedForReferral: user.adsWatchedForReferral
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৩. উইথড্র রিকোয়েস্ট এবং বোনাস ব্যালেন্স ও কয়েন ফি চেক API
app.post('/api/user/withdraw', async (req, res) => {
  try {
    const { telegramId, wallet, amount } = req.body;

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const reqAmount = parseFloat(amount);
    if (isNaN(reqAmount) || reqAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount entered!' });
    }

    // ১. বোনাস ব্যালেন্স চেক
    const userBonus = user.bonusBalanceUSD || user.bonusBalance || 0;
    if (userBonus < reqAmount) {
      return res.status(400).json({ error: 'Insufficient Bonus Balance!' });
    }

    // ২. কয়েন ফি চেক ($1 = 100,000 Coins)
    const requiredCoins = reqAmount * 100000;
    if ((user.mainCoins || 0) < requiredCoins) {
      return res.status(400).json({ 
        error: `Insufficient Main Coins! Required: ${requiredCoins.toLocaleString()} Coins.` 
      });
    }

    // ৩. ব্যালেন্স ও কয়েন কাটা
    user.bonusBalanceUSD = parseFloat((userBonus - reqAmount).toFixed(2));
    user.mainCoins -= requiredCoins;
    await user.save();

    // ৪. টেলিগ্রামে নোটিফিকেশন পাঠানো (Safe Block)
    try {
      const adminMessage = `💸 *New Withdraw Request!* 💸\n\n` +
        `👤 *User:* ${user.firstName || 'User'} (@${user.username || 'N/A'})\n` +
        `🆔 *Telegram ID:* \`${telegramId}\`\n` +
        `💰 *Withdraw Amount:* $${reqAmount}\n` +
        `🔥 *Coins Fee Deducted:* ${requiredCoins.toLocaleString()} Coins\n` +
        `💎 *TON Wallet:* \`${wallet}\``;

      // Render Environment থেকে ADMIN_CHAT_ID নিবে
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        await bot.telegram.sendMessage(adminChatId, adminMessage, { parse_mode: 'Markdown' });
      }
    } catch (telegramErr) {
      console.error('Telegram Notification Error:', telegramErr.message);
    }

    return res.json({ success: true, message: 'Withdraw request submitted successfully!' });

  } catch (error) {
    console.error('Withdraw API Error:', error);
    return res.status(500).json({ error: 'Something went wrong. Try again!' });
  }
});

// ==============================================================

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Weekly Contest Reset & Prize Distribution (Every Sunday 00:00 AM)
cron.schedule('0 0 * * 0', async () => {
  console.log("🏆 Running Weekly Contest Reset & Distributing Prizes...");
  try {
    // ১. টপ ৩ ইউজার বের করা
    const topUsers = await User.find({}).sort({ weeklyCoins: -1 }).limit(3);

    const prizes = [0.50, 0.30, 0.20];

    // ২. বিজয়ী ৩ জনের অ্যাকাউন্টে প্রাইজ ডলার যোগ করা
    for (let i = 0; i < topUsers.length; i++) {
      if (topUsers[i] && topUsers[i].weeklyCoins > 0) {
        await User.findByIdAndUpdate(topUsers[i]._id, {
          $inc: { bonusBalanceUSD: prizes[i] }
        });
        console.log(`Prize $${prizes[i]} sent to User: ${topUsers[i].firstName || topUsers[i].username}`);
      }
    }

    // ৩. সকল ইউজারের weeklyCoins ০ করে দেওয়া
    await User.updateMany({}, { $set: { weeklyCoins: 0 } });
    console.log("✅ Weekly Contest Reset Successfully!");

  } catch (error) {
    console.error('❌ Reset Error:', error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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

// ================= TELEGRAM BOT SETUP =================
// .env ফাইল থেকে লিংক ও টোকেনগুলো নেওয়া হচ্ছে
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

// বটের সার্ভিস স্টার্ট করা
bot.launch().then(() => {
  console.log('🤖 Telegram Bot Started Successfully');
}).catch(err => {
  console.error('❌ Telegram Bot Launch Error:', err);
});
// =======================================================

// Routes
app.use('/api/auth', authRoutes);

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

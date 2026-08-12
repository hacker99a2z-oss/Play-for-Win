const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

// ============ TELEGRAM BOT SETUP ============
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-vercel-app.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/your_official_channel';
const GROUP_URL = process.env.GROUP_URL || 'https://t.me/your_official_group';

const bot = new Telegraf(BOT_TOKEN);

// হেল্পার ফাংশন: লিংক বা ইউজারনেম থেকে সঠিক ফরম্যাট (@username) তৈরি করার জন্য
const getUsername = (urlOrUsername) => {
  if (!urlOrUsername) return null;
  if (urlOrUsername.startsWith('@')) return urlOrUsername;
  const parts = urlOrUsername.split('/');
  const lastPart = parts[parts.length - 1];
  return lastPart ? `@${lastPart}` : null;
};

bot.start((ctx) => {
  ctx.reply('Welcome! Click below to open the app or join our community:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎮 Open App', web_app: { url: WEB_APP_URL } }
        ],
        [
          { text: '📢 Official Channel', url: CHANNEL_URL }
        ],
        [
          { text: '💬 Official Group', url: GROUP_URL }
        ]
      ]
    }
  });
});

// Webhook সেটআপ
if (process.env.BOT_TOKEN) {
  const WEBHOOK_URL = 'https://play-for-win.onrender.com/telegram-webhook';
  bot.telegram.setWebhook(WEBHOOK_URL)
    .then(() => console.log('✅ Webhook Configured Successfully'))
    .catch((err) => console.error('Webhook Error:', err.message));

  app.use(bot.webhookCallback('/telegram-webhook'));
}

// Routes
app.use('/api/auth', authRoutes);

// ==================== API ENDPOINTS FOR FRONTEND ====================

// ১. ইউজার তথ্য আনবে অথবা না থাকলে ডাটাবেজে তৈরি করবে
app.post('/api/user/sync', async (req, res) => {
  const { telegramId, firstName, username, photoUrl, referrerId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID required' });
  }

  try {
    let user = await User.findOne({ telegramId }).populate('referrals', 'firstName username photoUrl gamesPlayedForReferral');

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

// ৩. গেম খেলে রিওয়ার্ড ক্লেম করা ও রেফারেল বোনাস দেওয়া
app.post('/api/game/reward', async (req, res) => {
  try {
    const { telegramId, coins } = req.body;
    const rewardCoins = Number(coins);

    if (!telegramId || isNaN(rewardCoins)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ইউজারের নিজের পয়েন্ট যোগ ও গেম কাউন্ট বৃদ্ধি
    user.mainCoins = (user.mainCoins || 0) + rewardCoins;
    user.dailyCoins = (user.dailyCoins || 0) + rewardCoins;
    user.gamesPlayedForReferral = (user.gamesPlayedForReferral || 0) + 1;

    // রেফারেল লজিক: ১০ বা তার বেশি গেম খেললে রেফারার ১০০০ কয়েন পাবে (একবারই পাবে)
    if (user.referredBy && user.gamesPlayedForReferral >= 10 && !user.referralBonusGiven) {
      await User.findOneAndUpdate(
        { telegramId: user.referredBy },
        {
          $inc: {
            mainCoins: 1000,
            dailyCoins: 1000
          }
        }
      );
      user.referralBonusGiven = true; // যেন বারবার বোনাস না দেয়
    }

    await user.save();

    res.json({
      success: true,
      message: 'Coins claimed successfully',
      mainCoins: user.mainCoins,
      dailyCoins: user.dailyCoins,
      gamesPlayedForReferral: user.gamesPlayedForReferral
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ৪. AdsGram Webhook Endpoint (অ্যাডগ্রাম ড্যাশবোর্ড থেকে অটো কল হবে যখন ইউজার অ্যাড শেষ করবে)
app.get('/api/adsgram-reward', async (req, res) => {
  const targetUserId = req.query.userId || req.query.userid;

  if (!targetUserId) {
    return res.status(400).send('User ID missing');
  }

  try {
    let user = await User.findOne({ telegramId: targetUserId });

    if (user) {
      // ইউজার সম্পূর্ণ অ্যাড দেখলে ডাটাবেজে কাউন্ট বাড়বে
      user.adsWatched = (user.adsWatched || 0) + 1;
      await user.save();
      console.log(`✅ Adsgram Ad Verified & Counted for User: ${targetUserId}`);
    }

    // Adsgram-এর ড্যাশবোর্ডে কাউন্ট দেখানোর জন্য অবশ্যই 200 OK পাঠাতে হবে
    return res.status(200).send('OK');
  } catch (err) {
    console.error('AdsGram Webhook Error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// ৪.২. Monetag Server-to-Server Postback Endpoint
app.get('/api/monetag-postback', async (req, res) => {
  const { sub_id } = req.query; // Monetag থেকে telegramId আসবে

  if (!sub_id) {
    return res.status(400).send('Missing sub_id (telegramId)');
  }

  try {
    let user = await User.findOne({ telegramId: sub_id });

    if (user) {
      user.adsWatched = (user.adsWatched || 0) + 1;
      await user.save();
      console.log(`✅ Monetag Postback Verified for Telegram ID: ${sub_id}`);
      return res.status(200).send('OK');
    }

    return res.status(404).send('User not found');
  } catch (err) {
    console.error('Monetag Postback Error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// ডেইলি টাইমার এন্ডপয়েন্ট (বাংলাদেশ টাইমজোনে রাত ১২:০০ টা হিসাব করবে)
app.get('/api/contest/timer', (req, res) => {
  const now = new Date();
  const bdNowStr = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const bdNow = new Date(bdNowStr);

  const bdEndOfDay = new Date(bdNowStr);
  bdEndOfDay.setHours(23, 59, 59, 999);

  const difference = bdEndOfDay - bdNow;

  if (difference <= 0) {
    return res.json({ hours: 0, minutes: 0, seconds: 0 });
  }

  res.json({
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  });
});

// ==================== NEW: CHECK MEMBERSHIP API ====================
app.post('/api/check-membership', async (req, res) => {
  const { telegramId } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID required' });
  }

  // Render-এ এনভায়রনমেন্ট ভেরিয়েবল সেট করা না থাকলে ডিফল্ট ইউজারনেম কাজ করবে
  const channels = [
    getUsername(CHANNEL_URL),
    getUsername(GROUP_URL),
    getUsername(EXTRA_CHANNEL_URL)
  ].filter(ch => ch !== null);

  try {
    let allJoined = true;
    let membershipStatus = {};

    for (const chatUsername of channels) {
      try {
        const member = await bot.telegram.getChatMember(chatUsername, telegramId);
        const status = member.status;
        if (['member', 'creator', 'administrator'].includes(status)) {
          membershipStatus[chatUsername] = true;
        } else {
          membershipStatus[chatUsername] = false;
          allJoined = false;
        }
      } catch (err) {
        console.error(`Error checking chat ${chatUsername}:`, err.message);
        membershipStatus[chatUsername] = false;
        allJoined = false;
      }
    }

    res.json({ success: true, allJoined, membershipStatus });
  } catch (err) {
    console.error('Membership Check Error:', err);
    res.status(500).json({ error: 'Server error checking membership' });
  }
});

// ৫. উইথড্র রিকোয়েস্ট
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

    const userBonus = user.bonusBalanceUSD || 0;
    if (userBonus < reqAmount) {
      return res.status(400).json({ error: 'Insufficient Bonus Balance!' });
    }

    const requiredCoins = reqAmount * 100000;
    if ((user.mainCoins || 0) < requiredCoins) {
      return res.status(400).json({
        error: `Insufficient Main Coins! Required: ${requiredCoins.toLocaleString()} Coins.`
      });
    }

    user.bonusBalanceUSD = parseFloat((userBonus - reqAmount).toFixed(2));
    user.mainCoins -= requiredCoins;
    await user.save();

    try {
      const adminMessage = 
        `🚨<b>New Withdraw Request!</b>🚨\n\n` +
        `👤<b>User:</b> ${user.firstName || 'User'} (@${user.username || 'N/A'})\n` +
        `🆔<b>Telegram ID:</b> <code>${telegramId}</code>\n` +
        `💵<b>Withdraw Amount:</b> $${reqAmount}\n` +
        `🔥<b>Coins Fee Deducted:</b> ${requiredCoins.toLocaleString()} Coins\n` +
        `💎<b>TON Wallet:</b> <code>${wallet}</code>`;

      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        await bot.telegram.sendMessage(adminChatId, adminMessage, { parse_mode: 'HTML' });
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== DAILY CONTEST RESET & PRIZE DISTRIBUTION ====================
// প্রতিদিন রাত ১২:০০ টায় (00:00 AM) টপ ৩ জনকে প্রাইজ দেবে এবং Daily Coins ০ করে দেবে
cron.schedule('0 0 * * *', async () => {
  console.log('🏆 Running Daily Contest Reset & Distributing Prizes...');
  try {
    // ১. টপ ৩ ডেইলি প্লেয়ার বের করা
    const topUsers = await User.find({}).sort({ dailyCoins: -1 }).limit(10);
    const prizes = [
      1, 0.80, 0.50, 0.30, 0.20,
      0.10, 0.10, 0.10, 0.10, 0.10
    ];

    // ২. বিজয়ী ৩ জনের অ্যাকাউন্টে প্রাইজ যোগ করা
    for (let i = 0; i < topUsers.length; i++) {
      if (topUsers[i] && topUsers[i].dailyCoins > 0) {
        await User.findByIdAndUpdate(topUsers[i]._id, {
          $inc: { bonusBalanceUSD: prizes[i] }
        });
        console.log(`Prize $${prizes[i]} sent to User: ${topUsers[i].firstName || topUsers[i].username}`);
      }
    }

    // ৩. সকল ইউজারের dailyCoins রিসেট করে ০ করা
    await User.updateMany({}, { $set: { dailyCoins: 0 } });
    console.log('✅ Daily Contest Reset Successfully!');

  } catch (error) {
    console.error('❌ Reset Error:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Dhaka"
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

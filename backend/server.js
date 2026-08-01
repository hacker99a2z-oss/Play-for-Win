const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const User = require('./models/User'); // User model path

const app = express();
app.use(cors());
app.use(express.json());

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

    // ২. বিজয়ী ৩ জনের অ্যাকাউন্টে প্রাইজ ডলার যোগ করা
    for (let i = 0; i < topUsers.length; i++) {
      if (topUsers[i] && topUsers[i].weeklyCoins > 0) {
        await User.findByIdAndUpdate(topUsers[i]._id, {
          $inc: { bonusBalanceUSD: prizes[i] }
        });
        console.log(`Prize $${prizes[i]} sent to User: ${topUsers[i].firstName || topUsers[i].username}`);
      }
    }

    // ৩. সকল ইউজারের weeklyCoins ০ করে দেওয়া
    await User.updateMany({}, { $set: { weeklyCoins: 0 } });
    console.log("✅ Weekly Contest Reset Successfully!");

  } catch (error) {
    console.error('❌ Reset Error:', error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

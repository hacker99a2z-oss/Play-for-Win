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

// Weekly Reset Cron Job (Sunday 00:00 AM)
cron.schedule('0 0 * * 0', async () => {
  try {
    await User.updateMany({}, { $set: { weeklyCoins: 0 } });
    console.log('🔄 Weekly Contest Reset Successfully!');
  } catch (error) {
    console.error('❌ Reset Error:', error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

# Vercel Setup Guide (বাংলা)

এই প্রজেক্টটি Vercel-এ ডিপ্লয় করার জন্য নিচের ধাপগুলো অনুসরণ করুন:

## ১. MongoDB Atlas সেটআপ

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) এ গিয়ে ফ্রি অ্যাকাউন্ট তৈরি করুন
2. একটি নতুন Cluster তৈরি করুন (M0 ফ্রি টিয়ার ব্যবহার করতে পারেন)
3. Database Access → Add New Database User:
   - Username: আপনার পছন্দের নাম
   - Password: শক্তিশালী পাসওয়ার্ড দিন (এটা মনে রাখবেন)
4. Network Access → Add IP Address:
   - Allow Access from Anywhere: `0.0.0.0/0` (Vercel-এর জন্য প্রয়োজন)
5. Cluster → Connect → Connect your application:
   - Connection String কপি করুন (এটা আপনার `MONGODB_URI` হবে)
   - ফরম্যাট: `mongodb+srv://username:password@cluster.mongodb.net/farmcity?retryWrites=true&w=majority`

## ২. Vercel প্রজেক্ট তৈরি

1. [Vercel](https://vercel.com) এ গিয়ে GitHub দিয়ে লগইন করুন
2. "Add New..." → "Project" ক্লিক করুন
3. আপনার GitHub repository ইমপোর্ট করুন

## ৩. প্রজেক্ট কনফিগারেশন

**Framework Preset**: Other

**Build and Output Settings**:
- Build Command: `npm install && npm run build`
- Output Directory: `.output`
- Install Command: `npm install`

**Environment Variables** (Environment Variables সেকশনে এগুলো যোগ করুন):

### প্রয়োজনীয় Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farmcity?retryWrites=true&w=majority
MONGODB_DB=farmcity
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
TON_WALLET_MNEMONIC="word1 word2 word3 ... word24"
TON_WALLET_VERSION=v5r1
TONCENTER_API_KEY=your-toncenter-api-key
PAYOUT_CRON_SECRET=your-secret-key
WEBAPP_URL=https://your-app.vercel.app
CHANNEL_URL=https://t.me/your-channel
PAYMENTS_PROOF_URL=https://your-payment-proof-url
CONTACT_SUPPORT_URL=https://your-support-url
SUPPORT_URL=https://your-support-url
INTRO_VIDEO=https://your-intro-video-url
```

### প্রতিটি Variable সম্পর্কে বিস্তারিত:

- **MONGODB_URI**: MongoDB Atlas থেকে কপি করা connection string
- **MONGODB_DB**: Database নাম (ডিফল্ট: `farmcity`)
- **TELEGRAM_BOT_TOKEN**: Telegram BotFather থেকে পাওয়া টোকেন
- **TELEGRAM_WEBHOOK_SECRET**: Webhook নিরাপত্তার জন্য একটি শক্তিশালী স্ট্রিং
- **TON_WALLET_MNEMONIC**: আপনার TON ওয়ালেটের ২৪টি শব্দ (কোটেশনে রাখুন)
- **TON_WALLET_VERSION**: `v5r1` (ডিফল্ট)
- **TONCENTER_API_KEY**: [TON API](https://tonapi.io/) থেকে API key
- **PAYOUT_CRON_SECRET**: Cron job নিরাপত্তার জন্য একটি শক্তিশালী স্ট্রিং
- **WEBAPP_URL**: আপনার Vercel অ্যাপের URL (ডিপ্লয়ের পর আপডেট করুন)
- **CHANNEL_URL**: আপনার Telegram চ্যানেলের লিংক
- **PAYMENTS_PROOF_URL**: পেমেন্ট প্রুফ দেখানোর জন্য লিংক
- **CONTACT_SUPPORT_URL**: সাপোর্টের জন্য লিংক
- **SUPPORT_URL**: সাপোর্ট পেজের লিংক
- **INTRO_VIDEO**: ইন্ট্রো ভিডিওর URL

## ৪. ডিপ্লয়

1. "Deploy" বাটনে ক্লিক করুন
2. Vercel অটোমেটিক বিল্ড করবে এবং ডিপ্লয় করবে
3. ডিপ্লয় সম্পন্ন হলে আপনাকে একটি URL দেওয়া হবে (যেমন: `https://your-app.vercel.app`)

## ৫. ডিপ্লয়ের পর

1. Vercel Dashboard থেকে আপনার অ্যাপের URL কপি করুন
2. Environment Variables-এ `WEBAPP_URL` আপডেট করুন
3. Redeploy করুন

## ৬. Telegram Webhook সেটআপ (প্রয়োজন হলে)

আপনার Telegram বটের webhook সেট করতে হবে:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/webhook" \
  -d "secret_token=<YOUR_WEBHOOK_SECRET>"
```

## গুরুত্বপূর্ণ নোট:

- MongoDB Atlas ফ্রি টিয়ারে 512MB স্টোরেজ দেয়, যা ছোট প্রজেক্টের জন্য যথেষ্ট
- সব Environment Variables অবশ্যই Vercel-এ সেট করতে হবে, কোডে হার্ডকোড করবেন না
- Secrets কখনো GitHub-এ কমিট করবেন না
- প্রথম ডিপ্লয়ে কিছুক্ষণ সময় লাগতে পারে

## সমস্যা সমাধান:

যদি ডিপ্লয় ব্যর্থ হয়:
1. Build logs চেক করুন
2. Environment Variables সঠিকভাবে সেট করা আছে কিনা দেখুন
3. MongoDB connection string সঠিক কিনা যাচাই করুন
4. Node.js version চেক করুন (Vercel ডিফল্টভাবে সর্বশেষ version ব্যবহার করে)

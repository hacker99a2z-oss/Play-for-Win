import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Referral from './pages/Referral';
import Contest from './pages/Contest';
import Withdraw from './pages/Withdraw';

const BACKEND_URL = 'https://play-for-win.onrender.com'; // আপনার Render এর Backend URL

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ১. অ্যাপ চালু হলে টেলিগ্রাম ইউজারের তথ্য ব্যাকএন্ডের সাথে Sync করা
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param;
      if (tgUser) {
        fetch(`${BACKEND_URL}/api/user/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: tgUser.id.toString(),
            firstName: tgUser.first_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
            referrerId: startParam ? startParam.toString() : null
          })
        })
          .then((res) => res.json())
          .then((data) => {
            setUser(data);
            setLoading(false);
          })
          .catch((err) => {
            console.error("User sync error:", err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ২. অ্যাড দেখার পর ব্যাকএন্ডে পয়েন্ট পাঠানোর ফাংশন
  const rewardUserOnBackend = () => {
    if (!user) return;

    fetch(`${BACKEND_URL}/api/user/watch-ad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.telegramId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.mainCoins !== undefined) {
          // ব্যাকএন্ড থেকে আসা আপডেটেড পয়েন্ট স্টেটে বসানো
          setUser((prev) => ({
            ...prev,
            mainCoins: data.mainCoins,
            weeklyCoins: data.weeklyCoins,
            adsWatched: data.adsWatched,
            adsWatchedForReferral: data.adsWatchedForReferral
          }));
        }
      })
      .catch((err) => console.error("Error updating ad reward:", err));
  };

  // ৩. Adsgram Ad Controller
  const handlePlayAd = () => {
    if (window.Adsgram) {
      const AdController = window.Adsgram.init({
        blockId: "int-41387" // 👈 আপনার Adsgram Block ID
      });

      AdController.show()
        .then((result) => {
          // অ্যাড সফলভাবে দেখলে ব্যাকএন্ডে রিকোয়েস্ট যাবে এবং পয়েন্ট ডাটাবেজে সেভ হবে
          rewardUserOnBackend();
        })
        .catch((result) => {
          console.log("Ad skipped or error:", result);
        });
    } else {
      alert("Adsgram SDK Not Loaded!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-sans">
        <p className="text-amber-400 font-bold animate-pulse">Loading Play For Win...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-20">
      <Header user={user} />

      {activeTab === 'home' && <Home user={user} onPlayAd={handlePlayAd} />}
      {activeTab === 'referral' && <Referral user={user} refreshUser={() => window.location.reload()} />}
      {activeTab === 'contest' && <Contest user={user} />}
      {activeTab === 'withdraw' && <Withdraw user={user} />}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

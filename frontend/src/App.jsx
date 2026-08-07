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
  const syncUserData = () => {
    const tg = window.Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;

    if (tgUser) {
      fetch(`${BACKEND_URL}/api/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id.toString(),
          firstName: tgUser.first_name,
          username: tgUser.username,
          photoUrl: tgUser.photo_url,
          referrerId: tg?.initDataUnsafe?.start_param ? tg.initDataUnsafe.start_param.toString() : null
        })
      })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("User sync error:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    syncUserData();
  }, []);

  // ২. অ্যাড দেখার পর ব্যাকএন্ডে পয়েন্ট ও রেফারেল কাউন্ট পাঠানোর ফাংশন
  const rewardUserOnBackend = async () => {
    if (!user) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/user/watch-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.telegramId })
      });
      const data = await res.json();
      
      if (data.mainCoins !== undefined) {
        setUser((prev) => ({
          ...prev,
          mainCoins: data.mainCoins,
          dailyCoins: data.dailyCoins,
          adsWatched: data.adsWatched,
          adsWatchedForReferral: data.adsWatchedForReferral
        }));
      }
      return data;
    } catch (err) {
      console.error("Error updating ad reward:", err);
      return null;
    }
  };

  // ৩. Adsgram Ad Controller (অ্যাড সফলভাবে সম্পূর্ণ দেখলে রিকোয়েস্ট পাঠাবে)
  const handlePlayAd = () => {
    return new Promise((resolve) => {
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({
          blockId: "41655" // 👈 আপনার Adsgram Block ID
        });

        AdController.show()
          .then(async (result) => {
            if (result && result.done) {
              resolve(true);
            } else {
              alert("অ্যাডটি সম্পূর্ণ দেখুন! স্কিপ করলে গেম খেলা বা পয়েন্ট পাওয়া যাবে না।");
              resolve(false);
            }
          })
          .catch((result) => {
            console.log("Ad skipped or error:", result);
            alert("অ্যাডটি সম্পূর্ণ দেখুন! আবার চেষ্টা করুন।");
            resolve(false);
          });
      } else {
        alert("Adsgram SDK Not Loaded!");
        resolve(false);
      }
    });
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

      {activeTab === 'home' && (
        <Home 
          user={user} 
          onPlayAd={handlePlayAd} 
          refreshUserData={syncUserData} 
        />
      )}
      {activeTab === 'referral' && <Referral user={user} refreshUser={syncUserData} />}
      {activeTab === 'contest' && <Contest user={user} />}
      {activeTab === 'withdraw' && <Withdraw user={user} />}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

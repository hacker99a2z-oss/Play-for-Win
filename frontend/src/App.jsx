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


  // Adsgram Ad Controller (Invalid / Impression / Fail Protection সহ)
  const handlePlayAd = () => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      const currentTelegramId = user?.telegramId || tg?.initDataUnsafe?.user?.id?.toString();

      if (!currentTelegramId) {
        alert("User data is still loading. Please wait a second and try again!");
        resolve(false);
        return;
      }
      
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({
          blockId: "41655",
          userId: String(currentTelegramId)
        });

        AdController.show()
          .then((result) => {
            // যদি Adsgram থেকে সফল ইম্প্রেশন এবং কমপ্লিশন (done: true) না আসে
            if (!result || !result.done) {
              alert("❌ Ad was skipped, failed, or marked as invalid by Adsgram. You cannot double coins or play.");
              resolve(false);
              return;
            }

            // অ্যাড সফলভাবে সম্পূর্ণ দেখলে কেবল true রিটার্ন করবে
            resolve(true);
          })
          .catch((err) => {
            // যদি অ্যাড লোড না হয়, ইম্প্রেশন না ঘটে বা Adsgram কোনো এরর বা ইনভ্যালিড থ্রো করে
            console.error("Adsgram Error/Invalid Ad:", err);
            alert("❌ Invalid ad or ad failed to load/impression! Reward denied.");
            resolve(false);
          });
      } else {
        alert("Ad Network failed to load or Adblocker detected!");
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

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Referral from './pages/Referral';
import Contest from './pages/Contest';
import Withdraw from './pages/Withdraw';

const BACKEND_URL = 'https://play-for-win.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ১. টেলিগ্রাম ইউজারের তথ্য ব্যাকএন্ডের সাথে Sync করা
  const syncUserData = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;

    // টেলিগ্রাম এনভায়রনমেন্টে থাকলে
    if (tgUser) {
      fetch(`${BACKEND_URL}/api/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id.toString(),
          firstName: tgUser.first_name || 'Player',
          username: tgUser.username || '',
          photoUrl: tgUser.photo_url || '',
          referrerId: tg?.initDataUnsafe?.start_param ? tg.initDataUnsafe.start_param.toString() : null
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
      // লোকাল ব্রাউজারে টেস্টিংয়ের জন্য (Production-এ এটি না থাকলে টেলিগ্রামের ভেতরেই কাজ করবে)
      console.warn("Telegram WebApp Context Not Found! Running in standalone or test mode.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.enableClosingConfirmation(); // ভুল করে অ্যাপ বন্ধ হয়ে যাওয়া রোধ করতে
      } catch (e) {
        // Ignored for unsupported older versions
      }
    }
    syncUserData();
  }, [syncUserData]);

  // ২. Adsgram Ad Controller (Full Reward & Exception Handling)
  const handlePlayAd = () => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      const currentTelegramId = user?.telegramId || tg?.initDataUnsafe?.user?.id?.toString();

      if (!currentTelegramId) {
        alert("⚠️ User data is still loading. Please wait a second and try again!");
        resolve(false);
        return;
      }

      if (window.Adsgram) {
        try {
          const AdController = window.Adsgram.init({
            blockId: "41655",
            userId: String(currentTelegramId)
          });

          AdController.show()
            .then((result) => {
              // Adsgram ইম্প্রেশন ও দেখা শেষ হলে (result.done: true)
              if (result && result.done) {
                resolve(true);
              } else {
                alert("❌ Ad was skipped or closed early. Rewarded action cancelled.");
                resolve(false);
              }
            })
            .catch((err) => {
              console.error("Adsgram Error/Invalid Ad:", err);
              alert("❌ Unable to load Ad or Adblocker detected!");
              resolve(false);
            });
        } catch (error) {
          console.error("Adsgram Controller Init Error:", error);
          alert("❌ Failed to trigger Ad network.");
          resolve(false);
        }
      } else {
        alert("⚠️ Ad Network failed to load! Check your internet or disable AdBlocker.");
        resolve(false);
      }
    });
  };

  // ৩. অ্যাপ লোডিং স্ক্রিন
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans gap-3">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-amber-400 font-black tracking-wider animate-pulse">
          PLAY FOR WIN...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 select-none">
      {/* হেডার */}
      <Header user={user} />

      {/* মেইন কন্টেন্ট এলাকা (Tabs) */}
      <main className="max-w-md mx-auto px-2">
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
      </main>

      {/* নেভিগেশন বার */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

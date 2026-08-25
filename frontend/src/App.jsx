import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Fighting from './pages/Fighting';
import Battle from './pages/Battle';
import Referral from './pages/Referral';
import Contest from './pages/Contest';
import Withdraw from './pages/Withdraw';
import bgArena from './assets/fighting-bg.jpg';

const BACKEND_URL = 'https://play-for-win.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [matchMode, setMatchMode] = useState(2);
  const [matchId, setMatchId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ ২. নেভিগেশনে params থেকে matchId গ্রহণ ও সেভ
  const handleNavigate = (tab, params = {}) => {
    if (params.mode) {
      setMatchMode(params.mode);
    }
    if (params.matchId) {
      setMatchId(params.matchId);
    }
    setActiveTab(tab);
  };

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
        tg.disableClosingConfirmation();// ভুল করে অ্যাপ বন্ধ হয়ে যাওয়া রোধ করতে
      } catch (e) {
        // Ignored for unsupported older versions
      }
    }

    // 🟢 অ্যাপ মিনিমাইজ বা ব্যাকগ্রাউন্ডে গেলে ট্র্যাক করার লজিক
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn("⚠️ App was minimized or backgrounded!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    syncUserData();

    // 🧹 ক্লিনআপ ফাংশন
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    
  }, [syncUserData]);

  // 🟢 ডুপ্লিকেট API কলমুক্ত Monetag Ad Handler
  const handlePlayAd = () => {
    return new Promise((resolve) => {
      // Monetag SDK-এর গ্লোবাল ফাংশন চেক
      const showAdFunc = window.show_11548724 || window.show_RewardedInterstitial || window.showPromise;

      if (typeof showAdFunc === 'function') {
        showAdFunc()
          .then(() => {
            console.log("✅ Monetag Ad Finished Successfully");
            resolve(true); // অ্যাড দেখা সম্পন্ন হয়েছে
          })
          .catch((err) => {
            console.warn("⚠️ Monetag Ad Closed or Warning:", err);
            // Monetag পপআপ বন্ধ বা স্কিপ করলেও ইউজার ফেইল মারবে না
            resolve(true); 
          });
      } else {
        alert("⚠️ Ad system is initializing. Please try again in 5 seconds.");
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

  // 🔴 Battle ট্যাব হলে সম্পূর্ণ ফুল-স্ক্রিন গেম রেন্ডার করবে
  if (activeTab === 'battle') {
    return (
      <Battle 
        user={user} 
        mode={matchMode} 
        matchId={matchId} // ✅ ৩. Battle কম্পোনেন্টে সঠিকভাবে matchId পাস করা হলো
        refreshUserData={syncUserData} 
        onNavigate={handleNavigate} 
      />
    );
  }

  // মেইন অ্যাপ লেআউট (অন্যান্য ট্যাবের জন্য)
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white font-sans pb-24 select-none relative overflow-x-hidden flex flex-col justify-between"
      style={{ backgroundImage: `url(${bgArena})` }}
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

      {/* হেডার */}
      <div className="relative z-10">
        <Header user={user} />
      </div>

      {/* মেইন কন্টেন্ট এলাকা */}
      <main className="max-w-md mx-auto px-2 relative z-10 flex-1 flex flex-col justify-center w-full">
        {activeTab === 'home' && (
          <Home 
            user={user} 
            onPlayAd={handlePlayAd} 
            refreshUserData={syncUserData} 
          />
        )}

        {activeTab === 'fighting' && (
          <Fighting 
            user={user} 
            onPlayAd={handlePlayAd} 
            refreshUserData={syncUserData} 
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'referral' && <Referral user={user} refreshUser={syncUserData} />}
        {activeTab === 'contest' && <Contest user={user} />}
        {activeTab === 'withdraw' && <Withdraw user={user} />}
      </main>

      {/* নেভিগেশন বার */}
      <div className="relative z-10">
        <Navigation activeTab={activeTab} setActiveTab={(tab) => handleNavigate(tab)} />
      </div>
    </div>
  );
}

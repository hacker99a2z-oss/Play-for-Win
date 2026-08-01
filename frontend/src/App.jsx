import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Referral from './pages/Referral';
import Contest from './pages/Contest';
import Withdraw from './pages/Withdraw';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    telegramId: "12345678",
    firstName: "Demo User",
    username: "demouser",
    mainCoins: 1250,
    weeklyCoins: 450,
    bonusBalanceUSD: 0.50,
    referrals: []
  });

  const handlePlayAd = () => {
    alert("AdsGram Ad Triggered!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-20">
      <Header user={user} />
      
      {activeTab === 'home' && <Home user={user} onPlayAd={handlePlayAd} />}
      {activeTab === 'referral' && <Referral user={user} />}
      {activeTab === 'contest' && <Contest />}
      {activeTab === 'withdraw' && <Withdraw user={user} />}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

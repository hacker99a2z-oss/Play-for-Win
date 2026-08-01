import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    firstName: "Demo User",
    username: "demouser",
    mainCoins: 1250,
    weeklyCoins: 450,
  });

  const handlePlayAd = () => {
    alert("AdsGram Ad Triggered!");
    // AdsGram Integration will be placed here
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-20">
      <Header user={user} />
      
      {activeTab === 'home' && <Home user={user} onPlayAd={handlePlayAd} />}
      {activeTab === 'referral' && <div className="p-6 text-center">Referral Page (Coming Next)</div>}
      {activeTab === 'contest' && <div className="p-6 text-center">Contest Page (Coming Next)</div>}
      {activeTab === 'withdraw' && <div className="p-6 text-center">Withdraw Page (Coming Next)</div>}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

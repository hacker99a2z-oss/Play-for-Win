import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'fighting', label: 'Fighting', icon: '⚔️' },
    { id: 'referral', label: 'Referral', icon: '👥' },
    { id: 'contest', label: 'Contest', icon: '🏆' },
    { id: 'withdraw', label: 'Withdraw', icon: '💸' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-md border-t border-gray-800 px-4 py-2 flex justify-around items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 text-xs transition-colors ${
            activeTab === tab.id ? 'text-yellow-400 font-bold' : 'text-gray-400'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

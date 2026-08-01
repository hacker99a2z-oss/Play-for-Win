import React from 'react';

export default function Header({ user }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 text-white">
      {/* Telegram Profile Info */}
      <div className="flex items-center gap-3">
        <img 
          src={user?.photoUrl || "https://via.placeholder.com/40"} 
          alt="Profile" 
          className="w-10 h-10 rounded-full border-2 border-yellow-500"
        />
        <div>
          <h1 className="font-bold text-sm">{user?.firstName || "Telegram User"}</h1>
          <p className="text-xs text-gray-400">@{user?.username || "user"}</p>
        </div>
      </div>

      {/* Main Coins */}
      <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
        <span className="text-lg">🪙</span>
        <span className="font-bold text-yellow-400 text-sm">
          {user?.mainCoins?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );
}

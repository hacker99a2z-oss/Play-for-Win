import React from 'react';

export default function Header({ user }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10 text-white">
      {/* Telegram Profile Info */}
      <div className="flex items-center gap-3">
        <img
          src={user?.photoUrl || "https://via.placeholder.com/40"}
          alt="Profile"
          className="w-10 h-10 rounded-full border-2 border-yellow-500 object-cover"
        />
        <div>
          <h1 className="font-bold text-sm">{user?.firstName || "Telegram User"}</h1>
          <p className="text-xs text-gray-400">@{user?.username || "user"}</p>
        </div>
      </div>

      {/* Main Coins & Daily Coins */}
      <div className="flex flex-col items-end gap-1">
        {/* Main Coins */}
        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
          <span className="text-sm">🪙</span>
          <span className="font-bold text-yellow-400 text-sm">
            {user?.mainCoins?.toLocaleString() || 0}
          </span>
        </div>

        {/* Daily Coins */}
        <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
          <span className="text-[10px] text-amber-300 font-medium">Daily:</span>
          <span className="text-xs font-bold text-amber-300">
            +{user?.dailyCoins?.toLocaleString() || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

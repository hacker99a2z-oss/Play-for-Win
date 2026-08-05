import React from 'react';

export default function Home({ user, onPlayAd }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-140px)] p-6 text-white text-center">
      
      {/* Header Profile & Balance Section */}
      <div className="w-full flex items-center justify-between gap-4">
        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-yellow-500 flex items-center justify-center font-bold text-lg overflow-hidden">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.firstName ? user.firstName.charAt(0) : 'U'}</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm leading-tight">
              {user?.firstName || 'Telegram User'}
            </h3>
            <p className="text-xs text-gray-400">
              @{user?.username || 'username'}
            </p>
          </div>
        </div>

        {/* Total Coins / Balance */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full">
          <span className="text-amber-400 font-bold text-sm">🪙</span>
          <span className="font-extrabold text-amber-400 text-sm">
            {user?.balance?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Weekly Coins Display */}
      <div className="w-full flex justify-end my-2">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-2xl">
          <span className="text-xl">🏆</span>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Weekly Coins</p>
            <p className="font-bold text-blue-400 text-base">{user?.weeklyCoins || 0}</p>
          </div>
        </div>
      </div>

      {/* Play Ads Button */}
      <div className="my-auto flex flex-col items-center gap-6">
        <button
          onClick={onPlayAd}
          className="w-44 h-44 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-950 font-black text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="text-4xl">▶</span>
          <span>PLAY ADS</span>
        </button>
        <p className="text-xs text-gray-400 bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700">
          ✨ Watch 1 Ad = Gain <span className="text-yellow-400 font-bold">+100 Coins</span>
        </p>
      </div>

      <div></div>
    </div>
  );
}

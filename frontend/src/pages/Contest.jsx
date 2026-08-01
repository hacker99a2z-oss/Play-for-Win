import React from 'react';

export default function Contest() {
  // Dummy Leaderboard Data for UI Preview
  const leaderboard = [
    { rank: 1, name: "Yeasin", coins: 5100, prize: "$0.50" },
    { rank: 2, name: "Hasan", coins: 4200, prize: "$0.30" },
    { rank: 3, name: "Rakib", coins: 3900, prize: "$0.20" },
  ];

  return (
    <div className="p-4 text-white flex flex-col gap-4">
      {/* Countdown Timer */}
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-4 text-center">
        <p className="text-xs text-blue-300 uppercase font-semibold">Weekly Contest Ends In</p>
        <div className="text-xl font-black text-blue-400 mt-1 font-mono">
          ⏰ 5 Days 10 Hours 21 Mins
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-3">🏆 Top 100 Leaderboard</h3>
        <div className="flex flex-col gap-2">
          {leaderboard.map((item) => (
            <div key={item.rank} className="flex items-center justify-between bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs">
              <div className="flex items-center gap-3">
                <span className={`font-black ${item.rank === 1 ? 'text-yellow-400' : item.rank === 2 ? 'text-gray-300' : 'text-amber-600'}`}>
                  #{item.rank}
                </span>
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-bold block">{item.coins} Coins</span>
                <span className="text-emerald-400 font-semibold text-[10px]">Prize: {item.prize}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

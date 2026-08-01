import React, { useEffect, useState } from 'react';

const API_URL = "https://play-for-win.onrender.com"; // আপনার ব্যাকএন্ড URL

export default function Contest() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ব্যাকএন্ড থেকে আসল ইউজারদের ডাটা ফেচ করবে
    fetch(`${API_URL}/api/auth/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Leaderboard Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 text-white flex flex-col gap-6 max-w-md mx-auto">
      {/* Contest Status */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl text-center shadow-lg">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Weekly Contest Status</p>
        <div className="flex items-center justify-center gap-2 text-yellow-400 font-extrabold text-lg">
          ⏰ <span>Resets Every Sunday</span>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-400">
          🏆 Top Leaderboard
        </h2>

        {loading ? (
          <p className="text-center text-gray-400 py-6">Loading real users...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No active players this week yet!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {leaderboard.map((player, index) => (
              <div 
                key={player._id || index}
                className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm w-6 ${
                    index === 0 ? 'text-yellow-400 text-lg' :
                    index === 1 ? 'text-gray-300 text-base' :
                    index === 2 ? 'text-amber-600 text-base' : 'text-gray-500'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-gray-100">
                      {player.firstName || player.username || "Anonymous"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-blue-400 text-sm">{player.weeklyCoins || 0} Coins</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

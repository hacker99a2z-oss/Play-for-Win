import React, { useEffect, useState } from 'react';

const API_URL = "https://play-for-win.onrender.com"; // আপনার ব্যাকএন্ড URL

export default function Contest() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 1. Live Countdown Timer Logic (Next Sunday Reset)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();

      // আজকের রাত ১১:৫৯:৫৯ পর্যন্ত সময় হিসাব করা
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay - now;

      if (difference > 0) {
        setTimeLeft({
          days: 0,
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Real Users Leaderboard
  useEffect(() => {
    fetch(`${API_URL}/api/auth/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Leaderboard Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  // 3. Prizes mapping
  const prizes = ["$0.08", "$0.05", "$0.03"];

  return (
    <div className="p-4 text-white flex flex-col gap-6 max-w-md mx-auto">
      {/* Contest Status & Live Timer */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl text-center shadow-lg">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">DAILY CONTEST ENDS IN</p>
        <div className="flex items-center justify-center gap-2 text-yellow-400 font-extrabold text-lg">
          <span>⏰ {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-400">
          🏆 Top 100 Leaderboard
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
                  <p className="font-bold text-blue-400 text-sm">{player.dailyCoins || 0} Coins</p>
                  {index < 3 && (
                    <p className="text-xs font-semibold text-emerald-400">
                      Prize: {prizes[index]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

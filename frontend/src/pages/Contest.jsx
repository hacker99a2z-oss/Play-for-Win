import React, { useEffect, useState } from 'react';

const API_URL = "https://play-for-win.onrender.com"; // আপনার ব্যাকএন্ড URL

export default function Contest() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // ১. Fetch Time Left from Server & Start Local Countdown
  useEffect(() => {
    const fetchTimer = () => {
      fetch(`${API_URL}/api/contest/timer`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setTimeLeft(data);
          }
        })
        .catch((err) => console.error("Timer Fetch Error:", err));
    };

    fetchTimer(); // প্রথমবার সার্ভার থেকে সময় আনবে

    // প্রতি ১ সেকেন্ড পরপর ফ্রন্টএন্ডে টাইমার কমাবে
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime.hours === 0 && prevTime.minutes === 0 && prevTime.seconds === 0) {
          fetchTimer(); // টাইমার ০ হলে আবার সার্ভার থেকে সময় আপডেট করবে
          return prevTime;
        }

        let { hours, minutes, seconds } = prevTime;

        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ২. Fetch Real Users Leaderboard
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

  // ৩. Prizes mapping
  const prizes = [
    "$1", "$0.80", "$0.50", "$0.30", "$0.20",
    "$0.10", "$0.10", "$0.10", "$0.10", "$0.10"
  ];

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
                  {index < 10 && (
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

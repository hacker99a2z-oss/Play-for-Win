import React, { useState, useEffect, useCallback } from 'react';
import fightBtnImg from '../assets/FIGHT.png';

const Fighting = ({ user, refreshUserData, onNavigate }) => {
  const [history, setHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ১. লাস্ট ৫টি ম্যাচের হিস্ট্রি লোড
  const fetchHistory = useCallback(() => {
    if (user?.telegramId) {
      fetch(`https://play-for-win.onrender.com/api/match/history/${user.telegramId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistory(data.slice(0, 5));
          }
        })
        .catch(err => console.error("History fetch error:", err));
    }
  }, [user?.telegramId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ২. ম্যাচ জয়েন লজিক (/api/match/join)
  const handleStartGame = async (mode) => {
    if ((user?.mainCoins || 0) < 250) {
      alert("⚠️ Insufficient coins! 250 Coins required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://play-for-win.onrender.com/api/match/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user.telegramId,
          firstName: user.firstName || 'Player',
          mode: mode
        })
      });

      const data = await res.json();
      if (data.success && data.matchId) {
        if (refreshUserData) refreshUserData(); 
        setShowModeModal(false);
        // battle পেজে matchId ও mode পাঠানো হচ্ছে
        onNavigate('battle', { mode: mode, matchId: data.matchId });
      } else {
        alert(data.error || "Failed to join match");
      }
    } catch (err) {
      console.error(err);
      alert("Network error joining match!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 py-4 text-white">
      {/* Fight Button */}
      <button 
        onClick={() => setShowModeModal(true)}
        className="w-full active:scale-95 transition hover:brightness-110 flex justify-center cursor-pointer"
      >
        <img src={fightBtnImg} alt="Fight" className="w-full max-w-[280px] object-contain drop-shadow-2xl" />
      </button>

      {/* Mode Selection Modal */}
      {showModeModal && (
        <div 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)' }} 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
        >
          <div 
            style={{ 
              backgroundColor: '#0f172a', 
              border: '2px solid #f59e0b', 
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)' 
            }} 
            className="p-6 w-full max-w-xs text-center space-y-4"
          >
            <h3 style={{ color: '#fbbf24' }} className="text-xl font-bold">Select Arena Mode</h3>
            <p style={{ color: '#f1f5f9' }} className="text-xs font-semibold">Entry Fee: 🪙 250 Coins</p>
            
            <div className="flex gap-3 pt-2">
              <button 
                disabled={loading}
                onClick={() => handleStartGame(2)} 
                style={{ backgroundColor: '#f59e0b', color: '#000000', borderRadius: '12px', fontWeight: 'bold', padding: '10px 0' }}
                className="flex-1 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Joining...' : '2 Players'}
              </button>
              <button 
                disabled={loading}
                onClick={() => handleStartGame(4)} 
                style={{ backgroundColor: '#f59e0b', color: '#000000', borderRadius: '12px', fontWeight: 'bold', padding: '10px 0' }}
                className="flex-1 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Joining...' : '4 Players'}
              </button>
            </div>

            <button 
              onClick={() => setShowModeModal(false)} 
              style={{ color: '#94a3b8' }}
              className="text-xs underline pt-2 inline-block cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recent 5 Matches History */}
      <div 
        style={{ 
          backgroundColor: '#0f172a', 
          border: '2px solid #334155', 
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }} 
        className="p-4 w-full"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 style={{ color: '#fbbf24' }} className="text-sm font-bold uppercase tracking-wider">
            Recent 5 Matches
          </h3>
          <button 
            onClick={fetchHistory}
            className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {history.length === 0 ? (
            <p style={{ color: '#94a3b8' }} className="text-xs text-center py-2 font-medium">
              No match history found
            </p>
          ) : (
            history.map((match, idx) => (
              <div 
                key={match._id || idx} 
                onClick={() => setSelectedMatch(match)}
                style={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                className="p-3 rounded-xl flex justify-between items-center cursor-pointer hover:brightness-125 transition"
              >
                <div>
                  <span style={{ color: '#cbd5e1' }} className="text-xs font-bold">
                    {match.mode || 2} Players Match
                  </span>
                  <p style={{ color: '#64748b' }} className="text-[10px]">
                    {match.createdAt ? new Date(match.createdAt).toLocaleTimeString() : 'Recent'}
                  </p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${
                  match.status === 'pending' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {match.status || 'Completed'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-sm space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-amber-400">Match Details ({selectedMatch.status})</h4>
            <div className="space-y-2">
              {selectedMatch.players?.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-slate-800 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <p className="text-slate-200 font-bold">{i + 1}. {p.firstName || 'Player'}</p>
                    <p className="text-[10px] text-slate-400">{p.timeTaken ? `${Number(p.timeTaken).toFixed(1)}s` : 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">{p.hits || 0} Hits</p>
                    <p className="text-emerald-400 font-bold">+${p.prizeUSD || 0}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedMatch(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fighting;

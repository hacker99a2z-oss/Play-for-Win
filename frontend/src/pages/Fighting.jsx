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

  // ২. ম্যাচ জয়েন লজিক (/api/match/join)
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
          telegramId: user?.telegramId,
          firstName: user?.firstName || 'Player',
          mode: mode
        })
      });

      const data = await res.json();
      
      // ✅ সঠিকভাবে matchId রিসিভ করে battle পেজে পাঠানো হচ্ছে
      if (data.success && data.matchId) {
        if (refreshUserData) refreshUserData(); 
        setShowModeModal(false);
        
        if (onNavigate) {
          onNavigate('battle', { mode: mode, matchId: data.matchId });
        }
      } else {
        alert(data.error || "Failed to join match");
      }
    } catch (err) {
      console.error("Join match error:", err);
      alert("Network error joining match!");
    } finally {
      setLoading(false);
    }
  };

  // ৩. পেন্ডিং ম্যাচের জন্য ডায়নামিক র‍্যাঙ্ক অনুযায়ী Estimated USD Prize বের করার হেলপার
  const getEstimatedPrizeUSD = (rankIndex, mode) => {
    if (mode === 2) {
      // ২ জন প্লেয়ার: ১ম প্রাইজ $0.10, ২য় প্রাইজ $0.00
      return rankIndex === 0 ? 0.10 : 0.00;
    } else if (mode === 4) {
      // ৪ জন প্লেয়ার: ১ম $0.10, ২য় $0.07, ৩য় $0.03, ৪র্থ $0.00
      if (rankIndex === 0) return 0.10;
      if (rankIndex === 1) return 0.07;
      if (rankIndex === 2) return 0.03;
      return 0.00;
    }
    return 0.00;
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

      {/* Match Details Modal (Fixed Layout & UI Overlap) */}
      {selectedMatch && (() => {
        const mode = selectedMatch.mode || 2;
        const entryFee = selectedMatch.entryFeeCoins || 250;

        let rawPlayers = (selectedMatch.players && selectedMatch.players.length > 0)
          ? [...selectedMatch.players]
          : [{
              telegramId: user?.telegramId,
              firstName: user?.firstName || 'You',
              hits: 0,
              timeTaken: 0,
              finishedAt: new Date()
            }];

        // Hits অনুযায়ী সর্ট
        rawPlayers.sort((a, b) => {
          const hitsA = a.hits || 0;
          const hitsB = b.hits || 0;
          if (hitsB !== hitsA) return hitsB - hitsA;
          return (a.timeTaken || 0) - (b.timeTaken || 0);
        });

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4 backdrop-blur-md">
            <div className="bg-slate-900 border border-amber-500/50 p-5 rounded-2xl w-full max-w-xs space-y-4 shadow-2xl relative z-[1000]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-amber-400 capitalize">
                    {mode} Players Match
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Status: <b className="text-amber-400 uppercase">{selectedMatch.status || 'Pending'}</b>
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  🪙 {entryFee} Coins
                </span>
              </div>
              
              {/* Player List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {rawPlayers.map((p, rankIndex) => {
                  const playerHits = p.hits || 0;
                  const isYou = String(p.telegramId) === String(user?.telegramId);
                  
                  const finalPrizeUSD = selectedMatch.status === 'completed'
                    ? (p.prizeUSD || 0)
                    : getEstimatedPrizeUSD(rankIndex, mode);

                  return (
                    <div 
                      key={p.telegramId || rankIndex} 
                      className={`flex justify-between items-center text-xs p-3 rounded-xl border ${
                        isYou 
                          ? 'bg-amber-500/10 border-amber-500/60' 
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                          rankIndex === 0 ? 'bg-amber-500 text-black' :
                          rankIndex === 1 ? 'bg-slate-300 text-black' : 'bg-slate-700 text-white'
                        }`}>
                          #{rankIndex + 1}
                        </span>
                        <div>
                          <p className="text-slate-200 font-bold">
                            {p.firstName || 'Player'} {isYou && <span className="text-amber-400 text-[10px]">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {p.finishedAt ? `${Number(p.timeTaken || 0).toFixed(1)}s` : 'Playing...'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-amber-400 font-bold">{playerHits} Hits</p>
                        <p className="text-emerald-400 text-[11px] font-bold">
                          Est. Prize: ${Number(finalPrizeUSD).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedMatch(null)} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Fighting;

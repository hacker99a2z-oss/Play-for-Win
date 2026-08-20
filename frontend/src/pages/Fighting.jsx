import React, { useState, useEffect } from 'react';
import fightBtnImg from '../assets/FIGHT.png';

const Fighting = ({ user, refreshUserData, onNavigate }) => {
  const [history, setHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    if (user?.telegramId) {
      fetch(`https://play-for-win.onrender.com/api/match/history/${user.telegramId}`)
        .then(res => res.json())
        .then(data => setHistory(data.slice(0, 5)))
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleStartGame = (mode) => {
    if ((user?.mainCoins || 0) < 250) {
      alert("⚠️ Insufficient coins! 250 Coins required.");
      return;
    }
    setShowModeModal(false);
    onNavigate('battle', { mode });
  };

  return (
    <div className="w-full flex flex-col gap-4 py-4 text-white">
      {/* Fight Modal / Options */}
      <button 
        onClick={() => setShowModeModal(true)}
        className="w-full active:scale-95 transition hover:brightness-110 flex justify-center cursor-pointer"
      >
        <img src={fightBtnImg} alt="Fight" className="w-full max-w-[280px] object-contain drop-shadow-2xl" />
      </button>

      {/* Mode Selection Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl w-full max-w-xs text-center space-y-4">
            <h3 className="text-lg font-bold text-amber-400">Select Arena Mode</h3>
            <p className="text-xs text-slate-300">Entry Fee: 🪙 250 Coins</p>
            <div className="flex gap-3">
              <button onClick={() => handleStartGame(2)} className="flex-1 bg-amber-500 font-bold py-2 rounded-xl text-black">2 Players</button>
              <button onClick={() => handleStartGame(4)} className="flex-1 bg-amber-500 font-bold py-2 rounded-xl text-black">4 Players</button>
            </div>
            <button onClick={() => setShowModeModal(false)} className="text-xs text-slate-400 underline mt-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Last 5 Matches History */}
      <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">Recent 5 Matches</h3>
        <div className="space-y-2">
          {history.map((match, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedMatch(match)}
              className="bg-slate-800/60 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-800 border border-white/5"
            >
              <div>
                <span className="text-xs font-bold text-slate-300">{match.mode} Players Match</span>
                <p className="text-[10px] text-slate-400">{new Date(match.createdAt).toLocaleTimeString()}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${match.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {match.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Match Details Modal (Shows on Pending/Completed Click) */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-sm space-y-3">
            <h4 className="text-sm font-bold text-amber-400">Match Details ({selectedMatch.status})</h4>
            <div className="space-y-2">
              {selectedMatch.players.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-slate-800 p-2 rounded-lg">
                  <span className="text-slate-200">{i + 1}. {p.firstName}</span>
                  <span className="text-amber-400 font-bold">{p.hits} Target Hits</span>
                  <span className="text-emerald-400 font-bold">+${p.prizeUSD || 0}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedMatch(null)} className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fighting;

import React, { useState } from 'react';
import bgArena from '../fighting-bg.jpg';

const Fighting = ({ onPlayAd }) => {
  const [mice, setMice] = useState([
    { id: 'alpha', name: 'MOUSE ALPHA', power: 6250, color: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-blue-500/50', icon: '🐭⚔️' },
    { id: 'beta', name: 'MOUSE BETA', power: 5500, color: 'text-amber-400', border: 'border-amber-500', shadow: 'shadow-amber-500/50', icon: '🐭🗡️' },
    { id: 'gamma', name: 'MOUSE GAMMA', power: 7000, color: 'text-emerald-400', border: 'border-emerald-500', shadow: 'shadow-emerald-500/50', icon: '🐭🔮' }
  ]);

  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  const handleBoostSingleMouse = async (mouseId) => {
    if (onPlayAd) {
      const isWatched = await onPlayAd();
      if (isWatched) {
        setMice(prev => prev.map(m => m.id === mouseId ? { ...m, power: m.power + 100 } : m));
      }
    } else {
      setMice(prev => prev.map(m => m.id === mouseId ? { ...m, power: m.power + 100 } : m));
    }
  };

  return (
    <div 
      className="w-full max-w-md mx-auto min-h-screen p-3 flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(${bgArena})` }}
    >
      {/* টপ হেডার */}
      <div className="flex justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-700 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">⚡</span>
          <span className="text-xs text-slate-300 font-bold">Total Power:</span>
          <span className="text-amber-400 font-black text-base">{totalPower.toLocaleString()}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">Fighting Arena</span>
      </div>

      {/* মাঝের ৩টি কার্ড ও বুস্টার বাটন */}
      <div className="grid grid-cols-3 gap-2 my-auto">
        {mice.map((mouse) => (
          <div key={mouse.id} className="flex flex-col gap-2">
            
            {/* ক্যারেক্টার কার্ড */}
            <div className={`bg-slate-900/85 border-2 ${mouse.border} shadow-lg ${mouse.shadow} rounded-2xl p-2 text-center flex flex-col justify-between min-h-[180px] backdrop-blur-sm`}>
              <div className="text-4xl my-auto animate-pulse">{mouse.icon}</div>
              <div>
                <h4 className="text-[10px] font-black text-slate-200">{mouse.name}</h4>
                <p className={`text-[11px] font-black ${mouse.color} mt-0.5`}>
                  POWER: <span className="text-white">{mouse.power.toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* আলাদা Boost বাটন */}
            <button
              onClick={() => handleBoostSingleMouse(mouse.id)}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-black font-black text-[9px] py-2 px-1 rounded-xl shadow-md border border-amber-300/40 flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>📺</span>
              <span>+100 BOOST</span>
            </button>
          </div>
        ))}
      </div>

      {/* নিচের FIGHT বাটন */}
      <div className="mb-4">
        <button
          onClick={() => alert('⚔️ Battle Started!')}
          className="w-full bg-gradient-to-r from-red-700 via-orange-600 to-red-700 hover:opacity-95 text-yellow-300 font-black text-2xl py-3.5 rounded-2xl border-2 border-amber-400 shadow-xl shadow-red-950/80 tracking-widest flex items-center justify-center gap-3 active:scale-95 transition"
        >
          <span>⚔️</span>
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">FIGHT!</span>
          <span>⚔️</span>
        </button>
      </div>
    </div>
  );
};

export default Fighting;

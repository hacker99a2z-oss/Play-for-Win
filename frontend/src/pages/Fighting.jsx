import React, { useState } from 'react';

const Fighting = ({ onPlayAd }) => {
  // ৩টি ইঁদুরের স্টেট
  const [mice, setMice] = useState([
    { id: 'alpha', name: 'MOUSE ALPHA', power: 6250, color: 'text-blue-400' },
    { id: 'beta', name: 'MOUSE BETA', power: 5500, color: 'text-amber-400' },
    { id: 'gamma', name: 'MOUSE GAMMA', power: 7000, color: 'text-emerald-400' }
  ]);

  // মোট পাওয়ার হিসাব
  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  // ইন্ডিভিজুয়াল ইঁদুরের জন্য Adsgram পাওয়ার বাড়ানো
  const handleBoostSingleMouse = async (mouseId) => {
    if (onPlayAd) {
      const isWatched = await onPlayAd();
      if (isWatched) {
        setMice((prevMice) =>
          prevMice.map((mouse) =>
            mouse.id === mouseId ? { ...mouse, power: mouse.power + 100 } : mouse
          )
        );
      }
    } else {
      // Adsgram না থাকলে টেস্ট করার জন্য
      setMice((prevMice) =>
        prevMice.map((mouse) =>
          mouse.id === mouseId ? { ...mouse, power: mouse.power + 100 } : mouse
        )
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 text-white p-2">
      
      {/* ১. টপ হেডার (Total Power) */}
      <div className="flex justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-800 mb-4 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">⚡</span>
          <span className="text-xs text-slate-400 font-bold">Total Power:</span>
          <span className="text-amber-400 font-black text-base">{totalPower.toLocaleString()}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">Fighting Arena</span>
      </div>

      {/* ২. মেইন গেম ইন্টারফেস Area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 p-3">
        
        {/* ৩টি কার্ডের গ্রিড */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {mice.map((mouse) => (
            <div key={mouse.id} className="flex flex-col gap-2">
              
              {/* ইঁদুরের ইন্ডিভিজুয়াল কার্ড */}
              <div className="bg-slate-950/80 border border-slate-700/60 rounded-xl p-2 text-center flex flex-col justify-between min-h-[170px] shadow-md relative overflow-hidden">
                
                {/* অ্যানিমেটেড ইঁদুর চ্যারেক্টর (আপনার প্রজেক্টের ইমেজ বা ইমোজি) */}
                <div className="text-4xl my-auto animate-bounce">
                  {mouse.id === 'alpha' && '🐭⚔️'}
                  {mouse.id === 'beta' && '🐭🗡️'}
                  {mouse.id === 'gamma' && '🐭🔮'}
                </div>

                {/* ডাইনামিক নাম ও পাওয়ার */}
                <div className="mt-2">
                  <h4 className="text-[10px] font-bold text-slate-300 tracking-tighter">{mouse.name}</h4>
                  <p className={`text-[11px] font-black ${mouse.color} mt-0.5`}>
                    POWER: <span className="text-white">{mouse.power.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* ইন্ডিভিজুয়াল Adsgram Booster Button */}
              <button
                onClick={() => handleBoostSingleMouse(mouse.id)}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-[9px] py-2 px-1 rounded-lg border border-amber-300/40 shadow-md flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <span>📺</span>
                <span>+100 BOOST</span>
              </button>

            </div>
          ))}
        </div>

        {/* ৩. নিচে বড় FIGHT! বাটন */}
        <div className="mt-2">
          <button
            onClick={() => alert('⚔️ Fight Started!')}
            className="w-full bg-gradient-to-r from-red-700 via-orange-600 to-red-700 hover:opacity-95 text-yellow-300 font-black text-xl py-3.5 rounded-xl border-2 border-amber-400/80 shadow-lg shadow-red-950/80 tracking-widest flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <span>⚔️</span>
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">FIGHT!</span>
            <span>⚔️</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Fighting;

import React, { useState } from 'react';
import bgArena from '../assets/fighting-bg.jpg';
import mouseAlpha from '../assets/mouse-alpha.png';
import mouseBeta from '../assets/mouse-beta.png';
import mouseGamma from '../assets/mouse-gamma.png';

const Fighting = ({ onPlayAd }) => {
  // ১. স্টেটে ছবিগুলো (img) যুক্ত করা হয়েছে
  const [mice, setMice] = useState([
    { 
      id: 'alpha', 
      name: 'MOUSE ALPHA', 
      power: 6250, 
      color: 'text-blue-400', 
      border: 'border-blue-500/50', 
      shadow: 'shadow-blue-500/30', 
      img: mouseAlpha 
    },
    { 
      id: 'beta', 
      name: 'MOUSE BETA', 
      power: 5500, 
      color: 'text-amber-400', 
      border: 'border-amber-500/50', 
      shadow: 'shadow-amber-500/30', 
      img: mouseBeta 
    },
    { 
      id: 'gamma', 
      name: 'MOUSE GAMMA', 
      power: 7000, 
      color: 'text-emerald-400', 
      border: 'border-emerald-500/50', 
      shadow: 'shadow-emerald-500/30', 
      img: mouseGamma 
    }
  ]);

  // ২. মোট পাওয়ার ক্যালকুলেশন লজিক
  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  // ৩. সিঙ্গেল মাউস পাওয়ার বুস্ট করার এডসগ্রাম লজিক
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
      className="w-full max-w-md mx-auto min-h-screen p-4 flex flex-col justify-between bg-cover bg-center bg-no-repeat selection:bg-none"
      style={{ backgroundImage: `url(${bgArena})` }}
    >
      {/* টপ হেডার (Total Power) */}
      <div className="flex justify-between items-center bg-slate-900/85 p-3.5 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xl animate-bounce">⚡</span>
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Power:</span>
          <span className="text-amber-400 font-black text-lg tracking-wide">{totalPower.toLocaleString()}</span>
        </div>
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">Arena</span>
      </div>

      {/* মাঝের ৩টি কার্ড ও এডসগ্রাম বুস্টার বাটন */}
      <div className="grid grid-cols-3 gap-2.5 my-auto">
        {mice.map((mouse) => (
          <div key={mouse.id} className="flex flex-col gap-2">
            
            {/* আসল ইঁদুরের PNG কার্ড */}
            <div className={`bg-slate-900/80 border-2 ${mouse.border} shadow-xl ${mouse.shadow} rounded-2xl p-2 text-center flex flex-col justify-between min-h-[210px] backdrop-blur-md transition-all duration-300 hover:scale-[1.02]`}>
              
              {/* Image Container */}
              <div className="my-auto flex items-center justify-center p-1">
                <img 
                  src={mouse.img} 
                  alt={mouse.name} 
                  className="w-full h-auto max-h-[110px] object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]" 
                />
              </div>

              {/* Title & Power */}
              <div className="bg-slate-950/60 p-1.5 rounded-xl border border-white/5">
                <h4 className="text-[9px] font-black text-slate-300 tracking-wider truncate">{mouse.name}</h4>
                <p className={`text-[10px] font-black ${mouse.color} mt-0.5`}>
                  POWER: <span className="text-white font-bold">{mouse.power.toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* +100 ADS BOOST Button */}
            <button
              onClick={() => handleBoostSingleMouse(mouse.id)}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[9px] py-2 px-1 rounded-xl shadow-lg border border-amber-300/60 flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <span className="text-xs">📺</span>
              <span>+100 BOOST</span>
            </button>
          </div>
        ))}
      </div>

      {/* নিচের বড় FIGHT বাটন */}
      <div className="mb-2">
        <button
          onClick={() => alert(`⚔️ Battle Started with Total Power: ${totalPower.toLocaleString()}`)}
          className="w-full bg-gradient-to-r from-red-700 via-orange-600 to-red-700 hover:brightness-110 text-yellow-300 font-black text-2xl py-3.5 rounded-2xl border-2 border-amber-400/80 shadow-[0_10px_25px_rgba(185,28,28,0.5)] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span>⚔️</span>
          <span className="drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] uppercase">FIGHT!</span>
          <span>⚔️</span>
        </button>
      </div>
    </div>
  );
};

export default Fighting;

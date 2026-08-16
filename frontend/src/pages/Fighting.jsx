import React, { useState } from 'react';
import bgArena from '../assets/fighting-bg.jpg';
import mouseAlpha from '../assets/mouse-alpha.png';
import mouseBeta from '../assets/mouse-beta.png';
import mouseGamma from '../assets/mouse-gamma.png';

const Fighting = ({ onPlayAd }) => {
  const [mice, setMice] = useState([
    { id: 'alpha', name: 'MOUSE ALPHA', power: 6250, img: mouseAlpha },
    { id: 'beta', name: 'MOUSE BETA', power: 5500, img: mouseBeta },
    { id: 'gamma', name: 'MOUSE GAMMA', power: 7000, img: mouseGamma },
  ]);

  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  const handleBoostSingleMouse = async (mouseId) => {
    if (onPlayAd) {
      const isWatched = await onPlayAd();
      if (isWatched) {
        setMice((prev) =>
          prev.map((m) => (m.id === mouseId ? { ...m, power: m.power + 100 } : m))
        );
      }
    } else {
      setMice((prev) =>
        prev.map((m) => (m.id === mouseId ? { ...m, power: m.power + 100 } : m))
      );
    }
  };

  return (
    <div
      className="w-full max-w-md mx-auto min-h-screen pb-24 p-2 flex flex-col justify-between bg-cover bg-center text-white select-none overflow-x-hidden"
      style={{ backgroundImage: `url(${bgArena})` }}
    >
      {/* ১. টপ হেডার (Total Power) */}
      <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex justify-between items-center shadow-lg mt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-lg">⚡</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-200">TOTAL POWER:</span>
          <span className="text-yellow-400 font-extrabold text-sm">{totalPower.toLocaleString()}</span>
        </div>
        <span className="border border-white/40 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase bg-black/40">
          ARENA
        </span>
      </div>

      {/* ২. মাঝের ৩টি কার্ড ও বুস্ট বাটন (Responsive Grid) */}
      <div className="grid grid-cols-3 gap-1.5 my-auto py-2">
        {mice.map((mouse) => (
          <div key={mouse.id} className="flex flex-col gap-1.5 items-center">
            
            {/* মাউসের PNG ছবি */}
            <div className="w-full bg-black/40 border border-white/30 rounded-xl p-1 backdrop-blur-sm flex flex-col items-center">
              <img 
                src={mouse.img} 
                alt={mouse.name} 
                className="w-full h-auto max-h-[110px] object-contain drop-shadow-md"
              />
              
              {/* পাওয়ারের হিসাব */}
              <div className="w-full bg-black/60 rounded-lg p-1 mt-1 text-center border border-white/10">
                <p className="text-[8px] font-black text-slate-300 truncate">{mouse.name}</p>
                <p className="text-[9px] font-black text-sky-400">
                  POWER: <span className="text-white">{mouse.power.toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* +100 Boost Button */}
            <button
              onClick={() => handleBoostSingleMouse(mouse.id)}
              className="w-full bg-black/60 hover:bg-black/80 border border-white/40 rounded-xl py-1.5 px-1 text-center backdrop-blur-sm shadow-md active:scale-95 transition flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-1 text-[9px] font-black">
                <span>📺</span>
                <span className="text-yellow-400">+100</span>
              </div>
              <span className="text-[8px] font-bold uppercase text-slate-200">BOOST</span>
            </button>
          </div>
        ))}
      </div>

      {/* ৩. নিচের FIGHT! বাটন */}
      <div className="w-full px-2 mb-2">
        <button
          onClick={() => alert(`⚔️ Battle Started!`)}
          className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:brightness-110 text-yellow-300 font-black text-xl py-3 rounded-xl border-2 border-yellow-400 shadow-2xl tracking-widest flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <span>⚔️</span>
          <span className="drop-shadow-md uppercase">FIGHT!</span>
          <span>⚔️</span>
        </button>
      </div>
    </div>
  );
};

export default Fighting;

import React, { useState } from 'react';
import bgArena from '../assets/fighting-bg.jpg';
import mouseAlpha from '../assets/mouse-alpha.png';
import mouseBeta from '../assets/mouse-beta.png';
import mouseGamma from '../assets/mouse-gamma.png';

const Fighting = ({ onPlayAd }) => {
  const [mice, setMice] = useState([
    { id: 'alpha', power: 6250, color: 'text-sky-400', img: mouseAlpha },
    { id: 'beta', power: 5500, color: 'text-amber-500', img: mouseBeta },
    { id: 'gamma', power: 7000, color: 'text-emerald-400', img: mouseGamma },
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

      {/* ২. মাঝের ৩টি কার্ড ও বুস্ট বাটন (অতিরিক্ত টেক্সট ফাকা করে ওভারলে করা হয়েছে) */}
      <div className="grid grid-cols-3 gap-1.5 my-auto py-2">
        {mice.map((mouse) => (
          <div key={mouse.id} className="flex flex-col gap-1.5 items-center">
            
            {/* মাউসের PNG ছবি ও ডায়নামিক নম্বর */}
            <div className="w-full relative flex flex-col items-center justify-center">
              <img 
                src={mouse.img} 
                alt="Mouse Card" 
                className="w-full h-auto object-contain drop-shadow-md"
              />
              
              {/* ছবির ওপর শুধু পাওয়ারের সংখ্যাটি দেখাবে */}
              <div className="absolute bottom-[6%] w-full text-center">
                <span className={`font-black text-xs tracking-wider ${mouse.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}>
                  {mouse.power.toLocaleString()}
                </span>
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
          onClick={() => alert(`⚔️ Battle Started with Total Power: ${totalPower.toLocaleString()}`)}
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

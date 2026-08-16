import React, { useState } from 'react';
import bgArena from '../assets/fighting-bg.jpg';
import mouseAlpha from '../assets/mouse-alpha.png';
import mouseBeta from '../assets/mouse-beta.png';
import mouseGamma from '../assets/mouse-gamma.png';

// Icons for bottom navigation (simplified)
const HomeIcon = () => <span>🏠</span>;
const FightingIcon = () => <span>⚔️</span>;
const ReferralIcon = () => <span>👥</span>;
const ContestIcon = () => <span>🏆</span>;
const WithdrawIcon = () => <span>💸</span>;

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
      // For testing without actual ads logic
      setMice((prev) =>
        prev.map((m) => (m.id === mouseId ? { ...m, power: m.power + 100 } : m))
      );
    }
  };

  const navItems = [
    { name: 'Home', icon: HomeIcon },
    { name: 'Fighting', icon: FightingIcon, active: true },
    { name: 'Referral', icon: ReferralIcon },
    { name: 'Contest', icon: ContestIcon },
    { name: 'Withdraw', icon: WithdrawIcon },
  ];

  return (
    <div
      className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between bg-cover bg-center text-white font-sans selection:bg-none relative"
      style={{ backgroundImage: `url(${bgArena})` }}
    >
      {/* 1. Header (Total Power & Arena) */}
      <div className="p-4 pt-6">
        <div className="border border-white/70 rounded-3xl px-5 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-3xl animate-pulse">⚡</span>
            <div className='flex items-baseline gap-1.5'>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Total Power:</span>
              <span className="text-white font-extrabold text-2xl tracking-tight">{totalPower.toLocaleString()}</span>
            </div>
          </div>
          <button className="border border-white rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest hover:bg-white hover:text-black transition">
            Arena
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex items-center justify-center p-3 mb-10">
        <div className="grid grid-cols-3 gap-3 w-full">
          {mice.map((mouse) => (
            <div key={mouse.id} className="flex flex-col gap-3">
              {/* Card with Image and Inner Boxes */}
              <div className="border-2 border-white rounded-3xl p-3 bg-black/15 shadow-2xl flex flex-col gap-3 transition-transform hover:scale-105">
                {/* Image Area */}
                <div className="aspect-[3/4] flex items-center justify-center p-1 relative">
                    <img 
                      src={mouse.img} 
                      alt={mouse.name} 
                      className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
                    />
                </div>
                
                {/* Text Inner Boxes */}
                <div className="space-y-2">
                    <div className="border border-white rounded-xl p-2.5 text-center bg-black/20">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider truncate">{mouse.name}</h4>
                    </div>
                    <div className="border border-white rounded-xl p-2.5 text-center bg-black/20">
                        <p className={`text-[11px] font-black text-sky-400 mt-0.5`}>
                          POWER:
                        </p>
                        <p className="text-white font-extrabold text-sm mt-1">{mouse.power.toLocaleString()}</p>
                    </div>
                </div>
              </div>

              {/* +100 Boost Button */}
              <button
                onClick={() => handleBoostSingleMouse(mouse.id)}
                className="border-2 border-white rounded-3xl p-4 w-full bg-black/15 shadow-lg flex flex-col items-center justify-center gap-1.5 text-white active:scale-95 transition hover:bg-white/5"
              >
                <div className="flex items-center gap-1.5">
                    <span className="text-xl">📺</span>
                    <span className="font-extrabold text-sm tracking-tight">+100</span>
                </div>
                <span className="font-black text-sm uppercase tracking-wider">Boost</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Fight Button & Bottom Navigation */}
      <div className="w-full relative">
        {/* Fight Button (Positioned over the nav) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-10 w-[80%] max-w-sm">
          <button
            onClick={() => alert(`⚔️ Battle Started with Total Power: ${totalPower.toLocaleString()}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-yellow-300 font-extrabold text-2xl py-5 rounded-2xl border-4 border-yellow-300 shadow-[0_15px_30px_rgba(185,28,28,0.6)] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span>⚔️</span>
            <span className="drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] uppercase">Fight!</span>
            <span>⚔️</span>
          </button>
        </div>

        {/* Bottom Nav Bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 pt-10 pb-4 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-5 gap-1 items-end">
            {navItems.map((item, index) => (
              <div key={index} className={`flex flex-col items-center justify-center gap-1.5 pb-1 ${item.active ? 'relative' : ''}`}>
                {item.active && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-12 border-2 border-yellow-300 rounded-lg flex items-center justify-center p-1.5 bg-slate-900 shadow-xl">
                      <item.icon />
                   </div>
                )}
                
                {!item.active && (
                    <div className="text-xl opacity-60">
                        <item.icon />
                    </div>
                )}

                <span className={`text-[10px] font-bold ${item.active ? 'text-yellow-300 pt-10' : 'text-slate-400'} uppercase tracking-wider`}>
                    {item.name}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-[10px] text-slate-600">@playersfordestiny_bot</div>
        </div>
      </div>
    </div>
  );
};

export default Fighting;

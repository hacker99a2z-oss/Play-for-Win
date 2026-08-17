import React, { useState, useEffect } from 'react';
import mouseAlpha from '../assets/mouse-alpha.png';
import mouseBeta from '../assets/mouse-beta.png';
import mouseGamma from '../assets/mouse-gamma.png';
import adsBoostImg from '../assets/ADS-boost.png';
import fightBtnImg from '../assets/FIGHT.png';

const Fighting = ({ user, onPlayAd, refreshUserData, onNavigate }) => {
  // 🟢 ডেমো পাওয়ার সরিয়ে পাওয়ার প্রাথমিক মান 0 করে দেওয়া হয়েছে
  const [mice, setMice] = useState([
    { 
      id: 'alpha', 
      power: 0, 
      color: '#38bdf8', 
      img: mouseAlpha,
      textPos: { bottom: '6.1%', left: '52%' }
    },
    { 
      id: 'beta', 
      power: 0, 
      color: '#f59e0b', 
      img: mouseBeta,
      textPos: { bottom: '6.5%', left: '52%' }
    },
    { 
      id: 'gamma', 
      power: 0, 
      color: '#34d399', 
      img: mouseGamma,
      textPos: { bottom: '7%', left: '46.6%' },
      cardPos: 'translate-y-0.9 translate-x-1'
    },
  ]);

  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [loadingMouseId, setLoadingMouseId] = useState(null);

  // ১. কুলডাউন চেক ও টাইমার
  useEffect(() => {
    const savedCooldownTarget = localStorage.getItem('boostCooldownTarget');
    if (savedCooldownTarget) {
      const remaining = Math.ceil((parseInt(savedCooldownTarget, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        setIsCooldownActive(true);
      } else {
        localStorage.removeItem('boostCooldownTarget');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isCooldownActive && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && isCooldownActive) {
      setIsCooldownActive(false);
      localStorage.removeItem('boostCooldownTarget');
    }
    return () => clearInterval(timer);
  }, [isCooldownActive, cooldown]);

  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  // ২. Adsgram অ্যাড ভ্যালিডেশন এবং ১০০ পাওয়ার বৃদ্ধি
  const handleBoostSingleMouse = async (mouseId) => {
    if (isCooldownActive || loadingMouseId) return;

    setLoadingMouseId(mouseId);

    try {
      let isWatched = false;
      if (onPlayAd) {
        isWatched = await onPlayAd();
      }

      // অ্যাড সফলভাবে দেখা শেষ হলে ১০০ পাওয়ার যুক্ত হবে
      if (isWatched) {
        setMice((prev) =>
          prev.map((m) => (m.id === mouseId ? { ...m, power: m.power + 100 } : m))
        );

        // ৬০ সেকেন্ডের কুলডাউন চালু হবে
        const cooldownTarget = Date.now() + 60 * 1000;
        localStorage.setItem('boostCooldownTarget', cooldownTarget.toString());
        setCooldown(60);
        setIsCooldownActive(true);
      }
    } catch (error) {
      console.error("Boost Ad Error:", error);
    } finally {
      setLoadingMouseId(null);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between py-2 pb-10 select-none">
      {/* ১. TOTAL POWER Header */}
      <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex justify-between items-center shadow-lg mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-lg">⚡</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-200">TOTAL POWER:</span>
          <span className="text-yellow-400 font-extrabold text-sm">{totalPower.toLocaleString()}</span>
        </div>
        <span className="border border-white/40 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase bg-black/40 text-white">
          ARENA
        </span>
      </div>

      {/* ২. মাউস কার্ডস ও পাওয়ার প্রদর্শনী */}
      <div className="grid grid-cols-3 gap-1 px-0 my-auto py-2">
        {mice.map((mouse) => (
          <div 
            key={mouse.id}
            className={`flex flex-col gap-2 items-center transform transition-transform ${mouse.cardPos || ''}`}
          >
            {/* ছবির কন্টেইনার */}
            <div className="w-full relative inline-block transform scale-105 origin-center animate-float">
              <img 
                src={mouse.img} 
                alt="Mouse Card" 
                className="w-full h-auto block object-contain"
              />
              
              {/* পাওয়ার টেক্সট */}
              <div 
                className="absolute font-black tracking-wider whitespace-nowrap"
                style={{
                  bottom: mouse.textPos.bottom,
                  left: mouse.textPos.left,
                  color: mouse.color,
                  fontSize: '9px',
                  textShadow: '0px 2px 4px rgba(0,0,0,0.95)'
                }}
              >
                {mouse.power.toLocaleString()}
              </div>
            </div>

            {/* Boost Button (Adsgram) */}
            <button
              onClick={() => handleBoostSingleMouse(mouse.id)}
              disabled={isCooldownActive || loadingMouseId !== null}
              className={`w-full max-w-[120px] mt-2 flex justify-center items-center cursor-pointer transition rounded-xl ${
                isCooldownActive || loadingMouseId !== null
                  ? 'opacity-60 cursor-not-allowed'
                  : 'active:scale-95 hover:brightness-110'
              }`}
            >
              {loadingMouseId === mouse.id ? (
                <div className="bg-black/80 text-yellow-400 text-[10px] font-bold py-2 px-3 rounded-xl border border-yellow-500/30 flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : isCooldownActive ? (
                <div className="bg-black/80 text-gray-300 text-[10px] font-bold py-1.5 px-2 rounded-xl border border-white/20 w-full text-center">
                  ⏳ {cooldown}s
                </div>
              ) : (
                <img 
                  src={adsBoostImg} 
                  alt="Ads Boost" 
                  className="w-full h-auto block object-contain drop-shadow-md"
                />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* ৩. FIGHT Button */}
      <div className="w-full px-4 mt-12 mb-4 flex justify-center">
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('battle');
            }
          }}
          className="w-full active:scale-95 transition hover:brightness-110 flex justify-center cursor-pointer"
        >
          <img 
            src={fightBtnImg} 
            alt="Fight" 
            className="w-full max-w-[280px] h-auto block object-contain drop-shadow-2xl"
          />
        </button>
      </div>
    </div>
  );
};

export default Fighting;


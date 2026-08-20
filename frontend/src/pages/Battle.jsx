import React, { useState, useEffect, useRef } from 'react';
import mouseImg from '../assets/mouse-alpha.png'; // আপনার ইঁদুরের পিকচার পাথ
import stoneImg from '../assets/stone.png';// পাথরের পিকচার পাথ (assets এ যুক্ত করবেন)
import bgImg from '../assets/battle.jpeg'; // অথবা '../assets/fighting-bg.jpg'

const Battle = ({ user, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ৩টি ইঁদুরের পজিশন ও স্পিড (ডান থেকে বামে)
  const [mice, setMice] = useState([
    { id: 1, x: 100, y: 15, speed: 1.2, hit: false },
    { id: 2, x: 130, y: 25, speed: 1.6, hit: false },
    { id: 3, x: 160, y: 35, speed: 1.4, hit: false },
  ]);

  // পাথরের পজিশন ও ফিজিক্স
  const [stonePos, setStonePos] = useState({ x: 50, y: 80 }); // Percentage পজিশন
  const [isDragging, setIsDragging] = useState(false);
  const [isThrown, setIsThrown] = useState(false);
  
  const touchStartRef = useRef({ x: 0, y: 0 });
  const arenaRef = useRef(null);

  // ১. ইঁদুরগুলো ডান থেকে বামে মুভ করার লজিক
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMice((prevMice) =>
        prevMice.map((mouse) => {
          let newX = mouse.x - mouse.speed;
          if (newX < -20) newX = 120; // স্ক্রিন পার হয়ে গেলে আবার ডানপাশ থেকে আসবে
          return { ...mouse, x: newX };
        })
      );
    }, 30);
    return () => clearInterval(interval);
  }, [gameOver]);

  // ২. ড্র্যাগ শুরু করা
  const handleTouchStart = (e) => {
    if (stonesLeft <= 0 || isThrown || gameOver) return;
    const touch = e.touches ? e.touches[0] : e;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  // ৩. পাথর ড্র্যাগ বা সোয়াইপ করে ছুড়ে মারা
  const handleTouchEnd = (e) => {
    if (!isDragging || isThrown) return;
    setIsDragging(false);

    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const deltaY = touchStartRef.current.y - touch.clientY;
    const deltaX = touch.clientX - touchStartRef.current.x;

    // যদি উপরের দিকে সুইপ করা হয় (Swipe Up)
    if (deltaY > 30) {
      setIsThrown(true);
      setStonesLeft((prev) => prev - 1);

      // পাথরের অ্যানিমেশন উপরে যাওয়ার জন্য
      const targetX = 50 + (deltaX / window.innerWidth) * 100;
      const targetY = 20; // ইঁদুরের লেভেলে পৌঁছাবে

      setStonePos({ x: targetX, y: targetY });

      // ৪. হিট ডিকটেকশন (Hit Detection)
      setTimeout(() => {
        checkHit(targetX, targetY);
        // পাথর রিসেট করা
        resetStone();
      }, 300);
    }
  };

  // হিট চেক করার লজিক
  const checkHit = (targetX, targetY) => {
    let hitDetected = false;

    setMice((prevMice) =>
      prevMice.map((mouse) => {
        // পাথর ও ইঁদুরের পজিশনের পার্থক্য চেক
        const diffX = Math.abs(mouse.x - targetX);
        const diffY = Math.abs(mouse.y - targetY);

        if (diffX < 12 && diffY < 12 && !hitDetected) {
          hitDetected = true;
          setHits((prev) => prev + 1);
          return { ...mouse, x: 120 }; // হিট হলে ইঁদুর আবার ডানে চলে যাবে
        }
        return mouse;
      })
    );
  };

  // পাথর আবার নিজ জায়গায় ফেরত আনা
  const resetStone = () => {
    setStonePos({ x: 50, y: 80 });
    setIsThrown(false);

    if (stonesLeft - 1 <= 0) {
      setGameOver(true);
      submitScore();
    }
  };

  // স্কোর সাবমিট
  const submitScore = () => {
    fetch('https://play-for-win.onrender.com/api/match/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user?.telegramId,
        hits: hits,
        finishedAt: new Date()
      })
    }).then(() => {
      if (refreshUserData) refreshUserData();
    });
  };

  return (
    <div 
      ref={arenaRef}
      className="w-full h-[75vh] relative overflow-hidden select-none touch-none"
      onTouchEnd={handleTouchEnd}
      onMouseUp={handleTouchEnd}
    >
      {/* 🔴 ১. উপরে ডানে - হিট করা ইঁদুরের কাউন্টার */}
      <div className="absolute top-2 right-4 bg-black/60 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 z-20">
        <span className="text-xs text-amber-400 font-bold">🎯 Hits:</span>
        <span className="text-lg font-black text-white">{hits}</span>
      </div>

      {/* 🔴 ২. উপরে - ৩টি ইঁদুর ডান থেকে বামে যাবে */}
      <div className="absolute top-10 left-0 w-full h-40 pointer-events-none z-10">
        {mice.map((mouse) => (
          <img
            key={mouse.id}
            src={mouseImg}
            alt="Mouse"
            className="absolute w-12 h-auto transition-transform duration-75"
            style={{
              left: `${mouse.x}%`,
              top: `${mouse.y}%`,
              transform: 'scaleX(-1)' // ডানে থেকে বামে মুখ করার জন্য
            }}
          />
        ))}
      </div>

      {/* 🔴 ৩. মাঝখানে/নিচে - ছোড়ার জন্য পাথর */}
      {!gameOver && (
        <div
          onTouchStart={handleTouchStart}
          onMouseDown={handleTouchStart}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30 transition-all ${
            isThrown ? 'duration-300 ease-out' : 'duration-75'
          }`}
          style={{
            left: `${stonePos.x}%`,
            top: `${stonePos.y}%`,
          }}
        >
          <img 
            src={stoneImg} 
            alt="Stone" 
            className="w-14 h-14 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] pointer-events-auto"
          />
        </div>
      )}

      {/* 🔴 ৪. নিচের বামে - অবশিষ্ট ৩০টি পাথরের কাউন্টার */}
      <div className="absolute bottom-4 left-4 bg-black/60 border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2 z-20">
        <img src={stoneImg} alt="Stone Icon" className="w-6 h-6" />
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold leading-none">STONES</span>
          <span className="text-base font-black text-amber-400 leading-none">{stonesLeft}</span>
        </div>
      </div>

      {/* গেম ওভার মেসেজ */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500 p-6 rounded-2xl text-center space-y-3">
            <h2 className="text-xl font-bold text-amber-400">MATCH FINISHED!</h2>
            <p className="text-sm text-slate-200">You hitted <span className="text-emerald-400 font-bold">{hits}</span> mice!</p>
            <p className="text-xs text-slate-400">Result is saved. Check Fighting page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Battle;

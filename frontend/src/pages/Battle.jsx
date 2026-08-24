import React, { useState, useEffect, useRef, useCallback } from 'react';
import mouseImg from '../assets/mouserun.png';
import stoneImg from '../assets/stone.png';
import bgImg from '../assets/battle.jpeg';

const Battle = ({ user, mode = 2, matchId, onNavigate, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  const startTimeRef = useRef(Date.now());

  // 🔴 নতুন FX States
  const [screenShake, setScreenShake] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showHitText, setShowHitText] = useState(null);

  const [mouse, setMouse] = useState({
    x: 180, // স্ক্রিনের ঠিক মাঝখান থেকে শুরু হবে (৩৬০ এর অর্ধেক)
    y: 28,
    speed: 6, // পিক্সেল স্পিড একটু বাড়িয়ে দেওয়া হলো
    direction: 1,
    isFalling: false
  });

  const mouseRef = useRef(mouse);
  mouseRef.current = mouse;

  const hitsRef = useRef(hits);
  hitsRef.current = hits;

  const [stonePos, setStonePos] = useState({ x: 50, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const [isThrown, setIsThrown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const arenaRef = useRef(null);

  // ইঁদুরের চলাচলের লজিক
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMouse((prev) => {
        if (prev.isFalling) return prev;

        let newX = prev.x + prev.speed * prev.direction;
        let newDir = prev.direction;

        if (newX >= 420) {
          newX = 420;
          newDir = -1;
        } else if (newX <= -60) {
          newX = -60;
          newDir = 1;
        }

        return { ...prev, x: newX, direction: newDir };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  // 🔴 পার্টিকল তৈরির হেল্পার ফাংশন
  const triggerImpactParticles = (xPercent, yPercent) => {
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: xPercent,
      y: yPercent,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      size: Math.random() * 6 + 4,
      color: Math.random() > 0.5 ? '#f59e0b' : '#d97706'
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 400);
  };

  // 🔴 স্ক্রিন শেক ফাংশন
  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  };

  useEffect(() => {
    if (gameOver) {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      submitMatchResult(hits, timeTaken);
    }
  }, [gameOver]);

  // ২. স্কোর সাবমিট করার নির্ভরযোগ্য ফাংশন
  const submitMatchResult = useCallback(async (finalHits, timeTaken) => {
    if (hasSubmittedRef.current) return; // ২বার সাবমিশন আটকাবে
    hasSubmittedRef.current = true;
    setSubmitting(true);

    try {
      const res = await fetch('https://play-for-win.onrender.com/api/match/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId,
          telegramId: user?.telegramId,
          mode: mode,
          hits: Number(finalHits) || 0,
          timeTaken: Number(timeTaken) || 0
        })
      });

      const data = await res.json();
      if (data.success && refreshUserData) {
        refreshUserData();
      }
    } catch (err) {
      console.error("Match submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  }, [matchId, user?.telegramId, mode, refreshUserData]);

  // ৩. Game Over হলে একবারই সঠিক Hits এবং Time ব্যাকএন্ডে যাবে
  useEffect(() => {
    if (gameOver && !hasSubmittedRef.current) {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      submitMatchResult(hits, timeTaken);
    }
  }, [gameOver, hits, submitMatchResult]);

  // 🔴 নতুন যোগ করা হয়েছে: মাঝপথে Exit করার ফাংশন
  const handleExitGame = async () => {
    if (!hasSubmittedRef.current) {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      await submitMatchResult(hitsRef.current, timeTaken);
    }
    if (onNavigate) onNavigate('fighting');
  };

  // 🟢 নতুন যোগ করা হয়েছে: অ্যাপ হঠাৎ ব্যাকগ্রাউন্ডে কেটে দিলে অটো সেভ করার লজিক
  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current && matchId && user?.telegramId) {
        hasSubmittedRef.current = true;
        const timeTaken = (Date.now() - startTimeRef.current) / 1000;
        const payload = JSON.stringify({
          matchId: matchId,
          telegramId: user?.telegramId,
          mode: mode,
          hits: Number(hitsRef.current) || 0,
          timeTaken: Number(timeTaken) || 0
        });

        // sendBeacon ব্যাকগ্রাউন্ডে ব্রাউজার বন্ধ হলেও ডাটা পাঠাতে সক্ষম
        navigator.sendBeacon(
          'https://play-for-win.onrender.com/api/match/submit-score',
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
  }, [matchId, user?.telegramId, mode]);

  const handleTouchStart = (e) => {
    if (isThrown || stonesLeft <= 0 || gameOver) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isThrown) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (arenaRef.current) {
      const rect = arenaRef.current.getBoundingClientRect();
      const xPercent = ((clientX - rect.left) / rect.width) * 100;
      const yPercent = ((clientY - rect.top) / rect.height) * 100;

      setStonePos({
        x: Math.max(15, Math.min(85, xPercent)),
        y: Math.max(60, Math.min(88, yPercent))
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || isThrown) return;
    setIsDragging(false);

    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffY = dragStart.y - clientY;

    if (diffY > 30) {
      throwStone();
    } else {
      setStonePos({ x: 50, y: 85 });
    }
  };

  // ১. পাথর ছোড়ার ফাংশন (ডাইরেক্ট বরবার মারলে হিট হবে না, ফিজিক্স মেনে সামনে মারতে হবে)
  const throwStone = () => {
    if (isThrown || gameOver) return;
    setIsThrown(true);
    
    const currentStoneX = stonePos.x; 
    setStonePos({ x: currentStoneX, y: 28 });

    setTimeout(() => {
      const thrownPixelX = (currentStoneX / 100) * 360;
      const currentMouseX = mouseRef.current.x;
      const mouseDir = mouseRef.current.direction; // ইঁদুর কোন দিকে যাচ্ছে (1 বা -1)
      const distance = Math.abs(currentMouseX - thrownPixelX);

      // ফিজিক্স রুল শর্ত:
      // ১. দূরত্ব ১০ পিক্সেলের বেশি হতে হবে (অর্থাৎ একদম ইঁদুরের গায়ের ওপর বা বরাবর মারা যাবে না)
      // ২. তবে দূরত্ব ৩৫ পিক্সেলের মধ্যে থাকতে হবে (সামনে বা লিডিং পজিশনে মারলে)
      // ৩. ইঁদুর যে দিকে যাচ্ছে, পাথরটি যেন তার সামনের দিকে পড়ে (Leading Target check)
      const isAheadOfMouse = (mouseDir === 1 && thrownPixelX > currentMouseX) || (mouseDir === -1 && thrownPixelX < currentMouseX);

      if (distance >= 10 && distance <= 38 && isAheadOfMouse && !mouseRef.current.isFalling) {
        setHits((h) => h + 1);
        setMouse((prev) => ({ ...prev, isFalling: true }));

        // 🔴 এই ৩টি লাইন যোগ করুন:
        triggerScreenShake();
        triggerImpactParticles(currentStoneX, 28);
        setShowHitText({ x: currentStoneX, y: 24 });
        setTimeout(() => setShowHitText(null), 600);
        setTimeout(() => {
          setMouse({
            x: Math.random() > 0.5 ? 20 : 340,
            y: 28,
            speed: 6,
            direction: Math.random() > 0.5 ? 1 : -1,
            isFalling: false
          });
        }, 1000);
      } else {
        // 🔴 মিস করলে পার্টিকল দেখানোর জন্য এই else অংশ যোগ করুন:
        triggerImpactParticles(currentStoneX, 28);
      }
    }, 250);

    // পাথর রিসেট ও গেমের বাকি লজিক
    setTimeout(() => {
      setIsThrown(false);
      setStonePos({ x: 22, y: 78 });

      setTimeout(() => {
        if (!gameOver) {
          setStonePos({ x: 50, y: 85 });
        }
      }, 50);
    }, 400);

    setStonesLeft((prev) => {
      const remaining = prev - 1;
      if (remaining <= 0) setGameOver(true);
      return remaining;
    });
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* গেম কন্টেইনার: ৩৬০x৬৪০ পিক্সেলের ফিক্সড ফ্রেমে লক করা হয়েছে */}
      <div
        ref={arenaRef}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative overflow-hidden select-none touch-none shadow-2xl shrink-0 transition-transform ${
          screenShake ? 'translate-x-1 translate-y-1 scale-105' : ''
        }`}
        style={{
          width: '360px',
          height: '640px',
          // স্ক্রিন ছোট বা বড় হলে পুরো গেম অটো স্কেল হবে, কিন্তু পজিশন নড়বে না
          transform: `scale(${Math.min(window.innerWidth / 360, window.innerHeight / 640)}) ${screenShake ? 'rotate(1deg)' : ''}`,
          transformOrigin: 'center center',
          backgroundImage: `url(${bgImg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* ১. Exit Button (আপডেট করা হয়েছে) */}
        <div className="absolute top-[16px] left-[16px] z-20">
          <button
            onClick={handleExitGame}
            className="bg-red-600/90 text-white px-3 py-1 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer shadow-lg border border-red-500/30"
          >
            Exit
          </button>
        </div>

        {/* ২. TARGETS HIT (0) - ফিক্সড পিক্সেল পজিশন */}
        <div
          className="absolute z-20 pointer-events-none flex items-center justify-center"
          style={{ top: '45.5px', right: '37px', width: '40px', height: '24px' }}
        >
          <span className="text-lg font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {hits}
          </span>
        </div>

        {/* 🔴 ৩. HIT Popup Effect */}
        {showHitText && (
          <div
            className="absolute z-40 font-black text-xl text-yellow-400 animate-bounce pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
            style={{ left: `${showHitText.x}%`, top: `${showHitText.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            💥 HIT!
          </div>
        )}

        {/* 🔴 ৪. Impact Dust/Spark Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-30 transition-all duration-300 opacity-80"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              transform: `translate(${p.vx}px, ${p.vy}px)`
            }}
          />
        ))}

        {/* ৩. Mouse (সঠিক দিক এবং আকৃতির জন্য) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute"
            style={{
              left: `${mouse.x}px`,
              top: mouse.isFalling ? `${mouse.y + 25}%` : `${mouse.y}%`,
              opacity: mouse.isFalling ? 0 : 1,
              // এখানে direction 1 হলে একমুখী এবং -1 হলে সঠিক উল্টোমুখী হবে, সাইজ সবসময় সমান থাকবে
              transform: `translate(-50%, -50%) scaleX(${mouse.direction === 1 ? -1 : 1}) ${mouse.isFalling ? 'rotate(90deg) scale(0.7)' : ''}`
              transformOrigin: 'center center'
            }}
          >
            <img src={mouseImg} alt="Mouse" className="w-14 h-16 object-contain drop-shadow-md" />
          </div>
        </div>
        
        {/* ৪. STONES (30) - ফিক্সড পিক্সেল পজিশন */}
        <div
          className="absolute z-20 pointer-events-none flex items-center justify-center"
          style={{ bottom: '72px', left: '39px', width: '40px', height: '24px' }}
        >
          <span className="text-sm font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {stonesLeft}
          </span>
        </div>

        {/* 🔴 ৭. Slingshot Stone Animation (Curve arc dynamic scale) */}
        {!gameOver && stonesLeft > 0 && (
          <div
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            className={`absolute z-30 cursor-grab active:cursor-grabbing ${
              isThrown ? 'transition-all duration-300 ease-out' : 'transition-none'
            }`}
            style={{
              left: `${stonePos.x}%`,
              top: `${stonePos.y}%`,
              transform: `translate(-50%, -50%) scale(${isThrown ? 0.3 : 1.1}) rotate(${isThrown ? '360deg' : '0deg'})`,
              opacity: isThrown ? 0.8 : 1
            }}
          >
            {stoneImg ? (
              <img src={stoneImg} alt="Stone" className="w-14 h-14 object-contain drop-shadow-2xl" />
            ) : (
              <div className="w-12 h-12 bg-gray-400 rounded-full border-2 border-gray-200 shadow-xl flex items-center justify-center font-bold text-[10px]">
                STONE
              </div>
            )}
          </div>
        )}

        {/* ৬. Game Over Modal - Arena Screen Centered */}
        {gameOver && (
          <div 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
            className="absolute inset-0 flex items-center justify-center z-50 p-4"
          >
            <div
              style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '2px solid #cbd5e1', 
                borderRadius: '20px',
                width: '100%',
                maxWidth: '260px',
                padding: '24px 16px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)'
              }}
              className="space-y-4"
            >
              <h3 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px' }}>
                Game Over!
              </h3>
              
              <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: '600' }}>
                Total Hits: <span style={{ color: '#ffffff', fontWeight: '900' }}>{hits}</span>
              </p>

              {submitting ? (
                <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600' }} className="animate-pulse">
                  Saving Score...
                </p>
              ) : (
                <button
                  onClick={() => {
                    if (refreshUserData) refreshUserData();
                    if (onNavigate) onNavigate('fighting');
                  }}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    border: '1.5px solid #ffffff',
                    cursor: 'pointer',
                  }}
                  className="active:scale-95 transition hover:bg-white/10"
                >
                  Back to Arena
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Battle;

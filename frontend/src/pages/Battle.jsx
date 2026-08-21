import React, { useState, useEffect, useRef } from 'react';
import mouseImg from '../assets/mouserun.png';
import stoneImg from '../assets/stone.png';
import bgImg from '../assets/battle.jpeg';

const Battle = ({ user, mode = 2, matchId, onNavigate, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef(Date.now());

  const [mouse, setMouse] = useState({
    x: 50,
    y: 28,
    speed: 1.6,
    direction: 1
  });

  const [stonePos, setStonePos] = useState({ x: 50, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const [isThrown, setIsThrown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const arenaRef = useRef(null);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMouse((prev) => {
        let newX = prev.x + prev.speed * prev.direction;
        let newDir = prev.direction;

        if (newX >= 88) {
          newX = 88;
          newDir = -1;
        } else if (newX <= 12) {
          newX = 12;
          newDir = 1;
        }

        return { ...prev, x: newX, direction: newDir };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) {
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      submitMatchResult(hits, timeTaken);
    }
  }, [gameOver]);

  const submitMatchResult = async (finalHits, timeTaken) => {
    setSubmitting(true);
    try {
      const res = await fetch('https://play-for-win.onrender.com/api/match/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId,
          telegramId: user?.telegramId,
          mode: mode,
          hits: finalHits,
          timeTaken: timeTaken
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
  };

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

  const throwStone = () => {
    setIsThrown(true);
    const targetY = 28;
    const targetX = stonePos.x;

    setStonePos({ x: targetX, y: targetY });

    setTimeout(() => {
      checkHit(targetX);
    }, 250);

    setTimeout(() => {
      setStonesLeft((prev) => {
        const remaining = prev - 1;
        if (remaining <= 0) setGameOver(true);
        return remaining;
      });

      setStonePos({ x: 50, y: 85 });
      setIsThrown(false);
    }, 450);
  };

  const checkHit = (thrownX) => {
    const distance = Math.abs(mouse.x - thrownX);
    if (distance < 12) {
      setHits((h) => h + 1);
      setMouse((prev) => ({
        ...prev,
        x: prev.direction === 1 ? 20 : 80
      }));
    }
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
        className="relative overflow-hidden select-none touch-none shadow-2xl shrink-0"
        style={{
          width: '360px',
          height: '640px',
          // স্ক্রিন ছোট বা বড় হলে পুরো গেম অটো স্কেল হবে, কিন্তু পজিশন নড়বে না
          transform: `scale(${Math.min(window.innerWidth / 360, window.innerHeight / 640)})`,
          transformOrigin: 'center center',
          backgroundImage: `url(${bgImg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* ১. Exit Button */}
        <div className="absolute top-[16px] left-[16px] z-20">
          <button
            onClick={() => onNavigate && onNavigate('fighting')}
            className="bg-red-600/90 text-white px-3 py-1 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer shadow-lg border border-red-500/30"
          >
            Exit
          </button>
        </div>

        {/* ২. TARGETS HIT (0) - ফিক্সড পিক্সেল পজিশন */}
        <div
          className="absolute z-20 pointer-events-none flex items-center justify-center"
          style={{ top: '45px', right: '37px', width: '40px', height: '24px' }}
        >
          <span className="text-lg font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {hits}
          </span>
        </div>

        {/* ৩. Mouse (ইঁদুর) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute transition-all duration-75 ease-linear"
            style={{
              left: `${mouse.x}%`,
              top: `${mouse.y}%`,
              transform: `translate(-50%, -50%) scaleX(${mouse.direction === 1 ? -1 : 1})`
            }}
          >
            {mouseImg ? (
              <img src={mouseImg} alt="Mouse" className="w-14 h-16 object-contain drop-shadow-md" />
            ) : (
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
                MOUSE
              </div>
            )}
          </div>
        </div>

        {/* ৪. STONES (30) - ফিক্সড পিক্সেল পজিশন */}
        <div
          className="absolute z-20 pointer-events-none flex items-center justify-center"
          style={{ bottom: '72px', left: '37px', width: '40px', height: '24px' }}
        >
          <span className="text-sm font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {stonesLeft}
          </span>
        </div>

        {/* ৫. Slingshot Stone */}
        {!gameOver && stonesLeft > 0 && (
          <div
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            className={`absolute z-30 cursor-grab active:cursor-grabbing transition-all ${
              isThrown ? 'duration-500 ease-out' : 'duration-75'
            }`}
            style={{
              left: `${stonePos.x}%`,
              top: `${stonePos.y}%`,
              transform: `translate(-50%, -50%) scale(${isThrown ? 0.35 : 1.1})`,
              opacity: isThrown ? 0.7 : 1
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

        {/* ৬. Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              style={{ backgroundColor: '#0f172a', border: '2px solid #334155' }}
              className="p-6 rounded-2xl w-full max-w-xs text-center space-y-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-amber-400">Game Over!</h3>
              <p className="text-sm text-slate-300">
                Total Hits: <span className="text-emerald-400 font-bold">{hits}</span>
              </p>
              {submitting ? (
                <p className="text-xs text-amber-400 animate-pulse font-medium">Saving Score...</p>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate('fighting')}
                  className="w-full bg-amber-500 hover:bg-amber-400 font-bold py-2.5 rounded-xl text-black active:scale-95 transition cursor-pointer"
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

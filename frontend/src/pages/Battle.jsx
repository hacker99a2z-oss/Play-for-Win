import React, { useState, useEffect, useRef } from 'react';
import mouseImg from '../assets/mouserun.png';
import stoneImg from '../assets/stone.png';
import bgImg from '../assets/battle.jpeg';

const Battle = ({ user, mode = 2, onNavigate, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ১টি মাত্র ইঁদুর যা ব্রিজের ওপর ডানে-বামে মুভ করবে (y: 28% ব্রিজের সমান্তরালে)
  const [mouse, setMouse] = useState({
    x: 50,
    y: 28,
    speed: 1.6,
    direction: 1
  });

  // পাথর নিক্ষেপের স্টেট
  const [stonePos, setStonePos] = useState({ x: 50, y: 90 });
  const [isDragging, setIsDragging] = useState(false);
  const [isThrown, setIsThrown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const arenaRef = useRef(null);

  // ইঁদুরের এক লাইনে ডানে-বামে মুভ করার লজিক
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMouse((prev) => {
        let newX = prev.x + prev.speed * prev.direction;
        let newDir = prev.direction;

        if (newX >= 90) {
          newX = 90;
          newDir = -1;
        } else if (newX <= 10) {
          newX = 10;
          newDir = 1;
        }

        return { ...prev, x: newX, direction: newDir };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  // ড্র্যাগ হ্যান্ডলার
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
      setStonePos({ x: 50, y: 82 });
    }
  };

  // পাথর ছোঁড়া এবং হিট চেক
  const throwStone = () => {
    setIsThrown(true);
    const targetY = 28; // ইঁদুরের লাইনে (y: 28%) পাথর পৌঁছাবে
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

      setStonePos({ x: 50, y: 90 });
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
    <div
      ref={arenaRef}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-screen bg-slate-900 text-white relative overflow-hidden flex flex-col justify-between select-none touch-none"
      style={
        bgImg
          ? {
              backgroundImage: `url(${bgImg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }
          : {}
      }
    >
      {/* টপ বার (Exit এবং শুধু Hits কাউন্ট) */}
      <div className="flex justify-between items-start p-4 z-20">
        <button
          onClick={() => onNavigate && onNavigate('fighting')}
          className="bg-red-600/80 text-white px-3 py-1 rounded-lg text-xs font-bold active:scale-95 transition cursor-pointer"
        >
          Exit
        </button>

        {/* ডানদিকের বোর্ডে শুধুমাত্র Hits সংখ্যা দেখাবে */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{ top: '39px', right: '54px' }}
        >
          <p className="text-xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {hits}
          </p>
        </div>
      </div>

      {/* ১টি মাত্র ইঁদুর যা ব্রিজের ওপর দিয়ে চলাফেরা করবে */}
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
            <img src={mouseImg} alt="Mouse" className="w-16 h-20 object-contain drop-shadow-md" />
          ) : (
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
              MOUSE
            </div>
          )}
        </div>
      </div>

      {/* বাম পাশের পাথরের বাক্সে সংকেত/কাউন্ট */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ bottom: '67px', left: '45px' }}
      >
        <div className="relative flex items-center justify-center">
          <span className="bg-black/80 border border-amber-500/60 text-amber-400 font-black text-xs px-2.5 py-0.5 rounded-full shadow-lg">
            {stonesLeft}
          </span>
        </div>
      </div>

      {/* ছোড়ার জন্য মেইন পাথর */}
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
            <img src={stoneImg} alt="Stone" className="w-16 h-16 object-contain drop-shadow-2xl" />
          ) : (
            <div className="w-12 h-12 bg-gray-400 rounded-full border-2 border-gray-200 shadow-xl flex items-center justify-center font-bold text-[10px]">
              STONE
            </div>
          )}
        </div>
      )}

      {/* গেম ওভার পপআপ */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl w-full max-w-xs text-center space-y-4">
            <h3 className="text-xl font-bold text-amber-400">Game Over!</h3>
            <p className="text-sm text-slate-300">
              Total Hits: <span className="text-emerald-400 font-bold">{hits}</span>
            </p>
            <button
              onClick={() => onNavigate && onNavigate('fighting')}
              className="w-full bg-amber-500 font-bold py-2 rounded-xl text-black active:scale-95 transition"
            >
              Back to Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Battle;

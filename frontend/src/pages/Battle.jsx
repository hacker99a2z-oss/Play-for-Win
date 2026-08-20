import React, { useState, useEffect, useRef } from 'react';
import mouseImg from '../assets/mouse-alpha.png';
import stoneImg from '../assets/stone.png';
import bgImg from '../assets/battle.jpeg';

const Battle = ({ user, mode = 2, onNavigate, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ইঁদুরের পজিশন ও ডিরেকশন (বাম-ডান মুভমেন্ট)
  const [mice, setMice] = useState([
    { id: 1, x: 10, y: 20, speed: 0.8, direction: 1 },
    { id: 2, x: 50, y: 32, speed: 1.2, direction: -1 },
    { id: 3, x: 80, y: 45, speed: 1.0, direction: 1 },
  ]);

  // পাথর নিক্ষেপের স্টেট
  const [stonePos, setStonePos] = useState({ x: 50, y: 85 }); // পির্সেন্টেজ অনুযায়ী পজিশন
  const [isDragging, setIsDragging] = useState(false);
  const [isThrown, setIsThrown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const arenaRef = useRef(null);

  // ১. ইঁদুর বামে ও ডানে মুভ করার লজিক
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMice((prevMice) =>
        prevMice.map((mouse) => {
          let newX = mouse.x + mouse.speed * mouse.direction;
          let newDir = mouse.direction;

          // স্ক্রিনের কিনারে গেলে ডিরেকশন রিভার্স করবে
          if (newX >= 88) {
            newX = 88;
            newDir = -1;
          } else if (newX <= 5) {
            newX = 5;
            newDir = 1;
          }

          return { ...mouse, x: newX, direction: newDir };
        })
      );
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  // ২. ড্র্যাগ ও থ্রো (Touch & Mouse Handlers)
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

      // নির্দিষ্ট সীমার মধ্যে পাথর ড্র্যাগ করা যাবে
      setStonePos({
        x: Math.max(10, Math.min(90, xPercent)),
        y: Math.max(65, Math.min(90, yPercent))
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || isThrown) return;
    setIsDragging(false);

    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffY = dragStart.y - clientY;

    // যদি উপরের দিকে অন্তত ৩০ পিক্সেল সোয়াইপ করা হয় তবে পাথর ছোঁড়া হবে
    if (diffY > 30) {
      throwStone();
    } else {
      // সোয়াইপ না হলে পাথর আবার আগের পজিশনে ফিরে আসবে
      setStonePos({ x: 50, y: 85 });
    }
  };

  // ৩. পাথর ছোঁড়া এবং হিট চেক করার লজিক
  const throwStone = () => {
    setIsThrown(true);

    // পাথরের টার্গেট পয়েন্ট (যেদিকে মুখ করে ড্র্যাগ করা হয়েছিল)
    const targetY = 15; // স্ক্রিনের একদম উপরের দিকে উড়ে যাবে
    const targetX = stonePos.x;

    setStonePos({ x: targetX, y: targetY });

    // পাথরটি ইঁদুরের লেভেলে পৌঁছালে হিট চেক করা হবে
    setTimeout(() => {
      checkHit(targetX);
    }, 250);

    // পাথর ছোঁড়ার পর রিসেট করা
    setTimeout(() => {
      setStonesLeft((prev) => {
        const remaining = prev - 1;
        if (remaining <= 0) {
          setGameOver(true);
        }
        return remaining;
      });

      // পাথরকে আবার শুরুতে ফেরত নিয়ে আসা
      setStonePos({ x: 50, y: 85 });
      setIsThrown(false);
    }, 450);
  };

  // ৪. হিট বা কলিশন চেক লজিক
  const checkHit = (thrownX) => {
    let hitDetected = false;

    setMice((prevMice) =>
      prevMice.map((m) => {
        // পাথর এবং ইঁদুরের X-Axis এর পার্থক্য কম হলে হিট গণ্য হবে
        const distance = Math.abs(m.x - thrownX);
        if (!hitDetected && distance < 12) {
          hitDetected = true;
          setHits((h) => h + 1);

          // হিট হওয়া ইঁদুরকে অন্য প্রান্তে রিসেট করা
          return {
            ...m,
            x: m.direction === 1 ? 5 : 88
          };
        }
        return m;
      })
    );
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
      {/* টপ বার (স্কোর ও এক্সিট) */}
      <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-md z-20">
        <button
          onClick={() => onNavigate && onNavigate('fighting')}
          className="bg-red-600/80 text-white px-3 py-1 rounded-lg text-xs font-bold active:scale-95 transition cursor-pointer"
        >
          Exit
        </button>
        <div className="text-right">
          <p className="text-xs text-amber-400 font-bold">Mode: {mode}P</p>
          <p className="text-sm font-black text-emerald-400">Hits: {hits}</p>
        </div>
      </div>

      {/* গেম প্লে এরিয়া (ইঁদুরসমূহ) */}
      <div className="relative w-full h-80 my-auto pointer-events-none">
        {mice.map((m) => (
          <div
            key={m.id}
            className="absolute transition-all duration-75 ease-linear"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              transform: `translate(-50%, -50%) scaleX(${m.direction === 1 ? -1 : 1})`
            }}
          >
            {mouseImg ? (
              <img src={mouseImg} alt="Mouse" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
                MICE
              </div>
            )}
          </div>
        ))}
      </div>

      {/* পাথর (যা আঙুল দিয়ে টেনে ছোড়া যাবে) */}
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
            transform: `translate(-50%, -50%) scale(${isThrown ? 0.4 : 1.1})`,
            opacity: isThrown ? 0.7 : 1
          }}
        >
          {stoneImg ? (
            <img src={stoneImg} alt="Stone" className="w-14 h-14 object-contain drop-shadow-lg" />
          ) : (
            <div className="w-10 h-10 bg-gray-500 rounded-full border-2 border-gray-300 shadow-xl flex items-center justify-center font-bold text-[10px]">
              STONE
            </div>
          )}
        </div>
      )}

      {/* বটম বার (অবশিষ্ট পাথর) */}
      <div className="p-4 bg-black/40 backdrop-blur-md text-center z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {stoneImg && <img src={stoneImg} alt="Stone" className="w-6 h-6 object-contain" />}
          <span className="text-sm font-bold text-slate-200">
            Stones Left: {stonesLeft}
          </span>
        </div>
      </div>

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

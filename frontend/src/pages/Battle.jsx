import React, { useState, useEffect, useRef } from 'react';
// ইমেজ ইম্পোর্ট (পাথ আপনার assets ফোল্ডার অনুযায়ী না মিললে এগুলো রিমুভ করে সাধারণ টেক্সট দেখাবে, অ্যাপ ক্র্যাশ করবে না)
import mouseImg from '../assets/mouse-alpha.png';
import stoneImg from '../assets/stone.png';
import bgImg from '../assets/battle.jpeg';

const Battle = ({ user, mode = 2, onNavigate, refreshUserData }) => {
  const [stonesLeft, setStonesLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ইঁদুরের প্রাথমিক পজিশন
  const [mice, setMice] = useState([
    { id: 1, x: 100, y: 15, speed: 1.2, hit: false },
    { id: 2, x: 130, y: 25, speed: 1.6, hit: false },
    { id: 3, x: 160, y: 35, speed: 1.4, hit: false },
  ]);

  const arenaRef = useRef(null);

  // ইঁদুর মুভমেন্ট লজিক
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setMice((prevMice) =>
        prevMice.map((mouse) => {
          let newX = mouse.x - mouse.speed;
          if (newX < -20) newX = 120;
          return { ...mouse, x: newX };
        })
      );
    }, 30);
    return () => clearInterval(interval);
  }, [gameOver]);

  // ইঁদুর হিট করার লজিক
  const handleHitMouse = (id) => {
    if (stonesLeft <= 0 || gameOver) return;
    
    setStonesLeft((prev) => {
      const nextStones = prev - 1;
      if (nextStones <= 0) {
        setGameOver(true);
      }
      return nextStones;
    });

    setHits((prev) => prev + 1);

    // রিসেট ইঁদুর
    setMice((prevMice) =>
      prevMice.map((m) => (m.id === id ? { ...m, x: 120 } : m))
    );
  };

  return (
    <div 
      ref={arenaRef}
      className="w-full h-screen bg-slate-900 text-white relative overflow-hidden flex flex-col justify-between"
      style={bgImg ? {
        backgroundImage: `url(${bgImg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {/* টপ বার (স্কোর ও এক্সিট) */}
      <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-md z-20">
        <button 
          onClick={() => onNavigate && onNavigate('fighting')}
          className="bg-red-600/80 text-white px-3 py-1 rounded-lg text-xs font-bold active:scale-95 transition"
        >
          Exit
        </button>
        <div className="text-right">
          <p className="text-xs text-amber-400 font-bold">Mode: {mode}P</p>
          <p className="text-sm font-black text-emerald-400">Hits: {hits}</p>
        </div>
      </div>

      {/* গেম প্লে এরিয়া (ইঁদুর) */}
      <div className="relative w-full h-64 my-auto overflow-hidden">
        {mice.map((m) => (
          <div
            key={m.id}
            onClick={() => handleHitMouse(m.id)}
            className="absolute cursor-pointer select-none transition-transform active:scale-90"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {mouseImg ? (
              <img src={mouseImg} alt="Mouse" className="w-16 h-16 object-contain pointer-events-auto" />
            ) : (
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
                MICE
              </div>
            )}
          </div>
        ))}
      </div>

      {/* বটম বার (পাথর ও গেম স্ট্যাটাস) */}
      <div className="p-4 bg-black/40 backdrop-blur-md text-center z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {stoneImg && <img src={stoneImg} alt="Stone" className="w-6 h-6 object-contain" />}
          <span className="text-sm font-bold text-slate-200">Stones Left: {stonesLeft}</span>
        </div>
      </div>

      {/* গেম ওভার পপআপ */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl w-full max-w-xs text-center space-y-4">
            <h3 className="text-xl font-bold text-amber-400">Game Over!</h3>
            <p className="text-sm text-slate-300">Total Hits: <span className="text-emerald-400 font-bold">{hits}</span></p>
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

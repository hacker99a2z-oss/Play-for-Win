import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://play-for-win.onrender.com';

const Home = ({ user, onPlayAd, refreshUserData }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasFreePlay, setHasFreePlay] = useState(true);

  const targetIdCounter = useRef(0);

  // ডেইলি ফ্রি খেলার হিসাব লোকাল স্টোরেজে রাখা
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastFreePlayDate = localStorage.getItem('last_free_play_date');
    if (lastFreePlayDate === today) {
      setHasFreePlay(false);
    } else {
      setHasFreePlay(true);
    }
  }, []);

  // ১.৫ সেকেন্ড পরপর নতুন টার্গেট স্পন (Spawn) করা
  useEffect(() => {
    let spawnInterval;
    if (gameState === 'playing') {
      spawnInterval = setInterval(() => {
        setTargets((prev) => {
          if (prev.length >= 5) return prev; // স্ক্রিনে সর্বোচ্চ ৫টি অবজেক্ট থাকবে
          
          targetIdCounter.current += 1;
          const newTarget = {
            id: targetIdCounter.current,
            top: Math.floor(Math.random() * 65) + 15 + '%',
            left: Math.floor(Math.random() * 70) + 10 + '%',
            hitsLeft: 3 // অবজেক্ট ধ্বংস করতে ৩ বার ট্যাপ লাগবে
          };

          // ১.৫ সেকেন্ড পর অবজেক্ট নিজে থেকেই গায়েব হয়ে যাবে
          setTimeout(() => {
            setTargets((curr) => curr.filter((t) => t.id !== newTarget.id));
          }, 1500);

          return [...prev, newTarget];
        });
      }, 700); // প্রতি ০.৭ সেকেন্ডে ১টি করে অবজেক্ট স্ক্রিনে আসতে থাকবে
    }

    return () => clearInterval(spawnInterval);
  }, [gameState]);

  // ৩০ সেকেন্ড গেম টাইমার
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('ended');
      setTargets([]);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // গেম শুরু করার লজিক
  const handleStartGame = async () => {
    if (hasFreePlay) {
      // আজকের ১ম বার: সরাসরি ফ্রি খেলা যাবে
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('last_free_play_date', today);
      setHasFreePlay(false);
      startGame();
    } else {
      // পরবর্তীতে যতবার ইচ্ছে অ্যাড দেখে খেলা যাবে
      const adWatched = await onPlayAd();
      if (adWatched) {
        startGame();
      }
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setGameState('playing');
  };

  // অবজেক্টে ট্যাপ/শুটিং লজিক (৩ বার হিট চেক)
  const handleHitTarget = (id) => {
    setTargets((prevTargets) => {
      return prevTargets.map((target) => {
        if (target.id === id) {
          const updatedHits = target.hitsLeft - 1;
          if (updatedHits <= 0) {
            // ৩ হিট পূরণ হলে ১০ কয়েন যোগ হবে এবং অবজেক্ট মুছে যাবে
            setScore((s) => s + 10);
            return null;
          }
          return { ...target, hitsLeft: updatedHits };
        }
        return target;
      }).filter(Boolean);
    });
  };

  // পয়েন্ট ক্লেইম বা ডাবল করার লজিক
  const claimReward = async (isDouble = false) => {
    if (score === 0) {
      setGameState('idle');
      return;
    }
    setIsClaiming(true);

    const sendScoreToBackend = async (finalScore) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/game/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: user?.telegramId,
            coins: finalScore
          }),
        });

        if (response.ok) {
          alert(`🎉 Successfully claimed ${finalScore} Coins!`);
          refreshUserData();
          setGameState('idle');
          setScore(0);
        } else {
          alert("Error claiming coins. Please try again.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsClaiming(false);
      }
    };

    if (isDouble) {
      const adWatched = await onPlayAd();
      if (adWatched) {
        await sendScoreToBackend(score * 2);
      } else {
        setIsClaiming(false);
      }
    } else {
      await sendScoreToBackend(score);
    }
  };

  return (
    <div className="p-4 text-center min-h-[80vh] flex flex-col justify-between select-none">
      
      {/* ১. IDLE STATE (স্টার্ট হোম স্ক্রিন) */}
      {gameState === 'idle' && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30 mb-4 animate-bounce">
            <span className="text-5xl">🎯</span>
          </div>

          <h2 className="text-2xl font-bold text-amber-400 mb-2">Target Shooter Game</h2>
          <p className="text-gray-400 text-sm mb-1">Destroy objects before they vanish in 1.5s!</p>
          <p className="text-xs text-amber-300 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/20 mb-6">
            ✨ Hit 3 Times = Destroy & Get +10 Coins
          </p>

          <button
            onClick={handleStartGame}
            className="w-full max-w-xs py-4 px-6 rounded-2xl font-black text-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-950 shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
          >
            {hasFreePlay ? '🎁 PLAY (1 Daily Free Game)' : '🎬 WATCH AD TO PLAY'}
          </button>
        </div>
      )}

      {/* ২. PLAYING STATE (শুটিং ম্যাচ ক্যানভাস) */}
      {gameState === 'playing' && (
        <div className="w-full">
          <div className="flex justify-between items-center bg-gray-900/80 px-4 py-3 rounded-xl border border-gray-800 mb-4 font-bold text-lg">
            <span className="text-amber-400">⏱️ {timeLeft}s</span>
            <span className="text-emerald-400">🪙 {score}</span>
          </div>

          <div className="h-[380px] w-full bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-2xl relative overflow-hidden">
            {targets.map((target) => (
              <button
                key={target.id}
                onClick={() => handleHitTarget(target.id)}
                style={{
                  top: target.top,
                  left: target.left,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 border-2 border-white shadow-xl active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-white"
              >
                <span className="text-xl">👾</span>
                <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded-full mt-0.5">
                  {target.hitsLeft} HP
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ৩. GAME OVER SCREEN (স্কোর ক্লেইম স্ক্রিন) */}
      {gameState === 'ended' && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mt-6">
          <h3 className="text-xl font-bold text-white mb-2">🎉 Match Finished!</h3>
          <p className="text-gray-400 text-sm mb-1">Total Coins Earned:</p>
          <p className="text-3xl font-black text-amber-400 mb-6">{score} Coins</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => claimReward(false)}
              disabled={isClaiming}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700"
            >
              Claim {score} Coins
            </button>

            <button
              onClick={() => claimReward(true)}
              disabled={isClaiming}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950"
            >
              🎬 Watch Ad to Double (2x) → {score * 2} Coins
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://play-for-win.onrender.com';

const Home = ({ user, onPlayAd, refreshUserData }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasFreePlay, setHasFreePlay] = useState(true);

  // ১. ডেইলি ফ্রি খেলার হিসাব
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastFreePlayDate = localStorage.getItem('last_free_play_date');
    if (lastFreePlayDate === today) {
      setHasFreePlay(false);
    } else {
      setHasFreePlay(true);
    }
  }, []);

  // ২. অবজেক্ট তৈরি এবং স্পনিং লজিক (নিশ্চিতভাবে ৩-৪টি অবজেক্ট স্ক্রিনে রাখবে)
  useEffect(() => {
    let spawnTimer;

    if (gameState === 'playing') {
      // শুরুতে অবিলম্বে ৪টি অবজেক্ট জেনারেট করা
      generateTargets();

      // প্রতি ১.২ সেকেন্ড পরপর অবজেক্টের পজিশন ও তালিকা রিফ্রেশ হবে
      spawnTimer = setInterval(() => {
        generateTargets();
      }, 1200);
    } else {
      setTargets([]);
    }

    return () => clearInterval(spawnTimer);
  }, [gameState]);

  // র‍্যান্ডম পজিশনে অবজেক্ট তৈরির সিম্পল ফাংশন
  const generateTargets = () => {
    const count = Math.floor(Math.random() * 2) + 3; // এক সাথে ৩ থেকে ৪ টি অবজেক্ট তৈরি হবে
    const newTargets = [];

    for (let i = 0; i < count; i++) {
      newTargets.push({
        id: Math.random(),
        top: Math.floor(Math.random() * 200) + 20, // ২০px থেকে ২২০px এর মধ্যে
        left: Math.floor(Math.random() * 200) + 20, // ২০px থেকে ২২০px এর মধ্যে
        hitsLeft: 3
      });
    }
    setTargets(newTargets);
  };

  // ৩. ৩০ সেকেন্ড টাইমার
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('ended');
      setTargets([]);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // ৪. গেম স্টার্ট লজিক
  const handleStartGame = async () => {
    if (hasFreePlay) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('last_free_play_date', today);
      setHasFreePlay(false);
      startGame();
    } else {
      const adWatched = await onPlayAd();
      if (adWatched) {
        startGame();
      }
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
  };

  // ৫. শুটিং / হিট লজিক (৩ হিট প্রয়োজন)
  const handleHitTarget = (id) => {
    setTargets((prev) =>
      prev
        .map((target) => {
          if (target.id === id) {
            const currentHits = target.hitsLeft - 1;
            if (currentHits <= 0) {
              setScore((s) => s + 10); // ১০ পয়েন্ট যোগ
              return null; // অবজেক্ট গায়েব
            }
            return { ...target, hitsLeft: currentHits };
          }
          return target;
        })
        .filter(Boolean)
    );
  };

  // ৬. রিওয়ার্ড ক্লেইম লজিক
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
    <div className="p-4 text-center min-h-[70vh] flex flex-col justify-between select-none">
      
      {/* 1. IDLE STATE */}
      {gameState === 'idle' && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30 mb-4">
            <span className="text-4xl">🎯</span>
          </div>

          <h2 className="text-2xl font-bold text-amber-400 mb-2">Target Shooter Game</h2>
          <p className="text-gray-400 text-sm mb-1">Destroy targets with 3 hits before they shift!</p>
          <p className="text-xs text-amber-300 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/20 mb-6">
            ✨ Destroy 1 Target = +10 Coins
          </p>

          <button
            onClick={handleStartGame}
            className="w-full max-w-xs py-4 px-6 rounded-2xl font-black text-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-950 shadow-lg"
          >
            {hasFreePlay ? '🎁 PLAY (1 Daily Free Game)' : '🎬 WATCH AD TO PLAY'}
          </button>
        </div>
      )}

      {/* 2. PLAYING STATE */}
      {gameState === 'playing' && (
        <div className="w-full">
          {/* হেডার স্কোরবার */}
          <div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded-xl border border-gray-800 mb-3 font-bold text-lg">
            <span className="text-amber-400">⏱️ {timeLeft}s</span>
            <span className="text-emerald-400">🪙 {score}</span>
          </div>

          {/* Shooting Arena Canvas */}
          <div className="relative w-full h-[320px] bg-slate-900 border-2 border-amber-500/30 rounded-2xl overflow-hidden block">
            {targets.map((target) => (
              <button
                key={target.id}
                onClick={() => handleHitTarget(target.id)}
                style={{
                  position: 'absolute',
                  top: `${target.top}px`,
                  left: `${target.left}px`,
                  zIndex: 99
                }}
                className="w-14 h-14 bg-gradient-to-br from-red-500 to-amber-500 border-2 border-white rounded-2xl flex flex-col items-center justify-center font-black text-white active:scale-90 transition-transform shadow-md"
              >
                <span className="text-lg">🎯</span>
                <span className="text-[10px] bg-black/80 px-1.5 rounded-full mt-0.5">
                  {target.hitsLeft} HP
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. GAME OVER SCREEN */}
      {gameState === 'ended' && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mt-4">
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
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold rounded-xl shadow-lg"
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

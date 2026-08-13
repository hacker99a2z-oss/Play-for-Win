import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://play-for-win.onrender.com';

const Home = ({ user, onPlayAd, refreshUserData }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasFreePlay, setHasFreePlay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  // ১৬টি গর্তের স্টেট (null থাকলে ফাঁকা গর্ত, অবজেক্ট থাকলে ইঁদুর অবস্থান করছে)
  const [holes, setHoles] = useState(Array(16).fill(null));

  // ১. ডেইলি ফ্রি খেলার লিমিট চেক
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastFreePlayDate = localStorage.getItem('last_free_play_date');
    if (lastFreePlayDate === today) {
      setHasFreePlay(false);
    } else {
      setHasFreePlay(true);
    }

    const savedCooldownTarget = localStorage.getItem('gameCooldownTarget');
    if (savedCooldownTarget) {
      const remaining = Math.ceil((parseInt(savedCooldownTarget) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        setIsCooldownActive(true);
      } else {
        localStorage.removeItem('gameCooldownTarget');
      }
    }

    // নতুন যোগ করুন: অ্যাপ ওপেন হলেই ইউজারের কান্ট্রি ব্যাকএন্ডে সেভ করে নিবে
    const saveUserLocation = async () => {
      try {
        if (user?.telegramId) {
          await fetch(`${BACKEND_URL}/api/save-user-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.telegramId })
          });
        }
      } catch (err) {
        console.error("Location save error:", err);
      }
    };

    saveUserLocation();
  }, [user]);

  // ২. ইঁদুর স্পনিং ও ১.৫ সেকেন্ড টাইমার লজিক
  useEffect(() => {
    let spawnInterval;

    if (gameState === 'playing') {
      spawnInterval = setInterval(() => {
        // ফাঁকা থাকা গর্তগুলো খুঁজে বের করা
        setHoles((prevHoles) => {
          const emptyHoleIndexes = prevHoles
            .map((val, idx) => (val === null ? idx : null))
            .filter((val) => val !== null);

          if (emptyHoleIndexes.length === 0) return prevHoles;

          // র‍্যান্ডম একটি ফাঁকা গর্ত নির্বাচন করা
          const randomIndex = emptyHoleIndexes[Math.floor(Math.random() * emptyHoleIndexes.length)];
          const mouseId = Date.now() + Math.random();

          const newHoles = [...prevHoles];
          newHoles[randomIndex] = {
            id: mouseId,
          };

          // ঠিক ১.২ সেকেন্ড পর ইঁদুরটি গর্ত থেকে গায়েব হয়ে যাবে
          setTimeout(() => {
            setHoles((currHoles) => {
              const updated = [...currHoles];
              if (updated[randomIndex] && updated[randomIndex].id === mouseId) {
                updated[randomIndex] = null;
              }
              return updated;
            });
          }, 600);

          return newHoles;
        });
      }, 1150); // প্রতি ০.৭ সেকেন্ড পর পর নতুন ইঁদুর বের হবে
    } else {
      setHoles(Array(16).fill(null));
    }

    return () => clearInterval(spawnInterval);
  }, [gameState]);

  // ৩. ৩০ সেকেন্ড কাউন্টডাউন টাইমার
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('ended');
      setHoles(Array(16).fill(null));
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // ৪. ২০ সেকেন্ডের কুলডাউন টাইমার
  useEffect(() => {
    let timer;
    if (isCooldownActive && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && isCooldownActive) {
      setIsCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCooldownActive, cooldown]);

  const handleStartGame = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (hasFreePlay) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('last_free_play_date', today);
        setHasFreePlay(false);
        startGame();
      } else {
        const adWatched = await onPlayAd();
        if (adWatched) {
          startGame();
        } else {
          alert("Ad failed to load or was closed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Game start error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setHoles(Array(16).fill(null));
    setGameState('playing');
  };

  // ৫. ইঁদুরে ক্লিক (৩ হিট সিস্টেম)
  const handleHitMouse = (index) => {
    if (gameState !== 'playing') return;

    setHoles((prevHoles) => {
      const mouse = prevHoles[index];
      if (!mouse) return prevHoles;


      setScore((prevScore) => prevScore + 10);
      const newHoles = [...prevHoles];
      newHoles[index] = null;

      return newHoles;
    });
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
          
          const cooldownTarget = Date.now() + 20 * 1000;
          localStorage.setItem('gameCooldownTarget', cooldownTarget);
          
          setCooldown(20);
          setIsCooldownActive(true);
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
    <div className="p-4 text-center min-h-[75vh] flex flex-col justify-between select-none">
      
      {/* ১. IDLE STATE */}
      {gameState === 'idle' && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30 mb-4 animate-bounce">
            <span className="text-5xl">🐭</span>
          </div>

          <h2 className="text-2xl font-bold text-amber-400 mb-2">Whack A Mouse</h2>
          <p className="text-gray-400 text-sm mb-1">Hit mice before they hide in 0.7s!</p>
          <p className="text-xs text-amber-300 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/20 mb-6">
            ✨ Destroy 1 Mouse = +10 Coins
          </p>

          <button
            onClick={handleStartGame}
            disabled={isLoading || isCooldownActive}
            className={`w-full max-w-xs py-4 px-6 rounded-2xl font-black text-lg transition-all transform flex items-center justify-center gap-2 border-2 ${
              isLoading || isCooldownActive
                ? 'bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed opacity-80 shadow-none'
                : 'bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 border-emerald-300/50 shadow-lg shadow-emerald-500/40 hover:from-emerald-400 hover:to-green-300 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading Ad...</span>
              </>
            ) : isCooldownActive ? (
              `⏳ Please wait ${cooldown}s...`
            ) : hasFreePlay ? (
              '🎁 PLAY (1 Daily Free Game)'
            ) : (
              '📺 WATCH AD TO PLAY'
            )}
          </button>
        </div>
      )}

      {/* ২. PLAYING STATE (4x4 Grid Holes Arena) */}
      {gameState === 'playing' && (
        <div className="w-full">
          {/* টাইমার ও পয়েন্ট ডিসপ্লে */}
          <div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded-xl border border-gray-800 mb-3 font-bold text-lg">
            <span className="text-amber-400">⏱️ {timeLeft}s</span>
            <span className="text-emerald-400">🎯 {score}</span>
          </div>

          {/* ৪x৪ ১৬টি গর্তের গ্রিড */}
          <div className="grid grid-cols-4 gap-3 bg-slate-900 border-2 border-gray-800 p-3 rounded-2xl">
            {holes.map((mouse, index) => (
              <div
                key={index}
                onClick={() => mouse && handleHitMouse(index)}
                className="h-16 bg-slate-950 rounded-2xl border border-gray-800 flex items-center justify-center relative overflow-hidden cursor-pointer active:scale-95 transition-all shadow-inner"
              >
                {/* গর্তের চিহ্নিত শেড */}
                <div className="absolute inset-x-2 bottom-1 h-3 bg-black/60 rounded-full"></div>

                {/* ইঁদুর থাকলে দেখাবে */}
                {mouse ? (
                  <div className="flex flex-col items-center justify-center z-10 animate-pulse">
                    <span className="text-2xl leading-none">🐭</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-700">🕳️</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ৩. GAME OVER SCREEN */}
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
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-black rounded-xl shadow-lg shadow-orange-500/40 border border-amber-300/30 transform active:scale-95 transition-all animate-pulse disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>📺 Watch Ad to Double (2x) ➔</span>
              <span className="text-yellow-200 underline">{score * 2} Coins</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

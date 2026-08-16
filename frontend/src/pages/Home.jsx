import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://play-for-win.onrender.com';

const GAME_ASSETS = {
  mouse: 'https://i.postimg.cc/mrwWynd6/gemini-2-5-flash-image-give-me-the-single-pic-of-mouse-with-transparent-background-and-same-size-0-r.png',
  cat: 'https://i.postimg.cc/t49jnyks/gemini-2-5-flash-image-give-me-the-single-pic-of-cat-with-transparent-background-and-same-size-0-rem.png',
  human: 'https://i.postimg.cc/0N6HbHTz/gemini-2-5-flash-image-give-me-the-single-pic-of-human-with-transparent-background-and-same-size-0-r.png',
  field: 'https://i.postimg.cc/Kjh1KNNM/Chat-GPT-Image-Aug-15-2026-11-55-07-PM.png',
  hole: 'https://i.postimg.cc/c4QfxqX5/gemini-2-5-flash-image-now-give-me-just-a-single-hole-pic-0-removebg-preview.png',
  hammer: 'https://i.postimg.cc/Bb9qhz90/Chat-GPT-Image-Aug-15-2026-11-38-33-PM-removebg-preview.png',
};

const Home = ({ user, onPlayAd, refreshUserData }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasFreePlay, setHasFreePlay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [hitIndex, setHitIndex] = useState(null);

  const [holes, setHoles] = useState(Array(16).fill(null));
  
  const activeTimeouts = useRef([]);
  const clickedItemsRef = useRef(new Set());
  const spawnedMiceCount = useRef(0);

  // ১. ডেইলি ফ্রি প্লে ও কুলডাউন লজিক
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
      const remaining = Math.ceil((parseInt(savedCooldownTarget, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        setIsCooldownActive(true);
      } else {
        localStorage.removeItem('gameCooldownTarget');
      }
    }

    if (user?.telegramId && !sessionStorage.getItem('loc_saved')) {
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((ipData) => {
          fetch(`${BACKEND_URL}/api/save-user-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.telegramId, clientIp: ipData.ip }),
          });
          sessionStorage.setItem('loc_saved', 'true');
        })
        .catch((err) => console.error("Location save error:", err));
    }
  }, [user]);

  // ২. অবজেক্ট স্পনিং লজিক
  useEffect(() => {
    let spawnInterval;

    if (gameState === 'playing') {
      clickedItemsRef.current.clear();
      
      spawnInterval = setInterval(() => {
        setHoles((prevHoles) => {
          const emptyHoleIndexes = prevHoles
            .map((val, idx) => (val === null ? idx : null))
            .filter((val) => val !== null);

          if (emptyHoleIndexes.length === 0) return prevHoles;

          const batchSize = Math.floor(Math.random() * 3) + 1; 
          const availableIndices = [...emptyHoleIndexes];
          const newHoles = [...prevHoles];

          let mouseSpawnedInThisBatch = false;

          for (let i = 0; i < batchSize; i++) {
            if (availableIndices.length === 0) break;

            const randIndexPos = Math.floor(Math.random() * availableIndices.length);
            const targetHoleIndex = availableIndices.splice(randIndexPos, 1)[0];
            const itemId = Date.now() + Math.random();

            let itemType = 'cat';
            const canSpawnMouse = spawnedMiceCount.current < 14 && !mouseSpawnedInThisBatch;

            if (canSpawnMouse) {
              const randVal = Math.random();
              if (randVal < 0.75) {
                itemType = 'mouse';
                spawnedMiceCount.current += 1;
                mouseSpawnedInThisBatch = true;
              } else if (randVal < 0.9) {
                itemType = 'cat';
              } else {
                itemType = 'human';
              }
            } else {
              itemType = Math.random() < 0.5 ? 'cat' : 'human';
            }

            newHoles[targetHoleIndex] = { id: itemId, type: itemType };

            const timeoutId = setTimeout(() => {
              setHoles((currHoles) => {
                const updated = [...currHoles];
                if (updated[targetHoleIndex] && updated[targetHoleIndex].id === itemId) {
                  updated[targetHoleIndex] = null;
                }
                return updated;
              });
            }, 800);

            activeTimeouts.current.push(timeoutId);
          }

          return newHoles;
        });
      }, 2000);
    } else {
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current = [];
      setHoles(Array(16).fill(null));
    }

    return () => {
      clearInterval(spawnInterval);
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current = [];
    };
  }, [gameState]);

  // ৩. টাইমার লজিক
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

  // ৪. কুলডাউন টাইমার
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
    if (isLoading || isCooldownActive) return;
    setIsLoading(true);

    try {
      if (hasFreePlay) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('last_free_play_date', today);
        setHasFreePlay(false);
        startGame();
      } else {
        const adWatched = await onPlayAd();
        if (!adWatched) {
          setIsLoading(false);
          return; 
        }
        startGame();
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
    setTimeLeft(35);
    setHoles(Array(16).fill(null));
    clickedItemsRef.current.clear();
    spawnedMiceCount.current = 0;
    setGameState('playing');
  };

  // ৫. আইটেম হিট লজিক
  const handleHitItem = (index) => {
    if (gameState !== 'playing') return;

    const item = holes[index];
    if (!item || clickedItemsRef.current.has(item.id)) return;

    clickedItemsRef.current.add(item.id);
    setHitIndex(index);

    if (item.type === 'mouse') {
      setScore((prevScore) => Math.min(prevScore + 10, 140));
    } else if (item.type === 'cat' || item.type === 'human') {
      setScore((prevScore) => Math.max(0, prevScore - 5));
    }

    setTimeout(() => {
      setHitIndex(null);
      setHoles((prevHoles) => {
        const newHoles = [...prevHoles];
        newHoles[index] = null;
        return newHoles;
      });
    }, 200);
  };

  // ৬. রিওয়ার্ড ক্লেইম লজিক
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

        const data = await response.json();

        if (response.ok && data.success) {
          alert(`🎉 Successfully claimed ${finalScore} Coins!`);
          refreshUserData();
          setGameState('idle');
          setScore(0);
          
          const cooldownTarget = Date.now() + 35 * 1000;
          localStorage.setItem('gameCooldownTarget', cooldownTarget.toString());
          
          setCooldown(35);
          setIsCooldownActive(true);
        } else {
          alert(data.message || "Error claiming coins. Please try again.");
        }
      } catch (err) {
        console.error("Claim reward error:", err);
        alert("Network error. Please try again.");
      } finally {
        setIsClaiming(false);
      }
    };

    if (isDouble) {
      const adWatched = await onPlayAd();
      if (!adWatched) {
        setIsClaiming(false);
        return;
      }
      await sendScoreToBackend(score * 2);
    } else {
      await sendScoreToBackend(score);
    }
  };

  return (
    <div className="p-4 text-center min-h-[75vh] flex flex-col justify-between select-none w-full max-w-sm mx-auto">
      
      {/* ১. IDLE STATE */}
      {gameState === 'idle' && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30 mb-4 animate-bounce">
            <span className="text-5xl">🐭</span>
          </div>

          <h2 className="text-2xl font-bold text-amber-400 mb-2">Whack A Mouse</h2>
          <p className="text-gray-400 text-sm mb-1">Hit 14 mice in 35s! Avoid Cats & Humans!</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6 mt-2">
            <span className="text-xs text-emerald-300 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
              🐭 Mouse = +10 Coins
            </span>
            <span className="text-xs text-rose-300 bg-rose-950/40 px-3 py-1 rounded-full border border-rose-500/20">
              🐱/👨 Cat/Human = -5 Coins
            </span>
          </div>

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

      {/* ২. PLAYING STATE - অরিজিনাল থিম + ফিক্সড ৩৫০px বোর্ড */}
      {gameState === 'playing' && (
        <div className="w-full flex flex-col items-center my-auto">
          {/* স্কোরবার (অরিজিনাল ডার্ক স্টাইল) */}
          <div className="w-full flex justify-between items-center bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700 mb-4 font-bold text-lg shadow-lg">
            <span className="text-cyan-300 flex items-center gap-2">⏱️ {timeLeft}s</span>
            <span className="text-amber-400 flex items-center gap-2">🎯 {score}</span>
          </div>

          {/* ফিক্সড ৩৫০px মাঠ (কখনো সাইজ ছোট বা লাফাবে না) */}
          <div 
            style={{ 
              width: '100%',
              height: '500px',
              minHeight: '500px',
              maxHeight: '500px',
              backgroundImage: `url(${GAME_ASSETS.field})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}
            className="rounded-3xl shadow-2xl relative border-4 border-lime-800 bg-green-700 block"
          >
          {/* ১৬টি স্থির স্থান */}
          <div 
            style={{ width: '100%', height: '100%' }}
            className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-2 gap-2"
          >
            {holes.map((item, index) => (
              <div
                key={index}
                onClick={() => item && handleHitItem(index)}
                style={{ width: '100%', height: '100%' }}
                className="flex items-center justify-center cursor-pointer relative"
              >
                {/* ১. ফুল-সাইজ বড় গর্ত (Hole) */}
                <img
                  src={GAME_ASSETS.hole}
                  alt="hole"
                  style={{ 
                    width: '180px', 
                    height: '130px', 
                    maxWidth: 'none', 
                    maxHeight: 'none', 
                    transform: 'scale(2.4)' 
                  }}
                  className="absolute object-contain opacity-95 pointer-events-none z-0"
                />

                {/* ২. গর্ত থেকে ক্যারেক্টার বের হওয়া */}
                {item && (
                  <div className="z-10 animate-pop-up flex items-center justify-center w-full h-full relative -translate-y-1">
                    {item.type === 'mouse' && (
                      <img
                        src={GAME_ASSETS.mouse}
                        alt="mouse"
                        className="w-26 h-26 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
                      />
                    )}
                    {item.type === 'cat' && (
                      <img
                        src={GAME_ASSETS.cat}
                        alt="cat"
                        className="w-13 h-13 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
                      />
                    )}
                    {item.type === 'human' && (
                      <img
                        src={GAME_ASSETS.human}
                        alt="human"
                        className="w-13 h-13 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
                      />
                    )}

                    {/* হাতুড়ির আঘাত */}
                    {hitIndex === index && (
                      <img
                        src={GAME_ASSETS.hammer}
                        alt="hammer"
                        className="absolute -top-3 -right-1 w-12 h-12 z-30 pointer-events-none transform -rotate-45 transition-all scale-110 drop-shadow-[0_6px_10px_rgba(0,0,0,0.9)]"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      )}
      
      {/* ৩. GAME OVER SCREEN */}
      {gameState === 'ended' && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mt-4 w-full">
          <h3 className="text-xl font-bold text-white mb-2">🎉 Match Finished!</h3>
          <p className="text-gray-400 text-sm mb-1">Total Coins Earned:</p>
          <p className="text-3xl font-black text-amber-400 mb-6">{score} Coins</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => claimReward(false)}
              disabled={isClaiming}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 disabled:opacity-50"
            >
              {isClaiming ? 'Processing...' : `Claim ${score} Coins`}
            </button>

            <button
              onClick={() => claimReward(true)}
              disabled={isClaiming}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-black rounded-xl shadow-lg shadow-orange-500/40 border border-amber-300/30 transform active:scale-95 transition-all animate-pulse disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isClaiming ? 'Loading Ad...' : '📺 Watch Ad to Double (2x) ➔'}</span>
              {!isClaiming && <span className="text-yellow-200 underline">{score * 2} Coins</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

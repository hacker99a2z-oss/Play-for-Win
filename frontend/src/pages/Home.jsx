import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://play-for-win.onrender.com';

// অনলাইন ৩D ইমেজের লিংক (আপনার সুবিধার্থে যুক্ত করা হয়েছে)
const GAME_ASSETS = {
  mouse: 'https://img.icons8.com/isometric/96/mouse.png',
  cat: 'https://img.icons8.com/isometric/96/cat.png',
  human: 'https://img.icons8.com/isometric/96/standing-man.png'
};

const Home = ({ user, onPlayAd, refreshUserData }) => {
  const [gameState, setGameState] = useState('idle'); // idle, playing, ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35); // ৩৫ সেকেন্ডের গেম টাইমার
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasFreePlay, setHasFreePlay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  // ১৬টি গর্তের স্টেট
  const [holes, setHoles] = useState(Array(16).fill(null));
  
  // ট্র্যাকিং রেফারেন্স
  const activeTimeouts = useRef([]);
  const clickedItemsRef = useRef(new Set());
  const spawnedMiceCount = useRef(0); // মোট কয়টি ইঁদুর বের হয়েছে তার হিসাব

  // ১. ডেইলি ফ্রি খেলার লিমিট ও আইপি লোকেশন চেক
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

    const saveUserLocation = async () => {
      try {
        if (user?.telegramId && !sessionStorage.getItem('loc_saved')) {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          const userIp = ipData.ip;

          await fetch(`${BACKEND_URL}/api/save-user-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.telegramId, clientIp: userIp })
          });

          sessionStorage.setItem('loc_saved', 'true');
        }
      } catch (err) {
        console.error("Location save error:", err);
      }
    };

    saveUserLocation();
  }, [user]);

  // ২. অবজেক্ট (Mouse, Cat, Human) স্পনিং লজিক
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
            }, 600);

            activeTimeouts.current.push(timeoutId);
          }

          return newHoles;
        });
      }, 2400);
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

  // ৩. ৩৫ সেকেন্ড কাউন্টডাউন টাইমার
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

  // ৫. আইটেমে ক্লিকের লজিক
  const handleHitItem = (index) => {
    if (gameState !== 'playing') return;

    const item = holes[index];
    if (!item || clickedItemsRef.current.has(item.id)) return;

    clickedItemsRef.current.add(item.id);

    if (item.type === 'mouse') {
      setScore((prevScore) => Math.min(prevScore + 10, 140));
    } else if (item.type === 'cat' || item.type === 'human') {
      setScore((prevScore) => Math.max(0, prevScore - 5));
    }

    setHoles((prevHoles) => {
      const newHoles = [...prevHoles];
      newHoles[index] = null;
      return newHoles;
    });
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
    <div className="p-4 text-center min-h-[75vh] flex flex-col justify-between select-none">
      
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

      {/* ২. PLAYING STATE (4x4 Cartoon Grass Arena) */}
      {gameState === 'playing' && (
        <div className="w-full max-w-sm mx-auto">
          {/* স্কোরবার */}
          <div className="flex justify-between items-center bg-[#0e1726]/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/50 mb-4 font-bold text-lg shadow-lg">
            <span className="text-[#a8dadc] flex items-center gap-2">⏱️ {timeLeft}s</span>
            <span className="text-amber-400 flex items-center gap-2">🎯 {score}</span>
          </div>

          {/* কার্টুন ঘাসের মাঠ ও ৩D মাটির গর্ত */}
          <div className="grid grid-cols-4 gap-3 bg-[#80b938] border-4 border-[#5d8b24] p-3.5 rounded-3xl shadow-2xl relative touch-manipulation">
            {holes.map((item, index) => (
              <div
                key={index}
                onClick={() => item && handleHitItem(index)}
                className="h-20 bg-[#4a3319] rounded-full border-4 border-[#332210] flex items-end justify-center relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-[inset_0_8px_14px_rgba(0,0,0,0.9)]"
              >
                {/* গর্তের ভেতর গভীরতার ছায়া */}
                <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none rounded-full"></div>

                {item ? (
                  <div className="z-10 pb-1 animate-pop-up flex items-center justify-center">
                    {item.type === 'mouse' && (
                      <img
                        src={GAME_ASSETS.mouse}
                        alt="mouse"
                        className="w-14 h-14 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                      />
                    )}
                    {item.type === 'cat' && (
                      <img
                        src={GAME_ASSETS.cat}
                        alt="cat"
                        className="w-14 h-14 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                      />
                    )}
                    {item.type === 'human' && (
                      <img
                        src={GAME_ASSETS.human}
                        alt="human"
                        className="w-14 h-14 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                      />
                    )}
                  </div>
                ) : null}
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

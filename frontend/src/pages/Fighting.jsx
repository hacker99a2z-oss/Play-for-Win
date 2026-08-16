import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Fighting = () => {
  // ইঁদুরদের প্রাথমিক পাওয়ার
  const [mice, setMice] = useState([
    { id: 1, name: 'Mouse Alpha', power: 50, emoji: '🐭' },
    { id: 2, name: 'Mouse Beta', power: 75, emoji: '🐭' },
    { id: 3, name: 'Mouse Gamma', power: 100, emoji: '🐭' },
  ]);

  // ৩টি প্লেয়ারের মোট পাওয়ার
  const totalPower = mice.reduce((acc, curr) => acc + curr.power, 0);

  // Adsgram Ad দেখে পাওয়ার ১০০ বাড়ানোর লজিক
  const handleBoostPower = () => {
    // Adsgram Controller Integration
    if (window.AdController) {
      window.AdController.show()
        ? setMice((prevMice) =>
            prevMice.map((mouse) => ({
              ...mouse,
              power: mouse.power + 100,
            }))
          )
        : alert('Ad loading failed!');
    } else {
      // Adsgram না থাকলে টেস্ট করার জন্য ডাইরেক্ট পাওয়ার বাড়বে
      setMice((prevMice) =>
        prevMice.map((mouse) => ({
          ...mouse,
          power: mouse.power + 100,
        }))
      );
    }
  };

  const handleFight = () => {
    alert('Fight Started!');
    // পরবর্তী লজিক এখানে যুক্ত হবে
  };

  return (
    <div style={{ padding: '20px', color: '#fff', textAlign: 'center', minHeight: '100vh', background: '#121212' }}>
      
      {/* উপরে বাম পাশে মোট পাওয়ার শো করবে */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#f39c12' }}>⚡ Total Power: {totalPower}</h2>
      </div>

      <h1 style={{ marginBottom: '30px' }}>Fighting Arena</h1>

      {/* ৩টি অ্যানিমেটেড ইঁদুর কার্ড */}
      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px', marginBottom: '30px' }}>
        {mice.map((mouse) => (
          <motion.div
            key={mouse.id}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{
              background: '#1e1e1e',
              padding: '15px',
              borderRadius: '12px',
              border: '1px solid #333',
              width: '30%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* ইঁদুরের অ্যানিমেশন/ইমোজি */}
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{mouse.emoji}</div>
            <h3 style={{ margin: '5px 0', fontSize: '16px' }}>{mouse.name}</h3>
            
            {/* নিচে ব্যক্তিগত পাওয়ার */}
            <p style={{ margin: 0, color: '#2ecc71', fontWeight: 'bold' }}>
              Power: {mouse.power}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Adsgram পাওয়ার বাড়ানোর বাটন */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleBoostPower}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#e67e22',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📺 Watch Ad (+100 Power)
        </button>
      </div>

      {/* নিচে Fight বাটন */}
      <div>
        <button
          onClick={handleFight}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            backgroundColor: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
          }}
        >
          ⚔️ FIGHT ⚔️
        </button>
      </div>
    </div>
  );
};

export default Fighting;

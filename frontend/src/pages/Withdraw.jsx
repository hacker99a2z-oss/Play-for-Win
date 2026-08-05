import React, { useState } from 'react';

export default function Withdraw({ user }) {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');

  const handleWithdraw = (e) => {
    e.preventDefault();
    alert(`Withdraw Request: $${amount} to address ${wallet}`);
  };

  return (
    <div className="p-4 text-white flex flex-col gap-4">
      {/* Balance Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl">
          <p className="text-[11px] text-gray-400">Bonus Balance</p>
          <p className="text-lg font-bold text-emerald-400">${user?.bonusBalanceUSD || "0.00"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl">
          <p className="text-[11px] text-gray-400">Main Coins</p>
          <p className="text-lg font-bold text-yellow-400">{user?.mainCoins?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Withdraw Form */}
      <form onSubmit={handleWithdraw} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Network</label>
          <input type="text" value="TON Network" disabled className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 font-semibold" />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">TON Wallet Address</label>
          <input 
            type="text" 
            placeholder="Enter TON Wallet Address" 
            value={wallet} 
            onChange={(e) => setWallet(e.target.value)}
            required
            className="w-full bg-white text-black border border-gray-800 rounded-xl p-2.5 text-xs outline-none focus:border-yellow-500"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Enter Amount ($)</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="e.g. 0.5" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-white text-black border border-gray-800 rounded-xl p-2.5 text-xs outline-none focus:border-yellow-500"
          />
        </div>

        {/* Withdrawal Rules */}
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-[11px] text-gray-400 flex flex-col gap-1">
          <p className="text-yellow-400 font-bold">📌 Fee Structure (From Main Coins):</p>
          <p>• $0.50 Withdraw = <span className="text-white font-bold">50,000 Coins</span> Fee</p>
          <p>• $1.00 Withdraw = <span className="text-white font-bold">100,000 Coins</span> Fee</p>
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: '#10b981',
            color: '#000000',
            padding: '12px 24px',
            borderRadius: '12px',
            width: '100%',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          💸 Withdraw Funds
        </button>
      </form>

      {/* Support Link */}
      <a href="https://t.me/earners_1b" target="_blank" rel="noreferrer" className="text-center text-xs text-blue-400 hover:underline py-1">
        💬 Contact Support
      </a>
    </div>
  );
}

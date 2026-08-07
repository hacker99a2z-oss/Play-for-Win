import React, { useState } from 'react';

export default function Withdraw({ user, BACKEND_URL, refreshUser }) {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!wallet) {
      alert("Please enter your TON Wallet Address!");
      return;
    }

    try {
      const res = await fetch(`https://play-for-win.onrender.com/api/user/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user?.telegramId,
          wallet,
          amount
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Withdraw Request Submitted Successfully!");
        setWallet('');
        setAmount('');
        window.location.reload();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert("❌ Something went wrong. Try again!");
    }
  };

  return (
    <div className="p-4 text-white flex flex-col gap-4">
      {/* Balance Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl">
          <p className="text-[11px] text-gray-400">Bonus Balance</p>
          <p className="text-lg font-bold text-emerald-400">${user?.bonusBalanceUSD ? Number(user.bonusBalanceUSD).toFixed(2) : "0.00"}</p>
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
            className="w-full bg-white text-black font-bold text-base p-3 border border-gray-800 rounded-xl outline-none focus:border-yellow-500"
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
            className="w-full bg-white text-black font-bold text-base p-3 border border-gray-800 rounded-xl outline-none focus:border-yellow-500"
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

        {/* Warning Notice under Withdraw Button */}
        <p className="text-[11px] text-amber-400/90 text-center mt-3 px-2 leading-relaxed font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          ⚠️ <b>Note:</b> You must join our Official Channel before withdrawing. Requests from non-members will be manually checked and cancelled.
        </p>

        </form>

        {/* Support & Payment Proof Links */}
        <div className="flex flex-col items-center gap-2 mt-4 text-xs">
          <a href="https://t.me/earners_1b" target="_blank" rel="noreferrer" className="text-center text-xs text-blue-400 hover:underline">
            💬 Contact Support
          </a>

         <a href="https://t.me/payment_proofs_for" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition underline">
            📢 Payment's Proofs
         </a>
       </div>
    </div>
  );
}

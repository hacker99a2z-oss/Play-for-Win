import React, { useState } from 'react';

export default function Withdraw({ user, BACKEND_URL, refreshUser }) {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  
  // নতুন পপ-আপ ও মেম্বারশিপ চেক করার জন্য স্টেট
  const [showPopup, setShowPopup] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // ১. প্রথমে উইথড্র বাটনে ক্লিক করলে মেম্বারশিপ চেক করবে
  const handleWithdrawClick = async (e) => {
    e.preventDefault();

    if (!wallet) {
      alert("Please enter your TON Wallet Address!");
      return;
    }

    if (!amount) {
      alert("Please enter amount!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://play-for-win.onrender.com/api/check-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user?.telegramId })
      });

      const data = await res.json();

      if (data.success) {
        if (data.allJoined) {
          // সবগুলোতে জয়েন করা থাকলে সরাসরি আসল উইথড্র API কল হবে
          executeWithdraw();
        } else {
          // জয়েন করা না থাকলে পপ-আপ ওপেন হবে এবং স্ট্যাটাস দেখাবে
          setMembershipStatus(data.membershipStatus);
          setShowPopup(true);
          setLoading(false);
        }
      } else {
        alert("Failed to verify membership. Try again!");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong checking membership!");
      setLoading(false);
    }
  };

  // ২. আসল উইথড্র API রিকোয়েস্ট (আপনার আগের কোডের লজিক)
  const executeWithdraw = async () => {
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
        setShowPopup(false);
        if (refreshUser) refreshUser();
        else window.location.reload();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert("❌ Something went wrong. Try again!");
    } finally {
      setLoading(false);
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
      <form onSubmit={handleWithdrawClick} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
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
          disabled={loading}
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
          {loading ? "Checking Membership..." : "💸 Withdraw Funds"}
        </button>

        <p className="text-[11px] text-amber-400/90 text-center mt-3 px-2 leading-relaxed font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          ⚠️ <b>Note:</b> You must join our Official Channels & Group before withdrawing. Requests from non-members will be cancelled.
        </p>

      </form>

      {/* Support & Payment Proof Links */}
      <div className="flex flex-col items-center gap-2 mt-4 text-xs">
        <a href="https://t.me/earners_1b" target="_blank" rel="noreferrer" className="text-center text-xs text-blue-400 hover:underline">
          💬 Contact Support
        </a>

        <a href="https://t.me/payment_proofs_for" target="_blank" rel="noreferrer" className="text-center text-xs text-blue-400 hover:underline">
          📢 Payment's Proofs
        </a>
      </div>

      {/* পপ-আপ মডাল (চ্যানেল/গ্রুপ জয়েনিং স্ট্যাটাস চেক করার জন্য - ডাইনামিক) */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl p-5 relative">
            
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-amber-400 mb-1 text-center">Join Required</h3>
            <p className="text-xs text-gray-400 text-center mb-4">Please join all communities to unlock withdraw.</p>

            <div className="flex flex-col gap-3">
              {Object.entries(membershipStatus).map(([chatUsername, isJoined]) => (
                <div key={chatUsername} className="flex justify-between items-center bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <span className="text-xs font-medium text-gray-300">{chatUsername}</span>
                  {isJoined ? (
                    <span className="text-emerald-400 font-bold text-xs bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-500/30">Done</span>
                  ) : (
                    <a
                      href={`https://t.me/${chatUsername.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1.5 rounded-lg font-bold text-white"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleWithdrawClick}
              className="w-full mt-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm"
            >
              Re-check & Withdraw
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

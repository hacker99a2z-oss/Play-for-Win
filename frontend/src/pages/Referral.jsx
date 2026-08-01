import React, { useState } from 'react';

export default function Referral({ user }) {
  const [copied, setCopied] = useState(false);
  const botUsername = "PlayForWinBot"; // আপনার Telegram Bot Username
  const refLink = `https://t.me/${botUsername}/app?startapp=${user?.telegramId || '123456'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 text-white flex flex-col gap-4">
      {/* Referral Link Box */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h2 className="text-sm text-gray-400 font-medium mb-2">Your Invite Link</h2>
        <div className="flex items-center gap-2 bg-gray-950 p-2.5 rounded-xl border border-gray-800">
          <input 
            type="text" 
            readOnly 
            value={refLink} 
            className="bg-transparent text-xs text-yellow-400 flex-1 outline-none truncate"
          />
          <button 
            onClick={handleCopy}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? 'Copied! ✅' : 'Copy 📋'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2.5">
          🎁 Rule: When your referral watches <span className="text-yellow-400 font-bold">20 Ads</span>, you receive <span className="text-yellow-400 font-bold">500 Coins</span>!
        </p>
      </div>

      {/* Referrals List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-3">My Referrals ({user?.referrals?.length || 0})</h3>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {user?.referrals && user.referrals.length > 0 ? (
            user.referrals.map((ref, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-xs">
                <div className="flex items-center gap-2">
                  <img src={ref.photoUrl || "https://via.placeholder.com/30"} alt="pic" className="w-7 h-7 rounded-full" />
                  <span className="font-medium">{ref.firstName}</span>
                </div>
                <span className="text-gray-400 font-mono">{ref.adsWatchedForReferral || 0}/20 Ads</span>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-gray-500 py-4">No referrals yet. Share your link!</p>
          )}
        </div>
      </div>
    </div>
  );
}

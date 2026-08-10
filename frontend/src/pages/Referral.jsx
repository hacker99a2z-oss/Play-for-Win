import React, { useState, useEffect } from 'react';

export default function Referral({ user, refreshUser }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (refreshUser) refreshUser();
  }, []);

  const botUsername = "playersfordestiny_bot";
  const refLink = `https://t.me/${botUsername}/gamers?startapp=${user?.telegramId || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralsList = user?.referrals || [];

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
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
          >
            {copied ? 'Copied! ✓' : 'Copy 📋'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2.5">
          🎁 Rule: When your referral plays <span className="text-yellow-400 font-bold">10 Games</span>, you receive <span className="text-yellow-400 font-bold">1,000 Main Coins & Daily Coins</span>
        </p>
      </div>

      {/* Referrals List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">My Referrals ({user?.referralCount || referralsList.length})</h3>
          <button
            onClick={refreshUser}
            className="text-xs text-yellow-400 hover:underline flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>

        {referralsList.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {referralsList.map((ref, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {ref.firstName ? ref.firstName[0] : 'U'}
                  </div>
                  <span className="font-medium text-xs">{ref.firstName || ref.username || 'User'}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{ref.gamesPlayedForReferral || 0}/10 Games</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-500 py-4">No referrals yet. Share your link!</p>
        )}
      </div>
    </div>
  );
}

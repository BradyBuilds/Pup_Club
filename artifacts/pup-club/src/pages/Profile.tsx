import { useStore } from '../store/useStore';
import { getNextTierInfo, TIER_LABELS, TIER_COLORS } from '../lib/tiers';

export function Profile() {
  const { patron } = useStore();

  if (!patron) return null;

  const { nextTier, xpNeeded, progress } = getNextTierInfo(patron.total_xp);
  const tierColorClass = TIER_COLORS[patron.loyalty_tier] || TIER_COLORS.pup;

  return (
    <div className="h-full overflow-y-auto pb-20 p-4 space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold text-[#FF2D78] neon-text-primary uppercase tracking-wider">
            Player Profile
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your arcade status.</p>
        </div>
      </header>

      <div className="bg-[#1A1A2E] rounded-xl border border-[#252540] p-6 text-center">
        <div className="w-24 h-24 mx-auto bg-[#0D0D1A] rounded-full border-4 border-[#252540] flex items-center justify-center text-4xl mb-4 relative">
          👤
          <div className="absolute -bottom-2 -right-2 bg-[#FF2D78] rounded-full w-8 h-8 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(255,45,120,0.5)]">
            ⭐
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-1">{patron.display_name}</h2>
        
        <div className="flex justify-center mb-6">
          <span className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider border ${tierColorClass}`}>
            {TIER_LABELS[patron.loyalty_tier] || "Pup"}
          </span>
        </div>
        
        <div className="bg-[#0D0D1A] rounded-lg p-4 mb-4 border border-[#252540]">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total XP</div>
          <div className="text-4xl font-mono font-bold text-[#39FF14] neon-text-green">
            {patron.total_xp.toLocaleString()}
          </div>
        </div>
        
        {nextTier && (
          <div className="text-left mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
              <span>Next: {TIER_LABELS[nextTier]}</span>
              <span>{xpNeeded} XP to go</span>
            </div>
            <div className="h-4 bg-[#0D0D1A] rounded-full overflow-hidden border border-[#252540]">
              <div 
                className="h-full bg-gradient-to-r from-[#00E5FF] to-[#FF2D78] rounded-full relative"
                style={{ width: `${Math.max(5, progress * 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1A1A2E] rounded-xl border border-[#252540] p-4 text-center">
          <div className="text-2xl mb-2">🎮</div>
          <div className="text-sm text-gray-400 mb-1">Games Played</div>
          <div className="text-xl font-bold text-white">—</div>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl border border-[#252540] p-4 text-center">
          <div className="text-2xl mb-2">🥇</div>
          <div className="text-sm text-gray-400 mb-1">High Scores</div>
          <div className="text-xl font-bold text-white">—</div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-600 font-mono">
          Session ID: {patron.session_token.substring(0, 12)}...
        </p>
      </div>
    </div>
  );
}

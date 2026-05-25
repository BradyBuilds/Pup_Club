import { useState } from 'react';
import { useGetLeaderboard, useGetLeaderboardAlltime } from '@workspace/api-client-react';
import { useStore } from '../store/useStore';
import { TIER_COLORS } from '../lib/tiers';

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'today' | 'alltime'>('today');
  const [selectedGameSlug, setSelectedGameSlug] = useState<string | undefined>(undefined);
  
  const { games } = useStore();
  
  // Create hooks but conditionally use their data
  const { data: todayData, isLoading: isLoadingToday } = useGetLeaderboard(
    { game_slug: selectedGameSlug },
    { query: { enabled: timeframe === 'today', queryKey: ['leaderboard', 'today', selectedGameSlug] } }
  );
  
  const { data: alltimeData, isLoading: isLoadingAlltime } = useGetLeaderboardAlltime(
    { game_slug: selectedGameSlug },
    { query: { enabled: timeframe === 'alltime', queryKey: ['leaderboard', 'alltime', selectedGameSlug] } }
  );

  const data = timeframe === 'today' ? todayData : alltimeData;
  const isLoading = timeframe === 'today' ? isLoadingToday : isLoadingAlltime;

  return (
    <div className="h-full overflow-y-auto pb-20 p-4 flex flex-col">
      <header className="mb-6">
        <h1 className="text-4xl font-display font-bold text-[#FF2D78] neon-text-primary uppercase tracking-wider flex items-center gap-2">
          <span>🏆</span> Leaderboard
        </h1>
      </header>

      <div className="flex bg-[#1A1A2E] rounded-lg p-1 mb-4 border border-[#252540]">
        <button
          onClick={() => setTimeframe('today')}
          className={`flex-1 py-2 text-sm font-bold uppercase rounded-md transition-colors ${
            timeframe === 'today' ? 'bg-[#FF2D78] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setTimeframe('alltime')}
          className={`flex-1 py-2 text-sm font-bold uppercase rounded-md transition-colors ${
            timeframe === 'alltime' ? 'bg-[#FF2D78] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          All Time
        </button>
      </div>

      <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4 flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedGameSlug(undefined)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-colors ${
            !selectedGameSlug 
              ? 'bg-[#00E5FF] text-[#0D0D1A] border-[#00E5FF]' 
              : 'bg-transparent text-[#00E5FF] border-[#00E5FF]/30'
          }`}
        >
          All Games
        </button>
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setSelectedGameSlug(game.slug)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-colors ${
              selectedGameSlug === game.slug
                ? 'bg-[#00E5FF] text-[#0D0D1A] border-[#00E5FF]' 
                : 'bg-transparent text-[#00E5FF] border-[#00E5FF]/30'
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#1A1A2E] rounded-xl border border-[#252540] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <span className="text-[#00E5FF] font-mono text-sm animate-pulse">Loading scores...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
            <span className="text-3xl mb-2">👻</span>
            <p className="font-mono text-sm uppercase">No scores yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#252540]">
            {data.map((entry, i) => (
              <div key={`${entry.game_id}-${entry.rank}-${i}`} className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold rounded-full border ${
                  entry.rank === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                  entry.rank === 2 ? 'bg-gray-300/20 border-gray-300 text-gray-300' :
                  entry.rank === 3 ? 'bg-amber-700/20 border-amber-700 text-amber-700' :
                  'bg-transparent border-transparent text-gray-500'
                }`}>
                  #{entry.rank}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{entry.display_name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-sm border whitespace-nowrap ${TIER_COLORS[entry.loyalty_tier] || TIER_COLORS.pup}`}>
                      {entry.loyalty_tier.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {entry.game_name}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono font-bold text-[#39FF14] text-lg">{entry.best_score}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{entry.plays} plays</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useStore } from '../store/useStore';
import { GameCard } from '../components/GameCard';

export function Hub() {
  const { games } = useStore();

  // Sort by sort_order
  const sortedGames = [...games].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="h-full overflow-y-auto pb-20 p-4 space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-display font-bold text-[#FF2D78] neon-text-primary uppercase tracking-wider">
          Arcade Hub
        </h1>
        <p className="text-gray-400 text-sm">Select a game to start playing.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {sortedGames.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            isAvailable={game.slug === 'pong'} 
          />
        ))}
      </div>
    </div>
  );
}

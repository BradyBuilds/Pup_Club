import { Game } from '@workspace/api-client-react/src/generated/api.schemas';
import { useStore } from '../store/useStore';

interface GameCardProps {
  game: Game;
  isAvailable?: boolean;
}

export function GameCard({ game, isAvailable = true }: GameCardProps) {
  const { setActiveGame } = useStore();

  const handleTap = () => {
    if (isAvailable) {
      setActiveGame(game);
    } else {
      // For sprint 3 placeholders, we just set it, the app will render "coming soon" overlay.
      setActiveGame(game);
    }
  };

  return (
    <button
      onClick={handleTap}
      className={`relative w-full aspect-video bg-[#1A1A2E] rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-200 ${
        isAvailable 
          ? 'border-[#252540] hover:border-[#FF2D78] active:border-[#FF2D78] hover:shadow-[0_0_15px_rgba(255,45,120,0.3)]' 
          : 'border-[#252540] opacity-80'
      }`}
    >
      <h3 className={`text-2xl font-display font-bold uppercase tracking-wider mb-2 ${
        isAvailable ? 'text-white' : 'text-gray-400'
      }`}>
        {game.name}
      </h3>
      
      {game.description && (
        <p className="text-xs text-gray-400 text-center line-clamp-2">
          {game.description}
        </p>
      )}
      
      {!isAvailable && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <span className="text-[#00E5FF] font-display font-bold text-xl uppercase tracking-widest neon-text-secondary transform -rotate-12">
            Coming Soon
          </span>
        </div>
      )}
    </button>
  );
}

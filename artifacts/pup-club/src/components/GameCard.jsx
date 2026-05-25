import { useStore } from '../store/useStore'

const GAME_META = {
  pong: {
    emoji:      '🏓',
    accentColor: '#F0C040',
    dimColor:    '#F0C04022',
    label:       'Classic paddle battle',
    tagBg:       'linear-gradient(135deg, #F0C040, #C9922A)',
  },
  'neon-invaders': {
    emoji:      '👾',
    accentColor: '#CC2200',
    dimColor:    '#CC220022',
    label:       'Tap before they reach you',
    tagBg:       'linear-gradient(135deg, #FF3B1A, #CC2200)',
  },
  'laser-tug': {
    emoji:      '⚡',
    accentColor: '#C9922A',
    dimColor:    '#C9922A22',
    label:       'Push the laser to win',
    tagBg:       'linear-gradient(135deg, #F0C040, #8B6914)',
  },
}

export default function GameCard({ game, topScore }) {
  const { setActiveGame, setActiveTab } = useStore()
  const meta = GAME_META[game.slug] || {
    emoji: '🎮', accentColor: '#C9922A', dimColor: '#C9922A22',
    label: '', tagBg: 'linear-gradient(135deg, #F0C040, #C9922A)',
  }

  function handlePlay() {
    setActiveGame(game)
    alert(`🎮 ${game.name}\n\nGame engine plugs in here.\nLeaderboard + scoring are fully wired.`)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #2A2518, #1A1712)',
        border: `1px solid ${meta.accentColor}33`,
        boxShadow: `0 4px 20px #00000055, 0 0 30px ${meta.accentColor}11`,
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: meta.tagBg }} />

      <div className="p-4 flex items-center gap-4">
        {/* Icon circle */}
        <div
          className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{
            background: meta.dimColor,
            border: `1px solid ${meta.accentColor}44`,
            boxShadow: `inset 0 2px 8px #00000044`,
          }}
        >
          {meta.emoji}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl tracking-wide" style={{ color: '#F5E0C0' }}>
            {game.name}
          </h3>
          <p className="text-muted text-xs font-body mt-0.5">{meta.label}</p>

          {topScore ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[9px] text-muted font-body tracking-wider uppercase">Leader:</span>
              <span className="text-xs font-display tracking-wide" style={{ color: meta.accentColor }}>
                {topScore.display_name}
              </span>
              <span className="score-font text-xs text-muted">
                {topScore.best_score.toLocaleString()}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-muted font-body mt-1 italic">
              No scores yet — be first!
            </p>
          )}
        </div>

        {/* Play button */}
        <button
          onClick={handlePlay}
          className="flex-shrink-0 w-[60px] h-[60px] rounded-xl btn-press font-display
            text-sm tracking-wider"
          style={{
            background: meta.tagBg,
            color: '#0B0A07',
            boxShadow: `0 4px 12px ${meta.accentColor}55, inset 0 1px 0 #FFFFFF22`,
            fontSize: '13px',
          }}
        >
          PLAY
        </button>
      </div>
    </div>
  )
}

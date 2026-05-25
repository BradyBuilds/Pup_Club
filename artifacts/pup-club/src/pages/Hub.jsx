import { useStore } from '../store/useStore'
import GameCard from '../components/GameCard'
import { TIER_LABELS } from '../lib/supabase'

const TIER_ICONS = {
  pup:         '🐶',
  alpha_pup:   '⚡',
  pack_leader: '👑',
  top_dog:     '🔥',
}

export default function Hub() {
  const { games, leaderboard, patron, venue } = useStore()

  function getTopScore(gameId) {
    const rows = leaderboard.filter((r) => r.game_id === gameId)
    return rows[0] || null
  }

  const xpToNext = patron ? (500 - (patron.total_xp % 500)) : 0
  const xpProgress = patron ? ((patron.total_xp % 500) / 500) * 100 : 0

  return (
    <div className="h-full flex flex-col page-enter">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-2">

        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {/* Venue name in script */}
            <p className="font-script text-sm" style={{ color: '#C9922A88' }}>
              Deaf Puppy
            </p>
            <h1 className="font-display text-4xl tracking-wider leading-none" style={{
              background: 'linear-gradient(180deg, #F0C040 0%, #C9922A 60%, #7A5C10 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              GAME HUB
            </h1>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
               style={{ background: '#252218', border: '1px solid #3A3220' }}>
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-gold live-pulse" />
              <div className="w-2 h-2 rounded-full bg-gold" />
            </div>
            <span className="font-display text-[11px] tracking-widest" style={{ color: '#C9922A' }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Chain divider */}
        <div className="chain-divider mb-3" />

        {/* Patron XP strip */}
        {patron && (
          <div className="rounded-xl p-3 flex items-center gap-3 mb-1"
               style={{ background: '#252218', border: '1px solid #3A3220' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                 style={{ background: '#C9922A18', border: '1px solid #C9922A33' }}>
              {TIER_ICONS[patron.loyalty_tier] || '🐶'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-sm tracking-wide truncate" style={{ color: '#F5E0C0' }}>
                  {patron.display_name}
                </span>
                <span className="score-font text-xs ml-2 flex-shrink-0" style={{ color: '#C9922A' }}>
                  {patron.total_xp.toLocaleString()} XP
                </span>
              </div>
              {/* XP bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0B0A07' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpProgress}%`,
                    background: 'linear-gradient(90deg, #8B6914, #F0C040)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Games ──────────────────────────────────── */}
      <div className="flex-1 scroll-area px-4 pb-4 space-y-3">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-4xl">🎮</span>
            <p className="text-muted text-sm font-body">No games active tonight</p>
          </div>
        ) : (
          games.map((game) => (
            <GameCard key={game.id} game={game} topScore={getTopScore(game.id)} />
          ))
        )}

        {/* More coming */}
        <div className="rounded-xl py-3 text-center"
             style={{ border: '1px dashed #3A3220' }}>
          <p className="font-display tracking-widest text-muted text-sm">
            MORE GAMES COMING SOON
          </p>
        </div>
      </div>
    </div>
  )
}

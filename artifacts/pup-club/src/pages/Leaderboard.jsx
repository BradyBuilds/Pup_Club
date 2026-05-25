import { useState } from 'react'
import { useStore } from '../store/useStore'
import { TIER_LABELS } from '../lib/supabase'

const RANK_DISPLAY = {
  1: { icon: '👑', color: '#F0C040', labelColor: '#F0C040', glow: '0 0 20px #F0C04066' },
  2: { icon: '🥈', color: '#C8C8C8', labelColor: '#C8C8C8', glow: '0 0 10px #C8C8C833' },
  3: { icon: '🥉', color: '#CD7F32', labelColor: '#CD7F32', glow: '0 0 10px #CD7F3233' },
}

export default function Leaderboard() {
  const { games, leaderboard, patron } = useStore()
  const [selectedGame, setSelectedGame] = useState(null)

  const activeGameId = selectedGame || games[0]?.id
  const rows = leaderboard
    .filter((r) => r.game_id === activeGameId)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 50)

  const myRow = rows.find((r) => r.display_name === patron?.display_name)
  const topRow = rows[0]

  return (
    <div className="h-full flex flex-col page-enter">

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <p className="font-script text-sm" style={{ color: '#C9922A88' }}>Tonight's</p>
        <h1 className="font-display text-4xl tracking-wider leading-none" style={{
          background: 'linear-gradient(180deg, #F0C040, #C9922A, #7A5C10)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          LEADERBOARD
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gold live-pulse" />
          <span className="text-muted text-xs font-body">Live · Resets at midnight</span>
        </div>
      </div>

      {/* Chain divider */}
      <div className="chain-divider mx-4 mb-3 flex-shrink-0" />

      {/* Game tabs */}
      <div className="flex-shrink-0 px-4 flex gap-2 overflow-x-auto pb-3">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full font-display text-sm tracking-wide
              transition-all btn-press"
            style={g.id === activeGameId ? {
              background: 'linear-gradient(135deg, #F0C040, #C9922A)',
              color: '#0B0A07',
              boxShadow: '0 2px 12px #C9922A44',
            } : {
              background: '#252218',
              color: '#7A6A50',
              border: '1px solid #3A3220',
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* My rank banner */}
      {myRow && (
        <div className="mx-4 mb-3 flex-shrink-0 rounded-xl p-3 flex items-center gap-3"
             style={{ background: '#C9922A15', border: '1px solid #C9922A44' }}>
          <span className="score-font text-xl" style={{ color: '#F0C040' }}>
            #{myRow.rank}
          </span>
          <div className="flex-1">
            <p className="font-display text-sm tracking-wide" style={{ color: '#F5E0C0' }}>
              Your rank tonight
            </p>
            <p className="score-font text-xs text-muted">
              {myRow.best_score.toLocaleString()} pts · {myRow.plays} plays
            </p>
          </div>
          {myRow.rank > 1 && topRow && (
            <p className="text-muted text-xs font-body text-right leading-tight">
              {(topRow.best_score - myRow.best_score).toLocaleString()} pts<br/>
              <span style={{ color: '#CC2200' }}>behind #1</span>
            </p>
          )}
        </div>
      )}

      {/* Rankings */}
      <div className="flex-1 scroll-area px-4 pb-4 space-y-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-4xl">🏆</span>
            <p className="text-muted text-sm font-body">No scores yet tonight</p>
            <p className="text-muted text-xs">Be the first on the board!</p>
          </div>
        ) : (
          rows.map((row) => {
            const isMe   = row.display_name === patron?.display_name
            const rankMeta = RANK_DISPLAY[row.rank]

            return (
              <div
                key={`${row.game_id}-${row.display_name}`}
                className="rounded-xl p-3 flex items-center gap-3"
                style={{
                  background: isMe ? '#C9922A0D' : 'linear-gradient(145deg, #252218, #1E1B14)',
                  border: `1px solid ${isMe ? '#C9922A55' : '#3A3220'}`,
                  boxShadow: rankMeta ? `${rankMeta.glow}` : 'none',
                }}
              >
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {rankMeta ? (
                    <span className="text-xl">{rankMeta.icon}</span>
                  ) : (
                    <span className="score-font text-muted text-sm">#{row.rank}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base tracking-wide truncate"
                     style={{ color: isMe ? '#F0C040' : '#F5E0C0' }}>
                    {row.display_name}
                    {isMe && <span className="text-muted text-xs ml-1 font-body normal-case">(you)</span>}
                  </p>
                  <p className="text-muted text-[10px] font-body">
                    {TIER_LABELS[row.loyalty_tier] || '🐶 Pup'} · {row.plays} plays
                  </p>
                </div>

                {/* Score */}
                <span
                  className="score-font text-lg font-bold flex-shrink-0"
                  style={{
                    color: rankMeta ? rankMeta.color : isMe ? '#C9922A' : '#7A6A50',
                    textShadow: rankMeta ? rankMeta.glow : 'none',
                  }}
                >
                  {row.best_score.toLocaleString()}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

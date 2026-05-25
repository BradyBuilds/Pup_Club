// ─── EVENTS PAGE ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { getEvents, TIER_LABELS, getTierForXP } from '../lib/supabase'

export function Events() {
  const { venue } = useStore()
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!venue) return
    getEvents(venue.id).then(setEvents).finally(() => setLoading(false))
  }, [venue])

  function formatDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })
  }
  const isToday = (d) => d === new Date().toLocaleDateString('en-CA')

  return (
    <div className="h-full flex flex-col page-enter">
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <p className="font-script text-sm" style={{ color: '#C9922A88' }}>What's On</p>
        <h1 className="font-display text-4xl tracking-wider leading-none" style={{
          background: 'linear-gradient(180deg, #F0C040, #C9922A, #7A5C10)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          EVENTS
        </h1>
      </div>

      <div className="chain-divider mx-4 mb-4 flex-shrink-0" />

      <div className="flex-1 scroll-area px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-3xl animate-spin">🐾</div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-5xl">🎟️</span>
            <p className="text-muted text-sm font-body">No upcoming events posted yet</p>
            <p className="text-muted text-xs">Follow us on Instagram for updates</p>
          </div>
        ) : (
          events.map((ev) => {
            const today = isToday(ev.event_date)
            return (
              <div
                key={ev.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: today
                    ? 'linear-gradient(145deg, #2A2010, #1A1712)'
                    : 'linear-gradient(145deg, #252218, #1A1712)',
                  border: today ? '1px solid #C9922A66' : '1px solid #3A3220',
                  boxShadow: today ? '0 4px 24px #C9922A22' : 'none',
                }}
              >
                {today && (
                  <div className="px-4 py-1.5" style={{
                    background: 'linear-gradient(90deg, #F0C040, #C9922A)',
                  }}>
                    <p className="font-display text-xs tracking-widest text-bg">⚡ TONIGHT</p>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-display text-xl tracking-wide leading-tight" style={{ color: '#F5E0C0' }}>
                        {ev.title}
                      </h3>
                      {ev.performer && (
                        <p className="font-script text-base mt-0.5" style={{ color: '#C9922A' }}>
                          {ev.performer}
                        </p>
                      )}
                      {ev.description && (
                        <p className="text-muted text-xs font-body mt-2 leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-display text-sm tracking-wide text-muted">{formatDate(ev.event_date)}</p>
                      {ev.start_time && <p className="text-muted text-xs mt-0.5 font-body">{ev.start_time}</p>}
                      {ev.ticket_price && (
                        <p className="score-font text-sm mt-1" style={{ color: '#F0C040' }}>
                          ${parseFloat(ev.ticket_price).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                  {ev.ticket_url && (
                    <a
                      href={ev.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block w-full text-center py-2.5 rounded-xl font-display tracking-widest text-sm btn-press"
                      style={{
                        background: 'linear-gradient(135deg, #F0C040, #C9922A)',
                        color: '#0B0A07',
                        boxShadow: '0 2px 12px #C9922A44',
                      }}
                    >
                      GET TICKETS →
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
const TIER_ORDER = ['pup', 'alpha_pup', 'pack_leader', 'top_dog']
const TIER_XP    = { pup: 0, alpha_pup: 500, pack_leader: 2000, top_dog: 10000 }
const TIER_ICONS = { pup: '🐶', alpha_pup: '⚡', pack_leader: '👑', top_dog: '🔥' }

export function Profile() {
  const { patron, clearPatron, leaderboard } = useStore()

  if (!patron) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 page-enter">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
             style={{ background: '#252218', border: '1px solid #3A3220' }}>🐶</div>
        <p className="font-display text-2xl tracking-wide" style={{ color: '#F5E0C0' }}>No Profile Yet</p>
        <p className="text-muted text-sm font-body text-center">Play a game to start earning XP</p>
      </div>
    )
  }

  const xp      = patron.total_xp
  const tier    = patron.loyalty_tier
  const tierIdx = TIER_ORDER.indexOf(tier)
  const nextTier = TIER_ORDER[tierIdx + 1]
  const curXP   = TIER_XP[tier]
  const nextXP  = nextTier ? TIER_XP[nextTier] : null
  const progress = nextXP ? Math.min(((xp - curXP) / (nextXP - curXP)) * 100, 100) : 100

  const myBests = leaderboard
    .filter((r) => r.display_name === patron.display_name)
    .sort((a, b) => a.rank - b.rank)

  return (
    <div className="h-full flex flex-col page-enter">
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <p className="font-script text-sm" style={{ color: '#C9922A88' }}>Your</p>
        <h1 className="font-display text-4xl tracking-wider leading-none" style={{
          background: 'linear-gradient(180deg, #F0C040, #C9922A, #7A5C10)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          PROFILE
        </h1>
      </div>

      <div className="chain-divider mx-4 mb-4 flex-shrink-0" />

      <div className="flex-1 scroll-area px-4 pb-4 space-y-3">

        {/* Identity */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
             style={{ background: 'linear-gradient(145deg, #2A2518, #1A1712)', border: '1px solid #3A3220',
                      boxShadow: '0 0 30px #C9922A11' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #F0C04022, #C9922A11)', border: '1px solid #C9922A44' }}>
            {TIER_ICONS[tier] || '🐶'}
          </div>
          <div>
            <p className="font-display text-2xl tracking-wide" style={{ color: '#F5E0C0' }}>
              {patron.display_name}
            </p>
            <p className="font-display text-sm tracking-wider mt-0.5" style={{ color: '#C9922A' }}>
              {TIER_LABELS[tier]}
            </p>
            {patron.email && <p className="text-muted text-xs font-body mt-1">{patron.email}</p>}
          </div>
        </div>

        {/* XP */}
        <div className="rounded-2xl p-4"
             style={{ background: 'linear-gradient(145deg, #252218, #1A1712)', border: '1px solid #3A3220' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-display tracking-wide" style={{ color: '#F5E0C0' }}>XP Progress</p>
            <p className="score-font" style={{ color: '#C9922A' }}>{xp.toLocaleString()} XP</p>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#0B0A07' }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7A5C10, #F0C040)' }} />
          </div>
          {nextTier && (
            <p className="text-muted text-xs font-body mt-2 text-right">
              {(nextXP - xp).toLocaleString()} XP to {TIER_LABELS[nextTier]}
            </p>
          )}
          {!nextTier && (
            <p className="font-display text-xs tracking-widest mt-2 text-center shimmer-text">
              MAX TIER — TOP DOG 🔥
            </p>
          )}
        </div>

        {/* Tonight */}
        {myBests.length > 0 && (
          <div className="rounded-2xl p-4"
               style={{ background: 'linear-gradient(145deg, #252218, #1A1712)', border: '1px solid #3A3220' }}>
            <p className="font-display tracking-wide mb-3" style={{ color: '#F5E0C0' }}>Tonight's Ranks</p>
            <div className="space-y-2">
              {myBests.map((b) => (
                <div key={b.game_id} className="flex items-center justify-between">
                  <p className="text-muted text-sm font-body">{b.game_name}</p>
                  <div className="flex items-center gap-3">
                    <span className="score-font text-sm text-muted">{b.best_score.toLocaleString()}</span>
                    <span className="score-font text-sm font-bold"
                          style={{ color: b.rank <= 3 ? '#F0C040' : '#7A6A50' }}>
                      #{b.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tiers guide */}
        <div className="rounded-2xl p-4"
             style={{ background: 'linear-gradient(145deg, #252218, #1A1712)', border: '1px solid #3A3220' }}>
          <p className="font-display tracking-wide mb-3" style={{ color: '#F5E0C0' }}>Loyalty Tiers</p>
          <div className="space-y-1.5">
            {TIER_ORDER.map((t) => (
              <div key={t}
                   className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
                   style={t === tier ? { background: '#C9922A15', border: '1px solid #C9922A44' } : {}}>
                <p className="font-display text-sm tracking-wide"
                   style={{ color: t === tier ? '#F0C040' : '#7A6A50' }}>
                  {TIER_ICONS[t]} {TIER_LABELS[t]}
                </p>
                <p className="score-font text-muted text-xs">{TIER_XP[t].toLocaleString()}+ XP</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => window.confirm('Reset local session?') && clearPatron() && window.location.reload()}
          className="w-full py-3 text-muted text-sm font-body text-center btn-press"
        >
          Reset local session
        </button>
      </div>
    </div>
  )
}

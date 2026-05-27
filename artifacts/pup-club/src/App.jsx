import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { getVenue, getGames, getLeaderboardToday, supabase } from './lib/supabase'

import BottomNav       from './components/BottomNav'
import OnboardingModal from './components/OnboardingModal'
import RewardToast     from './components/RewardToast'
import LoadingScreen   from './components/LoadingScreen'

import Hub             from './pages/Hub'
import Leaderboard     from './pages/Leaderboard'
import Menu            from './pages/Menu'
import { Events, Profile } from './pages/EventsAndProfile'

import StackWarsLobby  from './games/StackWarsLobby'
import StackWarsDemo   from './games/StackWarsGame'

export default function App() {
  const {
    venue, setVenue,
    setGames, setLeaderboard,
    hasOnboarded,
    activeTab, setActiveTab,
    activeGame, clearActiveGame,
    pendingRewards,
  } = useStore()

  const [booting,   setBooting]   = useState(true)
  const [bootError, setBootError] = useState(null)

  useEffect(() => {
    async function boot() {
      try {
        const v = await getVenue()
        setVenue(v)
        const [games, lb] = await Promise.all([
          getGames(v.id),
          getLeaderboardToday(v.id),
        ])
        setGames(games)
        setLeaderboard(lb)
      } catch (err) {
        console.error('Boot error:', err)
        setBootError(err.message)
      } finally {
        setBooting(false)
      }
    }
    boot()
  }, [])

  useEffect(() => {
    if (!venue) return
    const channel = supabase
      .channel(`scores:${venue.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'scores',
        filter: `venue_id=eq.${venue.id}`,
      }, async () => {
        const lb = await getLeaderboardToday(venue.id)
        setLeaderboard(lb)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [venue])

  if (booting) return <LoadingScreen />

  if (bootError) return (
    <div className="flex items-center justify-center h-full bg-bg text-ink p-6 text-center">
      <div>
        <div className="text-4xl mb-4">🐾</div>
        <p className="font-display text-xl mb-2 tracking-wide" style={{ color: '#C9922A' }}>
          Connection Error
        </p>
        <p className="text-muted text-sm font-body">{bootError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-6 py-3 rounded-xl font-display text-lg tracking-wider btn-gold btn-press"
        >
          RETRY
        </button>
      </div>
    </div>
  )

  // ── Full-screen game overlay ──────────────────────────────────────────────
  if (activeGame) {
    const isStackWars = activeGame.slug === 'stack-wars'
    return (
      <div className="flex flex-col h-full bg-bg overflow-hidden">
        {/* Back bar */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid #3A3220', background: '#1A1712' }}
        >
          <button
            onClick={clearActiveGame}
            className="font-display text-sm tracking-wider btn-press"
            style={{ color: '#C9922A' }}
          >
            ← HUB
          </button>
          <span className="font-display text-base tracking-wide" style={{ color: '#F5E0C0' }}>
            {activeGame.name}
          </span>
        </div>

        {/* Game content */}
        <div className="flex-1 overflow-y-auto">
          {isStackWars
            ? <StackWarsLobby onExit={clearActiveGame} />
            : <StackWarsDemo />
          }
        </div>
      </div>
    )
  }

  const PAGES = { hub: Hub, leaderboard: Leaderboard, menu: Menu, events: Events, profile: Profile }
  const ActivePage = PAGES[activeTab] || Hub

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">
      {!hasOnboarded && <OnboardingModal />}

      {pendingRewards.map((r) => <RewardToast key={r.id} reward={r} />)}

      <main className="flex-1 overflow-hidden relative">
        <ActivePage />
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generates a unique session token and persists it to localStorage
function generateToken() {
  return 'pc_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Venue ──────────────────────────────────────────
      venue: null,
      setVenue: (venue) => set({ venue }),

      // ── Patron (persisted) ─────────────────────────────
      patron: null,
      sessionToken: generateToken(),
      hasOnboarded: false,

      setPatron: (patron) => set({ patron, hasOnboarded: true }),
      updatePatron: (updates) => set((s) => ({ patron: { ...s.patron, ...updates } })),
      clearPatron: () => set({ patron: null, hasOnboarded: false }),

      // ── Games ──────────────────────────────────────────
      games: [],
      setGames: (games) => set({ games }),

      // ── Leaderboard ────────────────────────────────────
      leaderboard: [],       // array of leaderboard_today rows
      setLeaderboard: (rows) => set({ leaderboard: rows }),

      // ── Active game ────────────────────────────────────
      activeGame: null,      // game object
      setActiveGame: (game) => set({ activeGame: game }),
      clearActiveGame: () => set({ activeGame: null }),

      // ── Rewards ────────────────────────────────────────
      pendingRewards: [],
      addReward: (reward) => set((s) => ({
        pendingRewards: [reward, ...s.pendingRewards],
      })),
      clearReward: (id) => set((s) => ({
        pendingRewards: s.pendingRewards.filter((r) => r.id !== id),
      })),

      // ── Nav ────────────────────────────────────────────
      activeTab: 'hub',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'pup-club-v1',
      // Only persist patron identity + session token
      partialState: (state) => ({
        sessionToken: state.sessionToken,
        patron: state.patron,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
)

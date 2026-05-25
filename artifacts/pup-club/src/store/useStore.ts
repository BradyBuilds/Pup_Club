import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Venue, Patron, Game } from '@workspace/api-client-react/src/generated/api.schemas';

export type TabType = 'hub' | 'leaderboard' | 'menu' | 'events' | 'profile';

export interface PendingReward {
  id: string;
  xp: number;
  message: string;
}

interface AppState {
  venue: Venue | null;
  patron: Patron | null;
  hasOnboarded: boolean;
  sessionToken: string;
  games: Game[];
  activeTab: TabType;
  activeGame: Game | null;
  pendingRewards: PendingReward[];
  
  setVenue: (venue: Venue | null) => void;
  setPatron: (patron: Patron | null) => void;
  setHasOnboarded: (hasOnboarded: boolean) => void;
  setGames: (games: Game[]) => void;
  setActiveTab: (tab: TabType) => void;
  setActiveGame: (game: Game | null) => void;
  addPendingReward: (reward: Omit<PendingReward, 'id'>) => void;
  removePendingReward: (id: string) => void;
  clearPendingRewards: () => void;
}

const generateSessionToken = () => 'pc_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      venue: null,
      patron: null,
      hasOnboarded: false,
      sessionToken: generateSessionToken(),
      games: [],
      activeTab: 'hub',
      activeGame: null,
      pendingRewards: [],
      
      setVenue: (venue) => set({ venue }),
      setPatron: (patron) => set({ patron }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setGames: (games) => set({ games }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setActiveGame: (activeGame) => set({ activeGame }),
      addPendingReward: (reward) => set((state) => ({ 
        pendingRewards: [...state.pendingRewards, { ...reward, id: Date.now().toString() }] 
      })),
      removePendingReward: (id) => set((state) => ({
        pendingRewards: state.pendingRewards.filter((r) => r.id !== id)
      })),
      clearPendingRewards: () => set({ pendingRewards: [] }),
    }),
    {
      name: 'pup-club-storage',
      partialize: (state) => ({ 
        sessionToken: state.sessionToken,
        hasOnboarded: state.hasOnboarded
      }),
    }
  )
);

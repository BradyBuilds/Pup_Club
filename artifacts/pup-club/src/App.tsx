import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetVenue, useGetGames, useGetPatron } from "@workspace/api-client-react";
import { getGetPatronQueryKey } from "@workspace/api-client-react";

import { useStore } from "./store/useStore";

import { LoadingScreen } from "./components/LoadingScreen";
import { OnboardingModal } from "./components/OnboardingModal";
import { BottomNav } from "./components/BottomNav";
import { RewardToast } from "./components/RewardToast";
import { PongGame } from "./games/PongGame";

import { Hub } from "./pages/Hub";
import { Leaderboard } from "./pages/Leaderboard";
import { Menu } from "./pages/Menu";
import { Events } from "./pages/Events";
import { Profile } from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { 
    sessionToken, 
    hasOnboarded, 
    setVenue, 
    setGames, 
    setPatron, 
    activeTab, 
    activeGame,
    venue,
    patron
  } = useStore();

  const { data: venueData, isLoading: isLoadingVenue, error: venueError } = useGetVenue();
  const { data: gamesData, isLoading: isLoadingGames } = useGetGames();
  
  // Try to fetch patron with sessionToken
  const { data: patronData, isLoading: isLoadingPatron, isError: isPatronError } = useGetPatron(
    { session_token: sessionToken },
    { 
      query: { 
        enabled: true, 
        queryKey: getGetPatronQueryKey({ session_token: sessionToken }),
        retry: false
      } 
    }
  );

  // Sync state
  useEffect(() => {
    if (venueData) setVenue(venueData);
  }, [venueData, setVenue]);

  useEffect(() => {
    if (gamesData) setGames(gamesData);
  }, [gamesData, setGames]);

  useEffect(() => {
    if (patronData) {
      setPatron(patronData);
      useStore.getState().setHasOnboarded(true);
    }
  }, [patronData, setPatron]);

  // Loading state
  const isBooting = isLoadingVenue || isLoadingGames || isLoadingPatron;

  if (isBooting) {
    return <LoadingScreen />;
  }
  
  if (venueError) {
    return (
      <div className="flex items-center justify-center h-full text-white p-4 text-center">
        <div>
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-bold text-[#FF2D78] mb-2">SYSTEM OFFLINE</h2>
          <p className="text-gray-400">Could not connect to the arcade server.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hasOnboarded && <OnboardingModal />}
      
      {hasOnboarded && (
        <>
          <RewardToast />
          
          {/* Active Page View */}
          <div className="h-full w-full bg-[#0D0D1A]">
            {activeTab === 'hub' && <Hub />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'menu' && <Menu />}
            {activeTab === 'events' && <Events />}
            {activeTab === 'profile' && <Profile />}
          </div>
          
          <BottomNav />
          
          {/* Fullscreen Games */}
          {activeGame?.slug === 'pong' && <PongGame />}
          
          {/* Placeholders for other games */}
          {activeGame && activeGame.slug !== 'pong' && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
              <div className="text-6xl mb-6">👾</div>
              <h2 className="text-4xl font-display font-bold text-[#00E5FF] neon-text-secondary uppercase tracking-widest text-center px-4">
                Coming Soon
              </h2>
              <p className="text-gray-400 mt-4 font-mono text-sm text-center px-8">
                The mechanics are still tweaking the cabinet.
              </p>
              <button 
                onClick={() => useStore.getState().setActiveGame(null)}
                className="mt-8 bg-transparent border border-[#00E5FF] text-[#00E5FF] px-8 py-3 rounded-lg font-bold uppercase tracking-wider"
              >
                Back to Hub
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

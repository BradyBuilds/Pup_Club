import { useStore, TabType } from '../store/useStore';

export function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'hub', icon: '🎮', label: 'Hub' },
    { id: 'leaderboard', icon: '🏆', label: 'Board' },
    { id: 'menu', icon: '🍺', label: 'Menu' },
    { id: 'events', icon: '🎭', label: 'Events' },
    { id: 'profile', icon: '👤', label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#1A1A2E] border-t border-[#252540] flex justify-around items-center z-40 pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-[#FF2D78]' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <span className={`text-xl ${isActive ? 'neon-text-primary' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-sans font-medium">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

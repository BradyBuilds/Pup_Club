const TABS = [
  { id: 'hub',         icon: '🎮', label: 'Games'  },
  { id: 'leaderboard', icon: '🏆', label: 'Board'  },
  { id: 'menu',        icon: '🍺', label: 'Menu'   },
  { id: 'events',      icon: '🎟️', label: 'Events' },
  { id: 'profile',     icon: '🐶', label: 'Me'     },
]

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="flex-shrink-0 bg-surface pb-safe"
         style={{ borderTop: '1px solid #3A3220', boxShadow: '0 -4px 20px #0B0A0788' }}>
      <div className="flex">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5
                transition-all duration-150 btn-press relative"
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                     style={{ background: 'linear-gradient(90deg, #F0C040, #C9922A)' }} />
              )}

              <span className={`text-xl leading-none transition-all
                ${active ? '' : 'opacity-30 grayscale'}`}>
                {tab.icon}
              </span>

              <span className={`text-[9px] font-display tracking-widest uppercase transition-all
                ${active ? 'text-gold-gradient' : 'text-muted'}`}
                style={active ? {
                  background: 'linear-gradient(180deg, #F0C040, #C9922A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : {}}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

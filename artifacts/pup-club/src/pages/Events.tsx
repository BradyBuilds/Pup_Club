import { useGetEvents } from '@workspace/api-client-react';

export function Events() {
  const { data: events, isLoading } = useGetEvents();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="text-[#00E5FF] font-mono text-sm animate-pulse">Loading events...</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-gray-500">
        <span className="text-3xl mb-2">🎭</span>
        <p className="font-mono text-sm uppercase">No upcoming events</p>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return (
    <div className="h-full overflow-y-auto pb-20 p-4 space-y-6">
      <header>
        <h1 className="text-4xl font-display font-bold text-[#FF2D78] neon-text-primary uppercase tracking-wider flex items-center gap-2">
          <span>🎭</span> Events
        </h1>
        <p className="text-gray-400 text-sm mt-1">Live at the Deaf Puppy.</p>
      </header>

      <div className="space-y-4">
        {sortedEvents.map(event => {
          const date = new Date(event.event_date);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          
          return (
            <div 
              key={event.id}
              className="bg-[#1A1A2E] border border-[#252540] rounded-xl overflow-hidden flex flex-col relative"
            >
              {event.is_featured && (
                <div className="absolute top-0 right-0 bg-[#FF2D78] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg z-10">
                  Featured
                </div>
              )}
              
              <div className="p-4 flex gap-4">
                <div className="flex flex-col items-center justify-center bg-[#0D0D1A] rounded-lg p-2 min-w-[70px] border border-[#252540]">
                  <span className="text-xs text-gray-400 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-2xl font-display font-bold text-white">{date.getDate()}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white truncate">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                    {event.start_time && (
                      <span className="flex items-center gap-1">
                        <span className="text-[#00E5FF]">⏱</span> {event.start_time}
                      </span>
                    )}
                  </div>
                  {event.performer && (
                    <div className="text-sm text-[#FF2D78] mt-1 font-medium truncate">
                      w/ {event.performer}
                    </div>
                  )}
                </div>
              </div>
              
              {(event.description || event.ticket_url) && (
                <div className="px-4 pb-4 pt-2 border-t border-[#252540] mt-2 bg-[#0D0D1A]/50">
                  {event.description && (
                    <p className="text-sm text-gray-400 mb-3">{event.description}</p>
                  )}
                  
                  {event.ticket_url && (
                    <div className="flex items-center justify-between mt-2">
                      {event.ticket_price !== null && (
                        <span className="font-mono font-bold text-[#39FF14]">
                          ${event.ticket_price}
                        </span>
                      )}
                      <a 
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#00E5FF] text-[#0D0D1A] px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ml-auto hover:bg-[#00E5FF]/90"
                      >
                        Get Tickets
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

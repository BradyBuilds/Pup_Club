import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useCreatePatron } from '@workspace/api-client-react';

export function OnboardingModal() {
  const { venue, sessionToken, setPatron, setHasOnboarded } = useStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  const createPatron = useCreatePatron();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !venue) return;

    createPatron.mutate(
      {
        data: {
          venue_id: venue.id,
          display_name: displayName.trim(),
          email: email.trim() || null,
          session_token: sessionToken,
        }
      },
      {
        onSuccess: (patron) => {
          setPatron(patron);
          setHasOnboarded(true);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A2E] border border-[#FF2D78] neon-border-primary rounded-xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🐾</div>
          <h2 className="text-3xl font-display font-bold neon-text-primary text-[#FF2D78]">PUP CLUB</h2>
          <p className="text-gray-400 text-sm mt-2">Enter the arcade.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
              Display Name *
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. PACMAN_99"
              className="w-full bg-[#0D0D1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78]"
              required
              maxLength={20}
              disabled={createPatron.isPending}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email (optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="For special rewards"
              className="w-full bg-[#0D0D1A] border border-[#252540] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78]"
              disabled={createPatron.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={!displayName.trim() || createPatron.isPending}
            className="w-full mt-6 bg-[#FF2D78] text-white font-bold py-3 rounded-lg uppercase tracking-wider disabled:opacity-50 hover:bg-opacity-90 active:bg-opacity-80 transition-opacity"
          >
            {createPatron.isPending ? 'Joining...' : 'Insert Coin'}
          </button>
        </form>
      </div>
    </div>
  );
}

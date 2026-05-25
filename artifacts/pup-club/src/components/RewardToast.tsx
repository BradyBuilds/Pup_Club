import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function RewardToast() {
  const { pendingRewards, removePendingReward } = useStore();

  useEffect(() => {
    if (pendingRewards.length > 0) {
      const timer = setTimeout(() => {
        removePendingReward(pendingRewards[0].id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingRewards, removePendingReward]);

  if (pendingRewards.length === 0) return null;

  const reward = pendingRewards[0];

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#1A1A2E] border-2 border-[#39FF14] rounded-lg px-6 py-3 shadow-[0_0_15px_rgba(57,255,20,0.3)] flex items-center space-x-3">
        <div className="text-2xl">🎮</div>
        <div>
          <p className="text-[#39FF14] font-mono font-bold text-sm">
            +{reward.xp} XP EARNED!
          </p>
          <p className="text-gray-300 text-xs">
            {reward.message}
          </p>
        </div>
      </div>
    </div>
  );
}

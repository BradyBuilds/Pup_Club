import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function RewardToast({ reward }) {
  const { clearReward } = useStore()

  useEffect(() => {
    const t = setTimeout(() => clearReward(reward.id), 9000)
    return () => clearTimeout(t)
  }, [reward.id])

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: 'linear-gradient(145deg, #2A2518, #1A1712)',
        border: '1px solid #C9922A66',
        boxShadow: '0 8px 30px #00000088, 0 0 40px #C9922A33',
      }}
    >
      <div className="text-3xl flex-shrink-0">🏆</div>
      <div className="flex-1">
        <p className="font-display text-lg tracking-wide glow-gold" style={{
          background: 'linear-gradient(135deg, #F0C040, #C9922A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {reward.title}
        </p>
        <p className="text-cream-dk text-sm font-body mt-0.5">{reward.description}</p>
        {reward.reward_code && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1"
               style={{ background: '#0B0A07', border: '1px solid #3A3220' }}>
            <span className="score-font text-sm tracking-widest" style={{ color: '#F0C040' }}>
              {reward.reward_code}
            </span>
            <span className="text-muted text-xs">— show at bar</span>
          </div>
        )}
      </div>
      <button
        onClick={() => clearReward(reward.id)}
        className="text-muted text-xl leading-none btn-press flex-shrink-0"
      >
        ×
      </button>
    </div>
  )
}

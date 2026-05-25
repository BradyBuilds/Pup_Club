import { useState } from 'react'
import { useStore } from '../store/useStore'
import { getOrCreatePatron } from '../lib/supabase'

export default function OnboardingModal() {
  const { venue, sessionToken, setPatron } = useStore()
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) {
      setError('Need at least 2 characters')
      return
    }
    setError('')
    setStep(2)
  }

  async function handleFinish(skipEmail = false) {
    if (loading) return
    setLoading(true)
    try {
      const patron = await getOrCreatePatron({
        venueId:     venue.id,
        sessionToken,
        displayName: name.trim(),
        email:       skipEmail ? null : (email.trim() || null),
        phone:       null,
      })
      setPatron(patron)
    } catch (err) {
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6"
         style={{ background: 'linear-gradient(180deg, #0B0A07EE 0%, #1A1712F8 100%)', backdropFilter: 'blur(8px)' }}>

      {/* Chain ring + mascot */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-4">
        {/* Outer chain ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="58" fill="none"
            stroke="url(#chainGrad)" strokeWidth="6"
            strokeDasharray="12 6" strokeLinecap="round" />
          <defs>
            <linearGradient id="chainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#F0C040" />
              <stop offset="50%"  stopColor="#C9922A" />
              <stop offset="100%" stopColor="#7A5C10" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-3 rounded-full"
             style={{ background: 'radial-gradient(circle, #25221888, #0B0A07CC)' }} />
        <span className="text-5xl relative z-10">🐶</span>
      </div>

      {/* Brand */}
      <h1 className="font-display text-5xl tracking-wider leading-none shimmer-text">
        PUP CLUB
      </h1>
      <p className="font-script text-2xl glow-gold mt-0.5 mb-1"
         style={{ color: '#C9922A' }}>
        Comedy Club
      </p>
      <p className="text-muted text-xs tracking-widest uppercase font-body mb-7">
        Deaf Puppy · Manteca, CA
      </p>

      {/* Chain divider */}
      <div className="chain-divider w-full max-w-xs mb-7 opacity-60" />

      {step === 1 ? (
        /* ── Step 1: Name ─────────────────────────── */
        <form onSubmit={handleNameSubmit} className="w-full max-w-xs flex flex-col gap-4">
          <div>
            <label className="text-muted text-[10px] font-display tracking-widest uppercase mb-2 block">
              Enter Your Name to Play
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Your name or nickname"
              maxLength={20}
              className="w-full rounded-xl px-4 py-4 font-display text-xl tracking-wide
                placeholder-muted focus:outline-none transition-all"
              style={{
                background: '#252218',
                border: '1px solid #3A3220',
                color: '#F5E0C0',
                boxShadow: 'inset 0 2px 8px #00000044',
              }}
              onFocus={(e) => e.target.style.borderColor = '#C9922A'}
              onBlur={(e)  => e.target.style.borderColor = '#3A3220'}
            />
            {error && <p className="text-red-lt text-xs mt-1.5 font-body">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl py-4 btn-gold btn-press text-xl tracking-widest"
          >
            ENTER THE ARENA
          </button>
        </form>
      ) : (
        /* ── Step 2: Email ────────────────────────── */
        <div className="w-full max-w-xs flex flex-col gap-4">
          {/* Bonus callout */}
          <div className="rounded-xl p-3.5 text-center"
               style={{ background: '#C9922A18', border: '1px solid #C9922A44' }}>
            <p className="font-display text-xl tracking-wide"
               style={{ color: '#F0C040' }}>
              +50 BONUS XP
            </p>
            <p className="text-muted text-xs font-body mt-0.5">
              Save your score · Get notified about shows
            </p>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com (optional)"
            className="w-full rounded-xl px-4 py-4 font-body text-base
              placeholder-muted focus:outline-none transition-all"
            style={{
              background: '#252218',
              border: '1px solid #3A3220',
              color: '#F5E0C0',
              boxShadow: 'inset 0 2px 8px #00000044',
            }}
            onFocus={(e) => e.target.style.borderColor = '#C9922A'}
            onBlur={(e)  => e.target.style.borderColor = '#3A3220'}
          />

          {error && <p className="text-red-lt text-xs font-body">{error}</p>}

          <button
            onClick={() => handleFinish(false)}
            disabled={loading}
            className="w-full rounded-xl py-4 btn-gold btn-press text-xl tracking-widest disabled:opacity-50"
          >
            {loading ? 'LOADING…' : 'CLAIM XP + PLAY'}
          </button>

          <button
            onClick={() => handleFinish(true)}
            disabled={loading}
            className="text-muted text-sm font-body text-center py-2 btn-press"
          >
            Skip — just play
          </button>
        </div>
      )}
    </div>
  )
}

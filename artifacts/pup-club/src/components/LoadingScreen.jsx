export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg gap-5 px-8">

      {/* Chain ring decoration */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-chain opacity-60"
             style={{ background: 'radial-gradient(circle, #25221820, #0B0A0700)' }} />
        <div className="absolute inset-2 rounded-full border border-gold opacity-30" />
        <span className="text-5xl relative z-10">🐶</span>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-5xl tracking-wider shimmer-text leading-none">
          PUP CLUB
        </h1>
        <p className="font-script text-gold text-xl mt-1 glow-gold">
          Comedy Club
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-gold live-pulse"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>

      <p className="text-muted text-xs font-body tracking-widest uppercase mt-1">
        Manteca, CA
      </p>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D1A]">
      <div className="text-7xl mb-4 animate-bounce">🐾</div>
      <h1 className="text-5xl font-display font-bold text-[#FF2D78] neon-text-primary tracking-widest animate-pulse">
        PUP CLUB
      </h1>
      <p className="text-[#00E5FF] mt-4 font-mono text-sm neon-text-secondary">LOADING...</p>
    </div>
  );
}

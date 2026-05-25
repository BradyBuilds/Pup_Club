export const XP_THRESHOLDS = {
  pup: 0,
  alpha_pup: 500,
  pack_leader: 2000,
  top_dog: 10000,
};

export const TIER_LABELS: Record<string, string> = {
  pup: "Pup",
  alpha_pup: "Alpha Pup",
  pack_leader: "Pack Leader",
  top_dog: "Top Dog",
};

export const TIER_COLORS: Record<string, string> = {
  pup: "text-gray-400 bg-gray-900/50 border-gray-700",
  alpha_pup: "text-yellow-400 bg-yellow-900/20 border-yellow-700/50",
  pack_leader: "text-purple-400 bg-purple-900/20 border-purple-700/50",
  top_dog: "text-orange-500 bg-orange-900/20 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]",
};

export function getTierForXP(xp: number): string {
  if (xp >= XP_THRESHOLDS.top_dog) return "top_dog";
  if (xp >= XP_THRESHOLDS.pack_leader) return "pack_leader";
  if (xp >= XP_THRESHOLDS.alpha_pup) return "alpha_pup";
  return "pup";
}

export function getNextTierInfo(xp: number): { nextTier: string | null; xpNeeded: number; progress: number } {
  if (xp >= XP_THRESHOLDS.top_dog) {
    return { nextTier: null, xpNeeded: 0, progress: 1 };
  }
  
  let currentThreshold = 0;
  let nextThreshold = 0;
  let nextTier = "";

  if (xp < XP_THRESHOLDS.alpha_pup) {
    currentThreshold = XP_THRESHOLDS.pup;
    nextThreshold = XP_THRESHOLDS.alpha_pup;
    nextTier = "alpha_pup";
  } else if (xp < XP_THRESHOLDS.pack_leader) {
    currentThreshold = XP_THRESHOLDS.alpha_pup;
    nextThreshold = XP_THRESHOLDS.pack_leader;
    nextTier = "pack_leader";
  } else {
    currentThreshold = XP_THRESHOLDS.pack_leader;
    nextThreshold = XP_THRESHOLDS.top_dog;
    nextTier = "top_dog";
  }

  const range = nextThreshold - currentThreshold;
  const currentProgress = xp - currentThreshold;
  const progress = Math.min(1, Math.max(0, currentProgress / range));

  return {
    nextTier,
    xpNeeded: nextThreshold - xp,
    progress,
  };
}

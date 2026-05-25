import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

export const VENUE_SLUG = import.meta.env.VITE_VENUE_SLUG || 'dpcc'

// ── Helpers ──────────────────────────────────────────────

/** Get the current venue record */
export async function getVenue() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', VENUE_SLUG)
    .single()
  if (error) throw error
  return data
}

/** Get all active games for venue */
export async function getGames(venueId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data
}

/** Get today's leaderboard for all games */
export async function getLeaderboardToday(venueId) {
  const { data, error } = await supabase
    .from('leaderboard_today')
    .select('*')
    .order('game_id')
    .order('rank')
  if (error) throw error
  return data
}

/** Get or create patron from session token */
export async function getOrCreatePatron({ venueId, sessionToken, displayName, email, phone }) {
  // Try to find existing patron
  const { data: existing } = await supabase
    .from('patrons')
    .select('*')
    .eq('session_token', sessionToken)
    .single()

  if (existing) {
    // Update last_seen
    await supabase
      .from('patrons')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing
  }

  // Create new patron
  const { data, error } = await supabase
    .from('patrons')
    .insert({ venue_id: venueId, session_token: sessionToken, display_name: displayName, email, phone })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Submit a score */
export async function submitScore({ gameId, patronId, venueId, score, durationSecs }) {
  const { data, error } = await supabase
    .from('scores')
    .insert({
      game_id: gameId,
      patron_id: patronId,
      venue_id: venueId,
      score,
      duration_secs: durationSecs,
      session_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Get menu items for venue */
export async function getMenu(venueId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_available', true)
    .order('category')
    .order('sort_order')
  if (error) throw error
  return data
}

/** Get upcoming events */
export async function getEvents(venueId) {
  const today = new Date().toLocaleDateString('en-CA')
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .gte('event_date', today)
    .order('event_date')
    .limit(10)
  if (error) throw error
  return data
}

/** Award XP and check for tier up */
export async function awardXP(patronId, xpAmount) {
  const { data: patron } = await supabase
    .from('patrons')
    .select('total_xp, loyalty_tier')
    .eq('id', patronId)
    .single()

  if (!patron) return null

  const newXP = patron.total_xp + xpAmount
  const newTier = getTierForXP(newXP)
  const tieredUp = newTier !== patron.loyalty_tier

  await supabase
    .from('patrons')
    .update({ total_xp: newXP, loyalty_tier: newTier })
    .eq('id', patronId)

  return { newXP, newTier, tieredUp }
}

export function getTierForXP(xp) {
  if (xp >= 10000) return 'top_dog'
  if (xp >= 2000)  return 'pack_leader'
  if (xp >= 500)   return 'alpha_pup'
  return 'pup'
}

export const TIER_LABELS = {
  pup:         '🐶 Pup',
  alpha_pup:   '⚡ Alpha Pup',
  pack_leader: '👑 Pack Leader',
  top_dog:     '🔥 Top Dog',
}

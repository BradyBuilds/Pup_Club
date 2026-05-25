import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const VENUE_SLUG = process.env.VITE_VENUE_SLUG ?? "dpcc";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  logger.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export { VENUE_SLUG };

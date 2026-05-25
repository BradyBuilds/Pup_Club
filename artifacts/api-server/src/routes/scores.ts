import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import {
  SubmitScoreBody,
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
  GetLeaderboardAlltimeQueryParams,
  GetLeaderboardAlltimeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/scores", async (req, res): Promise<void> => {
  const parsed = SubmitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await supabase
    .from("scores")
    .insert({
      game_id: parsed.data.game_id,
      patron_id: parsed.data.patron_id,
      venue_id: parsed.data.venue_id,
      score: parsed.data.score,
      duration_secs: parsed.data.duration_secs ?? null,
      session_date: new Date().toLocaleDateString("en-CA"),
    })
    .select()
    .single();

  if (error || !data) {
    req.log.error({ error }, "Failed to submit score");
    res.status(500).json({ error: "Failed to submit score" });
    return;
  }

  // Award XP to patron (10 XP per point, capped at 500 per game)
  const xpEarned = Math.min(parsed.data.score * 10, 500);

  // Direct XP update
  const { data: patron } = await supabase
    .from("patrons")
    .select("total_xp")
    .eq("id", parsed.data.patron_id)
    .single();

  if (patron) {
    const newXP = patron.total_xp + xpEarned;
    const newTier = getTierForXP(newXP);
    await supabase
      .from("patrons")
      .update({ total_xp: newXP, loyalty_tier: newTier })
      .eq("id", parsed.data.patron_id);
  }

  res.status(201).json(data);
});

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let query = supabase
    .from("leaderboard_today")
    .select("*")
    .order("rank");

  if (parsed.data.game_slug) {
    query = query.eq("game_slug", parsed.data.game_slug);
  }

  const { data, error } = await query;

  if (error) {
    req.log.error({ error }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
    return;
  }

  res.json(GetLeaderboardResponse.parse(data ?? []));
});

router.get("/leaderboard/alltime", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardAlltimeQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let query = supabase
    .from("leaderboard_alltime")
    .select("*")
    .order("rank");

  if (parsed.data.game_slug) {
    query = query.eq("game_slug", parsed.data.game_slug);
  }

  const { data, error } = await query;

  if (error) {
    req.log.error({ error }, "Failed to fetch all-time leaderboard");
    res.status(500).json({ error: "Failed to fetch all-time leaderboard" });
    return;
  }

  res.json(GetLeaderboardAlltimeResponse.parse(data ?? []));
});

function getTierForXP(xp: number): string {
  if (xp >= 10000) return "top_dog";
  if (xp >= 2000) return "pack_leader";
  if (xp >= 500) return "alpha_pup";
  return "pup";
}

export default router;

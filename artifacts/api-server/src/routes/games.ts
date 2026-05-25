import { Router, type IRouter } from "express";
import { supabase, VENUE_SLUG } from "../lib/supabase";
import { GetGamesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/games", async (req, res): Promise<void> => {
  // First get venue id
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", VENUE_SLUG)
    .single();

  if (venueError || !venue) {
    req.log.error({ venueError }, "Venue not found");
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    req.log.error({ error }, "Failed to fetch games");
    res.status(500).json({ error: "Failed to fetch games" });
    return;
  }

  res.json(GetGamesResponse.parse(data ?? []));
});

export default router;

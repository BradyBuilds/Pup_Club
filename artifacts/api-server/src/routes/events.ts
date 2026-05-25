import { Router, type IRouter } from "express";
import { supabase, VENUE_SLUG } from "../lib/supabase";
import { GetEventsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", VENUE_SLUG)
    .single();

  if (venueError || !venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const today = new Date().toLocaleDateString("en-CA");
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .gte("event_date", today)
    .order("event_date")
    .limit(10);

  if (error) {
    req.log.error({ error }, "Failed to fetch events");
    res.status(500).json({ error: "Failed to fetch events" });
    return;
  }

  res.json(GetEventsResponse.parse(data ?? []));
});

export default router;

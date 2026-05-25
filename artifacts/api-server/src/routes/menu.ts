import { Router, type IRouter } from "express";
import { supabase, VENUE_SLUG } from "../lib/supabase";
import { GetMenuResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/menu", async (req, res): Promise<void> => {
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", VENUE_SLUG)
    .single();

  if (venueError || !venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("is_available", true)
    .order("category")
    .order("sort_order");

  if (error) {
    req.log.error({ error }, "Failed to fetch menu");
    res.status(500).json({ error: "Failed to fetch menu" });
    return;
  }

  res.json(GetMenuResponse.parse(data ?? []));
});

export default router;

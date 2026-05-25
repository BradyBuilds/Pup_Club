import { Router, type IRouter } from "express";
import { supabase, VENUE_SLUG } from "../lib/supabase";
import { GetVenueResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/venue", async (req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", VENUE_SLUG)
    .single();

  if (error || !data) {
    req.log.error({ error }, "Failed to fetch venue");
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  res.json(GetVenueResponse.parse(data));
});

export default router;

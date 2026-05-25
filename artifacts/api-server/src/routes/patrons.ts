import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import {
  GetPatronQueryParams,
  GetPatronResponse,
  CreatePatronBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/patrons/me", async (req, res): Promise<void> => {
  const parsed = GetPatronQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await supabase
    .from("patrons")
    .select("*")
    .eq("session_token", parsed.data.session_token)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Patron not found" });
    return;
  }

  // Update last_seen_at
  await supabase
    .from("patrons")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);

  res.json(GetPatronResponse.parse(data));
});

router.post("/patrons", async (req, res): Promise<void> => {
  const parsed = CreatePatronBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check if session_token already exists
  const { data: existing } = await supabase
    .from("patrons")
    .select("*")
    .eq("session_token", parsed.data.session_token)
    .single();

  if (existing) {
    res.status(201).json(GetPatronResponse.parse(existing));
    return;
  }

  const { data, error } = await supabase
    .from("patrons")
    .insert({
      venue_id: parsed.data.venue_id,
      display_name: parsed.data.display_name,
      email: parsed.data.email ?? null,
      session_token: parsed.data.session_token,
    })
    .select()
    .single();

  if (error || !data) {
    req.log.error({ error }, "Failed to create patron");
    res.status(500).json({ error: "Failed to create patron" });
    return;
  }

  res.status(201).json(GetPatronResponse.parse(data));
});

export default router;

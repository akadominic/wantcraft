// POST /api/check — confirms the access code and reports which services are configured.
import { authorized, onlyPost, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  sendJson(res, 200, {
    ok: true,
    coach: Boolean(process.env.ANTHROPIC_API_KEY),
    voice: Boolean(process.env.ELEVENLABS_API_KEY),
    model: process.env.COACH_MODEL || "claude-sonnet-5-5"
  });
}

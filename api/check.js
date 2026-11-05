// POST /api/check — confirms the access code and reports which services are configured.
import { authorized, onlyPost, sendJson } from "../lib/http.js";
import { voiceProvider } from "../lib/voice.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  const provider = voiceProvider();
  sendJson(res, 200, {
    ok: true,
    coach: Boolean(process.env.ANTHROPIC_API_KEY),
    voice: Boolean(provider),
    voiceProvider: provider,
    defaultVoice: provider === "fish" ? Boolean(process.env.FISH_VOICE_ID) : true,
    model: process.env.COACH_MODEL || "claude-sonnet-5-5"
  });
}

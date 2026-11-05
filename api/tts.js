// POST /api/tts — turns the coach's spoken line into natural speech with ElevenLabs (MP3).
import { authorized, onlyPost, readJson, sendJson } from "../lib/http.js";

const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // "Rachel", an ElevenLabs premade voice
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  if (!process.env.ELEVENLABS_API_KEY) return sendJson(res, 501, { error: "not_configured", message: "No ElevenLabs key; using the device voice." });

  let body;
  try { body = await readJson(req); } catch { return sendJson(res, 400, { error: "bad_request" }); }
  const text = String(body.text || "").replace(/\s+/g, " ").trim().slice(0, 2500);
  if (!text) return sendJson(res, 400, { error: "bad_request", message: "Nothing to say." });
  const voice = /^[A-Za-z0-9]{16,32}$/.test(String(body.voice || "")) ? body.voice : DEFAULT_VOICE;

  let up;
  try {
    up = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.45, similarity_boost: 0.8 } })
    });
  } catch {
    return sendJson(res, 502, { error: "upstream_error", message: "Couldn't reach ElevenLabs." });
  }
  if (!up.ok || !up.body) {
    let detail = "";
    try { const j = await up.json(); detail = j?.detail?.message || j?.detail || ""; } catch {}
    return sendJson(res, up.status === 429 ? 429 : 502, { error: up.status === 401 ? "bad_api_key" : "upstream_error", message: String(detail || `ElevenLabs returned ${up.status}.`) });
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  for await (const chunk of up.body) res.write(chunk);
  res.end();
}

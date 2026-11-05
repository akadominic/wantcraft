// POST /api/tts — turns the coach's spoken line into natural speech (MP3).
// Uses Fish Audio when FISH_API_KEY is set, otherwise ElevenLabs.
import { authorized, onlyPost, readJson, sendJson } from "../lib/http.js";
import { voiceProvider } from "../lib/voice.js";

const EL_DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // "Rachel", an ElevenLabs premade voice
const EL_MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";
const FISH_MODEL = process.env.FISH_MODEL || "s2.1-pro";
// Default coach voice when FISH_VOICE_ID isn't set in Vercel (the environment variable wins).
export const FISH_DEFAULT_VOICE = "R7mK2vN9xP4qT8bW3yH6cF1jL5sD0a";

function fishRequest(text, voice) {
  const body = { text, format: "mp3", mp3_bitrate: 128, latency: "balanced" };
  const ref = voice || process.env.FISH_VOICE_ID || FISH_DEFAULT_VOICE;
  if (ref) body.reference_id = ref;
  return fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.FISH_API_KEY}`, "content-type": "application/json", model: FISH_MODEL },
    body: JSON.stringify(body)
  });
}
function elevenRequest(text, voice) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice || EL_DEFAULT_VOICE}/stream?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: EL_MODEL, voice_settings: { stability: 0.45, similarity_boost: 0.8 } })
  });
}

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  const provider = voiceProvider();
  if (!provider) return sendJson(res, 501, { error: "not_configured", message: "No voice key on the server; using the device voice." });

  let body;
  try { body = await readJson(req); } catch { return sendJson(res, 400, { error: "bad_request" }); }
  const text = String(body.text || "").replace(/\s+/g, " ").trim().slice(0, 2500);
  if (!text) return sendJson(res, 400, { error: "bad_request", message: "Nothing to say." });
  const voice = /^[A-Za-z0-9_-]{8,64}$/.test(String(body.voice || "")) ? String(body.voice) : "";

  let up;
  try { up = provider === "fish" ? await fishRequest(text, voice) : await elevenRequest(text, voice); }
  catch { return sendJson(res, 502, { error: "upstream_error", message: `Couldn't reach ${provider === "fish" ? "Fish Audio" : "ElevenLabs"}.` }); }

  if (!up.ok || !up.body) {
    let detail = "";
    try { const j = await up.json(); detail = j?.message || j?.detail?.message || j?.detail || ""; } catch {}
    const code = up.status === 401 ? "bad_api_key" : up.status === 402 ? "out_of_credit" : "upstream_error";
    return sendJson(res, up.status === 429 || up.status === 503 ? 429 : 502, { error: code, message: String(detail || `Voice service returned ${up.status}.`) });
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  for await (const chunk of up.body) res.write(chunk);
  res.end();
}

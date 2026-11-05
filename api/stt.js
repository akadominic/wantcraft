// POST /api/stt — transcribes a recorded clip with ElevenLabs Scribe.
// Used only in browsers without built-in speech recognition (e.g. Firefox).
import { authorized, onlyPost, readRaw, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  if (!process.env.ELEVENLABS_API_KEY) return sendJson(res, 501, { error: "not_configured", message: "No ElevenLabs key for transcription." });

  let audio;
  try { audio = await readRaw(req, 10 * 1024 * 1024); } catch (e) { return sendJson(res, e.status || 400, { error: "bad_request", message: "Recording too large." }); }
  if (!audio.length) return sendJson(res, 400, { error: "bad_request", message: "Empty recording." });

  const type = String(req.headers["x-audio-type"] || "audio/webm").split(";")[0];
  const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
  form.append("file", new Blob([audio], { type }), `clip.${ext}`);

  let up;
  try {
    up = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, body: form });
  } catch {
    return sendJson(res, 502, { error: "upstream_error", message: "Couldn't reach ElevenLabs." });
  }
  let j = null;
  try { j = await up.json(); } catch {}
  if (!up.ok) return sendJson(res, 502, { error: "upstream_error", message: String(j?.detail?.message || j?.detail || `ElevenLabs returned ${up.status}.`) });
  sendJson(res, 200, { text: String(j?.text || "").trim() });
}

// POST /api/stt — transcribes a recorded clip (Fish Audio, or ElevenLabs Scribe).
// Used only in browsers without built-in speech recognition (e.g. Firefox).
import { authorized, onlyPost, readRaw, sendJson } from "../lib/http.js";
import { voiceProvider } from "../lib/voice.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  const provider = voiceProvider();
  if (!provider) return sendJson(res, 501, { error: "not_configured", message: "No voice key on the server for transcription." });

  let audio;
  try { audio = await readRaw(req, 10 * 1024 * 1024); } catch (e) { return sendJson(res, e.status || 400, { error: "bad_request", message: "Recording too large." }); }
  if (!audio.length) return sendJson(res, 400, { error: "bad_request", message: "Empty recording." });

  const type = String(req.headers["x-audio-type"] || "audio/webm").split(";")[0];
  const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
  const file = new Blob([audio], { type });
  const form = new FormData();
  let url, headers;
  if (provider === "fish") {
    url = "https://api.fish.audio/v1/asr";
    headers = { authorization: `Bearer ${process.env.FISH_API_KEY}`, model: process.env.FISH_STT_MODEL || "transcribe-1-pro" };
    form.append("audio", file, `clip.${ext}`);
    form.append("language", "en");
  } else {
    url = "https://api.elevenlabs.io/v1/speech-to-text";
    headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
    form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
    form.append("file", file, `clip.${ext}`);
  }

  let up;
  try { up = await fetch(url, { method: "POST", headers, body: form }); }
  catch { return sendJson(res, 502, { error: "upstream_error", message: "Couldn't reach the transcription service." }); }
  let j = null;
  try { j = await up.json(); } catch {}
  if (!up.ok) return sendJson(res, 502, { error: "upstream_error", message: String(j?.message || j?.detail?.message || j?.detail || `Transcription returned ${up.status}.`) });
  sendJson(res, 200, { text: String(j?.text || "").trim() });
}

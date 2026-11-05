// POST /api/coach — streams the coach's reply (a JSON object, as text) from the Claude API.
import { buildSystem } from "../lib/prompt.js";
import { authorized, onlyPost, readJson, sendJson } from "../lib/http.js";

const API = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
const MODEL = process.env.COACH_MODEL || "claude-sonnet-5-5";
const MAX_TURNS = 30;

// Keep the conversation valid: user/assistant only, non-empty, starts and ends on user,
// consecutive same-role turns merged, oldest turns dropped first.
function cleanMessages(list) {
  const out = [];
  for (const m of Array.isArray(list) ? list : []) {
    const role = m && m.role === "assistant" ? "assistant" : "user";
    const content = String((m && m.content) || "").slice(0, 40000).trim();
    if (!content) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += "\n\n" + content;
    else out.push({ role, content });
  }
  let trimmed = out.slice(-MAX_TURNS);
  while (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);
  return trimmed;
}

export default async function handler(req, res) {
  if (!onlyPost(req, res) || !authorized(req, res)) return;
  if (!process.env.ANTHROPIC_API_KEY) return sendJson(res, 500, { error: "not_configured", message: "Set ANTHROPIC_API_KEY." });

  let body;
  try { body = await readJson(req); } catch { return sendJson(res, 400, { error: "bad_request", message: "Body must be JSON." }); }
  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") return sendJson(res, 400, { error: "bad_request", message: "The conversation must end with a user message." });

  const ctl = new AbortController();
  res.on("close", () => { if (!res.writableEnded) ctl.abort(); });

  let upstream;
  try {
    upstream = await fetch(`${API}/v1/messages`, {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        stream: true,
        system: buildSystem(body.setup, body.about),
        messages
      })
    });
  } catch (e) {
    if (ctl.signal.aborted) return;
    return sendJson(res, 502, { error: "upstream_error", message: "Couldn't reach Claude." });
  }

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try { detail = (await upstream.json())?.error?.message || ""; } catch {}
    const code = upstream.status === 429 || upstream.status === 529 ? "rate_limited" : upstream.status === 401 ? "bad_api_key" : "upstream_error";
    return sendJson(res, upstream.status === 429 || upstream.status === 529 ? 429 : 502, { error: code, message: detail || `Claude returned ${upstream.status}.` });
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Accel-Buffering", "no");

  // Translate Claude's server-sent events into a plain stream of text.
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for await (const chunk of upstream.body) {
      buf += decoder.decode(chunk, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        let ev;
        try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") res.write(ev.delta.text);
        else if (ev.type === "error") res.write(`\n\u0000ERROR:${ev.error?.type || "upstream_error"}`);
      }
    }
  } catch (e) {
    if (!ctl.signal.aborted) res.write("\n\u0000ERROR:upstream_error");
  }
  res.end();
}

// Small helpers shared by the API routes.
import { timingSafeEqual } from "node:crypto";

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

// Every route requires the access code set in APP_PASSCODE, sent as the x-app-key header.
export function authorized(req, res) {
  const expected = process.env.APP_PASSCODE || "";
  if (!expected) {
    sendJson(res, 500, { error: "not_configured", message: "Set APP_PASSCODE in your environment variables." });
    return false;
  }
  const got = String(req.headers["x-app-key"] || "");
  const a = Buffer.from(got), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    sendJson(res, 401, { error: "unauthorized", message: "Wrong access code." });
    return false;
  }
  return true;
}

export async function readRaw(req, limit = 12 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("Body too large"), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

// Vercel parses JSON bodies into req.body; the local dev server does not.
export async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const raw = await readRaw(req, 2 * 1024 * 1024);
  return raw.length ? JSON.parse(raw.toString("utf8")) : {};
}

export function onlyPost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "method_not_allowed" });
    return false;
  }
  return true;
}

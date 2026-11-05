// Local preview: `npm run dev`, then open http://localhost:3000
// Reads keys from .env.local. Mirrors how Vercel serves /public and /api.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".webmanifest":"application/manifest+json", ".json":"application/json" };
const port = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
      const file = path.join(root, "api", name + ".js");
      if (!existsSync(file)) { res.statusCode = 404; return res.end("Not found"); }
      const mod = await import(pathToFileURL(file).href);
      return await mod.default(req, res);
    }
    let file = path.join(root, "public", decodeURIComponent(url.pathname));
    if (!file.startsWith(path.join(root, "public"))) { res.statusCode = 403; return res.end(); }
    if (!existsSync(file) || (await stat(file)).isDirectory()) file = path.join(root, "public", "index.html");
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) { res.statusCode = 500; res.end("Server error"); } else res.end();
  }
}).listen(port, () => console.log(`Influence Coach running at http://localhost:${port}`));

// Local dev server — serves static files and /api/intelligence/* routes.
// Mirrors Vercel serverless handler signature so production code is identical.
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

// Load .env.local
async function loadEnv() {
  try {
    const txt = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    txt.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
    console.log("[dev] .env.local loaded");
  } catch {}
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function wrapRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
  };
  return res;
}

async function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  if (!path.extname(p)) {
    const candidate = path.join(ROOT, p + ".html");
    try { await fs.access(candidate); p = p + ".html"; } catch {}
  }
  const full = path.join(ROOT, p);
  if (!full.startsWith(ROOT)) { res.statusCode = 403; res.end("Forbidden"); return; }
  try {
    const stat = await fs.stat(full);
    if (stat.isDirectory()) {
      const indexFile = path.join(full, "index.html");
      const data = await fs.readFile(indexFile);
      res.setHeader("Content-Type", MIME[".html"]);
      res.end(data);
      return;
    }
    const ext = path.extname(full).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    const data = await fs.readFile(full);
    res.end(data);
  } catch (err) {
    res.statusCode = 404;
    res.end("Not found: " + p);
  }
}

const API_ROUTES = {
  "/api/intelligence/start": "./api/intelligence/start.js",
  "/api/intelligence/message": "./api/intelligence/message.js",
  "/api/intelligence/complete": "./api/intelligence/complete.js",
};

async function handleAPI(req, res, routeFile) {
  try {
    if (req.method === "POST") {
      const body = await readBody(req);
      try { req.body = JSON.parse(body || "{}"); } catch { req.body = {}; }
    }
    const mod = await import(routeFile + `?t=${Date.now()}`);
    const handler = mod.default;
    if (!handler) throw new Error("no default export");
    wrapRes(res);
    await handler(req, res);
  } catch (err) {
    console.error("[api error]", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "dev_server_error", message: String(err?.message || err) }));
  }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const start = Date.now();
  const log = () => console.log(`${req.method} ${u.pathname} ${res.statusCode} ${Date.now() - start}ms`);

  if (API_ROUTES[u.pathname]) {
    res.on("finish", log);
    return handleAPI(req, res, API_ROUTES[u.pathname]);
  }
  res.on("finish", log);
  await serveStatic(req, res);
});

await loadEnv();
// Local dev only: bypass Windows TLS revocation lookup that intermittently fails on consumer machines.
if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
server.listen(PORT, () => {
  console.log(`[dev] Ensign dev server on http://localhost:${PORT}`);
  console.log(`[dev] LOCAL_KV_STUB=${process.env.LOCAL_KV_STUB || "0"}`);
  console.log(`[dev] GEMINI_API_KEY=${process.env.GEMINI_API_KEY ? "set" : "MISSING"}`);
  console.log(`[dev] RESEND_API_KEY=${process.env.RESEND_API_KEY ? "set" : "MISSING"}`);
});

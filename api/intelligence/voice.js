import { getSession } from "./_lib/kv.js";
import { synthesizeSpeech, elevenlabsStatus } from "./_lib/elevenlabs.js";

// POST /api/intelligence/voice
// Body: { sessionId, text, lang? }
// Returns: audio/mpeg buffer on success, or JSON error on failure.
// The client falls back to browser speechSynthesis if this returns non-200.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const status = elevenlabsStatus();
    if (!status.configured) {
      // Not configured yet — return 503 so the client falls back to browser TTS.
      res.status(503).json({ error: status.reason || "not_configured" });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { sessionId, text, lang } = body || {};
    if (!sessionId || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "bad_request" });
      return;
    }

    // Session must exist — prevents random anonymous callers from burning credits.
    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }

    const out = await synthesizeSpeech({
      text,
      lang: lang || session.lang || "en",
    });

    if (!out.ok) {
      console.warn("[voice] synth failed", out.status, out.error, (out.detail || "").slice(0, 200));
      res.status(out.status || 502).json({ error: out.error, detail: out.detail });
      return;
    }

    res.setHeader("Content-Type", out.contentType || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", String(out.audio.byteLength));
    res.status(200).send(Buffer.from(out.audio));
  } catch (err) {
    console.error("[voice] handler error", err);
    res.status(500).json({ error: "server_error", message: String(err?.message || err) });
  }
}

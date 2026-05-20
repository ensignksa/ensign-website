import { validateProfile, hashEmail, newSessionId, clientIP } from "./_lib/validate.js";
import { createSession, isEmailLocked, bumpIPLock } from "./_lib/kv.js";

const FIRST_MESSAGE = {
  en: "Your session is ready. To begin properly, tell me the one business challenge that is currently slowing growth, sales, operations, or visibility.",
  ar: "الجلسة جاهزة. لنبدأ بشكل صحيح: ما هو التحدي الأهم الذي يبطئ نموك، مبيعاتك، عملياتك، أو ظهورك في السوق؟",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const errors = validateProfile(body);
    if (errors.length) {
      res.status(400).json({ error: "validation", fields: errors });
      return;
    }

    const emailHash = hashEmail(body.email);
    if (await isEmailLocked(emailHash)) {
      res.status(409).json({ error: "already_completed" });
      return;
    }

    const ip = clientIP(req);
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.") || ip === "unknown";
    // QA branch: cap raised to 50 while iterating on preview. Restore to 5 before production merge.
    if (!isLocal) {
      const ipCount = await bumpIPLock(ip);
      if (ipCount > 50) {
        res.status(429).json({ error: "rate_limit" });
        return;
      }
    }

    const sessionId = newSessionId();
    const lang = body.lang === "ar" ? "ar" : "en";
    const firstMessage = FIRST_MESSAGE[lang];

    const session = {
      id: sessionId,
      lang,
      profile: {
        name: body.name,
        email: body.email,
        company: body.company,
        industry: body.industry,
        website: body.website || "",
      },
      ip,
      emailHash,
      messages: [{ role: "assistant", content: firstMessage, t: Date.now() }],
      signals: {},
      turn: 0,
      maxTurns: 3,
      createdAt: Date.now(),
      completed: false,
    };

    await createSession(sessionId, session);

    res.status(200).json({
      sessionId,
      lang,
      firstMessage,
      maxTurns: 3,
    });
  } catch (err) {
    console.error("[start] error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

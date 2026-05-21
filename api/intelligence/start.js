import { validateProfile, hashEmail, newSessionId, clientIP } from "./_lib/validate.js";
import { createSession, isEmailLocked, bumpIPLock } from "./_lib/kv.js";
import { sendLeadIntakeEmail } from "./_lib/email.js";

// Assistant-first opening. Name + light industry context, then an open
// invitation. No pitch, no "ready to show you", no leading discovery question.
function firstName(full) {
  return String(full || "").trim().split(/\s+/)[0] || "";
}
function indPhraseEN(industry) {
  if (!industry) return "your business";
  return /^(real estate|hospitality|finance|healthcare|education|technology|retail|luxury|government)/i.test(industry)
    ? `${industry}`
    : `${industry}`;
}
function buildFirstMessage(lang, profile) {
  const fn = firstName(profile?.name);
  const industry = (profile?.industry || "").trim();
  if (lang === "ar") {
    const greeting = fn ? `مرحباً ${fn}،` : "مرحباً،";
    const role = industry
      ? `أنا موظف ذكي من Ensign. اسألني أي شيء عن كيف يمكن لـ Ensign أن تساعدك في مجال ${industry}.`
      : "أنا موظف ذكي من Ensign. اسألني أي شيء عن كيف يمكن لـ Ensign أن تساعد أعمالك.";
    return `${greeting} ${role}`;
  }
  const greeting = fn ? `Hi ${fn},` : "Hi,";
  const role = industry
    ? `I'm an AI employee from Ensign. Ask me anything about how Ensign can help you in ${indPhraseEN(industry)}.`
    : "I'm an AI employee from Ensign. Ask me anything about how Ensign can help your business.";
  return `${greeting} ${role}`;
}

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
    const profile = {
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      company: body.company || "",       // optional / hidden in current UI
      industry: body.industry,
      website: body.website || "",
    };
    const firstMessage = buildFirstMessage(lang, profile);

    const session = {
      id: sessionId,
      lang,
      profile,
      ip,
      emailHash,
      messages: [{ role: "assistant", content: firstMessage, t: Date.now() }],
      signals: {},
      turn: 0,
      // Open-ended conversation cap. Real sessions rarely exceed a handful of
      // turns; this just protects against runaway loops, not user behavior.
      maxTurns: 50,
      createdAt: Date.now(),
      completed: false,
    };

    await createSession(sessionId, session);

    // Fire-and-forget lead intake notification to contact@ensignksa.com.
    // We do not await the result so a missing RESEND_API_KEY (or transient SMTP
    // hiccup) never blocks the user from starting the experience.
    try {
      sendLeadIntakeEmail({ profile: session.profile, lang, sessionId }).catch((err) => {
        console.warn("[intake email] non-fatal:", String(err?.message || err));
      });
    } catch (e) {
      console.warn("[intake email] dispatch failed (non-fatal):", String(e?.message || e));
    }

    res.status(200).json({
      sessionId,
      lang,
      firstMessage,
      maxTurns: 50,
    });
  } catch (err) {
    console.error("[start] error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

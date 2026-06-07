import { getSession, updateSession } from "./_lib/kv.js";
import { generateTurn } from "./_lib/gemini.js";
import { systemEN } from "./_lib/prompts/system.en.js";
import { systemAR } from "./_lib/prompts/system.ar.js";
import { OPENINGS } from "./_lib/openings.js";
import { extractURL, fetchWebsite, summaryToPromptBlock } from "./_lib/scrape.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { sessionId, message, selectedIntelligence } = body || {};
    if (!sessionId || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "bad_request" });
      return;
    }

    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }
    if (session.completed) {
      res.status(409).json({ error: "session_completed" });
      return;
    }

    // Persist the chosen intelligence lens (only set once — first selection wins for the session).
    const ALLOWED_LENSES = ["sales", "marketing", "workflow", "reporting", "content", "agents"];
    if (selectedIntelligence && ALLOWED_LENSES.includes(selectedIntelligence) && !session.selectedIntelligence) {
      session.selectedIntelligence = selectedIntelligence;
    }

    // One adaptive intelligence: if no lens is set yet (the public UI no longer exposes
    // chips), infer it transparently from the user's first message. The mapping mirrors the
    // internal routing — sales / marketing / workflow / reporting / content / agents — and
    // never surfaces to the user. Default falls back to marketing for general business
    // questions since it covers the broadest analytical surface.
    if (!session.selectedIntelligence) {
      session.selectedIntelligence = inferLens(message, session.lang);
    }

    const userMessage = message.trim().slice(0, 2000);
    const turnIndex = session.turn + 1;
    const totalTurns = session.maxTurns;

    // ── Web scraping: detect a URL anywhere in the conversation, fetch it (once),
    //    and cache the scraped summary on the session so subsequent turns reuse it.
    const priorUserMessages = (session.messages || []).filter((m) => m.role === "user").map((m) => m.content || "");
    const allUserText = [userMessage, ...priorUserMessages].join(" \n ");
    const detectedURL =
      extractURL(userMessage) ||
      (priorUserMessages.map((t) => extractURL(t)).find((u) => !!u) || null) ||
      (session.profile?.website ? extractURL(session.profile.website) : null);

    let scrapeBlock = "";
    let scrapeStatus = null; // "ok" | "failed" | "none"
    if (detectedURL) {
      // Reuse cached scrape if we've already fetched this URL for this session
      if (session.scrape?.url === detectedURL && session.scrape?.ok) {
        scrapeBlock = session.scrape.block || "";
        scrapeStatus = "ok";
      } else {
        try {
          const result = await fetchWebsite(detectedURL);
          if (result.ok && result.summary) {
            scrapeBlock = summaryToPromptBlock(result.summary, session.lang);
            scrapeStatus = "ok";
            session.scrape = { url: detectedURL, ok: true, block: scrapeBlock, fetchedAt: Date.now() };
          } else {
            scrapeStatus = "failed";
            session.scrape = { url: detectedURL, ok: false, error: result.error, fetchedAt: Date.now() };
          }
        } catch (e) {
          scrapeStatus = "failed";
          console.warn("[scrape] error:", e?.message || e);
        }
      }
    } else {
      scrapeStatus = "none";
    }

    // Force-produce only fires when we actually have real website content to ground the plan in.
    const forceProduce = scrapeStatus === "ok";

    const promptFn = session.lang === "ar" ? systemAR : systemEN;
    const system = promptFn({
      name: session.profile.name,
      company: session.profile.company,
      industry: session.profile.industry,
      website: session.profile.website,
      turnIndex,
      totalTurns,
      selectedIntelligence: session.selectedIntelligence || null,
      forceProduce,
      scrapeBlock,
      scrapeStatus,
      scrapedURL: detectedURL,
    });

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

    const { text: rawText, signal, signals } = await generateTurn({
      system,
      history,
      userMessage,
      profileName: session.profile.name,
    });

    const text = bulletizeQuestions(rawText);

    session.messages.push({ role: "user", content: userMessage, t: Date.now() });
    session.messages.push({ role: "assistant", content: text, t: Date.now() });
    session.turn = turnIndex;
    const sigList = Array.isArray(signals) && signals.length ? signals : (signal ? [signal] : []);
    for (const s of sigList) session.signals[s.key] = s.value;

    const reachedCap = session.turn >= session.maxTurns;
    await updateSession(sessionId, session);

    res.status(200).json({
      reply: text,
      signal,         // back-compat: first signal
      signals: sigList,
      turn: session.turn,
      maxTurns: session.maxTurns,
      shouldComplete: reachedCap,
    });
  } catch (err) {
    console.error("[message] error:", err);
    res.status(500).json({ error: "server_error", message: String(err?.message || err) });
  }
}


// ──────────────────────────────────────────────────────────────────────────
// Lens inference — invisible to the user. Maps the first message to one of
// the six internal lenses by counting keyword hits. Bilingual (EN + AR).
// Default = marketing (broadest analytical surface for general questions).
// ──────────────────────────────────────────────────────────────────────────
const LENS_KEYWORDS = {
  sales:     ["lead", "leads", "follow", "follow-up", "follow up", "qualif", "crm", "pipeline", "convers", "close", "deal", "outreach", "whatsapp", "booking", "sales", "prospect",
              "عميل", "عملاء", "متابعة", "تأهيل", "صفقة", "بيع", "بيوع", "مبيعات", "حجز", "حجوزات", "واتساب"],
  marketing: ["marketing", "campaign", "campaigns", "audience", "positioning", "brand", "messaging", "channel", "channels", "meta ads", "google ads", "tiktok ads", "ads", "growth", "acquisition", "funnel",
              "تسويق", "حملة", "حملات", "جمهور", "تموضع", "علامة", "براند", "إعلان", "إعلانات", "نمو", "استحواذ", "قمع"],
  workflow:  ["approval", "approvals", "process", "workflow", "operations", "ops", "manual", "bottleneck", "delay", "automate", "automation", "handoff", "coordin", "sla", "routing", "rework", "task",
              "موافقة", "موافقات", "عملية", "سير عمل", "عمليات", "يدوي", "أتمتة", "تنسيق", "تسليم", "توجيه"],
  reporting: ["report", "reports", "dashboard", "kpi", "kpis", "metric", "metrics", "data", "analytics", "decision", "visibility", "performance", "track", "tracking",
              "تقرير", "تقارير", "لوحة", "مؤشر", "مؤشرات", "بيانات", "تحليلات", "قرار", "أداء", "رؤية"],
  content:   ["content", "post", "posts", "carousel", "reel", "reels", "tiktok video", "creative", "visual", "visuals", "image", "images", "ad creative", "ad creatives", "hook", "hooks", "caption", "captions", "design", "designs", "photo", "photoshoot", "product shot", "ad", "real estate visual", "property visual", "campaign visual",
              "محتوى", "منشور", "منشورات", "كاروسيل", "ريل", "ريلز", "تيك توك", "إبداع", "مرئي", "مرئيات", "صورة", "صور", "خطاف", "خطافات", "كابشن", "تصميم", "تصاميم", "عقار", "منتج", "مرئية حملة"],
  agents:    ["agent", "agents", "ai agent", "bot", "automate this role", "ai worker", "assistant for", "voice agent", "chatbot",
              "وكيل", "وكلاء", "بوت", "مساعد", "روبوت محادثة"],
};

// Lens-defining keywords that should strongly bias the result if present.
// Each is the unambiguous name of its own lens (or a near-synonym), so it
// counts as 3 hits instead of 1. Prevents "I want an AI agent for sales
// follow-up" from being misrouted to sales just because the sales lens has
// more generic keywords overlapping the sentence.
const LENS_STRONG = {
  sales:     [],
  marketing: [],
  workflow:  ["workflow", "automation", "automate", "سير عمل", "أتمتة"],
  reporting: ["dashboard", "kpi", "report", "لوحة", "تقرير"],
  content:   ["visual", "creative", "campaign visual", "product visual", "real estate visual", "مرئية", "إبداع"],
  agents:    ["agent", "ai agent", "bot", "ai worker", "وكيل", "وكلاء"],
};

export function inferLens(text, _lang) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return "marketing";
  let best = "marketing";
  let bestScore = 0;
  for (const lens of Object.keys(LENS_KEYWORDS)) {
    let score = 0;
    for (const kw of LENS_KEYWORDS[lens]) {
      if (t.includes(kw)) score += 1;
    }
    for (const kw of (LENS_STRONG[lens] || [])) {
      if (t.includes(kw)) score += 2; // strong keywords get +2 on top of the +1 base hit
    }
    if (score > bestScore) { bestScore = score; best = lens; }
  }
  return best;
}



// ──────────────────────────────────────────────────────────────────────────
// Post-processor: when the model returns 2+ consecutive question lines that
// aren't already bulleted, prefix each with "- " so the reader can scan and
// answer easily. Gemini drops the literal bullet character even when the
// prompt requires it; this guarantees the format in the rendered output.
// ──────────────────────────────────────────────────────────────────────────
export function bulletizeQuestions(text) {
  if (!text || typeof text !== "string") return text;
  const lines = text.split("\n");
  const isQuestion = (l) => {
    const t = l.trim();
    if (!t) return false;
    if (/^[-•·]\s/.test(t)) return false; // already bulleted
    // Ends with ? or Arabic question mark ؟
    return /[?؟]\s*$/.test(t);
  };

  // Find runs of 2+ consecutive question lines (ignoring blank lines between).
  // For each line in such a run, prefix with "- ".
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (isQuestion(lines[i])) {
      // Look ahead for another question line within the next 2 lines.
      let runEnd = i;
      let lookAhead = i + 1;
      while (lookAhead < lines.length) {
        if (isQuestion(lines[lookAhead])) {
          runEnd = lookAhead;
          lookAhead++;
        } else if (lines[lookAhead].trim() === "" && lookAhead + 1 < lines.length && isQuestion(lines[lookAhead + 1])) {
          // Allow a single blank line between questions
          lookAhead += 2;
          runEnd = lookAhead - 1;
        } else {
          break;
        }
      }
      const runCount = lines.slice(i, runEnd + 1).filter(isQuestion).length;
      if (runCount >= 2) {
        // Bulletize all question lines in [i, runEnd]
        for (let j = i; j <= runEnd; j++) {
          if (isQuestion(lines[j])) out.push("- " + lines[j].trim());
          else out.push(lines[j]);
        }
        i = runEnd + 1;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  return out.join("\n");
}

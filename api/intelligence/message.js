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
    // When a lens is selected for the first time, replace the generic opening assistant message
    // with the lens-specific agent opening that the user actually saw on screen. This keeps
    // Gemini's view of the conversation aligned with the user's experience.
    const ALLOWED_LENSES = ["sales", "marketing", "workflow", "reporting", "content", "agents"];
    if (selectedIntelligence && ALLOWED_LENSES.includes(selectedIntelligence) && !session.selectedIntelligence) {
      session.selectedIntelligence = selectedIntelligence;
      const lensOpening = OPENINGS[session.lang]?.[selectedIntelligence];
      if (lensOpening && Array.isArray(session.messages) && session.messages.length > 0) {
        // Replace the original "Your session is ready..." opening with the lens opening.
        if (session.messages[0].role === "assistant") {
          session.messages[0] = { role: "assistant", content: lensOpening, t: Date.now() };
        } else {
          session.messages.unshift({ role: "assistant", content: lensOpening, t: Date.now() });
        }
      }
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

    const { text, signal } = await generateTurn({
      system,
      history,
      userMessage,
      profileName: session.profile.name,
    });

    session.messages.push({ role: "user", content: userMessage, t: Date.now() });
    session.messages.push({ role: "assistant", content: text, t: Date.now() });
    session.turn = turnIndex;
    if (signal) session.signals[signal.key] = signal.value;

    const reachedCap = session.turn >= session.maxTurns;
    await updateSession(sessionId, session);

    res.status(200).json({
      reply: text,
      signal,
      turn: session.turn,
      maxTurns: session.maxTurns,
      shouldComplete: reachedCap,
    });
  } catch (err) {
    console.error("[message] error:", err);
    res.status(500).json({ error: "server_error", message: String(err?.message || err) });
  }
}

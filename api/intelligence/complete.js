import { getSession, updateSession, deleteSession, lockEmail } from "./_lib/kv.js";
import { generateJSON } from "./_lib/gemini.js";
import { finalReviewPrompt, getSectionLabels } from "./_lib/prompts/final-review.js";
import { sendLeadEmail } from "./_lib/email.js";
import { isBusinessEmail } from "./_lib/validate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { sessionId } = body || {};
    if (!sessionId) {
      res.status(400).json({ error: "bad_request" });
      return;
    }

    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }
    if (session.completed) {
      res.status(200).json({ alreadyCompleted: true });
      return;
    }

    const transcript = session.messages
      .map((m) => `${m.role === "assistant" ? "Ensign" : session.profile.name}: ${m.content}`)
      .join("\n\n");

    const prompt = finalReviewPrompt({
      lang: session.lang,
      profile: session.profile,
      transcript,
    });

    let parsed;
    try {
      parsed = await generateJSON({ prompt });
    } catch (err) {
      console.error("[complete] JSON generation failed:", err);
      parsed = fallbackReview(session);
    }

    const review = parsed.visible_review || {};
    const internal = parsed.internal || {};

    // Apply business-email floor adjustment to score
    if (typeof internal.lead_score === "number") {
      if (isBusinessEmail(session.profile.email)) internal.lead_score = Math.min(100, internal.lead_score + 5);
      internal.lead_score = Math.max(0, Math.min(100, Math.round(internal.lead_score)));
    }

    session.completed = true;
    session.review = review;
    session.internal = internal;
    await updateSession(sessionId, session);
    await lockEmail(session.emailHash);

    // Surface the AI Employee classification, the interaction mode, and the
    // Book-a-Call click signal into the internal block so the lead briefing
    // email shows them prominently to the Ensign team.
    const agentMode = session.signals?.agent_mode || "unclear";
    const interactionMode = body?.mode || session.mode || "chat";
    const bookACallClicked = !!body?.bookACallClicked;
    internal.agent_mode = agentMode;
    internal.interaction_mode = interactionMode;
    internal.book_a_call_clicked = bookACallClicked;

    const emailResult = await sendLeadEmail({
      profile: session.profile,
      lang: session.lang,
      sessionId,
      messages: session.messages,
      review,
      internal,
    });

    const labels = getSectionLabels(session.lang);

    res.status(200).json({
      review,
      labels,
      emailDelivered: emailResult.delivered,
    });

    // Cleanup session payload after success (keep lock).
    setTimeout(() => deleteSession(sessionId).catch(() => {}), 1000);
  } catch (err) {
    console.error("[complete] error:", err);
    res.status(500).json({ error: "server_error", message: String(err?.message || err) });
  }
}

function fallbackReview(session) {
  const isAR = session.lang === "ar";
  return {
    visible_review: {
      business_signal: isAR
        ? "تم رصد إشارة عمل واضحة من الجلسة."
        : "A clear business signal was detected during the session.",
      bottleneck: isAR
        ? "الأرجح أن العائق الرئيسي يتمحور حول الكفاءة التشغيلية والتحويل."
        : "The likely bottleneck centers on operational efficiency and conversion.",
      ai_opportunity: isAR
        ? "هناك مساحة لطبقة ذكاء تربط الاكتساب بالتأهيل بالمتابعة."
        : "There is room for an intelligence layer connecting acquisition, qualification, and follow-up.",
      marketing_opportunity: isAR
        ? "إعادة هندسة قمع التسويق-المبيعات تفتح تحويلًا أعلى من نفس الإنفاق."
        : "Re-engineering the marketing-to-sales funnel unlocks higher conversion from the same spend.",
      direction: isAR
        ? "نقترح البدء بتقييم تشخيصي قصير مع فريق إنساين، يحدد الطبقة الأولى من Ensign OS التي ستضاعف الأثر."
        : "We recommend starting with a short diagnostic with the Ensign team, scoping the first Ensign OS layer that will multiply impact.",
    },
    internal: {
      lead_score: 50,
      lead_label: "Early Stage",
      tags: ["AI Automation", "CRM Intelligence"],
      service_line: "Ensign OS",
      pain_points: ["Unclassified — review transcript."],
      urgency_signal: "medium",
      decision_authority_signal: "unclear",
      budget_signal: "unknown",
      transcript_summary: "Session completed but structured generation failed. Review transcript manually.",
      sales_angle: "Review transcript manually before the call.",
      what_to_say_on_call: "Open with curiosity about their stated challenge.",
      objections_to_prepare: ["Pricing — defer to discovery"],
      recommended_next_step: "Manual review of transcript, then call.",
    },
  };
}

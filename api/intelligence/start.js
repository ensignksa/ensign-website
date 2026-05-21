import { validateProfile, hashEmail, newSessionId, clientIP } from "./_lib/validate.js";
import { createSession, isEmailLocked, bumpIPLock } from "./_lib/kv.js";
import { sendLeadIntakeEmail } from "./_lib/email.js";

// Assistant-first opening. Name + light industry context + a short list of
// tappable starter questions so the visitor never lands on a blank page.
function firstName(full) {
  return String(full || "").trim().split(/\s+/)[0] || "";
}

// Industry-specific starter questions. Tapping one sends it immediately.
// Falls back to the "Other" set for any industry not listed.
const STARTERS = {
  en: {
    "Real Estate": [
      "How would you handle WhatsApp leads from buyers?",
      "Show me how a qualifying conversation works",
      "Can you handle follow-up for cold leads?",
      "What kind of agent reporting could I get?",
    ],
    "Hospitality": [
      "How would you handle booking inquiries 24/7?",
      "Show me how multilingual guest messaging works",
      "Can you handle reservation confirmations?",
      "What kind of revenue and occupancy reporting could I get?",
    ],
    "Luxury": [
      "How would you handle VIP client messages?",
      "Show me how product inquiries get qualified",
      "Can you recover abandoned high-value carts?",
      "What kind of store-level reporting could I get?",
    ],
    "Events & Entertainment": [
      "How would you handle ticket and RSVP inquiries?",
      "Show me how attendee messaging at scale works",
      "Can you confirm bookings automatically?",
      "What kind of post-event reporting could I get?",
    ],
    "Government / Corporate": [
      "How would you handle citizen or employee inquiries?",
      "Show me how internal request routing works",
      "Can you automate dashboard reporting?",
      "What kind of operational visibility could I get?",
    ],
    "Retail & E-commerce": [
      "How would you handle customer service messages?",
      "Show me how returns and exchanges get processed",
      "Can you recover abandoned carts?",
      "What kind of store performance reporting could I get?",
    ],
    "Technology": [
      "How would you qualify inbound leads?",
      "Show me how a demo booking flow works",
      "Can you triage customer support?",
      "What kind of churn early-warning could I get?",
    ],
    "Finance": [
      "How would you qualify financial leads?",
      "Show me how document collection works",
      "Can you do KYC pre-screening?",
      "What kind of daily portfolio summary could I get?",
    ],
    "Healthcare": [
      "How would you handle appointment scheduling?",
      "Show me how a patient inquiry gets answered",
      "Can you send appointment reminders?",
      "What kind of intake automation could I get?",
    ],
    "Education": [
      "How would you handle enrollment inquiries?",
      "Show me how course information gets delivered",
      "Can you message parents at scale?",
      "What kind of attendance reporting could I get?",
    ],
    "Other": [
      "How would you qualify inbound inquiries?",
      "Show me how a customer conversation works",
      "Can you automate follow-up?",
      "What kind of reporting could I get?",
    ],
  },
  ar: {
    "Real Estate": [
      "كيف يمكنك التعامل مع عملاء واتساب الباحثين عن عقار؟",
      "أرني كيف تبدو محادثة تأهيل عميل",
      "هل يمكنك المتابعة مع العملاء الباردين؟",
      "ما نوع التقارير التي يمكن أن يحصل عليها الوكلاء؟",
    ],
    "Hospitality": [
      "كيف تتعامل مع استفسارات الحجز على مدار الساعة؟",
      "أرني كيف تعمل المراسلة بلغات متعددة مع النزلاء",
      "هل يمكنك تأكيد الحجوزات تلقائياً؟",
      "ما نوع تقارير الإيرادات والإشغال التي يمكنني الحصول عليها؟",
    ],
    "Luxury": [
      "كيف تتعامل مع رسائل عملاء VIP؟",
      "أرني كيف يتم تأهيل استفسارات المنتجات",
      "هل يمكنك استرداد سلات تسوّق عالية القيمة؟",
      "ما نوع التقارير على مستوى المتجر التي يمكنني الحصول عليها؟",
    ],
    "Events & Entertainment": [
      "كيف تتعامل مع استفسارات التذاكر والـ RSVP؟",
      "أرني كيف تعمل مراسلة الحضور على نطاق واسع",
      "هل يمكنك تأكيد الحجوزات تلقائياً؟",
      "ما نوع تقارير ما بعد الفعالية التي يمكنني الحصول عليها؟",
    ],
    "Government / Corporate": [
      "كيف تتعامل مع استفسارات المواطنين أو الموظفين؟",
      "أرني كيف يعمل توجيه الطلبات الداخلية",
      "هل يمكنك أتمتة تقارير لوحات البيانات؟",
      "ما نوع الرؤية التشغيلية التي يمكنني الحصول عليها؟",
    ],
    "Retail & E-commerce": [
      "كيف تتعامل مع رسائل خدمة العملاء؟",
      "أرني كيف تتم معالجة الإرجاع والاستبدال",
      "هل يمكنك استرداد سلات التسوّق المتروكة؟",
      "ما نوع تقارير أداء المتجر التي يمكنني الحصول عليها؟",
    ],
    "Technology": [
      "كيف يمكنك تأهيل العملاء الواردين؟",
      "أرني كيف يعمل تدفق حجز العروض التجريبية",
      "هل يمكنك فرز دعم العملاء؟",
      "ما نوع الإنذار المبكر بالتسرب الذي يمكنني الحصول عليه؟",
    ],
    "Finance": [
      "كيف يمكنك تأهيل العملاء الماليين؟",
      "أرني كيف يعمل جمع المستندات",
      "هل يمكنك إجراء فحص KYC الأولي؟",
      "ما نوع ملخص المحفظة اليومي الذي يمكنني الحصول عليه؟",
    ],
    "Healthcare": [
      "كيف تتعامل مع جدولة المواعيد؟",
      "أرني كيف تتم الإجابة على استفسار مريض",
      "هل يمكنك إرسال تذكيرات بالمواعيد؟",
      "ما نوع أتمتة الاستقبال التي يمكنني الحصول عليها؟",
    ],
    "Education": [
      "كيف تتعامل مع استفسارات التسجيل؟",
      "أرني كيف يتم تقديم معلومات المقررات",
      "هل يمكنك مراسلة أولياء الأمور على نطاق واسع؟",
      "ما نوع تقارير الحضور التي يمكنني الحصول عليها؟",
    ],
    "Other": [
      "كيف يمكنك تأهيل الاستفسارات الواردة؟",
      "أرني كيف تبدو محادثة مع عميل",
      "هل يمكنك أتمتة المتابعة؟",
      "ما نوع التقارير التي يمكنني الحصول عليها؟",
    ],
  },
};

function buildSuggestions(lang, industry) {
  const bank = STARTERS[lang === "ar" ? "ar" : "en"];
  const ind = (industry || "").trim();
  return bank[ind] || bank["Other"];
}

function buildFirstMessage(lang, profile) {
  const fn = firstName(profile?.name);
  if (lang === "ar") {
    const greeting = fn ? `مرحباً ${fn}،` : "مرحباً،";
    return `${greeting} أنا موظف ذكي من Ensign. يمكنك أن تبدأ بواحدة من هذه، أو اكتب ما يدور في بالك.`;
  }
  const greeting = fn ? `Hi ${fn},` : "Hi,";
  return `${greeting} I'm an AI employee from Ensign. Pick one of these to start, or type what's on your mind.`;
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
    const firstSuggestions = buildSuggestions(lang, profile.industry);

    const session = {
      id: sessionId,
      lang,
      profile,
      ip,
      emailHash,
      messages: [{ role: "assistant", content: firstMessage, t: Date.now() }],
      firstSuggestions,
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
      firstSuggestions,
      maxTurns: 50,
    });
  } catch (err) {
    console.error("[start] error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

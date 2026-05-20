import { Resend } from "resend";

// ──────────────────────────────────────────────────────────────────────────
// Lead intake — fires immediately on form submission so the Ensign team
// knows a new lead is inside the AI Employee experience right now.
// Full session briefing follows via sendLeadEmail() on /complete.
// ──────────────────────────────────────────────────────────────────────────
export async function sendLeadIntakeEmail({ profile, lang, sessionId }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO || "contact@ensignksa.com";
  const from = process.env.LEAD_EMAIL_FROM || "Ensign Intelligence <onboarding@resend.dev>";

  const payload = {
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    industry: profile?.industry || "",
    lang,
    sessionId,
    timestamp: new Date().toISOString(),
  };

  if (!apiKey) {
    console.warn("[Ensign Intelligence] intake: RESEND_API_KEY missing — logging payload instead.");
    console.log("[intake]", JSON.stringify(payload));
    return { delivered: false, reason: "no_api_key" };
  }

  const subject = `[Ensign · AI Employee] New lead — ${payload.name} · ${payload.industry}`;
  const html = renderIntakeHTML(payload);

  try {
    const resend = new Resend(apiKey);
    const r = await resend.emails.send({ from, to, subject, html });
    return { delivered: true, id: r?.data?.id };
  } catch (err) {
    console.error("[Ensign Intelligence] intake email failed:", err);
    return { delivered: false, reason: String(err?.message || err) };
  }
}

function renderIntakeHTML(p) {
  const safe = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F2EFE8;font-family:-apple-system,Segoe UI,Manrope,Arial,sans-serif;color:#0A0A0A;">
<div style="max-width:620px;margin:0 auto;padding:28px 24px;">
  <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-bottom:4px;">Ensign · AI Employee · New Lead</div>
  <h1 style="margin:0 0 6px;font-size:22px;font-weight:600;">${safe(p.name)}</h1>
  <div style="font-size:13px;color:#555;margin-bottom:20px;">${safe(p.industry)} · session in ${p.lang === "ar" ? "Arabic" : "English"}</div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <tr><td style="padding:6px 0;color:#666;width:140px;">Email</td><td><a href="mailto:${safe(p.email)}" style="color:#0A0A0A;">${safe(p.email)}</a></td></tr>
    <tr><td style="padding:6px 0;color:#666;">Phone</td><td>${safe(p.phone) || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Industry</td><td>${safe(p.industry)}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Session</td><td>${safe(p.sessionId)}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Timestamp</td><td>${safe(p.timestamp)}</td></tr>
  </table>
  <div style="margin-top:24px;padding-top:14px;border-top:1px solid #ccc;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase;">
    Full session briefing follows on completion.
  </div>
</div>
</body></html>`;
}

export async function sendLeadEmail({ profile, lang, sessionId, messages, review, internal }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO || "contact@ensignksa.com";
  const from = process.env.LEAD_EMAIL_FROM || "Ensign Intelligence <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[Ensign Intelligence] RESEND_API_KEY missing — logging payload instead.");
    console.log(JSON.stringify({ profile, lang, sessionId, review, internal, messages }, null, 2));
    return { delivered: false, reason: "no_api_key" };
  }

  const subject = `[Ensign Intelligence] ${internal?.lead_label || "New Lead"} — ${profile.name}, ${profile.company}`;
  const html = renderEmailHTML({ profile, lang, sessionId, messages, review, internal });

  try {
    const resend = new Resend(apiKey);
    const r = await resend.emails.send({ from, to, subject, html });
    return { delivered: true, id: r?.data?.id };
  } catch (err) {
    console.error("[Ensign Intelligence] Email send failed:", err);
    return { delivered: false, reason: String(err?.message || err) };
  }
}

function renderEmailHTML({ profile, lang, sessionId, messages, review, internal }) {
  const safe = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const list = (arr) => Array.isArray(arr) ? `<ul style="margin:6px 0 14px;padding-inline-start:20px;">${arr.map(x => `<li style="margin:4px 0;">${safe(x)}</li>`).join("")}</ul>` : "";

  const transcript = messages.map(m => {
    const who = m.role === "assistant" ? "Ensign" : safe(profile.name);
    return `<div style="margin:10px 0;padding:10px 14px;border-inline-start:2px solid ${m.role === "assistant" ? "#00D9C0" : "#999"};background:#f8f7f3;"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-bottom:4px;">${who}</div><div style="white-space:pre-wrap;color:#1a1a1a;line-height:1.55;">${safe(m.content)}</div></div>`;
  }).join("");

  const section = (h, body) => `<div style="margin:18px 0;"><div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0A0A0A;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;">${h}</div>${body}</div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F2EFE8;font-family:-apple-system,Segoe UI,Manrope,Arial,sans-serif;color:#0A0A0A;">
<div style="max-width:680px;margin:0 auto;padding:28px 24px;background:#F2EFE8;">
  <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-bottom:4px;">Ensign Intelligence · Lead Briefing</div>
  <h1 style="margin:0 0 4px;font-size:24px;font-weight:600;line-height:1.25;">${safe(internal?.lead_label || "New Lead")} — ${safe(profile.name)}</h1>
  <div style="font-size:14px;color:#555;margin-bottom:22px;">${safe(profile.company)} · ${safe(profile.industry)} · Session in ${lang === "ar" ? "Arabic" : "English"}</div>

  ${section("Lead Snapshot", `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 0;color:#666;width:140px;">Name</td><td>${safe(profile.name)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Email</td><td><a href="mailto:${safe(profile.email)}" style="color:#0A0A0A;">${safe(profile.email)}</a></td></tr>
      <tr><td style="padding:4px 0;color:#666;">Company</td><td>${safe(profile.company)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Industry</td><td>${safe(profile.industry)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Website</td><td>${profile.website ? `<a href="${safe(profile.website)}" style="color:#0A0A0A;">${safe(profile.website)}</a>` : "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Session</td><td>${safe(sessionId)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Score</td><td><strong>${safe(internal?.lead_score)}</strong> / 100 — ${safe(internal?.lead_label)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Service Line</td><td>${safe(internal?.service_line)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Tags</td><td>${(internal?.tags || []).map(t => `<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:#0A0A0A;color:#F2EFE8;border-radius:2px;font-size:11px;letter-spacing:.04em;">${safe(t)}</span>`).join("")}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Phone</td><td>${safe(profile.phone) || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Agent mode</td><td><strong>${safe(internal?.agent_mode || "unclear")}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#666;">Interaction</td><td>${safe(internal?.interaction_mode || "chat")}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Book-a-Call clicked</td><td>${internal?.book_a_call_clicked ? "Yes" : "No"}</td></tr>
    </table>
  `)}

  ${section("Qualification (BANT + Fit)", `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 0;color:#666;width:160px;">Budget signal</td><td>${safe(internal?.budget_signal)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Authority signal</td><td>${safe(internal?.decision_authority_signal)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Urgency</td><td>${safe(internal?.urgency_signal)}</td></tr>
    </table>
  `)}

  ${section("Pain Points", list(internal?.pain_points))}

  ${section("Transcript Summary", `<p style="margin:0;line-height:1.55;">${safe(internal?.transcript_summary)}</p>`)}

  ${section("What This Lead Actually Needs", `<p style="margin:0;line-height:1.55;">${safe(internal?.sales_angle)}</p>`)}

  ${section("Call Opening (suggested)", `<p style="margin:0;line-height:1.55;font-style:italic;color:#333;">"${safe(internal?.what_to_say_on_call)}"</p>`)}

  ${section("Objections to Prepare For", list(internal?.objections_to_prepare))}

  ${section("Recommended Next Step", `<p style="margin:0;line-height:1.55;font-weight:600;">${safe(internal?.recommended_next_step)}</p>`)}

  ${section(`Visible Review (${lang === "ar" ? "shown to lead in Arabic" : "shown to lead in English"})`, `
    <div style="background:#fff;padding:14px 16px;border:1px solid #ddd;${lang === "ar" ? "direction:rtl;text-align:right;font-family:Tahoma,Arial,sans-serif;" : ""}">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;color:#0A0A0A;">${lang === "ar" ? "الإشارة التجارية المكتشفة" : "Business Signal Detected"}</div>
      <p style="margin:0 0 12px;line-height:1.6;">${safe(review?.business_signal)}</p>
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;color:#0A0A0A;">${lang === "ar" ? "العائق الأرجح للنمو" : "Likely Growth Bottleneck"}</div>
      <p style="margin:0 0 12px;line-height:1.6;">${safe(review?.bottleneck)}</p>
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;color:#0A0A0A;">${lang === "ar" ? "فرصة الذكاء أو النظام" : "AI / System Opportunity"}</div>
      <p style="margin:0 0 12px;line-height:1.6;">${safe(review?.ai_opportunity)}</p>
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;color:#0A0A0A;">${lang === "ar" ? "فرصة التسويق أو المبيعات" : "Marketing or Sales Opportunity"}</div>
      <p style="margin:0 0 12px;line-height:1.6;">${safe(review?.marketing_opportunity)}</p>
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;color:#0A0A0A;">${lang === "ar" ? "التوجه المقترح من إنساين" : "Recommended Ensign Direction"}</div>
      <p style="margin:0;line-height:1.6;">${safe(review?.direction)}</p>
    </div>
  `)}

  ${section("Full Transcript", transcript)}

  <div style="margin-top:32px;padding-top:18px;border-top:1px solid #ccc;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase;">
    Ensign Ai Marketing Agency · Riyadh · ensignksa.com
  </div>
</div>
</body></html>`;
}

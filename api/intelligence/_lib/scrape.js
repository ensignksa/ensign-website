// Lightweight web scraper for Ensign Intelligence.
// Fetches a URL, strips HTML, extracts signals the AI can ground its plan in.
// No headless browser — just fetch + regex. Fast, no extra deps.

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 600_000;
const USER_AGENT = "Mozilla/5.0 (compatible; EnsignIntelligenceBot/1.0; +https://ensignksa.com)";

export function extractURL(text) {
  if (!text) return null;
  // Match http(s) URLs OR bare domains like acmehotel.com (>=2 dot-separated parts, common TLD).
  const explicit = text.match(/https?:\/\/[^\s)]+/i);
  if (explicit) return explicit[0].replace(/[.,;)\]]+$/, "");
  const bare = text.match(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|net|org|io|co|ai|sa|ae|app|me|store|shop|dev|tech|studio|agency|biz))\b/i);
  if (bare) return "https://" + bare[1];
  // Single-dot bare: word.tld
  const single = text.match(/\b([a-z][a-z0-9-]+\.(?:com|net|org|io|co|ai|sa|ae|app|me|store|shop|dev|tech|studio|agency|biz))\b/i);
  if (single) return "https://" + single[1];
  return null;
}

export async function fetchWebsite(rawUrl) {
  const url = normalizeURL(rawUrl);
  if (!url) return { ok: false, url: rawUrl, error: "invalid_url" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en,ar;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, url, error: err?.name === "AbortError" ? "timeout" : "fetch_failed", detail: String(err?.message || err) };
  }
  clearTimeout(timer);

  if (!res.ok) {
    return { ok: false, url, error: "http_" + res.status };
  }

  const reader = res.body?.getReader?.();
  let html = "";
  if (reader) {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let received = 0;
    while (received < MAX_BODY_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
  } else {
    html = await res.text();
    if (html.length > MAX_BODY_BYTES * 2) html = html.slice(0, MAX_BODY_BYTES * 2);
  }

  return { ok: true, url: res.url || url, html, summary: summarize(html, res.url || url) };
}

function normalizeURL(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  try {
    const u = new URL(s);
    return u.toString();
  } catch {
    return null;
  }
}

function summarize(html, finalUrl) {
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || pick(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const ogTitle = pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDescription = pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogSiteName = pick(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

  const headings = [];
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m;
  while ((m = h1Re.exec(html)) && headings.length < 6) {
    const t = stripTags(m[1]).trim();
    if (t) headings.push({ level: 1, text: t });
  }
  while ((m = h2Re.exec(html)) && headings.length < 14) {
    const t = stripTags(m[1]).trim();
    if (t) headings.push({ level: 2, text: t });
  }

  // Links to social profiles
  const socialDomains = ["instagram.com", "facebook.com", "x.com", "twitter.com", "linkedin.com", "tiktok.com", "youtube.com", "wa.me"];
  const socials = new Set();
  const linkRe = /<a[^>]+href=["']([^"']+)["']/gi;
  while ((m = linkRe.exec(html)) && socials.size < 12) {
    const href = m[1];
    for (const d of socialDomains) {
      if (href.includes(d)) {
        socials.add(href.split(/[?#]/)[0]);
        break;
      }
    }
  }

  // Body text — strip scripts/styles/tags, collapse whitespace, take first ~2500 chars
  const bodyText = stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);

  return {
    finalUrl,
    title: title ? cleanText(title) : null,
    siteName: ogSiteName ? cleanText(ogSiteName) : null,
    description: cleanText(metaDescription || ogDescription || ""),
    ogTitle: ogTitle ? cleanText(ogTitle) : null,
    headings: headings.map((h) => `${h.level === 1 ? "H1" : "H2"}: ${h.text.slice(0, 140)}`).slice(0, 12),
    socials: Array.from(socials).slice(0, 6),
    bodyExcerpt: bodyText,
  };
}

function pick(s, re) {
  const m = s.match(re);
  return m ? m[1] : null;
}
function stripTags(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}
function cleanText(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, 280);
}

export function summaryToPromptBlock(summary, lang = "en") {
  if (!summary) return "";
  const lines = [];
  if (lang === "ar") {
    lines.push(`الموقع المُفحَص: ${summary.finalUrl}`);
    if (summary.title) lines.push(`عنوان الصفحة: ${summary.title}`);
    if (summary.siteName) lines.push(`اسم الموقع: ${summary.siteName}`);
    if (summary.ogTitle && summary.ogTitle !== summary.title) lines.push(`OG Title: ${summary.ogTitle}`);
    if (summary.description) lines.push(`وصف الموقع: ${summary.description}`);
    if (summary.headings?.length) lines.push("عناوين رئيسية:\n" + summary.headings.join("\n"));
    if (summary.socials?.length) lines.push("روابط اجتماعية: " + summary.socials.join(" | "));
    if (summary.bodyExcerpt) lines.push("مقتطف من نص الصفحة:\n" + summary.bodyExcerpt);
  } else {
    lines.push(`Scraped URL: ${summary.finalUrl}`);
    if (summary.title) lines.push(`Page title: ${summary.title}`);
    if (summary.siteName) lines.push(`Site name: ${summary.siteName}`);
    if (summary.ogTitle && summary.ogTitle !== summary.title) lines.push(`OG title: ${summary.ogTitle}`);
    if (summary.description) lines.push(`Meta description: ${summary.description}`);
    if (summary.headings?.length) lines.push("Headings:\n" + summary.headings.join("\n"));
    if (summary.socials?.length) lines.push("Social links: " + summary.socials.join(" | "));
    if (summary.bodyExcerpt) lines.push("Body excerpt:\n" + summary.bodyExcerpt);
  }
  return lines.join("\n");
}

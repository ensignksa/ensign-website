// Lightweight web scraper for Ensign Intelligence.
// Strategy: aggressive URL normalization + multi-variant fallback pipeline.
// Tries (in order) the user input as-given, with/without www, http fallback,
// and a small set of public sub-pages if the homepage is thin. Browser-like
// headers and a real timeout per attempt. No headless browser (deliberately
// no Playwright dep — adds 200MB+ to the function bundle and Vercel Hobby
// blocks chromium-headless egress anyway).

const FETCH_TIMEOUT_MS = 9000;          // per-attempt timeout
const MAX_BODY_BYTES = 700_000;         // hard cap per response
const THIN_HOMEPAGE_THRESHOLD = 500;    // chars of body text below which we try sub-pages
const SUB_PAGES = ["/about", "/about-us", "/services", "/solutions", "/work", "/agency", "/contact", "/en", "/ar"];
const MAX_SUB_PAGE_FETCHES = 2;         // ceiling on extra fetches
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BROWSER_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

// ──────────────────────────────────────────────────────────────────────────
// URL detection from free text (user message)
// ──────────────────────────────────────────────────────────────────────────
export function extractURL(text) {
  if (!text) return null;
  const t = String(text).trim();
  // Explicit http(s) URL anywhere in the text
  const explicit = t.match(/https?:\/\/[^\s)<>]+/i);
  if (explicit) return cleanTrailing(explicit[0]);
  // Bare domain with multi-segment + common TLD
  const bare = t.match(/\b([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+\.(?:com|net|org|io|co|ai|sa|ae|app|me|store|shop|dev|tech|studio|agency|biz|design|gov))\b/i);
  if (bare) return "https://" + bare[1].toLowerCase();
  // Single-segment bare: word.tld
  const single = t.match(/\b([a-z][a-z0-9-]+\.(?:com|net|org|io|co|ai|sa|ae|app|me|store|shop|dev|tech|studio|agency|biz|design|gov))\b/i);
  if (single) return "https://" + single[1].toLowerCase();
  return null;
}

function cleanTrailing(u) {
  return u.replace(/[.,;:!?)\]\}'"]+$/, "");
}

// ──────────────────────────────────────────────────────────────────────────
// URL normalization + variant generation
// ──────────────────────────────────────────────────────────────────────────
export function normalizeURL(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim().replace(/\s+/g, "");
  if (!s) return null;
  // Drop any leading slashes
  s = s.replace(/^\/+/, "");
  // If no scheme, default to https
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    // Lowercase host, drop default ports, preserve path/query
    u.hostname = u.hostname.toLowerCase();
    if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) u.port = "";
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Build an ordered list of URL variants to try.
 * Preserves path/query from the original input. Returns unique entries.
 */
export function urlVariants(raw) {
  const normalized = normalizeURL(raw);
  if (!normalized) return [];
  const u = new URL(normalized);
  const host = u.hostname;
  const path = u.pathname + u.search + u.hash;

  const hostBare = host.replace(/^www\./, "");
  const hostWww = host.startsWith("www.") ? host : "www." + hostBare;

  const variants = [];
  // 1) exact as the user gave it
  variants.push(`https://${host}${path}`);
  // 2) toggle www
  variants.push(`https://${hostWww}${path}`);
  variants.push(`https://${hostBare}${path}`);
  // 3) http fallback (only as last resort — same domain pair)
  variants.push(`http://${host}${path}`);
  variants.push(`http://${hostWww}${path}`);
  variants.push(`http://${hostBare}${path}`);

  // Dedupe while preserving order
  const seen = new Set();
  return variants.filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
}

// ──────────────────────────────────────────────────────────────────────────
// Single-URL fetch with timeout + browser headers + redirect-follow
// ──────────────────────────────────────────────────────────────────────────
async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, attempted: url, error: "http_" + res.status, ms: Date.now() - t0 };
    }
    const html = await readBodyBounded(res);
    return { ok: true, attempted: url, finalUrl: res.url || url, html, ms: Date.now() - t0 };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      attempted: url,
      error: err?.name === "AbortError" ? "timeout" : "fetch_failed",
      detail: String(err?.message || err).slice(0, 200),
      ms: Date.now() - t0,
    };
  }
}

async function readBodyBounded(res) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    const t = await res.text();
    return t.length > MAX_BODY_BYTES * 2 ? t.slice(0, MAX_BODY_BYTES * 2) : t;
  }
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let received = 0;
  let html = "";
  while (received < MAX_BODY_BYTES) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

// ──────────────────────────────────────────────────────────────────────────
// Main entry: try every variant; if homepage is thin, augment with sub-pages.
// Always returns a {ok, ...} object — never throws. Logs are server-side only.
// ──────────────────────────────────────────────────────────────────────────
export async function fetchWebsite(rawUrl) {
  const variants = urlVariants(rawUrl);
  if (!variants.length) {
    log("invalid_url", rawUrl);
    return { ok: false, url: rawUrl, error: "invalid_url", attempts: [] };
  }

  const attempts = [];
  let success = null;

  for (const v of variants) {
    const r = await fetchOnce(v);
    attempts.push({ url: v, ok: r.ok, status: r.error || "200", ms: r.ms });
    log(r.ok ? "OK" : "FAIL", v, r.error || "", r.ms + "ms");
    if (r.ok) {
      success = r;
      break;
    }
  }

  if (!success) {
    return { ok: false, url: rawUrl, error: "all_variants_failed", attempts };
  }

  // Build initial summary
  let summary = summarize(success.html, success.finalUrl);

  // If homepage is thin, try a couple of common sub-pages on the SAME origin
  const bodyLen = (summary.bodyExcerpt || "").length;
  if (bodyLen < THIN_HOMEPAGE_THRESHOLD) {
    const origin = new URL(success.finalUrl).origin;
    let extra = 0;
    for (const path of SUB_PAGES) {
      if (extra >= MAX_SUB_PAGE_FETCHES) break;
      const subUrl = origin + path;
      const r = await fetchOnce(subUrl);
      attempts.push({ url: subUrl, ok: r.ok, status: r.error || "200", ms: r.ms });
      log(r.ok ? "OK-sub" : "FAIL-sub", subUrl, r.error || "", r.ms + "ms");
      if (r.ok) {
        const subSummary = summarize(r.html, r.finalUrl);
        summary = mergeSummaries(summary, subSummary);
        extra++;
        if ((summary.bodyExcerpt || "").length >= THIN_HOMEPAGE_THRESHOLD) break;
      }
    }
  }

  log("EXTRACT", success.finalUrl, "bodyLen=" + (summary.bodyExcerpt || "").length, "headings=" + (summary.headings?.length || 0));
  return { ok: true, url: success.finalUrl, html: success.html, summary, attempts };
}

function log(...parts) {
  // Server-side only — never returned to the user.
  // eslint-disable-next-line no-console
  console.log("[scrape]", ...parts);
}

// ──────────────────────────────────────────────────────────────────────────
// HTML → structured summary
// ──────────────────────────────────────────────────────────────────────────
function summarize(html, finalUrl) {
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription =
    pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pick(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const ogTitle = pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDescription = pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogSiteName = pick(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

  const headings = [];
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let m;
  while ((m = h1Re.exec(html)) && headings.length < 6) {
    const t = stripTags(m[1]).trim();
    if (t) headings.push({ level: 1, text: t });
  }
  while ((m = h2Re.exec(html)) && headings.length < 14) {
    const t = stripTags(m[1]).trim();
    if (t) headings.push({ level: 2, text: t });
  }
  while ((m = h3Re.exec(html)) && headings.length < 20) {
    const t = stripTags(m[1]).trim();
    if (t) headings.push({ level: 3, text: t });
  }

  // Nav labels (often product/service categories)
  const navLabels = [];
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  if (navMatch) {
    const navHTML = navMatch[1];
    const linkRe = /<a[^>]*>([\s\S]*?)<\/a>/gi;
    let l;
    while ((l = linkRe.exec(navHTML)) && navLabels.length < 12) {
      const txt = stripTags(l[1]).trim();
      if (txt && txt.length < 40) navLabels.push(txt);
    }
  }

  // Social links
  const socialDomains = ["instagram.com", "facebook.com", "x.com", "twitter.com", "linkedin.com", "tiktok.com", "youtube.com", "wa.me"];
  const socials = new Set();
  const linkRe2 = /<a[^>]+href=["']([^"']+)["']/gi;
  let lk;
  while ((lk = linkRe2.exec(html)) && socials.size < 12) {
    const href = lk[1];
    for (const d of socialDomains) {
      if (href.includes(d)) {
        socials.add(href.split(/[?#]/)[0]);
        break;
      }
    }
  }

  // JSON-LD structured data — pull @type, name, description if present
  const jsonLd = [];
  const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = jsonLdRe.exec(html)) && jsonLd.length < 3) {
    try {
      const obj = JSON.parse(m[1].trim());
      const entries = Array.isArray(obj) ? obj : [obj];
      for (const e of entries) {
        if (!e) continue;
        const piece = [];
        if (e["@type"]) piece.push(String(e["@type"]).slice(0, 40));
        if (e.name) piece.push(String(e.name).slice(0, 100));
        if (e.description) piece.push(String(e.description).slice(0, 240));
        if (piece.length) jsonLd.push(piece.join(" — "));
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  // Body text
  const bodyText = stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2800);

  return {
    finalUrl,
    title: title ? cleanText(title) : null,
    siteName: ogSiteName ? cleanText(ogSiteName) : null,
    description: cleanText(metaDescription || ogDescription || ""),
    ogTitle: ogTitle ? cleanText(ogTitle) : null,
    headings: headings.map((h) => `${h.level === 1 ? "H1" : h.level === 2 ? "H2" : "H3"}: ${h.text.slice(0, 140)}`).slice(0, 16),
    navLabels,
    socials: Array.from(socials).slice(0, 6),
    jsonLd,
    bodyExcerpt: bodyText,
  };
}

function mergeSummaries(base, extra) {
  return {
    finalUrl: base.finalUrl,
    title: base.title || extra.title,
    siteName: base.siteName || extra.siteName,
    description: base.description || extra.description,
    ogTitle: base.ogTitle || extra.ogTitle,
    headings: dedupeStrings([...(base.headings || []), ...(extra.headings || [])]).slice(0, 20),
    navLabels: dedupeStrings([...(base.navLabels || []), ...(extra.navLabels || [])]).slice(0, 16),
    socials: dedupeStrings([...(base.socials || []), ...(extra.socials || [])]).slice(0, 8),
    jsonLd: dedupeStrings([...(base.jsonLd || []), ...(extra.jsonLd || [])]).slice(0, 5),
    bodyExcerpt: ((base.bodyExcerpt || "") + " \n " + (extra.bodyExcerpt || "")).slice(0, 4500),
  };
}

function dedupeStrings(arr) {
  const seen = new Set();
  return arr.filter((s) => {
    const k = String(s).toLowerCase().trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
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
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, 300);
}

// ──────────────────────────────────────────────────────────────────────────
// Prompt block builder
// ──────────────────────────────────────────────────────────────────────────
export function summaryToPromptBlock(summary, lang = "en") {
  if (!summary) return "";
  const lines = [];
  if (lang === "ar") {
    lines.push(`الموقع المُفحَص: ${summary.finalUrl}`);
    if (summary.title) lines.push(`عنوان الصفحة: ${summary.title}`);
    if (summary.siteName) lines.push(`اسم الموقع: ${summary.siteName}`);
    if (summary.ogTitle && summary.ogTitle !== summary.title) lines.push(`OG Title: ${summary.ogTitle}`);
    if (summary.description) lines.push(`وصف الموقع: ${summary.description}`);
    if (summary.navLabels?.length) lines.push("روابط التنقل: " + summary.navLabels.join(" | "));
    if (summary.headings?.length) lines.push("عناوين رئيسية:\n" + summary.headings.join("\n"));
    if (summary.jsonLd?.length) lines.push("بيانات منظمة:\n" + summary.jsonLd.join("\n"));
    if (summary.socials?.length) lines.push("روابط اجتماعية: " + summary.socials.join(" | "));
    if (summary.bodyExcerpt) lines.push("مقتطف من نص الصفحة:\n" + summary.bodyExcerpt);
  } else {
    lines.push(`Scraped URL: ${summary.finalUrl}`);
    if (summary.title) lines.push(`Page title: ${summary.title}`);
    if (summary.siteName) lines.push(`Site name: ${summary.siteName}`);
    if (summary.ogTitle && summary.ogTitle !== summary.title) lines.push(`OG title: ${summary.ogTitle}`);
    if (summary.description) lines.push(`Meta description: ${summary.description}`);
    if (summary.navLabels?.length) lines.push("Nav labels: " + summary.navLabels.join(" | "));
    if (summary.headings?.length) lines.push("Headings:\n" + summary.headings.join("\n"));
    if (summary.jsonLd?.length) lines.push("Structured data:\n" + summary.jsonLd.join("\n"));
    if (summary.socials?.length) lines.push("Social links: " + summary.socials.join(" | "));
    if (summary.bodyExcerpt) lines.push("Body excerpt:\n" + summary.bodyExcerpt);
  }
  return lines.join("\n");
}

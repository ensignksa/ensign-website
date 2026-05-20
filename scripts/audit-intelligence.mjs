#!/usr/bin/env node
// Ensign Intelligence — local audit script.
//
// Runs a battery of PASS/FAIL checks across the intelligence layer:
//   - URL extraction + normalization + variant generation
//   - Live scrape against ensignksa.com (4 input shapes)
//   - Prompt-block builder (EN + AR)
//   - System prompt generation across all 6 lenses x 2 modes x 2 languages
//   - Off-topic handling rule presence
//   - Visual workflow rule presence
//   - Lens inference for representative prompts
//   - bulletizeQuestions multi-question pass-through
//   - No internal agent / file path / tooling leakage in public files
//
// Usage:
//   node scripts/audit-intelligence.mjs
//
// Set SKIP_NETWORK=1 to skip the live scrape (useful when offline / on CI).

import { extractURL, normalizeURL, urlVariants, fetchWebsite, summaryToPromptBlock } from "../api/intelligence/_lib/scrape.js";
import { systemEN } from "../api/intelligence/_lib/prompts/system.en.js";
import { systemAR } from "../api/intelligence/_lib/prompts/system.ar.js";
import { inferLens, bulletizeQuestions } from "../api/intelligence/message.js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, extra) {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}` + (extra ? `  (${extra})` : ""));
  } else {
    fail++;
    failures.push(name);
    console.log(`  FAIL  ${name}` + (extra ? `  (${extra})` : ""));
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── 1) URL extraction ─────────────────────────────────────────────────────
section("URL extraction from free text");
check("extract bare 'ensignksa.com'", extractURL("ensignksa.com") === "https://ensignksa.com");
check("extract 'www.ensignksa.com'", extractURL("www.ensignksa.com") === "https://www.ensignksa.com");
check("extract https URL", extractURL("https://ensignksa.com") === "https://ensignksa.com");
check("extract https www URL", extractURL("https://www.ensignksa.com") === "https://www.ensignksa.com");
check("extract URL inside sentence", extractURL("check my site www.ensignksa.com please") === "https://www.ensignksa.com");
check("trailing punctuation stripped", extractURL("see https://ensignksa.com.") === "https://ensignksa.com");
check("ignores non-URL text", extractURL("hello world") === null);

// ── 2) URL normalization + variants ───────────────────────────────────────
section("URL normalization + variant generation");
check("normalize 'www.ensignksa.com' adds https", normalizeURL("www.ensignksa.com") === "https://www.ensignksa.com/");
check("normalize trims spaces", normalizeURL("  https://ensignksa.com  ") === "https://ensignksa.com/");
check("normalize lowercases host", normalizeURL("HTTPS://ENSIGNKSA.COM") === "https://ensignksa.com/");
check("variants include www toggle (in)", urlVariants("ensignksa.com").includes("https://www.ensignksa.com/"));
check("variants include www toggle (out)", urlVariants("www.ensignksa.com").includes("https://ensignksa.com/"));
check("variants include http fallback", urlVariants("ensignksa.com").some((u) => u.startsWith("http://")));
check("variants are deduped", new Set(urlVariants("ensignksa.com")).size === urlVariants("ensignksa.com").length);

// ── 3) Live scrape — 4 input shapes ──────────────────────────────────────
section("Live scrape against ensignksa.com (set SKIP_NETWORK=1 to skip)");
if (process.env.SKIP_NETWORK === "1") {
  console.log("  SKIP  network tests (SKIP_NETWORK=1)");
} else {
  const inputs = ["www.ensignksa.com", "ensignksa.com", "https://ensignksa.com", "https://www.ensignksa.com"];
  const scrapeResults = {};
  for (const input of inputs) {
    const t0 = Date.now();
    const r = await fetchWebsite(input);
    const ms = Date.now() - t0;
    const titleLen = r.summary?.title?.length || 0;
    const bodyLen = r.summary?.bodyExcerpt?.length || 0;
    const headingsCt = r.summary?.headings?.length || 0;
    check(`scrape '${input}'`, r.ok === true, `${ms}ms, title=${titleLen}, body=${bodyLen}, headings=${headingsCt}`);
    if (r.ok) {
      scrapeResults[input] = r;
      check(`  '${input}' has title`, titleLen > 0);
      check(`  '${input}' has body excerpt`, bodyLen > 100);
      check(`  '${input}' has at least 1 heading`, headingsCt >= 1);
    } else {
      console.log("    attempts:", JSON.stringify(r.attempts).slice(0, 400));
    }
  }

  // Prompt block builder shape
  const sample = scrapeResults["https://ensignksa.com"];
  if (sample?.summary) {
    const blockEN = summaryToPromptBlock(sample.summary, "en");
    const blockAR = summaryToPromptBlock(sample.summary, "ar");
    check("EN prompt block contains 'Scraped URL'", blockEN.includes("Scraped URL"));
    check("EN prompt block contains 'Page title'", blockEN.includes("Page title"));
    check("AR prompt block contains 'الموقع المُفحَص'", blockAR.includes("الموقع المُفحَص"));
    check("AR prompt block contains 'عنوان الصفحة'", blockAR.includes("عنوان الصفحة"));
  }
}

// ── 4) System prompts across lenses x languages x modes ──────────────────
section("System prompt generation (6 lenses × 2 modes × 2 languages = 24 calls)");
const LENSES = ["sales", "marketing", "workflow", "reporting", "content", "agents"];
for (const lang of ["en", "ar"]) {
  for (const lens of LENSES) {
    for (const fp of [false, true]) {
      const fn = lang === "en" ? systemEN : systemAR;
      let out;
      try {
        out = fn({
          name: "Test",
          company: "Acme",
          industry: "Other",
          website: "",
          turnIndex: fp ? 2 : 1,
          totalTurns: 3,
          selectedIntelligence: lens,
          forceProduce: fp,
        });
      } catch (e) {
        check(`${lang} / ${lens} / fp=${fp} compiles`, false, e.message);
        continue;
      }
      check(`${lang} / ${lens} / fp=${fp} returns non-empty prompt`, out && out.length > 1000, `len=${out?.length || 0}`);
    }
  }
}

// ── 5) Critical prompt rules present ─────────────────────────────────────
section("Critical prompt rules present (EN + AR)");
const enSample = systemEN({ name: "T", company: "C", industry: "Tech", website: "", turnIndex: 1, totalTurns: 3, selectedIntelligence: "marketing", forceProduce: false });
const arSample = systemAR({ name: "T", company: "C", industry: "Tech", website: "", turnIndex: 1, totalTurns: 3, selectedIntelligence: "marketing", forceProduce: false });
check("EN has INFER FIRST block", enSample.includes("INFER FIRST"));
check("EN has VISUAL REQUEST WORKFLOW", enSample.includes("VISUAL REQUEST WORKFLOW"));
check("EN has ENSIGN OS BRIDGE", enSample.includes("ENSIGN OS BRIDGE"));
check("EN has OFF-TOPIC HANDLING", enSample.includes("OFF-TOPIC HANDLING"));
check("EN has bullet format example", enSample.includes("- What's your website"));
check("AR has equivalent infer-first rule", arSample.includes("استنتج أولاً"));
check("AR has visual workflow", arSample.includes("مسار طلب المرئيات"));
check("AR has off-topic rule", arSample.includes("التعامل مع الأسئلة خارج النطاق"));

// Scrape-failed shape: ensure new "SCRAPE UNAVAILABLE" wording + no "try another URL"
const enFailed = systemEN({ name: "T", company: "C", industry: "Tech", website: "", turnIndex: 2, totalTurns: 3, selectedIntelligence: "marketing", forceProduce: false, scrapeStatus: "failed", scrapedURL: "https://example.com" });
const arFailed = systemAR({ name: "T", company: "C", industry: "Tech", website: "", turnIndex: 2, totalTurns: 3, selectedIntelligence: "marketing", forceProduce: false, scrapeStatus: "failed", scrapedURL: "https://example.com" });
check("EN scrape-failed says SCRAPE UNAVAILABLE", enFailed.includes("SCRAPE UNAVAILABLE"));
check("EN scrape-failed forbids 'try another URL'", !/try another URL/i.test(enFailed) || enFailed.includes("Do NOT ask the user to \"try another URL\""));
check("AR scrape-failed says الفحص غير متاح", arFailed.includes("الفحص غير متاح"));

// ── 6) Lens inference ────────────────────────────────────────────────────
section("Lens inference from first message");
const inferCases = [
  ["my leads are slow, no CRM", "sales"],
  ["I need a marketing plan", "marketing"],
  ["approvals are stacking up", "workflow"],
  ["I can't read our dashboards", "reporting"],
  ["create me a campaign visual", "content"],
  ["I want an AI agent for sales follow-up", "agents"],
  ["عندي مشكلة في متابعة العملاء", "sales"],
  ["اريد خطة تسويقية", "marketing"],
  ["مرئية حملة جديدة", "content"],
];
for (const [text, expected] of inferCases) {
  const got = inferLens(text, "en");
  check(`infer '${text.slice(0, 40)}' -> ${expected}`, got === expected, `got=${got}`);
}

// ── 7) bulletizeQuestions ────────────────────────────────────────────────
section("bulletizeQuestions post-processor");
const bullet1 = bulletizeQuestions("To shape this tightly:\nWhat is your website?\nWhat country?\nWhat is the one outcome?\n\nI'll come back with the build direction.");
check("3 questions get '- ' bullets", /- What is your website/.test(bullet1) && /- What country/.test(bullet1));
const bullet2 = bulletizeQuestions("Got it. What is your CRM?");
check("1 question stays unbulleted", !/^- /m.test(bullet2));
const bullet3 = bulletizeQuestions("- Already?\n- Already?\n- Already?");
check("already-bulleted passes through", bullet3 === "- Already?\n- Already?\n- Already?");
const bullet4 = bulletizeQuestions("عشان أبني:\nما الموقع؟\nأي بلد؟\nما النتيجة؟");
check("Arabic 3 questions bulleted", /- ما الموقع؟/.test(bullet4) && /- أي بلد؟/.test(bullet4));

// ── 8) No internal name / path leakage in public files ───────────────────
section("No internal-name leakage in public prompt files");
// Internal titles use Capitalized noun + Agent (e.g. "Sales Agent — AI Sales
// Strategist" in the private .md). The public lens prose uses lowercase
// "Ensign's sales agent" which is intentional. Match the capitalized-title
// form only (case-sensitive) to avoid catching the deliberate public framing.
const FORBIDDEN = [
  /\b(CEO|Sales|Engineer|Research|Marketing|Content Creator|Operations|Growth) Agent\b/,
  /AI Operating System/,
  /Ensign AI Marketing Agency/,
  /\bFastAPI\b/,
  /\bSupabase\b/,
  /ensign-ai-marketing-agency/,
  /AGENT_LLM/,
  /KV_REST_API/,
  /GEMINI_API_KEY/,
  /\bMCP\b/,
  /\bXBL\b/i,
];
const PUBLIC_FILES = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|md)$/.test(p) && !name.startsWith(".") && !p.includes("README")) PUBLIC_FILES.push(p);
  }
}
walk("api/intelligence/_lib/prompts");
let leakHits = 0;
for (const f of PUBLIC_FILES) {
  const t = readFileSync(f, "utf8");
  for (const re of FORBIDDEN) {
    if (re.test(t)) {
      leakHits++;
      console.log(`    LEAK in ${f}: matches ${re}`);
    }
  }
}
check("zero forbidden internal terms in lens/system prompts", leakHits === 0, `${leakHits} hits`);

// ── Summary ──────────────────────────────────────────────────────────────
console.log("\n── SUMMARY ──");
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
if (fail) {
  console.log("\n  Failures:");
  for (const f of failures) console.log("    -", f);
  process.exit(1);
}
console.log("\n  All checks passed.");

// Switch all public pages from:
//   - placeholder GTM container code (head + noscript) — REMOVE
//   - direct GA4 gtag.js (G-LWTQMQ08D4)              — REPLACE with Google Tag
// to:
//   - Google Tag (GT-PJ5SSC9S) gtag.js               — single unified tag
// Idempotent.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAGES = [
  'index.html', 'about.html', 'agency.html', 'ai-solutions.html',
  'ensign-os.html', 'work.html', 'careers.html',
  'privacy-policy.html', 'terms-and-conditions.html',
  'blog/index.html',
  'blog/ai-content-creation-vs-human-copywriters-saudi.html',
  'blog/ai-lead-generation-saudi-arabia.html',
  'blog/ai-marketing-automations-saudi-business-2026.html',
  'blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html',
  'blog/crm-setup-saudi-businesses.html',
  'blog/in-house-marketing-vs-ai-agency-saudi-smes.html',
  'blog/marketing-automation-guide-saudi-smes.html',
  'blog/signs-marketing-wasting-budget-ai-fix.html',
  'blog/what-is-ai-marketing-agency-saudi-arabia.html',
  'ar/index.html', 'ar/about.html', 'ar/agency.html', 'ar/ai-solutions.html',
  'ar/ensign-os.html', 'ar/work.html', 'ar/careers.html',
  'ar/privacy-policy.html', 'ar/terms-and-conditions.html',
  'ar/blog/index.html',
  'ar/blog/ai-content-creation-vs-human-copywriters-saudi.html',
  'ar/blog/ai-lead-generation-saudi-arabia.html',
  'ar/blog/ai-marketing-automations-saudi-business-2026.html',
  'ar/blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html',
  'ar/blog/crm-setup-saudi-businesses.html',
  'ar/blog/in-house-marketing-vs-ai-agency-saudi-smes.html',
  'ar/blog/marketing-automation-guide-saudi-smes.html',
  'ar/blog/signs-marketing-wasting-budget-ai-fix.html',
  'ar/blog/what-is-ai-marketing-agency-saudi-arabia.html',
];

const GA4_ID = 'G-LWTQMQ08D4';
const GT_ID = 'GT-PJ5SSC9S';

const stats = { processed: 0, gtmHeadRemoved: 0, gtmNoscriptRemoved: 0, gaSwapped: 0, missing: [] };

for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { stats.missing.push(rel); continue; }
  let html = fs.readFileSync(file, 'utf8');
  let touched = false;

  // 1. Remove the GTM container head block
  const gtmHeadRegex = /\n?<!--\s*Google Tag Manager\s*-->[\s\S]*?<!--\s*End Google Tag Manager\s*-->\s*/i;
  if (gtmHeadRegex.test(html)) {
    html = html.replace(gtmHeadRegex, '\n');
    stats.gtmHeadRemoved++;
    touched = true;
  }

  // 2. Remove the GTM noscript block
  const gtmNoscriptRegex = /\n?<!--\s*Google Tag Manager \(noscript\)\s*-->[\s\S]*?<!--\s*End Google Tag Manager \(noscript\)\s*-->\s*/i;
  if (gtmNoscriptRegex.test(html)) {
    html = html.replace(gtmNoscriptRegex, '\n');
    stats.gtmNoscriptRemoved++;
    touched = true;
  }

  // 3. Replace G-LWTQMQ08D4 → GT-PJ5SSC9S in the gtag.js install
  if (html.includes(GA4_ID)) {
    const before = html;
    html = html.replaceAll(GA4_ID, GT_ID);
    if (html !== before) {
      stats.gaSwapped++;
      touched = true;
    }
  }

  if (touched) fs.writeFileSync(file, html);
  stats.processed++;
}

console.log('--- swap-to-google-tag summary ---');
console.log('processed             ', stats.processed);
console.log('GTM head removed      ', stats.gtmHeadRemoved);
console.log('GTM noscript removed  ', stats.gtmNoscriptRemoved);
console.log('GA4→Google Tag swap   ', stats.gaSwapped);
if (stats.missing.length) console.log('missing files         ', stats.missing);

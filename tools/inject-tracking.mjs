// Inject GTM head/noscript and analytics.js into every public HTML page.
// Idempotent: safe to re-run.
//
// Run: node tools/inject-tracking.mjs

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

// Placeholder GTM ID — replace with real container ID once created
const GTM_ID = 'GTM-XXXXXXX';

const GTM_HEAD = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const GTM_NOSCRIPT = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const ANALYTICS_TAG = `<script src="/assets/js/analytics.js" defer></script>`;

const stats = { processed: 0, gtmAdded: 0, noscriptAdded: 0, analyticsAdded: 0, alreadyDone: 0, missing: [] };

for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { stats.missing.push(rel); continue; }

  let html = fs.readFileSync(file, 'utf8');
  let touched = false;
  let alreadyHadAll = true;

  // 1. GTM head — insert as the very first <script> tag inside <head>
  if (!/googletagmanager\.com\/gtm\.js/.test(html)) {
    // Insert right after <meta charset…> or right after <head>
    const headOpen = /<head[^>]*>/i.exec(html);
    if (headOpen) {
      const insertAt = headOpen.index + headOpen[0].length;
      html = html.slice(0, insertAt) + '\n' + GTM_HEAD + html.slice(insertAt);
      stats.gtmAdded++;
      touched = true;
      alreadyHadAll = false;
    }
  }

  // 2. GTM noscript — insert immediately after <body…> opening tag
  if (!/googletagmanager\.com\/ns\.html/.test(html)) {
    const bodyOpen = /<body[^>]*>/i.exec(html);
    if (bodyOpen) {
      const insertAt = bodyOpen.index + bodyOpen[0].length;
      html = html.slice(0, insertAt) + '\n' + GTM_NOSCRIPT + html.slice(insertAt);
      stats.noscriptAdded++;
      touched = true;
      alreadyHadAll = false;
    }
  }

  // 3. analytics.js — insert before </head>
  if (!html.includes('/assets/js/analytics.js')) {
    html = html.replace(/<\/head>/i, '  ' + ANALYTICS_TAG + '\n</head>');
    stats.analyticsAdded++;
    touched = true;
    alreadyHadAll = false;
  }

  if (touched) fs.writeFileSync(file, html);
  if (alreadyHadAll) stats.alreadyDone++;
  stats.processed++;
}

console.log('--- inject-tracking summary ---');
console.log('processed       ', stats.processed);
console.log('GTM head added  ', stats.gtmAdded);
console.log('GTM noscript    ', stats.noscriptAdded);
console.log('analytics.js    ', stats.analyticsAdded);
console.log('already had all ', stats.alreadyDone);
if (stats.missing.length) console.log('missing files   ', stats.missing);

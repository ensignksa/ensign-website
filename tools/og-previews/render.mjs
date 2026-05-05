// Render the 4 OG variants to individual PNGs at 1200×630
// Run: node tools/og-previews/render.mjs
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'individual');

const url = 'http://localhost:8080/tools/og-previews/';
const variants = ['v1', 'v2', 'v3', 'v4'];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 7000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // wait for fonts
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  for (const v of variants) {
    const el = await page.$(`.${v}`);
    if (!el) { console.log(`! ${v} not found`); continue; }
    const out = path.join(outDir, `${v}.png`);
    await el.screenshot({ path: out, omitBackground: false });
    console.log(`✓ ${out}`);
  }
  await browser.close();
})();

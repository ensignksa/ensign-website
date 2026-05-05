// Render final OG composite to 1200x630 PNG
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'http://localhost:8080/tools/og-previews/final.html';
const out = path.join(__dirname, 'individual', 'final.png');
const outProd = path.join(__dirname, '..', '..', 'assets', 'og-image.png');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const el = await page.$('#og');
  await el.screenshot({ path: out, omitBackground: false });
  console.log(`✓ ${out}`);
  await browser.close();
})();

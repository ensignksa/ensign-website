// Render every per-page OG image from pages.config + template
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PAGES } from './pages.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, 'individual', 'pages');
const outDir = path.join(__dirname, '..', '..', 'assets', 'og', 'pages');
fs.mkdirSync(tmpDir, { recursive:true });
fs.mkdirSync(outDir, { recursive:true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport:{width:1200,height:630}, deviceScaleFactor:2 });
const page = await context.newPage();

// Pre-warm by hitting the bg image directly so it sits in browser cache
await page.goto('http://localhost:8080/assets/og/og-bg.png', { waitUntil:'load' });
await page.waitForTimeout(500);

for (const p of PAGES){
  const params = new URLSearchParams({ h:p.h, s:p.s, d:p.d, lang:p.lang });
  const url = `http://localhost:8080/tools/og-previews/template.html?${params.toString()}`;
  await page.goto(url, { waitUntil:'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Hard-wait for the actual rendered bg image to be decoded
  await page.evaluate(() => new Promise(r => {
    const probe = new Image();
    probe.onload = () => probe.decode().then(r,r);
    probe.onerror = r;
    probe.src = '/assets/og/og-bg.png';
  }));
  await page.waitForTimeout(1200);
  const tmpFile = path.join(tmpDir, `${p.slug}.png`);
  const outFile = path.join(outDir, `${p.slug}.png`);
  await page.locator('#og').screenshot({ path: tmpFile });
  await sharp(tmpFile).resize(1200,630,{fit:'cover'}).png({ quality:90, compressionLevel:9, palette:true }).toFile(outFile);
  const stat = fs.statSync(outFile);
  const ok = stat.size > 80*1024 ? '✓' : '!';
  console.log(`${ok} ${p.slug.padEnd(20)} ${(stat.size/1024).toFixed(0).padStart(4)} KB  [${p.lang}]`);
}
await browser.close();
console.log(`\nDone. ${PAGES.length} OG images rendered.`);

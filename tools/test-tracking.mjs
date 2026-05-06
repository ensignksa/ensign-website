// Verify analytics layer fires the expected dataLayer events.
// Tests run against the local Python http.server on :8080.
import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';

const results = [];
function pass(name, detail){ results.push({name, status:'PASS', detail: detail||''}); }
function fail(name, detail){ results.push({name, status:'FAIL', detail: detail||''}); }

async function withPage(url, fn){
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // Block real network out — GTM-XXXXXXX placeholder hangs, fonts irrelevant
  await page.route('**/googletagmanager.com/**', r => r.abort());
  await page.route('**/google-analytics.com/**', r => r.abort());
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('**/cdnjs.cloudflare.com/**', r => r.abort());
  await page.route('**/cal.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.route('**/wa.me/**', r => r.fulfill({ status: 200, body: 'ok' }));
  try {
    await page.goto(url, { waitUntil:'domcontentloaded', timeout: 25000 }).catch(()=>{});
    // analytics.js has `defer` — poll up to 12s
    let ok = false;
    for (let i = 0; i < 60 && !ok; i++) {
      await page.waitForTimeout(200);
      ok = await page.evaluate(() => typeof window.ensignTrack === 'function').catch(() => false);
    }
    if (!ok) {
      fail(`pageload_${url.split('/').pop().split('?')[0] || 'home'}`, 'ensignTrack never appeared');
      return;
    }
    await fn(page);
  } catch (e) {
    fail(`exception_${url.split('/').pop().split('?')[0] || 'home'}`, e.message.slice(0, 180));
  } finally { await browser.close(); }
}

async function getEvents(page){
  return page.evaluate(() => (window.dataLayer || []).map(x => x && x.event ? x.event : null).filter(Boolean));
}

// 1. dataLayer + GTM script present on homepage
await withPage(`${BASE}/index.html`, async page => {
  const hasGtm = await page.evaluate(() => !!document.querySelector('script[src*="googletagmanager.com/gtm.js"], script:not([src])')
    && document.documentElement.innerHTML.includes('GTM-'));
  hasGtm ? pass('homepage_gtm_head', 'GTM placeholder present') : fail('homepage_gtm_head');
  const hasAnalytics = await page.evaluate(() => !!document.querySelector('script[src*="/assets/js/analytics.js"]'));
  hasAnalytics ? pass('homepage_analytics_js', 'analytics.js loaded') : fail('homepage_analytics_js');
  const hasNoscript = await page.evaluate(() => !!document.querySelector('noscript iframe[src*="googletagmanager.com/ns.html"]'));
  hasNoscript ? pass('homepage_gtm_noscript') : fail('homepage_gtm_noscript');
  const hasGtag = await page.evaluate(() => typeof window.gtag === 'function');
  hasGtag ? pass('homepage_gtag_fn') : fail('homepage_gtag_fn');
  const hasTrack = await page.evaluate(() => typeof window.ensignTrack === 'function');
  hasTrack ? pass('homepage_ensignTrack_fn') : fail('homepage_ensignTrack_fn');
});

// 2. WhatsApp click on homepage
await withPage(`${BASE}/index.html`, async page => {
  const link = page.locator('a[href*="wa.me"]').first();
  if (!(await link.count())) { fail('homepage_whatsapp_present'); return; }
  pass('homepage_whatsapp_present');
  await link.evaluate(el => el.click());
  await page.waitForTimeout(200);
  const events = await getEvents(page);
  events.includes('whatsapp_click') ? pass('whatsapp_click_event', JSON.stringify(events)) : fail('whatsapp_click_event', JSON.stringify(events));
});

// 3. Cal.com booking click on homepage
await withPage(`${BASE}/index.html`, async page => {
  const link = page.locator('a[href*="cal.com/ensign"]').first();
  if (!(await link.count())) { fail('homepage_calcom_present'); return; }
  pass('homepage_calcom_present');
  await link.evaluate(el => el.click());
  await page.waitForTimeout(200);
  const events = await getEvents(page);
  events.includes('book_call_click') && events.includes('generate_lead')
    ? pass('book_call_click_event', JSON.stringify(events))
    : fail('book_call_click_event', JSON.stringify(events));
});

// 4. mailto click on homepage
await withPage(`${BASE}/index.html`, async page => {
  const link = page.locator('a[href^="mailto:"]').first();
  if (!(await link.count())) { fail('homepage_mailto_present'); return; }
  pass('homepage_mailto_present');
  await link.evaluate(el => el.click());
  await page.waitForTimeout(200);
  const events = await getEvents(page);
  events.includes('email_click')
    ? pass('email_click_event', JSON.stringify(events))
    : fail('email_click_event', JSON.stringify(events));
});

// 5. UTM capture
await withPage(`${BASE}/index.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=launch_test&utm_content=hero_v1`, async page => {
  await page.waitForTimeout(400);
  const events = await getEvents(page);
  events.includes('campaign_landing')
    ? pass('campaign_landing_event', JSON.stringify(events))
    : fail('campaign_landing_event', JSON.stringify(events));
  const utm = await page.evaluate(() => {
    const e = window.dataLayer.find(x => x && x.event === 'campaign_landing');
    return e || null;
  });
  utm && utm.utm_source === 'linkedin' && utm.utm_campaign === 'launch_test'
    ? pass('campaign_utm_params', JSON.stringify(utm))
    : fail('campaign_utm_params', JSON.stringify(utm));
});

// 6. Service-page view event
await withPage(`${BASE}/ai-solutions.html`, async page => {
  await page.waitForTimeout(500);
  const events = await getEvents(page);
  events.includes('view_service_page')
    ? pass('view_service_page_ai_solutions', JSON.stringify(events))
    : fail('view_service_page_ai_solutions', JSON.stringify(events));
});

// 7. Arabic page works the same way
await withPage(`${BASE}/ar/index.html`, async page => {
  await page.waitForTimeout(400);
  const lang = await page.evaluate(() => document.documentElement.lang);
  lang === 'ar' ? pass('ar_lang_attribute') : fail('ar_lang_attribute', lang);
  const link = page.locator('a[href*="wa.me"]').first();
  if (!(await link.count())) { fail('ar_whatsapp_present'); return; }
  await link.evaluate(el => el.click());
  await page.waitForTimeout(200);
  const events = await getEvents(page);
  events.includes('whatsapp_click') ? pass('ar_whatsapp_click') : fail('ar_whatsapp_click', JSON.stringify(events));
});

// 8. Careers form: form_start fires on submit attempt
await withPage(`${BASE}/careers.html`, async page => {
  const form = page.locator('form').first();
  if (!(await form.count())) { fail('careers_form_present'); return; }
  pass('careers_form_present');
  // dispatch a synthetic submit (don't actually post)
  await page.evaluate(() => {
    const f = document.querySelector('form');
    f.addEventListener('submit', e => e.preventDefault(), { once:true });
    f.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
  });
  await page.waitForTimeout(200);
  const events = await getEvents(page);
  events.includes('form_start') ? pass('careers_form_start') : fail('careers_form_start', JSON.stringify(events));
});

// --- Print results ---
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log('\n=== TRACKING TEST RESULTS ===');
results.forEach(r => console.log(`${r.status === 'PASS' ? '✓' : '✗'} ${r.name}${r.detail ? ' :: ' + r.detail.slice(0, 220) : ''}`));
console.log(`\n${passed}/${results.length} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

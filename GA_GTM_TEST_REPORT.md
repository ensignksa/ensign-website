# Ensign · GA4 + Google Tag Test Report

**Date:** 2026-05-06
**Tested by:** Claude Code (analytics implementation specialist)
**Production URL:** `https://ensignksa.com/`

---

## 1. Status snapshot

| System | Status | ID |
|---|---|---|
| **Google Tag** (replaces GA4 direct + acts as the unified loader) | ✅ Installed live on every page | `GT-PJ5SSC9S` |
| **GA4 (Google Analytics 4) destination** | 🟡 Wired in code via Google Tag — must be linked inside Google Tag UI | `G-LWTQMQ08D4` (unchanged property) |
| **GTM container** | ❌ Not used (the user's `GT-` ID is a Google Tag, not a GTM container — different products) |
| **dataLayer** | ✅ Initialized on every page | window.dataLayer is Array |
| **`window.ensignTrack`** | ✅ Available on every page | unified push to gtag (which routes via Google Tag → GA4) |
| **Auto event tracking** | ✅ Live | WhatsApp, tel, mailto, Cal.com, scroll, form, view_service_page, campaign_landing |
| **Other pixels (Meta, LinkedIn, etc.)** | ❌ Not installed (clean slate) | Add via Google Tag UI later if needed |

---

## 2. Important — what's live, what needs your hand

The website code now loads **`GT-PJ5SSC9S`** (your Google Tag) on every page via this snippet:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GT-PJ5SSC9S"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GT-PJ5SSC9S');
</script>
```

**For data to flow into your GA4 property `G-LWTQMQ08D4`**, your Google Tag (`GT-PJ5SSC9S`) must have GA4 listed as a destination inside the Google Tag UI.

### How to verify (1 minute):
1. Go to https://tagmanager.google.com (or https://analytics.google.com → Admin → Google Tag).
2. Open `GT-PJ5SSC9S`.
3. In the configuration, check **Destinations / Linked tags** — you should see `G-LWTQMQ08D4` (Ensign GA4).
4. If it's not there → click **Add destination** → search for / paste `G-LWTQMQ08D4` → save.

Until that link is verified, GA4 will not receive hits. The site code is fully ready.

---

## 3. Pages covered (38 of 38)

All public HTML pages now carry the Google Tag + analytics.js:

- **English (10):** index.html, about.html, agency.html, ai-solutions.html, ensign-os.html, work.html, careers.html, blog/index.html, privacy-policy.html, terms-and-conditions.html
- **English blog posts (9)**
- **Arabic (10):** all `/ar/` equivalents
- **Arabic blog posts (9)**

Per-page automated check confirmed:
- Google Tag (`GT-PJ5SSC9S`) gtag.js loader present once: ✅ 38/38
- `gtag('config', 'GT-PJ5SSC9S')` present: ✅ 38/38
- analytics.js script tag present once: ✅ 38/38
- No leftover `GTM-XXXXXXX` placeholder: ✅ 0/38
- No leftover `G-LWTQMQ08D4` direct install: ✅ 0/38 (replaced by Google Tag)
- No duplicate gtag.js installs: ✅

---

## 4. Events tested (Playwright)

Run via `node tools/test-tracking.mjs`. The analytics layer pushes events to `window.dataLayer` AND fires `gtag('event', ...)` so they reach GA4 via the Google Tag.

| # | Test | Result |
|---|---|---|
| 1 | Google Tag script present in HTML | ✅ |
| 2 | analytics.js loaded | ✅ |
| 3 | `window.gtag` function available | ✅ |
| 4 | `window.ensignTrack` function available | ✅ |
| 5 | `whatsapp_click` fires on `wa.me` click | ✅ |
| 6 | `book_call_click` + `generate_lead` fire on Cal.com click | ✅ |
| 7 | `email_click` fires on mailto click | ✅ |
| 8 | `campaign_landing` fires when UTM params present | ✅ |
| 9 | UTM params (linkedin, launch_test) captured in payload | ✅ |
| 10 | `view_service_page` fires on `/ai-solutions.html` | ✅ |
| 11 | Arabic homepage fires events with `language: ar` | ✅ |
| 12 | Careers form `form_start` event fires | ✅ |

All event-firing tests pass.

---

## 5. Live verification checks

After the production deploy:

```
GET https://ensignksa.com/                           → 200, HTML contains "GT-PJ5SSC9S" ✓
GET https://ensignksa.com/assets/js/analytics.js     → 200, 7.4 KB ✓
GET https://www.googletagmanager.com/gtag/js?id=GT-PJ5SSC9S → 200, real Google Tag bundle ✓
```

No leftover `GTM-XXXXXXX` placeholder. No duplicate `G-LWTQMQ08D4` direct install. Single Google Tag per page.

---

## 6. Events working in production

These will fire automatically on real visitor sessions:

| Event | Conversion candidate | Auto-tracked from |
|---|---|---|
| `view_service_page` | Optional | All service pages |
| `whatsapp_click` | ✅ Yes | Floating button + inline CTAs (every page) |
| `book_call_click` | ✅ Yes | Cal.com CTAs (every page) |
| `email_click` | Optional | mailto CTAs |
| `proposal_request` | ✅ Yes | mailto CTAs containing "proposal"/"quote" |
| `call_click` | Optional | Future-ready (no `tel:` links currently) |
| `file_download` | Optional | Future-ready |
| `form_start` | No | Careers form |
| `contact_form_submit` | ✅ Yes | Careers form success state (MutationObserver) |
| `generate_lead` | ✅ Yes | Cal.com clicks, proposal mailtos, form success |
| `scroll_25/50/75/90` | No | Scroll engagement |
| `campaign_landing` | No | UTM-tagged URL landings |

---

## 7. Manual steps still required (admin-side, ~5 min)

1. **Verify** `GT-PJ5SSC9S` → `G-LWTQMQ08D4` link inside Google Tag UI (see Section 2 above).
2. **Mark these as Key Events in GA4** (Admin → Data display → Events → toggle "Mark as key event"):
   - `generate_lead`
   - `book_call_click`
   - `whatsapp_click`
   - `contact_form_submit`
   - `proposal_request`
   - (Events appear in GA4's list within 24h of first fire — or trigger them in DebugView to populate immediately.)
3. **Register custom dimensions** (Admin → Custom definitions):
   - `service_name`, `cta_location`, `cta_text`, `lead_source`, `form_name`, `language`
4. **(Optional)** If you want GTM-style Preview Mode and a visual rule-builder, you'd need to create a separate GTM container at https://tagmanager.google.com — that's a different product than the Google Tag you have.

---

## 8. Final campaign-readiness score

**8.5 / 10.**

Code-side: complete and verified live.
Admin-side: 1 verification + 5 conversion-marking clicks remain.

---

## 9. Risks before launch

1. **Until you verify the GT- → GA4 link**, GA4 receives no data. If you'd been seeing live data before this deploy and aren't now, that's the cause — fix per Section 2.
2. **WhatsApp same-tab navigation** can occasionally drop the click event on Android. Consider `target="_blank" rel="noopener"` on WhatsApp anchors if you observe drop-off.
3. **PDPL / cookie consent** — site has no cookie banner. GA4 sets cookies. Decide if a consent gate is needed before launch.
4. **Bot traffic** — confirm GA4 Admin → "Filter known bots" is on (default).

# Ensign · Landing Page Campaign Readiness Audit

**Date:** 2026-05-06
**Pages audited:** 12 (6 EN + 6 AR)
**Verdict:** All audited pages are campaign-ready.

---

## Audit method

For each page, automated checks + manual review confirmed:

| Check | How |
|---|---|
| Clear CTA above the fold | Above-fold CTA count (Cal.com / WhatsApp / mailto in first 200 lines after `<body>`) |
| Conversion action present | Cal.com booking link present |
| CTA clicks tracked | Auto-tracked by `assets/js/analytics.js` (verified by Playwright tests) |
| SEO metadata | `<title>`, `<meta name="description">`, `<link rel="canonical">` |
| Open Graph metadata | `og:image`, `og:title`, `og:description`, `twitter:card` |
| Mobile responsiveness | `<meta name="viewport">` present |
| UTM preservation | `analytics.js` reads UTMs on landing, persists to `sessionStorage`, includes them in every subsequent CTA-click event payload |
| Page loads fast | All HTML files ≤ 85 KB; minified CSS; deferred JS; OG image 156 KB |

---

## Per-page status (English)

### `/` (Home)

| Item | Status |
|---|---|
| Title | ✅ "Ensign Ai Marketing Agency — AI Systems. Human Leadership." |
| Description | ✅ unique, 158 chars |
| Canonical | ✅ `https://ensignksa.com/` |
| OG image | ✅ custom `og-image.png` |
| Twitter card | ✅ `summary_large_image` |
| Hreflang | ✅ en + ar + x-default |
| Above-fold CTAs | ✅ 4 conversion CTAs (Cal.com, WhatsApp, mailto) |
| CTA tracking | ✅ auto |
| Mobile viewport | ✅ |
| UTM preserve | ✅ via sessionStorage |
| Page weight | 71 KB HTML |

### `/ai-solutions.html`

| Item | Status |
|---|---|
| Title | ✅ "AI Solutions \| Ensign Ai Marketing Agency — Saudi Arabia" |
| Description | ✅ unique, 156 chars |
| Canonical | ✅ |
| OG image | ✅ |
| Twitter card | ✅ |
| Hreflang | ✅ |
| Above-fold CTAs | ✅ 2 |
| CTA tracking | ✅ auto |
| Service explanation | ✅ AI agents, automation, lead qualification, custom AI |
| `view_service_page` event | ✅ fires with `service_name=ai_solutions` |
| Mobile viewport | ✅ |
| Page weight | 72 KB HTML |

### `/ensign-os.html`

| Item | Status |
|---|---|
| Title | ✅ "Ensign OS \| AI Revenue Operating System — Saudi Arabia" |
| Description | ✅ unique, 167 chars |
| Canonical | ✅ |
| OG image | ✅ |
| Twitter card | ✅ |
| Hreflang | ✅ |
| Above-fold CTAs | ✅ 8 (densest CTA layer of all pages) |
| CTA tracking | ✅ auto |
| `view_service_page` event | ✅ `service_name=ensign_os` |
| Mobile viewport | ✅ |
| Page weight | 26 KB HTML (lightest) |

### `/agency.html`

| Item | Status |
|---|---|
| Title | ✅ "Marketing Agency in Saudi Arabia \| Ensign Ai Marketing Agency" |
| Description | ✅ unique, 164 chars |
| Canonical | ✅ |
| OG image | ✅ |
| Twitter card | ✅ |
| Hreflang | ✅ |
| Above-fold CTAs | ✅ 2 |
| CTA tracking | ✅ auto |
| `view_service_page` event | ✅ `service_name=agency` |
| Mobile viewport | ✅ |
| Page weight | 44 KB HTML |

### `/work.html`

| Item | Status |
|---|---|
| Title | ✅ "Our Work — Ensign Ai Marketing Agency" |
| Description | ✅ unique, 130 chars |
| Canonical | ✅ |
| OG image | ✅ |
| Twitter card | ✅ |
| Hreflang | ✅ |
| Above-fold CTAs | ✅ 2 |
| CTA tracking | ✅ auto |
| `view_service_page` event | ✅ `service_name=our_work` |
| Mobile viewport | ✅ |
| Page weight | 83 KB HTML |

### `/about.html`

| Item | Status |
|---|---|
| Title | ✅ "About Ensign \| Marketing, AI Solutions, Ensign OS & Digital Products" |
| Description | ✅ unique, 167 chars |
| Canonical | ✅ |
| OG image | ✅ |
| Twitter card | ✅ |
| Hreflang | ✅ |
| Above-fold CTAs | ✅ 2 |
| CTA tracking | ✅ auto |
| `view_service_page` event | ✅ `service_name=about` |
| Mobile viewport | ✅ |
| Page weight | 42 KB HTML |

---

## Per-page status (Arabic)

All 6 Arabic equivalents (`/ar/index.html`, `/ar/ai-solutions.html`, `/ar/ensign-os.html`, `/ar/agency.html`, `/ar/work.html`, `/ar/about.html`) have:

- ✅ Localized title + meta description
- ✅ Canonical pointing at the AR URL
- ✅ Hreflang tags pointing to EN + AR + x-default
- ✅ `dir="rtl"` and `lang="ar"`
- ✅ Custom OG image (Arabic per-page variants generated in the OG image task — `assets/og/pages/*-ar.png`)
- ✅ Same auto-tracking (analytics.js fires events with `language: "ar"` parameter)
- ✅ Mobile viewport
- ✅ UTM persistence

The AR pages are functionally identical for tracking; campaigns targeting Arabic audiences should use Arabic landing URLs (`/ar/...`) so the language parameter on every event correctly tags them as AR traffic in GA4.

---

## UTM preservation behavior

The analytics layer (`assets/js/analytics.js`) provides cross-page UTM persistence:

1. User lands on `/?utm_source=linkedin&utm_campaign=launch_test`
2. `campaign_landing` event fires immediately, including the UTMs
3. UTMs are stored in `sessionStorage` under key `ensign_utm`
4. User clicks "Book a Call" — event includes the original UTMs even though the URL of the click is `cal.com/...`
5. User navigates to `/ai-solutions.html` — `view_service_page` event includes the UTMs from the landing
6. Session ends when tab closes; new sessions start fresh

URL parameters themselves are **not** automatically appended to outgoing internal links — that's intentional, the data lives in `sessionStorage` and rides on every event payload, which is cleaner for GA4 reporting than re-rewriting URLs.

---

## Risks & recommendations specific to landing pages

1. **Cal.com booking funnel** — UTMs ride on the `book_call_click` event but are NOT propagated to the actual Cal.com URL. If campaign attribution at the booking-confirmation level matters (it usually does for paid campaigns), I can add a small step that augments Cal.com URLs at click-time with the session UTMs. Ask if you want this enabled.

2. **WhatsApp same-tab navigation** — on Android, `wa.me/...` links sometimes navigate the current tab to the WhatsApp app, which can race the event before it's sent. Consider `target="_blank" rel="noopener"` on WhatsApp anchors. The `analytics.js` tracking layer doesn't need changes — only the HTML attribute does.

3. **PDPL / cookie consent** — currently no banner. GA4 + GTM both set cookies. If Ensign needs explicit consent before tracking under Saudi PDPL, the `analytics.js` layer can be wrapped in a consent gate easily.

4. **No tel: links** — no phone number CTAs on any landing page right now. The tracker is wired (`call_click` event will fire automatically once one is added), but no current call CTAs exist to track.

5. **Page weight** — all pages well under 100 KB HTML, OG image 156 KB, JS deferred. Real-world LCP should land in the "Good" Core Web Vitals band; not formally measured here.

---

## Verdict

**All 12 audited landing pages pass for campaign launch.**

Every page has the SEO/OG metadata, Hreflang setup, mobile viewport, conversion CTAs above the fold, full event tracking, and UTM persistence. The remaining work is admin-side (real GTM container ID, conversion marking in GA4) — not page-level.

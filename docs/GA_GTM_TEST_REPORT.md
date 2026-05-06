# GA / GTM Test Report — Ensign Ai Marketing Agency
**Date:** 2026-05-06  
**Site:** https://ensignksa.com  
**Analyst:** Analytics Audit (Claude Code)

---

## 1. Summary

| Item | Status | Details |
|---|---|---|
| GA4 Measurement ID | ✅ Active | `G-LWTQMQ08D4` |
| Google Tag ID | ✅ Active | `GT-PJ5SSC9S` (routes to GA4) |
| GTM Container | ⚠️ Not installed | No GTM-XXXXXXX found in any HTML file |
| analytics.js event layer | ✅ Complete | Present on all 38 production pages |
| UTM tracking | ✅ Implemented | sessionStorage persistence |
| dataLayer | ✅ Initialized | On every page via analytics.js |
| Duplicate GA4 scripts | ✅ None | One tag per page |
| Duplicate GTM scripts | ✅ N/A | GTM not yet installed |
| Arabic pages tracked | ✅ Yes | All ar/ pages have GA4 + analytics.js |
| Blog pages tracked | ✅ Yes | All blog/ and ar/blog/ pages covered |

---

## 2. Current Architecture

```
Browser
  │
  ├─ <script async src="gtag/js?id=GT-PJ5SSC9S">  [HTML head — all pages]
  │     └─ Google Tag GT-PJ5SSC9S → routes to GA4 G-LWTQMQ08D4
  │
  └─ <script src="/assets/js/analytics.js" defer>  [HTML bottom — all pages]
        ├─ Pushes events via gtag('event', ...) → GA4 directly
        └─ Pushes events via dataLayer.push({event: ...}) → GTM (when installed)
```

**Important distinction:**
- `GT-PJ5SSC9S` is a **Google Tag** (not GTM). It routes data from gtag.js to GA4.
- `G-LWTQMQ08D4` is the **GA4 Measurement ID** (the actual Analytics property).
- No traditional **GTM container** (`GTM-XXXXXXX`) is installed.

---

## 3. Pages Audited

### English Pages
| Page | GA4 Tag | analytics.js | dataLayer | Status |
|---|---|---|---|---|
| `/` (index.html) | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/ai-solutions.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/ensign-os.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/agency.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/work.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/about.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/careers.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/privacy-policy.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |
| `/terms-and-conditions.html` | ✅ GT-PJ5SSC9S | ✅ | ✅ | Ready |

### Arabic Pages
| Page | GA4 Tag | analytics.js | Status |
|---|---|---|---|
| `/ar/` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/ai-solutions.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/ensign-os.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/agency.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/work.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/about.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |
| `/ar/careers.html` | ✅ GT-PJ5SSC9S | ✅ | Ready |

### Blog Pages (all have GA4 + analytics.js)
- `/blog/index.html` ✅
- `/blog/ai-lead-generation-saudi-arabia.html` ✅
- `/blog/ai-marketing-automations-saudi-business-2026.html` ✅
- `/blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html` ✅
- `/blog/crm-setup-saudi-businesses.html` ✅
- `/blog/in-house-marketing-vs-ai-agency-saudi-smes.html` ✅
- `/blog/marketing-automation-guide-saudi-smes.html` ✅
- `/blog/signs-marketing-wasting-budget-ai-fix.html` ✅
- `/blog/what-is-ai-marketing-agency-saudi-arabia.html` ✅
- `/blog/ai-content-creation-vs-human-copywriters-saudi.html` ✅
- Arabic equivalents (all 10) ✅

---

## 4. Events Status

### Implemented in analytics.js (fire on every page)
| Event | Status | Trigger |
|---|---|---|
| `campaign_landing` | ✅ | UTM params present in URL |
| `view_service_page` | ✅ | Service page load |
| `whatsapp_click` | ✅ | Click on wa.me / WhatsApp links |
| `book_call_click` | ✅ | Click on cal.com/ensign links |
| `generate_lead` | ✅ | Cal.com click / form success / proposal email |
| `call_click` | ✅ | Click on tel: links |
| `email_click` | ✅ | Click on mailto: links |
| `proposal_request` | ✅ | Click on mailto with "proposal"/"quote" |
| `file_download` | ✅ | Click on .pdf/.docx/.xlsx/.zip etc |
| `form_start` | ✅ | Form submit begins |
| `contact_form_submit` | ✅ | Web3Forms success state detected |
| `scroll_25` | ✅ | Scroll 25% depth |
| `scroll_50` | ✅ | Scroll 50% depth |
| `scroll_75` | ✅ | Scroll 75% depth |
| `scroll_90` | ✅ | Scroll 90% depth |

### Added via data attributes
| Event | Status | Notes |
|---|---|---|
| `service_interest` | ✅ Implemented | Fires via `data-event-name` on service grid items (index.html, ar/index.html), agency CTA, and ai-solutions hero CTAs. |

---

## 5. GTM Status

**GTM is NOT installed.** No `GTM-XXXXXXX` container code found anywhere in the codebase.

**Required manual action to set up GTM:**
1. Log in to https://tagmanager.google.com
2. Find or create a Web container for `ensignksa.com`
3. Copy the Container ID (`GTM-XXXXXXX`)
4. Share it to install in the HTML code
5. Configure GA4 tag + event tags inside GTM
6. Test in Preview Mode
7. Publish

**Note on architecture choice:**  
The current Google Tag (GT-PJ5SSC9S) + analytics.js setup is functionally complete.  
analytics.js already fires events to BOTH GA4 (via gtag) AND dataLayer (ready for GTM).  
Adding GTM provides centralized tag management and campaign flexibility without changing analytics.js.

---

## 6. Duplicate Tracking Risk

When GTM is installed, there will be **two GA4 firing paths**:
1. Direct Google Tag `GT-PJ5SSC9S` in HTML
2. GA4 tag inside GTM

**Action required when GTM is installed:**  
Remove the direct `GT-PJ5SSC9S` `<script>` tag from ALL HTML pages.  
Keep analytics.js — it handles event pushing to dataLayer, which GTM will listen to.

---

## 7. GA4 Key Events — Status

These should be marked as Key Events in GA4 → Admin → Events:

| Event | Key Event Status |
|---|---|
| `generate_lead` | ⚠️ Needs manual marking in GA4 |
| `book_call_click` | ⚠️ Needs manual marking in GA4 |
| `whatsapp_click` | ⚠️ Needs manual marking in GA4 |
| `contact_form_submit` | ⚠️ Needs manual marking in GA4 |
| `proposal_request` | ⚠️ Needs manual marking in GA4 |

See `GOOGLE_ANALYTICS_AND_GTM_MANUAL_STEPS.md` for step-by-step instructions.

---

## 8. GTM Preview Mode — Not Yet Tested

GTM Preview Mode requires a published (or draft preview) GTM container.  
Status: **Cannot test — GTM container not installed.**

Once GTM is installed and container ID is added to the codebase:
1. Open GTM → Preview
2. Enter `https://ensignksa.com`
3. Verify `gtm.js` loads in the Tags Fired panel
4. Verify `page_view` fires via GA4 Configuration tag
5. Visit a campaign URL and verify `campaign_landing` fires
6. Click WhatsApp button → verify `whatsapp_click` fires
7. Click Cal.com link → verify `book_call_click` + `generate_lead` fire

---

## 9. GA4 Realtime — Not Yet Verified

GA4 Realtime requires live traffic or DebugView mode.  
**Manual verification required** after GTM is published.

Test URL to verify:
```
https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=test_creative_v1&utm_term=test_audience
```

---

## 10. Final Campaign Readiness Score

| Area | Score |
|---|---|
| GA4 Installation | 9/10 |
| Event Tracking Coverage | 9/10 |
| UTM Tracking | 10/10 |
| dataLayer Implementation | 10/10 |
| GTM Installation | 0/10 — not installed |
| Key Events Marked | 0/10 — not done |
| GTM Tested | 0/10 — not testable yet |
| Overall | **6/10** — functional but GTM + Key Events outstanding |

---

## 11. Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| GTM not installed — no centralized tag management | Medium | Install GTM container |
| Duplicate GA4 on GTM install | High | Remove direct GT-PJ5SSC9S script on GTM install |
| Key Events not marked — conversions not counted | High | Mark in GA4 admin (manual step) |
| `service_interest` event missing | Low | Add to analytics.js or GTM trigger |
| blog/post-template.html uses old ID G-LWTQMQ08D4 | Low | Template file only — not a live post page |
| Concepts pages use G-LWTQMQ08D4 or no tracking | Negligible | Not customer-facing |

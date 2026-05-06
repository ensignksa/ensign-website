# Ensign · Analytics Event Map

**Version:** 1.0
**Date:** 2026-05-06
**Tracking layer:** GA4 direct (G-LWTQMQ08D4) + GTM dataLayer (placeholder `GTM-XXXXXXX`)
**Source:** `assets/js/analytics.js`

All events fire automatically via the analytics layer. Every event is pushed to BOTH:

1. **GA4 directly** via `gtag('event', name, params)` — works today
2. **GTM dataLayer** via `dataLayer.push({event:name, ...params})` — works once a real GTM container ID replaces `GTM-XXXXXXX`

No PII (names, emails, phone numbers, message bodies) is ever included in event parameters.

---

## Common parameters on every event

| Param | Source | Always present |
|---|---|---|
| `page_title` | `document.title` | ✅ |
| `page_location` | `location.href` | ✅ |
| `page_path` | `location.pathname` | ✅ |
| `language` | `<html lang>` (en/ar) | ✅ |
| `utm_source` | URL query → sessionStorage | If campaign URL was used |
| `utm_medium` | URL query → sessionStorage | If campaign URL was used |
| `utm_campaign` | URL query → sessionStorage | If campaign URL was used |
| `utm_content` | URL query → sessionStorage | If campaign URL was used |
| `utm_term` | URL query → sessionStorage | If campaign URL was used |

UTMs persist for the session — clicks several pages after the campaign landing still carry the original campaign attribution.

---

## Primary conversion events

These should be marked as **Key Events** (conversions) inside GA4.

### `generate_lead`
**Trigger:** Any high-intent action that signals a real lead — Cal.com booking click, a "Request a Proposal" mailto, or a successful Web3Forms submit on `careers.html`.
**Parameters:** `cta_text`, `cta_location`, `service_name`, `link_url`, `lead_source` (`cal_booking_click` | `email_proposal` | `website_form`).
**Fires from:** Every page where the action is reachable.
**Mark as conversion in GA4:** ✅ YES — primary KPI.
**Test:** `Cmd-click any Cal.com "Book a Call" button → check Realtime → Events → "generate_lead" should appear within 30s.`

### `contact_form_submit`
**Trigger:** Web3Forms careers form transitions to its `.form-success` state in the DOM (MutationObserver).
**Parameters:** `form_name` (`careers-form` if id present, else `form`).
**Fires from:** `careers.html`, `ar/careers.html`.
**Mark as conversion:** ✅ YES.
**Test:** Submit a real careers form (without sensitive data) → success message appears → event in DebugView.

### `whatsapp_click`
**Trigger:** Click on any link matching `wa.me`, `api.whatsapp.com`, `whatsapp.com`, or `whatsapp:` scheme.
**Parameters:** `cta_text`, `cta_location` (e.g. `hero`, `footer`, `contact`), `link_url`.
**Fires from:** Every page (floating button + inline CTAs).
**Mark as conversion:** ✅ YES (high-intent KSA market behaviour).
**Test:** Click the floating WhatsApp button → check Realtime → "whatsapp_click" appears.

### `book_call_click`
**Trigger:** Click on a link to `cal.com/ensign...` or `cal.eu/ensign...`. Also fires `generate_lead`.
**Parameters:** `cta_text`, `cta_location`, `service_name`, `link_url`.
**Fires from:** Every page that has a "Book a Call" CTA.
**Mark as conversion:** ✅ YES.
**Test:** Click any "Book a Call" button → realtime should show `book_call_click` AND `generate_lead`.

### `proposal_request`
**Trigger:** Click on any `mailto:` link whose visible text or URL contains "proposal" or "quote". Also fires `generate_lead`.
**Parameters:** `cta_text`, `cta_location`, `link_url`.
**Fires from:** Pages with "Request a Proposal" CTA (about, agency, services, etc.).
**Mark as conversion:** ✅ YES.
**Test:** Click any "Request a Proposal" button → 3 events: `email_click`, `proposal_request`, `generate_lead`.

---

## Secondary tracked events

These are **not** conversions but useful for funnel analysis.

### `call_click`
**Trigger:** Click on a `tel:` link.
**Parameters:** `cta_text`, `cta_location`, `link_url`.
**Mark as conversion:** Optional — only if phone CTAs are added (currently no `tel:` links in the site, but tracker is wired).

### `email_click`
**Trigger:** Click on any `mailto:` link.
**Parameters:** `cta_text`, `cta_location`, `link_url`.
**Mark as conversion:** Optional — non-proposal email clicks are softer intent.

### `view_service_page`
**Trigger:** Page view on a known service page (`/ai-solutions.html`, `/ensign-os.html`, `/agency.html`, `/work.html`, `/about.html`, `/careers.html`, plus AR equivalents).
**Parameters:** `service_name` (`ai_solutions` | `ensign_os` | `agency` | `our_work` | `about` | `careers`).
**Mark as conversion:** No — measure as a funnel step.
**Test:** Visit `/ai-solutions.html` → realtime → `view_service_page` with `service_name: ai_solutions`.

### `service_interest`
**Trigger:** Reserved for explicit `data-event-name="service_interest"` data-attribute on CTAs (e.g. service-card "Learn more" buttons in the future).
**Parameters:** `service_name`, `cta_text`, `cta_location`.
**Mark as conversion:** No.

### `file_download`
**Trigger:** Click on a link ending in `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.zip`, `.csv`.
**Parameters:** `file_url`, `file_extension`.
**Mark as conversion:** No.

### `form_start`
**Trigger:** First `submit` event on any `<form>` (before success).
**Parameters:** `form_name`.
**Mark as conversion:** No — funnel diagnostic.

### `scroll_25` / `scroll_50` / `scroll_75` / `scroll_90`
**Trigger:** User scrolls past 25%/50%/75%/90% of the page.
**Parameters:** `percent`.
**Mark as conversion:** No — engagement diagnostic.

### `campaign_landing`
**Trigger:** Page loaded with any `utm_*` query parameter present.
**Parameters:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
**Mark as conversion:** No — captures the entry point of the campaign.
**Test:** Visit `https://ensignksa.com/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=test` → DebugView → `campaign_landing` with the params.

---

## Service name vocabulary

Use these exact strings in `service_name` parameters and `data-service-name` attributes:

| String | Page |
|---|---|
| `ai_solutions` | AI Solutions |
| `ensign_os` | Ensign OS |
| `agency` | Marketing Agency |
| `our_work` | Our Work |
| `about` | About Ensign |
| `careers` | Careers |
| `growth_marketing` | (sub-service of agency) |
| `creative_production` | (sub-service of agency) |
| `automation` | (sub-service of ai_solutions) |
| `website_development` | (sub-service of agency) |
| `blog` | Blog |

---

## Adding tracking to a new CTA

The auto-tracker covers WhatsApp, tel, mailto, and Cal.com out of the box. For anything else, add data attributes:

```html
<button
  data-event-name="service_interest"
  data-cta-text="Explore Ensign OS"
  data-cta-location="hero"
  data-service-name="ensign_os">
  Explore Ensign OS
</button>
```

Section context is auto-detected from the closest `<section id>`, `<header>`, `<footer>`, or `<nav>` if `data-cta-location` is absent.

---

## Conversion checklist for GA4

In **GA4 → Admin → Events → Mark as Key Event**, toggle on:

- [ ] `generate_lead`
- [ ] `book_call_click`
- [ ] `whatsapp_click`
- [ ] `contact_form_submit`
- [ ] `proposal_request`

Optionally:
- [ ] `call_click` (if phone CTAs added later)
- [ ] `view_service_page` (if you want page-level conversions)

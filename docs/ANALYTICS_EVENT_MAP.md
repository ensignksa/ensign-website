# Analytics Event Map — Ensign Ai Marketing Agency
**GA4 Property:** G-LWTQMQ08D4  
**Google Tag:** GT-PJ5SSC9S  
**Event Layer:** `/assets/js/analytics.js`  
**Last Updated:** 2026-05-06

---

## Dual-Channel Architecture

Every event fires through TWO channels simultaneously:
1. **GA4 direct** — `window.gtag('event', name, params)` → Google Tag GT-PJ5SSC9S → GA4 G-LWTQMQ08D4
2. **dataLayer** — `window.dataLayer.push({event: name, ...params})` → GTM Custom Event trigger (when GTM is installed)

---

## Base Parameters (sent with every event)

| Parameter | Value | Notes |
|---|---|---|
| `page_title` | `document.title` | Auto |
| `page_location` | `location.href` | Full URL with UTM |
| `page_path` | `location.pathname` | Path only |
| `language` | `html[lang]` attribute | `en` or `ar` |
| `utm_source` | from URL / sessionStorage | If UTM present |
| `utm_medium` | from URL / sessionStorage | If UTM present |
| `utm_campaign` | from URL / sessionStorage | If UTM present |
| `utm_content` | from URL / sessionStorage | If UTM present |
| `utm_term` | from URL / sessionStorage | If UTM present |

UTM values are captured on first page load and persisted in `sessionStorage` as `ensign_utm` for the duration of the session.

---

## Event Reference

### `campaign_landing`
| Field | Value |
|---|---|
| **Trigger** | Page load when URL contains `utm_*` parameters |
| **Pages** | All pages |
| **Key Event?** | No |
| **Parameters** | Base params + UTM params |
| **Status** | ✅ Implemented |
| **Notes** | Fires only once per page load, only when UTM params exist |

---

### `view_service_page`
| Field | Value |
|---|---|
| **Trigger** | Page load on a mapped service page |
| **Pages** | `/ai-solutions.html`, `/ensign-os.html`, `/agency.html`, `/work.html`, `/about.html`, `/careers.html`, `/blog/`, `/ar/` equivalents |
| **Key Event?** | No |
| **Parameters** | `service_name` (see Service Name values below) |
| **Status** | ✅ Implemented |

**Service name mapping:**

| URL path | `service_name` value |
|---|---|
| `/ai-solutions.html` | `ai_solutions` |
| `/ensign-os.html` | `ensign_os` |
| `/agency.html` | `agency` |
| `/work.html` | `our_work` |
| `/about.html` | `about` |
| `/careers.html` | `careers` |
| `/blog/` or `/blog/index.html` | `blog` |

Note: Arabic paths (`/ar/*`) are normalized by stripping `/ar` prefix before lookup.

---

### `whatsapp_click`
| Field | Value |
|---|---|
| **Trigger** | Click on any link matching `wa.me`, `api.whatsapp.com`, `whatsapp.com`, or `whatsapp:` protocol |
| **Pages** | All pages (floating WhatsApp button present on every page) |
| **Key Event?** | ✅ Yes — mark in GA4 |
| **Parameters** | `cta_text`, `cta_location`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |

---

### `book_call_click`
| Field | Value |
|---|---|
| **Trigger** | Click on any `cal.com/ensign` or `cal.eu/ensign` link |
| **Pages** | All pages (CTAs on every service page) |
| **Key Event?** | ✅ Yes — mark in GA4 |
| **Parameters** | `cta_text`, `cta_location`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |
| **Notes** | Also fires `generate_lead` with `lead_source: 'cal_booking_click'` |

---

### `generate_lead`
| Field | Value |
|---|---|
| **Trigger** | (a) Cal.com click; (b) Form success; (c) Proposal mailto click |
| **Pages** | All pages |
| **Key Event?** | ✅ Yes — primary conversion event |
| **Parameters** | `lead_source`, `cta_text`, `cta_location`, `service_name`, `link_url` or `form_name` |
| **Status** | ✅ Implemented |

**`lead_source` values:**

| Source | When |
|---|---|
| `cal_booking_click` | User clicks a Cal.com booking link |
| `website_form` | Form submission detected as successful |
| `email_proposal` | User clicks a "proposal" / "quote" mailto link |

---

### `proposal_request`
| Field | Value |
|---|---|
| **Trigger** | Click on `mailto:` link where CTA text or href contains "proposal" or "quote" |
| **Pages** | All pages |
| **Key Event?** | ✅ Yes — mark in GA4 |
| **Parameters** | `cta_text`, `cta_location`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |
| **Notes** | Also fires `generate_lead` with `lead_source: 'email_proposal'` |

---

### `call_click`
| Field | Value |
|---|---|
| **Trigger** | Click on any `tel:` link |
| **Pages** | All pages where phone number links exist |
| **Key Event?** | No (secondary) |
| **Parameters** | `cta_text`, `cta_location`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |

---

### `email_click`
| Field | Value |
|---|---|
| **Trigger** | Click on any `mailto:` link |
| **Pages** | All pages where email links exist |
| **Key Event?** | No (secondary) |
| **Parameters** | `cta_text`, `cta_location`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |
| **Notes** | Fires first, then checks if it's also a proposal click |

---

### `form_start`
| Field | Value |
|---|---|
| **Trigger** | Form submit event fired (before server response) |
| **Pages** | `/careers.html`, `/ar/careers.html` (Web3Forms) |
| **Key Event?** | No |
| **Parameters** | `form_name` (form id or name attribute) |
| **Status** | ✅ Implemented |

---

### `contact_form_submit`
| Field | Value |
|---|---|
| **Trigger** | DOM mutation observer detects `.form-success`, `[data-form-success]`, or `#form-success` element added |
| **Pages** | `/careers.html`, `/ar/careers.html` |
| **Key Event?** | ✅ Yes — mark in GA4 |
| **Parameters** | `form_name` |
| **Status** | ✅ Implemented |
| **Notes** | Also fires `generate_lead` with `lead_source: 'website_form'` |

---

### `file_download`
| Field | Value |
|---|---|
| **Trigger** | Click on link with extension `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.ppt`, `.zip`, `.csv` |
| **Pages** | Any page where downloadable files are linked |
| **Key Event?** | No |
| **Parameters** | `cta_text`, `cta_location`, `file_url`, `file_extension`, `service_name`, `link_url` |
| **Status** | ✅ Implemented |

---

### `scroll_25` / `scroll_50` / `scroll_75` / `scroll_90`
| Field | Value |
|---|---|
| **Trigger** | Page scroll reaches 25% / 50% / 75% / 90% of total page height |
| **Pages** | All pages |
| **Key Event?** | No |
| **Parameters** | `percent` (25, 50, 75, or 90) |
| **Status** | ✅ Implemented |
| **Notes** | Each fires only once per page session. Uses requestAnimationFrame for performance. |

---

### `service_interest`
| Field | Value |
|---|---|
| **Trigger** | Click on a tagged service CTA (uses `data-event-name="service_interest"` attribute) |
| **Pages** | `/` and `/ar/` (service grid items), `/agency.html` and `/ar/agency.html` ("Explore Our Work"), `/ai-solutions.html` and `/ar/ai-solutions.html` (hero CTAs) |
| **Key Event?** | No |
| **Parameters** | `service_name`, `cta_text`, `cta_location`, `link_url` |
| **Status** | ✅ Implemented via `data-event-name` attributes |

**Tagged elements:**

| Page | Element | `service_name` | `cta_location` |
|---|---|---|---|
| `/` | Service grid — Marketing Agency | `agency` | `service_grid` |
| `/` | Service grid — AI Solutions | `ai_solutions` | `service_grid` |
| `/` | Service grid — App/website Development | `website_development` | `service_grid` |
| `/` | Service grid — Ensign OS | `ensign_os` | `service_grid` |
| `/agency.html` | "Explore Our Work" CTA | `our_work` | `agency_cta` |
| `/ai-solutions.html` | "Run a Demo" hero CTA | `ai_solutions` | `hero` |
| `/ai-solutions.html` | "Explore the Agents" hero CTA | `ai_solutions` | `hero` |
| `/ar/` | Arabic service grid (all 4) | same as EN | `service_grid` |
| `/ar/agency.html` | "استعرض أعمالنا" CTA | `our_work` | `agency_cta` |
| `/ar/ai-solutions.html` | Hero CTAs (both) | `ai_solutions` | `hero` |

---

## Custom HTML Attributes for Explicit Event Control

analytics.js respects these data attributes on any `<a>` or `<button>`:

| Attribute | Purpose | Example |
|---|---|---|
| `data-event-name` | Override auto-detection with exact event name | `data-event-name="service_interest"` |
| `data-cta-text` | Override button text used as `cta_text` | `data-cta-text="Request Proposal"` |
| `data-cta-location` | Set explicit `cta_location` value | `data-cta-location="hero_section"` |
| `data-service-name` | Set explicit `service_name` value | `data-service-name="ai_solutions"` |

---

## Privacy Compliance

**Never tracked:**
- Form field values (name, email, phone, message, company)
- Personal identifiers
- IP addresses
- Browser fingerprints

**Always tracked (non-PII):**
- Page path, title, URL
- Button text and location on page
- Service name
- UTM campaign parameters
- Language (en/ar)

# Google Analytics & GTM Manual Steps — Ensign Ai Marketing Agency
**For:** Ensign team / admin  
**GA4 Property:** G-LWTQMQ08D4  
**Site:** https://ensignksa.com  
**Last Updated:** 2026-05-06

---

## Overview of Manual Actions Required

| Action | Priority | Where |
|---|---|---|
| 1. Create / find GTM container | HIGH | tagmanager.google.com |
| 2. Provide GTM container ID | HIGH | Share with developer |
| 3. Mark 5 Key Events in GA4 | HIGH | analytics.google.com |
| 4. Configure GA4 tag in GTM | HIGH | GTM UI |
| 5. Configure event tags in GTM | MEDIUM | GTM UI |
| 6. Test with GTM Preview Mode | HIGH | GTM UI |
| 7. Publish GTM container | HIGH | GTM UI |
| 8. Verify GA4 Realtime | HIGH | analytics.google.com |
| 9. Verify GA4 DebugView | HIGH | analytics.google.com |
| 10. Connect Google Ads to GA4 | MEDIUM | analytics.google.com |

---

## STEP 1 — Find or Create GTM Container

1. Go to: https://tagmanager.google.com
2. Sign in with the Google account that owns Ensign's analytics (ensignksa@gmail.com or the account linked to G-LWTQMQ08D4)
3. Look for an existing container named `ensignksa.com` or `Ensign`
4. If no container exists:
   - Click **Create Account**
   - Account Name: `Ensign Ai Marketing Agency`
   - Country: Saudi Arabia
   - Container Name: `ensignksa.com`
   - Target Platform: **Web**
   - Click Create → Accept Terms
5. Your Container ID will look like: `GTM-XXXXXXX` (shown at top of GTM UI)
6. **Write down this Container ID** — you need it for Step 2

---

## STEP 2 — Share the GTM Container ID

Once you have the GTM Container ID, the developer (or this AI) needs to:
- Replace the direct Google Tag script in all HTML files with the GTM snippet
- Remove the direct `GT-PJ5SSC9S` script to avoid duplicate GA4 hits

**The GTM snippet to be installed looks like this:**

In `<head>` (replace `GTM-XXXXXXX` with your real ID):
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

In `<body>` immediately after `<body>` tag:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

The direct GA4 script to **remove** from every page:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GT-PJ5SSC9S"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GT-PJ5SSC9S');
</script>
```

**Note:** `analytics.js` stays. It pushes events to dataLayer (for GTM) AND gtag. Once GTM fires GA4, analytics.js events will flow through GTM → GA4 automatically.

---

## STEP 3 — Configure GA4 Tag in GTM

Inside GTM (after Step 1):

1. Go to **Tags** → **New**
2. Click **Tag Configuration** → choose **Google Tag**
3. Tag ID: `G-LWTQMQ08D4`
4. Trigger: **All Pages** (Initialization - All Pages preferred)
5. Name: `GA4 — Configuration`
6. Click **Save**

This replaces the direct GA4 script that was in the HTML.

---

## STEP 4 — Configure Event Tags in GTM

For each conversion event, create a **GA4 Event tag** with a matching Custom Event trigger.

### How to create one event tag (example: `whatsapp_click`)

1. Go to **Triggers** → **New**
2. Trigger Type: **Custom Event**
3. Event Name: `whatsapp_click`
4. This trigger fires on: **All Custom Events**
5. Name: `CE — whatsapp_click`
6. Save

7. Go to **Tags** → **New**
8. Tag Type: **Google Analytics: GA4 Event**
9. Configuration Tag: select `GA4 — Configuration` (from Step 3)
10. Event Name: `whatsapp_click`
11. Event Parameters → Add rows:
    - `cta_text` → Variable: `{{DLV - cta_text}}` (create a Data Layer Variable for `cta_text`)
    - `cta_location` → `{{DLV - cta_location}}`
    - `service_name` → `{{DLV - service_name}}`
    - `link_url` → `{{DLV - link_url}}`
12. Trigger: select `CE — whatsapp_click`
13. Name: `GA4 Event — whatsapp_click`
14. Save

Repeat for all events below.

### Required Custom Event Triggers

Create one Custom Event trigger for each:

| Trigger Name | Event Name |
|---|---|
| CE — campaign_landing | `campaign_landing` |
| CE — view_service_page | `view_service_page` |
| CE — whatsapp_click | `whatsapp_click` |
| CE — book_call_click | `book_call_click` |
| CE — generate_lead | `generate_lead` |
| CE — proposal_request | `proposal_request` |
| CE — call_click | `call_click` |
| CE — email_click | `email_click` |
| CE — form_start | `form_start` |
| CE — contact_form_submit | `contact_form_submit` |
| CE — file_download | `file_download` |
| CE — scroll_75 | `scroll_75` |

### Required Data Layer Variables

Create one Data Layer Variable (DLV) for each parameter:

| Variable Name | Data Layer Variable Name |
|---|---|
| DLV - cta_text | `cta_text` |
| DLV - cta_location | `cta_location` |
| DLV - service_name | `service_name` |
| DLV - link_url | `link_url` |
| DLV - form_name | `form_name` |
| DLV - lead_source | `lead_source` |
| DLV - percent | `percent` |
| DLV - file_url | `file_url` |
| DLV - file_extension | `file_extension` |
| DLV - utm_source | `utm_source` |
| DLV - utm_medium | `utm_medium` |
| DLV - utm_campaign | `utm_campaign` |
| DLV - utm_content | `utm_content` |
| DLV - utm_term | `utm_term` |

---

## STEP 5 — Test with GTM Preview Mode

1. Inside GTM, click **Preview** (top right)
2. Enter URL: `https://ensignksa.com`
3. A browser tab opens with Tag Assistant connected
4. In Tag Assistant:
   - Verify `gtm.js` fires → `Tags Fired` shows `GA4 — Configuration`
   - Navigate to `/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=test_ksa&utm_content=test_v1&utm_term=test`
   - Verify `campaign_landing` fires in the left panel
   - Verify `view_service_page` fires with `service_name: ai_solutions`
5. Click the **WhatsApp floating button** → Verify `whatsapp_click` fires
6. Click any **"Book a Discovery Call"** button → Verify `book_call_click` + `generate_lead` fire
7. Scroll to 75% → Verify `scroll_75` fires
8. If all pass → proceed to publish

---

## STEP 6 — Mark Key Events in GA4

GA4 Key Events = what used to be called "Conversions" in Universal Analytics.

1. Go to: https://analytics.google.com
2. Select property: `ensignksa.com` (G-LWTQMQ08D4)
3. Go to **Admin** (gear icon, bottom left)
4. Under **Data display** → click **Events**
5. Wait for events to appear in the list (events must have fired at least once)
6. For each event below, find it in the list and toggle **Mark as key event** to ON:

| Event Name | Priority |
|---|---|
| `generate_lead` | PRIMARY |
| `book_call_click` | PRIMARY |
| `whatsapp_click` | PRIMARY |
| `contact_form_submit` | PRIMARY |
| `proposal_request` | PRIMARY |

**If an event doesn't appear yet:** It hasn't fired since the GA4 property was set up.  
Option A: Trigger it manually using the test URL + GTM Preview  
Option B: Create it manually in GA4 → Admin → Events → **Create event**

### Creating a Key Event manually in GA4 (if not visible yet)

1. Admin → Events → **Create event**
2. Custom event name: `generate_lead` (exact spelling, lowercase)
3. Match conditions: `event_name` contains `generate_lead`
4. Save
5. Then go back to Events list → toggle Key Event ON

---

## STEP 7 — Publish GTM Container

After Preview testing passes:

1. In GTM → Click **Submit** (top right, blue button)
2. Version Name: `Ensign Campaign Analytics Setup`
3. Version Description:
   ```
   GA4 connected through GTM, campaign UTM tracking confirmed, 
   conversion events configured, CTA tracking tested, 
   landing page readiness verified. Date: 2026-05-06
   ```
4. Click **Publish**
5. GTM is now live on all pages

---

## STEP 8 — Verify GA4 Realtime

1. Go to GA4 → **Reports** → **Realtime**
2. Open your website in another tab: `https://ensignksa.com`
3. In Realtime, you should see:
   - `page_view` event
   - Your country (Saudi Arabia) in the map
   - User count = 1 (yourself)
4. Click the WhatsApp button → Realtime should show `whatsapp_click`
5. Click a Book Call button → Should show `book_call_click` and `generate_lead`

---

## STEP 9 — Verify GA4 DebugView

DebugView shows events in real-time with full parameter detail.

**To enable DebugView on your device:**

Option A — Chrome Extension (easiest):
1. Install: https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna
2. Enable the extension
3. Visit your site
4. In GA4 → Admin → DebugView — you'll see your device

Option B — GTM Preview:
- When GTM Preview is active, DebugView automatically shows your session

**In DebugView, verify:**
- `page_view` fires on page load
- `view_service_page` fires with correct `service_name`
- `campaign_landing` fires when UTM params present
- `whatsapp_click` fires on WhatsApp button click
- `book_call_click` + `generate_lead` fire on Cal.com link click
- `scroll_75` fires after scrolling

---

## STEP 10 — How to Test Campaign URLs

Before launching any paid ad, test the UTM URL:

1. Paste your campaign URL in a private/incognito browser window:
   ```
   https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=test_creative_v1&utm_term=test_audience
   ```

2. Open GA4 → Realtime → verify:
   - `campaign_landing` event appears
   - Source shows `linkedin`
   - Medium shows `paid_social`
   - Campaign shows `ensign_ai_solutions_launch_ksa`

3. In GA4 → Reports → Acquisition → Traffic Acquisition (after 24-48 hours):
   - Filter by source/medium: `linkedin / paid_social`
   - Verify the session is counted

---

## STEP 11 — Connect Google Ads (Optional, when running Google Ads)

1. GA4 → Admin → **Product links** → **Google Ads links**
2. Click **Link**
3. Select your Google Ads account
4. Enable **Personalized Advertising** if running remarketing
5. This allows GA4 audiences to be used in Google Ads

---

## Quick Reference

| Item | Value |
|---|---|
| GA4 Measurement ID | `G-LWTQMQ08D4` |
| Google Tag ID | `GT-PJ5SSC9S` |
| GTM Container ID | **TBD — not yet installed** |
| GA4 Dashboard | https://analytics.google.com |
| GTM Dashboard | https://tagmanager.google.com |
| Google Search Console | https://search.google.com/search-console |
| Cal.com Booking URL | https://cal.com/ensign-ai-agency-q4mmzg/30min |
| UTM Builder Tool | https://ga-dev-tools.google/campaign-url-builder/ |

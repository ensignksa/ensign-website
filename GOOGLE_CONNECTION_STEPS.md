# Google & Tracking Setup — Step-by-Step Manual Guide
**For:** Ensign Ai Marketing Agency  
**Domain:** https://ensignksa.com  
**Date:** 2026-05-05

---

## 1. Google Analytics 4 (GA4)

### Verify Tracking Is Working
1. Go to https://analytics.google.com
2. Select property: **ensignksa.com** (Measurement ID: `G-LWTQMQ08D4`)
3. Click **Reports → Realtime**
4. Open https://ensignksa.com in another browser tab
5. You should see "1 user in the last 30 minutes" appear within 10-30 seconds
6. If no data appears, open browser DevTools (F12) → Network tab → filter for `gtag` or `google-analytics` — confirm the GA4 hit fires

### Set Up Conversion Events
Conversion events tell GA4 which actions matter most (leads, bookings, etc.).

**Step 1 — Mark existing events as conversions:**
1. Go to **Admin** (gear icon) → **Events** (under Data display)
2. Look for these events that GA4 auto-collects:
   - `page_view` — every page load
   - `scroll` — 90% page scroll (Enhanced Measurement)
   - `click` — outbound link clicks
3. To mark an event as a conversion: click the toggle next to it under "Mark as conversion"

**Step 2 — Track "Book a Call" clicks:**
1. Go to **Admin → Events → Create event**
2. Name: `booking_click`
3. Matching conditions:
   - Parameter: `event_name` equals `click`
   - Parameter: `link_url` contains `cal.eu/ensignksa`
4. Click **Save**
5. Mark `booking_click` as a conversion

**Step 3 — Track form submissions (Careers page):**
1. Create event named `form_submit`
2. Matching conditions:
   - Parameter: `event_name` equals `form_submit`
   - Parameter: `page_location` contains `careers`
3. Mark as conversion

**Step 4 — Track WhatsApp clicks:**
1. Create event named `whatsapp_click`
2. Matching conditions:
   - Parameter: `event_name` equals `click`
   - Parameter: `link_url` contains `wa.me`
3. Mark as conversion

### GA4 Dashboard
- Direct link: https://analytics.google.com
- Account: Ensign Ai Marketing Agency
- Property: ensignksa.com
- Data takes 24-48 hours to appear in standard reports (Realtime is instant)

---

## 2. Google Search Console (GSC)

### Verify the Meta Tag (Already Done)
The verification meta tag is already in index.html:
```
content="6mhIBpujaVlHhLelepqTFnCQbR2fOf5eYkuUP4PpcfQ"
```
If GSC shows "Unverified", re-verify:
1. Go to https://search.google.com/search-console
2. Select property: `https://ensignksa.com`
3. Click **Settings → Ownership verification → HTML tag**
4. Click **Verify** — it reads the live meta tag

### Submit the Sitemap
1. In GSC, go to **Indexing → Sitemaps** (left sidebar)
2. In the "Add a new sitemap" field, enter: `sitemap.xml`
3. Click **Submit**
4. GSC will crawl and show status within 24-48 hours
5. Check back to confirm "Success" and see discovered URL count (should be ~40)

### Request Indexing for Key Pages
After each new deployment, manually request indexing for the most important pages:
1. In GSC, use the search bar at the top — paste a URL, e.g. `https://ensignksa.com/ai-solutions.html`
2. Click **Request indexing** in the URL inspection panel
3. Repeat for:
   - https://ensignksa.com/
   - https://ensignksa.com/about.html
   - https://ensignksa.com/agency.html
   - https://ensignksa.com/ai-solutions.html
   - https://ensignksa.com/ensign-os.html
   - https://ensignksa.com/work.html
   - https://ensignksa.com/ar/
   - https://ensignksa.com/ar/ai-solutions.html

### Monitor GSC Regularly
- **Coverage report:** Indexing → Pages — look for "Excluded" pages that should be indexed
- **Performance report:** Search results → check which queries drive clicks
- **Core Web Vitals:** Experience → Core Web Vitals
- **Enhancements:** Check for schema/rich result errors

---

## 3. Google Business Profile

### Access Your Profile
- Direct link: https://business.google.com
- Or search Google for "Ensign Ai Marketing Agency Riyadh" → click "Edit your business"

### Update Website URL
1. Click **Edit profile**
2. Find **Website** field
3. Ensure it shows: `https://ensignksa.com`
4. Click **Save**

### Update Services List
1. Click **Edit profile → Services**
2. Add all services:
   - AI Marketing Consulting
   - Marketing Automation
   - AI Agents & Systems
   - Paid Media Management
   - Creative Production
   - Brand Strategy
   - Website & Digital Experience
   - Sales & Marketing Automation
   - Revenue Operations (Ensign OS)
3. Add descriptions for each

### Add Photos (Improves Click-Through Rate)
1. Click **Add photos**
2. Upload:
   - Logo (square, 250x250 minimum)
   - Cover photo (1024x576 minimum)
   - Office/team photos if available
   - Work samples/portfolio images
3. Minimum recommended: 5 photos

### Ensure NAP Consistency
NAP = Name, Address, Phone — must match exactly across all platforms:
- **Name:** Ensign Ai Marketing Agency
- **Address:** Riyadh, Saudi Arabia (Service Area Business — no street address needed)
- **Phone:** +966 54 891 9405
- **Website:** https://ensignksa.com

Same NAP must appear identically on:
- Website (footer)
- Google Business Profile
- LinkedIn company page
- Any directories or listings

---

## 4. Cal.com Booking — UTM Tracking

### Add UTM Parameters to Booking Links
UTM parameters let GA4 track where bookings come from.

**Current booking URL:** `https://cal.eu/ensignksa/30min`

**Add UTM tags by changing all booking button links on the website to:**

For buttons on the homepage:
```
https://cal.eu/ensignksa/30min?utm_source=website&utm_medium=cta&utm_campaign=homepage
```

For buttons on agency.html:
```
https://cal.eu/ensignksa/30min?utm_source=website&utm_medium=cta&utm_campaign=agency-page
```

For buttons on ai-solutions.html:
```
https://cal.eu/ensignksa/30min?utm_source=website&utm_medium=cta&utm_campaign=ai-solutions-page
```

For blog posts:
```
https://cal.eu/ensignksa/30min?utm_source=blog&utm_medium=cta&utm_campaign=blog-cta
```

### Connect Outlook Calendar to Cal.com
1. Log in to https://cal.eu/ensignksa
2. Go to **Settings → Calendar**
3. Click **Connect a calendar**
4. Select **Microsoft Outlook / Office 365**
5. Authorize with your Outlook credentials
6. Set which calendar to check for availability conflicts
7. Set which calendar to add new bookings to

### Track Booking Completions in GA4
Cal.com fires a redirect after a booking is confirmed to a thank-you page.
1. In Cal.com settings → **Event Types → 30min → Edit**
2. Under "Redirect on booking" add: `https://ensignksa.com/booking-confirmed.html` (create this page)
3. Or use Cal.com's built-in webhook to send data to GA4 via Measurement Protocol

---

## Quick Reference Links

| Tool | URL |
|------|-----|
| Google Analytics 4 | https://analytics.google.com |
| Google Search Console | https://search.google.com/search-console |
| Google Business Profile | https://business.google.com |
| Cal.com Dashboard | https://cal.eu/ensignksa |
| Sitemap (live) | https://ensignksa.com/sitemap.xml |
| GA4 Realtime | https://analytics.google.com → Reports → Realtime |
| GSC Sitemaps | https://search.google.com/search-console → Indexing → Sitemaps |
| Rich Results Test | https://search.google.com/test/rich-results |
| PageSpeed Insights | https://pagespeed.web.dev |

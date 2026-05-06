# Ensign · GA4 + Google Tag — Final Manual Steps

**Audience:** Whoever has Google admin access for ensignksa.com.
**Time required:** ~5 minutes.
**Prerequisite:** Code is already deployed with Google Tag `GT-PJ5SSC9S` on every page.

---

## Step 1 — Verify Google Tag is linked to GA4 (1 min)

Without this, GA4 receives no data.

1. Go to https://tagmanager.google.com **OR** https://analytics.google.com → Admin → Property → **Google tag** (under Data Streams).
2. Open Google Tag `GT-PJ5SSC9S`.
3. Look at **Configuration → Linked GA4 properties / Destinations**.
4. Confirm `G-LWTQMQ08D4` is listed.
5. If not: click **Add destination → Google Analytics → paste `G-LWTQMQ08D4` → Save**.

Visit `https://ensignksa.com/` once. Then in GA4 → **Reports → Realtime** you should see your visit within 30 seconds.

---

## Step 2 — Mark Key Events / Conversions in GA4 (3 min)

GA4 → **Admin → Data display → Events**.

Wait for events to appear (~24 hours after the first real fires, or trigger them yourself for instant population). For each, toggle **Mark as key event**:

- [ ] `generate_lead`
- [ ] `book_call_click`
- [ ] `whatsapp_click`
- [ ] `contact_form_submit`
- [ ] `proposal_request`

Optional secondary:
- [ ] `call_click` (if you add phone CTAs)
- [ ] `view_service_page`

**To populate events instantly without waiting:** open the site in a new tab, click a Cal.com "Book a Call" button, click WhatsApp, click a "Request a Proposal" mailto. Within seconds those events show up in GA4 → Realtime → Events. Then go back to Admin → Events and mark them as Key Events.

---

## Step 3 — Register custom dimensions (1 min)

GA4 → **Admin → Data display → Custom definitions → Custom dimensions → Create**.

| Dimension name | Scope | Event parameter |
|---|---|---|
| Service Name | Event | `service_name` |
| CTA Location | Event | `cta_location` |
| CTA Text | Event | `cta_text` |
| Lead Source | Event | `lead_source` |
| Form Name | Event | `form_name` |
| Language | Event | `language` |

This unlocks reports like "leads by service × CTA location × language × campaign source."

---

## Step 4 — Test campaign UTM (1 min)

In GA4 → **Configure → DebugView**, then in another tab open this test URL:

```
https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=test_creative_v1&utm_term=test_audience&_dbg=1
```

You should see in DebugView:
- `page_view` event with the UTMs
- `campaign_landing` event with `utm_source: linkedin`, `utm_campaign: ensign_ai_solutions_launch_ksa`
- `view_service_page` event with `service_name: ai_solutions`

Click "Book a Call" — `book_call_click` and `generate_lead` should appear with the same UTMs attached (the analytics layer persists UTMs in sessionStorage).

---

## Step 5 — (Optional) Add GTM container for visual workflow

If you want GTM-style Preview Mode, custom HTML tag templates, and a visual rule-builder, you can create a real GTM container alongside the Google Tag:

1. Go to https://tagmanager.google.com → **Create Account** → **Container** → Web → use `ensignksa.com` as the container name.
2. Get the new `GTM-XXXXXXX` ID.
3. Send it to the developer to inject as an additional layer (Google Tag + GTM can coexist; the GTM container will receive all the same dataLayer pushes our `analytics.js` makes).

This is not needed for campaign launch — your current Google Tag setup is sufficient. It's only useful if you want the GTM workspace UI experience.

---

## Step 6 — (Optional) Add other ad pixels later

When you launch Meta or LinkedIn ads, you can add their pixels through the Google Tag UI under **Add destination**:

- **Google Ads conversion** — by AW- ID
- **Meta Pixel / LinkedIn Insight** — these are NOT directly addable to a Google Tag; you'd add them via a real GTM container (see Step 5) OR by inserting their snippets directly into the HTML.

---

## Troubleshooting

| Problem | Diagnosis | Fix |
|---|---|---|
| GA4 Realtime shows 0 users | Google Tag not linked to GA4 | Step 1 above |
| Events show but no UTMs | URL didn't include `utm_*` or was redirected | Confirm UTM URL is direct |
| Double `page_view` in GA4 | A second tag (old direct G- install or duplicate) is firing | Run `grep -c "gtag/js?id=" index.html` — should equal 1 per page |
| `campaign_landing` not appearing | UTMs absent from landing URL | Use a tagged URL from `CAMPAIGN_TRACKING_STRUCTURE.md` |

---

## Summary

You only need to do **Step 1, Step 2, Step 3** to be campaign-ready. Steps 4–6 are testing / optional extensions.

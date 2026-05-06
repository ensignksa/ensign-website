# Ensign · GA4 + GTM Manual Setup Steps

**Audience:** Whoever has Google admin access for ensignksa.com.
**Goal:** Replace the `GTM-XXXXXXX` placeholder with a real container, wire GA4 through GTM, and mark the 5 conversion events.
**Time required:** ~30–40 minutes total.

---

## A. Create the GTM container (10 min)

1. Go to **https://tagmanager.google.com**.
2. Sign in with the Google account that owns Ensign assets.
3. Click **Create Account**:
   - Account name: `Ensign Ai Marketing Agency`
   - Country: `Saudi Arabia`
   - Container name: `ensignksa.com`
   - Target platform: **Web**
4. Accept the GTM Terms of Service.
5. **Copy the GTM container ID** that appears (looks like `GTM-ABC1234`).
6. Notify the developer / use Find & Replace in the codebase:
   - File: every HTML page (38 files) **and** `tools/inject-tracking.mjs`
   - Find: `GTM-XXXXXXX`
   - Replace: `GTM-ABC1234` (your real ID)
   - Commit, push, deploy.
7. Visit `https://ensignksa.com/` in an incognito tab. Open DevTools → Network → search for `gtm.js`. You should see a 200 response from `googletagmanager.com/gtm.js?id=GTM-ABC1234`.

---

## B. Add the GA4 Configuration tag inside GTM (5 min)

1. In the GTM workspace, click **Tags → New**.
2. Tag type: **Google Tag** (formerly "GA4 Configuration").
3. Tag ID: `G-LWTQMQ08D4`
4. Trigger: **Initialization — All Pages**.
5. Save the tag with name: `GA4 — Config — G-LWTQMQ08D4`.

---

## C. Add custom-event tags (15 min)

For each conversion event, create a Custom Event Trigger + a GA4 Event tag.

### C1. Triggers (create these first)

In GTM, **Triggers → New** for each:

| Trigger name | Type | Event name (regex) |
|---|---|---|
| `CE — generate_lead` | Custom Event | `generate_lead` |
| `CE — book_call_click` | Custom Event | `book_call_click` |
| `CE — whatsapp_click` | Custom Event | `whatsapp_click` |
| `CE — email_click` | Custom Event | `email_click` |
| `CE — proposal_request` | Custom Event | `proposal_request` |
| `CE — call_click` | Custom Event | `call_click` |
| `CE — contact_form_submit` | Custom Event | `contact_form_submit` |
| `CE — form_start` | Custom Event | `form_start` |
| `CE — view_service_page` | Custom Event | `view_service_page` |
| `CE — campaign_landing` | Custom Event | `campaign_landing` |
| `CE — file_download` | Custom Event | `file_download` |
| `CE — scroll_depth` | Custom Event | `^scroll_(25\|50\|75\|90)$` (use regex match) |

### C2. dataLayer Variables (create once, reuse on all event tags)

In GTM, **Variables → User-Defined Variables → New → Data Layer Variable**:

| Variable name | Data Layer Variable Name |
|---|---|
| `DLV — cta_text` | `cta_text` |
| `DLV — cta_location` | `cta_location` |
| `DLV — service_name` | `service_name` |
| `DLV — link_url` | `link_url` |
| `DLV — form_name` | `form_name` |
| `DLV — lead_source` | `lead_source` |
| `DLV — language` | `language` |
| `DLV — utm_source` | `utm_source` |
| `DLV — utm_medium` | `utm_medium` |
| `DLV — utm_campaign` | `utm_campaign` |
| `DLV — utm_content` | `utm_content` |
| `DLV — file_url` | `file_url` |
| `DLV — file_extension` | `file_extension` |

### C3. GA4 Event tags

Create one GA4 Event tag per event. Generic recipe:

- **Tag type:** Google Analytics: GA4 Event
- **Configuration tag:** `GA4 — Config — G-LWTQMQ08D4` (chooses the Google Tag from step B)
- **Event Name:** the event name (e.g. `generate_lead`)
- **Event Parameters:**
  - `cta_text` = `{{DLV — cta_text}}`
  - `cta_location` = `{{DLV — cta_location}}`
  - `service_name` = `{{DLV — service_name}}`
  - `link_url` = `{{DLV — link_url}}`
  - `form_name` = `{{DLV — form_name}}`
  - `lead_source` = `{{DLV — lead_source}}`
  - `language` = `{{DLV — language}}`
- **Trigger:** the matching `CE — *` trigger.

Repeat for each event. Tip: clone the first GA4 Event tag and just change the event name + trigger to save time.

### C4. Special handling: scroll depth

For the `scroll_depth` regex trigger, the event tag should send the event name dynamically:
- **Event Name:** `{{Event}}`  (built-in variable that resolves to the actual `event` value, e.g. `scroll_75`).

This way one tag handles all four scroll levels.

---

## D. Use Preview Mode to test (5 min)

1. In GTM, click **Preview** (top right).
2. Tag Assistant opens — enter `https://ensignksa.com/`.
3. The Ensign site opens with a debug bar at the bottom.
4. Click around: WhatsApp button, "Book a Call", a "Request a Proposal" link.
5. In Tag Assistant, you should see the corresponding triggers fire and the GA4 Event tags marked **Fired**.
6. Open a second tab to **GA4 → Admin → DebugView** — you should see the same events appearing live.

If everything fires correctly, click **Submit** in GTM, give the version a name (e.g. `v1 — initial campaign tracking`), and click **Publish**.

---

## E. Remove duplicate GA4 hits (2 min)

This step happens **after** GTM is publishing GA4 hits successfully.

1. Open every HTML file (or run the developer's removal script — a single-line `sed` does it).
2. Remove the inline GA4 block:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-LWTQMQ08D4"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-LWTQMQ08D4');
   </script>
   ```
3. Keep `analytics.js` — it works through GTM.
4. Deploy. Open GA4 DebugView and confirm only one `page_view` per page load (not two).

If you'd rather keep the direct GA4 install (faster) and use GTM only for non-GA4 tags (Meta pixel, LinkedIn Insight), skip this step. In that case, **don't** add a GA4 Configuration tag inside GTM.

---

## F. Mark Key Events (conversions) in GA4 (5 min)

1. Go to **GA4 (https://analytics.google.com) → Admin → Data display → Events**.
2. Wait until the events appear in the list (24–48 hours after first real fires; or fire them yourself in DebugView to populate immediately).
3. For each of these events, toggle **Mark as key event**:
   - `generate_lead` ✅
   - `book_call_click` ✅
   - `whatsapp_click` ✅
   - `contact_form_submit` ✅
   - `proposal_request` ✅
4. Optional secondary conversions:
   - `call_click` (only if/when phone CTAs are added)
   - `view_service_page` (if you want page-level conversions)

---

## G. Register custom dimensions (3 min)

GA4 → Admin → Data display → **Custom definitions → Custom dimensions → Create custom dimension**:

| Dimension name | Scope | Event parameter |
|---|---|---|
| Service Name | Event | `service_name` |
| CTA Location | Event | `cta_location` |
| CTA Text | Event | `cta_text` |
| Lead Source | Event | `lead_source` |
| Form Name | Event | `form_name` |
| Language | Event | `language` |

This unlocks reports like "leads by service × CTA location × language".

---

## H. Verify Realtime + Acquisition (2 min)

1. **Realtime → Events** — open the site in another tab, click a Cal.com button. You should see `book_call_click` and `generate_lead` within 30 seconds.
2. **Reports → Acquisition → Traffic acquisition** — confirm sources appear (Direct shows up immediately; Google/LinkedIn appear after first campaigns send traffic).
3. **Realtime → Conversions** — fire a tagged conversion event and confirm it counts.

---

## I. Campaign launch checklist

For each campaign:

- [ ] Use a UTM-tagged URL from `CAMPAIGN_TRACKING_STRUCTURE.md`
- [ ] Verify the URL works in incognito (no console errors, page loads)
- [ ] In GA4 DebugView, confirm `campaign_landing` fires with the right `utm_source` / `utm_campaign`
- [ ] Click a CTA and confirm the corresponding event fires with the UTMs included
- [ ] Add the campaign URL to the agency-side launch document
- [ ] Set up a GA4 audience for "users who saw campaign X but didn't convert" (optional, for retargeting)

---

## J. Optional — add other pixels later

When the time comes for Meta or LinkedIn ads:

- Add Meta Pixel via GTM (one tag, fires on All Pages + custom triggers for conversion events).
- Add LinkedIn Insight Tag via GTM (one tag, fires on All Pages).
- Same conversion events trigger them as triggered the GA4 tags.

Don't paste these pixels directly into HTML — keep everything inside GTM so you can manage / disable / change without redeploying the site.

---

## K. Troubleshooting

| Problem | Diagnosis | Fix |
|---|---|---|
| Events not appearing in GA4 Realtime | Wrong measurement ID | Confirm `G-LWTQMQ08D4` everywhere; check Network tab for `google-analytics.com/g/collect` calls |
| GTM Preview shows fired but GA4 shows nothing | GA4 Configuration tag missing | Add the GA4 Config tag inside GTM (step B) |
| Double `page_view` count in GA4 | Direct gtag + GTM both firing | Remove the direct gtag.js block (step E) |
| `campaign_landing` doesn't fire | UTM params absent | Verify the URL has `?utm_source=...` and the URL was used directly (not after a redirect that strips params) |
| WhatsApp click doesn't fire on mobile | Same-tab navigation eats the event | Add `target="_blank"` to the WhatsApp anchor |

---

## Final note

Once steps A–H are complete, ensignksa.com is fully campaign-ready. The codebase is already prepared — the rest is configuration that has to happen inside Google's UI. Reach out to the developer for the find-and-replace step (the only code change required) once you have the real GTM container ID.

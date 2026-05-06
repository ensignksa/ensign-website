# Ensign · Campaign Tracking Structure

**Version:** 1.0
**Date:** 2026-05-06
**Audience:** Marketing & Performance team running Ensign campaigns

This is the canonical UTM convention for every paid, organic, email, and partner-driven campaign sending traffic to `ensignksa.com`. **Use it without exceptions** — inconsistent UTMs are the single biggest cause of broken attribution.

---

## 1. UTM parameter rules

| Parameter | Required? | Lower-case? | Underscore-separated? | Purpose |
|---|---|---|---|---|
| `utm_source` | ✅ Always | ✅ | ✅ | The platform / publisher |
| `utm_medium` | ✅ Always | ✅ | ✅ | The traffic type |
| `utm_campaign` | ✅ Always | ✅ | ✅ | The campaign identity |
| `utm_content` | Recommended | ✅ | ✅ | The creative or ad variant |
| `utm_term` | Optional | ✅ | ✅ | Keyword (paid search) or audience (paid social) |

Rules:

- **All values lower-case.** `LinkedIn` and `linkedin` are different in GA4.
- **Underscores between words**, never hyphens or spaces. `paid_social` not `paid-social`.
- **No spaces**, ever — they URL-encode as `%20` and corrupt reports.
- **Persistent vocabulary** — use only the values from the lists below.
- **Re-using a `utm_campaign` across platforms is intentional** — it lets you compare LinkedIn vs Meta vs X delivery for the same campaign.

---

## 2. `utm_source` — allowed values

The platform that sent the click.

| Source | Use for |
|---|---|
| `linkedin` | LinkedIn ads + organic LinkedIn posts (split via `utm_medium`) |
| `meta` | Both Facebook and Instagram (Meta is one ad system) |
| `instagram` | Only Instagram if you specifically need to separate from Meta |
| `tiktok` | TikTok Ads + organic |
| `x` | X (Twitter) Ads + organic |
| `snapchat` | Snap Ads |
| `google` | Google Ads (search, display, YouTube — split via `utm_medium`) |
| `youtube` | YouTube specifically (when split from Google Ads) |
| `email` | Email campaigns (Mailchimp, custom, etc.) |
| `whatsapp` | WhatsApp broadcasts / status |
| `partner` | Generic partner placement — append partner name in `utm_content` |
| `newsletter` | Owned newsletter / Substack |
| `referral` | Manual referral campaigns from another site |
| `qr` | Physical QR codes (event posters, business cards) |
| `direct_mail` | Printed mail campaigns |
| `event` | Event sponsorship / booth scans |

If a new source is needed, add it here first, then use it.

---

## 3. `utm_medium` — allowed values

The traffic type / channel category.

| Medium | Use for |
|---|---|
| `paid_social` | Paid LinkedIn, Meta, TikTok, X, Snap |
| `organic_social` | Organic posts on the same platforms |
| `paid_search` | Google Ads search, Bing Ads search |
| `paid_display` | Google Display Network, programmatic display |
| `paid_video` | YouTube Ads, in-stream video |
| `email` | Any email campaign (transactional excluded) |
| `referral` | Earned placements from another site |
| `affiliate` | Affiliate / partner-paid placements |
| `qr` | Scanned QR codes |
| `cpc` | Reserved for non-Google paid clicks if needed (rarely used — prefer `paid_search`) |

---

## 4. `utm_campaign` — naming format

```
ensign_<service>_<goal>_<market>_<launchOrPhase>
```

| Part | Examples |
|---|---|
| `ensign` | Always start with `ensign` for ownership |
| `<service>` | `ai_solutions`, `ensign_os`, `agency`, `our_work`, `careers`, `brand` |
| `<goal>` | `launch`, `lead_gen`, `awareness`, `retargeting`, `event`, `proposal_drive` |
| `<market>` | `ksa`, `uae`, `gcc`, `mena`, `global` |
| `<launchOrPhase>` | `q2_2026`, `ramadan`, `loyalty_pilot`, optional |

**Examples:**

```
ensign_ai_solutions_launch_ksa
ensign_agency_lead_gen_uae
ensign_ensign_os_awareness_ksa_q2
ensign_brand_awareness_gcc_2026
ensign_careers_lead_gen_ksa
```

---

## 5. `utm_content` — naming format

The creative variant. Keep this expressive — it's what you'll use to compare which ad/post worked.

```
<format>_<descriptor>_<variant>
```

Examples:

```
video_founder_v1
video_founder_v2
carousel_3_problems_v1
static_solution_v3
testimonial_alrafia_v2
ugc_arabic_v1
hero_text_v4
```

If you A/B test the same creative across platforms, keep the `utm_content` value identical so the comparison is clean.

---

## 6. `utm_term` — when to use

- **Paid search:** Use the keyword bucket (e.g. `ai_marketing_agency_riyadh`, `marketing_automation_saudi`).
- **Paid social:** Use the audience name (e.g. `founders_ksa`, `marketing_directors_uae`, `lookalike_1pct`).
- **Other:** Leave empty.

---

## 7. Pre-built campaign URLs (copy-paste ready)

### Homepage (`/`)
```
https://ensignksa.com/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ksa_q2_2026&utm_content=video_founder_v1
https://ensignksa.com/?utm_source=meta&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ksa_q2_2026&utm_content=carousel_3_problems_v1
https://ensignksa.com/?utm_source=email&utm_medium=email&utm_campaign=ensign_brand_awareness_ksa_q2_2026&utm_content=launch_announcement
```

### AI Solutions (`/ai-solutions.html`)
```
https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=video_founder_v1&utm_term=marketing_directors_ksa
https://ensignksa.com/ai-solutions.html?utm_source=google&utm_medium=paid_search&utm_campaign=ensign_ai_solutions_lead_gen_ksa&utm_content=text_ad_v3&utm_term=ai_marketing_agency_riyadh
https://ensignksa.com/ai-solutions.html?utm_source=meta&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_lead_gen_ksa&utm_content=static_solution_v2&utm_term=lookalike_1pct
```

### Ensign OS (`/ensign-os.html`)
```
https://ensignksa.com/ensign-os.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ensign_os_awareness_ksa_q2&utm_content=demo_video_v1&utm_term=revops_leaders
https://ensignksa.com/ensign-os.html?utm_source=email&utm_medium=email&utm_campaign=ensign_ensign_os_awareness_ksa_q2&utm_content=newsletter_feature
```

### Agency (`/agency.html`)
```
https://ensignksa.com/agency.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_agency_lead_gen_ksa&utm_content=case_study_alrafia_v1&utm_term=cmo_directors
https://ensignksa.com/agency.html?utm_source=meta&utm_medium=paid_social&utm_campaign=ensign_agency_lead_gen_uae&utm_content=carousel_services_v2
```

### Our Work (`/work.html`)
```
https://ensignksa.com/work.html?utm_source=instagram&utm_medium=organic_social&utm_campaign=ensign_brand_awareness_ksa_q2_2026&utm_content=portfolio_post_v1
```

### About (`/about.html`)
```
https://ensignksa.com/about.html?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ensign_brand_awareness_ksa_q2_2026&utm_content=founder_thought_leadership_v1
```

### Careers (`/careers.html`)
```
https://ensignksa.com/careers.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_careers_lead_gen_ksa&utm_content=ad_copy_v3&utm_term=ai_engineers_ksa
```

### Arabic equivalents
Replace path with `/ar/...`:
```
https://ensignksa.com/ar/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa_arabic&utm_content=video_founder_arabic_v1
```

---

## 8. Cal.com booking link UTMs

The Ensign booking URL is `https://cal.com/ensign-ai-agency-q4mmzg/30min`. Cal.com supports UTM tracking — propagate the campaign all the way to the booking funnel:

```
https://cal.com/ensign-ai-agency-q4mmzg/30min?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=video_founder_v1
```

The `analytics.js` layer **already** captures whatever UTMs landed the user on Ensign's site and would need a small additional layer to inject them onto Cal.com clicks. If end-to-end click → booking attribution becomes important, ask for a follow-up: I'll add a `Cal.com URL augmentation` step that reads the session UTMs and appends them to every Cal.com link click.

---

## 9. Naming-error checklist (pre-launch)

Before publishing any ad / post / email, verify:

- [ ] `utm_source` is one of the values in section 2
- [ ] `utm_medium` is one of the values in section 3
- [ ] `utm_campaign` matches the format in section 4
- [ ] All values are lower-case
- [ ] No hyphens, only underscores
- [ ] No spaces
- [ ] The URL opens in a normal browser without errors (test by clicking)
- [ ] In GA4 DebugView, the `campaign_landing` event fires with the right params

---

## 10. Where campaign data shows up in GA4

Once a campaign URL drives traffic:

| GA4 report | What you'll see |
|---|---|
| **Reports → Acquisition → Traffic acquisition** | Sessions grouped by `Source / Medium / Campaign` |
| **Reports → Acquisition → User acquisition** | First-touch attribution |
| **Realtime → Events** | `campaign_landing` event with UTM params |
| **DebugView** | Live UTM capture during testing |
| **Explore → Free-form** | Custom dimensions: source, medium, campaign × event count, conversions |

**Custom dimensions to register in GA4** (Admin → Custom definitions):
- `service_name` (event-scoped)
- `cta_location` (event-scoped)
- `cta_text` (event-scoped)
- `lead_source` (event-scoped)

That unlocks reports like "which CTA on which page generated the most leads from which campaign".

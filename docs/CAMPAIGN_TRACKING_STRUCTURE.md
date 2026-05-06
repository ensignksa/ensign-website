# Campaign Tracking Structure — Ensign Ai Marketing Agency
**Domain:** ensignksa.com  
**Last Updated:** 2026-05-06

---

## UTM Parameter Rules

### Required Parameters (always include all five)

| Parameter | Purpose | Values |
|---|---|---|
| `utm_source` | Traffic source platform | See approved sources below |
| `utm_medium` | Channel type | See approved mediums below |
| `utm_campaign` | Campaign name | Use naming format below |
| `utm_content` | Ad or creative variant | `founder_video_v1`, `carousel_v2`, etc. |
| `utm_term` | Audience, keyword, or targeting group | `business_owners`, `cmo_ksa`, etc. |

### Rules
- Use **lowercase only** — `linkedin` not `LinkedIn`
- Use **underscores** not spaces or hyphens — `paid_social` not `paid-social`
- Never put personal data in UTM parameters
- Always test your UTM URL before launching ads
- Use the test URL validator: https://ga-dev-tools.google/campaign-url-builder/

---

## Approved Source Values

| `utm_source` | When to use |
|---|---|
| `linkedin` | LinkedIn Ads, LinkedIn posts, LinkedIn messages |
| `google` | Google Search Ads, Google Display, YouTube |
| `instagram` | Instagram Feed, Stories, Reels ads |
| `facebook` | Facebook Feed, Stories ads |
| `snapchat` | Snapchat ads |
| `tiktok` | TikTok ads |
| `newsletter` | Email newsletters you send |
| `whatsapp` | WhatsApp broadcast messages, links in WA |
| `referral` | Partner websites, directory listings |
| `twitter` | X / Twitter posts |
| `direct` | QR codes, business cards, offline materials |

---

## Approved Medium Values

| `utm_medium` | When to use |
|---|---|
| `paid_social` | Paid ads on any social platform |
| `organic_social` | Non-paid posts on social media |
| `paid_search` | Google Search Ads (CPC) |
| `display` | Banner/display ads, YouTube ads |
| `email` | Email campaigns, newsletters |
| `referral` | Inbound traffic from another website |
| `influencer` | Creator or influencer partnerships |
| `partner` | Strategic partnership traffic |
| `direct` | QR codes, offline printed materials |

---

## Campaign Naming Format

```
ensign_[service]_[goal]_[market]
```

### Service tokens
| Service | Token |
|---|---|
| AI Solutions | `ai_solutions` |
| Ensign OS | `ensign_os` |
| Agency (full services) | `agency` |
| Growth Marketing | `growth_marketing` |
| Creative Production | `creative_production` |
| Marketing Automation | `automation` |
| Website Development | `website_development` |
| Marketing Strategy | `marketing_strategy` |
| Sales Intelligence | `sales_intelligence` |
| General / Brand | `brand` |
| B2B Pipeline | `b2b_pipeline` |

### Goal tokens
| Goal | Token |
|---|---|
| Lead generation | `leads` |
| Brand awareness | `awareness` |
| Campaign launch | `launch` |
| Retargeting | `retargeting` |
| Demo / discovery call | `discovery` |
| Proposal requests | `proposals` |

### Market tokens
| Market | Token |
|---|---|
| Saudi Arabia | `ksa` |
| UAE | `uae` |
| GCC region | `gcc` |
| Arabic-speaking | `ar` |

### Examples
```
ensign_ai_solutions_launch_ksa
ensign_os_leads_ksa
ensign_agency_awareness_ksa
ensign_growth_marketing_leads_ksa
ensign_b2b_pipeline_ksa
ensign_brand_awareness_gcc
ensign_automation_discovery_uae
```

---

## Copy-Paste Campaign URLs

### Homepage `/`

**LinkedIn Paid Social:**
```
https://ensignksa.com/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ksa&utm_content=founder_post_v1&utm_term=cmo_ksa
```

**Google Search:**
```
https://ensignksa.com/?utm_source=google&utm_medium=paid_search&utm_campaign=ensign_agency_leads_ksa&utm_content=branded_search&utm_term=ai_marketing_agency_riyadh
```

**Instagram:**
```
https://ensignksa.com/?utm_source=instagram&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ksa&utm_content=reel_v1&utm_term=business_owners_ksa
```

---

### `/ai-solutions.html` — AI Solutions

**LinkedIn Paid Social:**
```
https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=founder_video_v1&utm_term=business_owners
```

**Google Search:**
```
https://ensignksa.com/ai-solutions.html?utm_source=google&utm_medium=paid_search&utm_campaign=ensign_ai_solutions_leads_ksa&utm_content=search_ad_v1&utm_term=ai_solutions_saudi_arabia
```

**Instagram Retargeting:**
```
https://ensignksa.com/ai-solutions.html?utm_source=instagram&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_retargeting_ksa&utm_content=carousel_v2&utm_term=website_visitors
```

**Snapchat:**
```
https://ensignksa.com/ai-solutions.html?utm_source=snapchat&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_awareness_ksa&utm_content=snap_story_v1&utm_term=entrepreneurs_ksa
```

**TikTok:**
```
https://ensignksa.com/ai-solutions.html?utm_source=tiktok&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_awareness_ksa&utm_content=tiktok_video_v1&utm_term=sme_ksa
```

---

### `/ensign-os.html` — Ensign OS

**LinkedIn:**
```
https://ensignksa.com/ensign-os.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_os_leads_ksa&utm_content=product_demo_v1&utm_term=marketing_managers
```

**Google:**
```
https://ensignksa.com/ensign-os.html?utm_source=google&utm_medium=paid_search&utm_campaign=ensign_os_discovery_ksa&utm_content=search_ad_v1&utm_term=marketing_automation_ksa
```

**Newsletter:**
```
https://ensignksa.com/ensign-os.html?utm_source=newsletter&utm_medium=email&utm_campaign=ensign_os_launch_ksa&utm_content=launch_email_v1&utm_term=subscribers
```

---

### `/agency.html` — Agency Services

**LinkedIn:**
```
https://ensignksa.com/agency.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_agency_leads_ksa&utm_content=services_overview_v1&utm_term=cmo_ksa
```

**Referral / Partner:**
```
https://ensignksa.com/agency.html?utm_source=referral&utm_medium=partner&utm_campaign=ensign_agency_awareness_ksa&utm_content=partner_page&utm_term=strategic_partner
```

---

### `/work.html` — Case Studies / Work

**LinkedIn:**
```
https://ensignksa.com/work.html?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ensign_brand_awareness_ksa&utm_content=case_study_post_v1&utm_term=business_owners
```

---

### `/about.html` — About

**LinkedIn:**
```
https://ensignksa.com/about.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ksa&utm_content=team_story_v1&utm_term=founders_ksa
```

---

### Arabic Homepage `/ar/`

**LinkedIn (Arabic):**
```
https://ensignksa.com/ar/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_brand_awareness_ar&utm_content=arabic_post_v1&utm_term=business_owners_ar
```

**Snapchat (Arabic):**
```
https://ensignksa.com/ar/?utm_source=snapchat&utm_medium=paid_social&utm_campaign=ensign_agency_awareness_ar&utm_content=ar_snap_v1&utm_term=sme_ksa_ar
```

---

### Arabic Service Pages

**AI Solutions (AR) — LinkedIn:**
```
https://ensignksa.com/ar/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ar&utm_content=ar_carousel_v1&utm_term=business_owners_ar
```

**Ensign OS (AR) — Instagram:**
```
https://ensignksa.com/ar/ensign-os.html?utm_source=instagram&utm_medium=paid_social&utm_campaign=ensign_os_leads_ar&utm_content=ar_reel_v1&utm_term=sme_ar
```

---

### Test URL (for verification)
```
https://ensignksa.com/ai-solutions.html?utm_source=linkedin&utm_medium=paid_social&utm_campaign=ensign_ai_solutions_launch_ksa&utm_content=test_creative_v1&utm_term=test_audience
```

---

## Platform-Specific Notes

### LinkedIn Ads
- Set UTM at the campaign URL level in Campaign Manager
- Use Insight Tag separately (not tracked here — install via GTM if needed)
- Recommended audiences: Job titles (CMO, Marketing Director, CEO), company size 11–500

### Google Ads
- Enable Auto-Tagging — Google adds `gclid` automatically
- ALSO add UTM params manually as a backup for GA4 cross-platform attribution
- utm_term = use the actual keyword group name, not individual keywords

### Meta (Instagram / Facebook)
- Set UTM in the Website URL field in Ads Manager
- Dynamic parameters available: `{{ad.name}}` → use in utm_content

### Snapchat
- Add UTM in the "Final URL" field
- Good for brand awareness in KSA/UAE — track with `utm_source=snapchat`

### TikTok
- Add UTM in the "Landing Page URL" field in Ads Manager
- Track creative performance via utm_content variants

### Email / Newsletter
- Always UTM every link in newsletters
- utm_medium = `email` for all email campaigns
- utm_source = `newsletter` for newsletters, `whatsapp` for WA broadcasts

### WhatsApp Broadcasts
- Shorten UTM URLs with Bitly before sending
- utm_source = `whatsapp`, utm_medium = `direct`

---

## UTM in GA4

UTM parameters appear in GA4 as:
- **Traffic Acquisition** → Source/Medium report
- **Acquisition** → Campaign report  
- **Explorations** → Use `session_campaign`, `session_source`, `session_medium` dimensions
- **Events** → All events include UTM params as custom parameters (via analytics.js sessionUtm)

GA4 dashboard: https://analytics.google.com (property: ensignksa.com, ID: G-LWTQMQ08D4)

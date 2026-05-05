# SEO Audit & Actions — Ensign Website
**Audit Date:** 2026-05-05  
**Domain:** https://ensignksa.com  
**Framework:** Static HTML/CSS/JS (no framework)

---

## Full Page Inventory (40 pages)

### English Pages (20)
| Page | File | Status |
|------|------|--------|
| Homepage | index.html | OK |
| About | about.html | OK |
| Agency | agency.html | OK |
| AI Solutions | ai-solutions.html | FIXED (this audit) |
| Ensign OS | ensign-os.html | OK |
| Our Work | work.html | OK |
| Careers | careers.html | OK |
| Privacy Policy | privacy-policy.html | OK |
| Terms & Conditions | terms-and-conditions.html | OK |
| Blog Index | blog/index.html | OK |
| Blog: AI Content vs Copywriters | blog/ai-content-creation-vs-human-copywriters-saudi.html | OK |
| Blog: AI Lead Generation | blog/ai-lead-generation-saudi-arabia.html | OK |
| Blog: AI Marketing Automations | blog/ai-marketing-automations-saudi-business-2026.html | OK |
| Blog: AI Reshaping Digital Marketing | blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html | OK |
| Blog: CRM Setup | blog/crm-setup-saudi-businesses.html | OK |
| Blog: In-House vs AI Agency | blog/in-house-marketing-vs-ai-agency-saudi-smes.html | OK |
| Blog: Marketing Automation Guide | blog/marketing-automation-guide-saudi-smes.html | OK |
| Blog: Signs Marketing Wasting Budget | blog/signs-marketing-wasting-budget-ai-fix.html | OK |
| Blog: What Is AI Marketing Agency | blog/what-is-ai-marketing-agency-saudi-arabia.html | OK |

### Arabic Pages (20)
| Page | File | Status |
|------|------|--------|
| Homepage (AR) | ar/index.html | OK |
| About (AR) | ar/about.html | OK |
| Agency (AR) | ar/agency.html | OK |
| AI Solutions (AR) | ar/ai-solutions.html | FIXED (this audit) |
| Ensign OS (AR) | ar/ensign-os.html | OK |
| Our Work (AR) | ar/work.html | OK |
| Careers (AR) | ar/careers.html | OK |
| Privacy Policy (AR) | ar/privacy-policy.html | OK |
| Terms & Conditions (AR) | ar/terms-and-conditions.html | OK |
| Blog Index (AR) | ar/blog/index.html | OK |
| Blog: AI Content vs Copywriters (AR) | ar/blog/ai-content-creation-vs-human-copywriters-saudi.html | OK |
| Blog: AI Lead Generation (AR) | ar/blog/ai-lead-generation-saudi-arabia.html | OK |
| Blog: AI Marketing Automations (AR) | ar/blog/ai-marketing-automations-saudi-business-2026.html | OK |
| Blog: AI Reshaping Digital Marketing (AR) | ar/blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html | OK |
| Blog: CRM Setup (AR) | ar/blog/crm-setup-saudi-businesses.html | OK |
| Blog: In-House vs AI Agency (AR) | ar/blog/in-house-marketing-vs-ai-agency-saudi-smes.html | OK |
| Blog: Marketing Automation Guide (AR) | ar/blog/marketing-automation-guide-saudi-smes.html | OK |
| Blog: Signs Marketing Wasting Budget (AR) | ar/blog/signs-marketing-wasting-budget-ai-fix.html | OK |
| Blog: What Is AI Marketing Agency (AR) | ar/blog/what-is-ai-marketing-agency-saudi-arabia.html | OK |

**Excluded from sitemap:** concepts/, content/brand-book/, blog/post-template.html, ar/blog/post-template.html

---

## What Was Fixed in This Audit (2026-05-05)

### 1. Sitemap (sitemap.xml)
Added 12 missing pages:
- **EN service pages:** about.html, agency.html, ai-solutions.html, ensign-os.html, work.html
- **AR service pages:** ar/about.html, ar/agency.html, ar/ai-solutions.html, ar/ensign-os.html, ar/work.html
- **Blog posts:** blog/ai-content-creation-vs-human-copywriters-saudi.html
- **AR blog posts:** ar/blog/ai-content-creation-vs-human-copywriters-saudi.html

### 2. GA4 Tracking
- Added GA4 (`G-LWTQMQ08D4`) to **ai-solutions.html** (at end of body)
- Added GA4 to **ar/ai-solutions.html** (at end of body)

### 3. ai-solutions.html — Full Head Overhaul
- Fixed meta description (removed "interactive intelligence chamber" — replaced with clear service description)
- Added canonical tag
- Added hreflang (en + ar + x-default)
- Added OG tags (type, url, title, description, image, locale, site_name)
- Added Twitter card tags
- Added robots, author, geo meta tags
- Added BreadcrumbList schema
- Added Service schema
- Added Organization schema

### 4. ar/ai-solutions.html — Full Head Overhaul
- Fixed meta description
- Added canonical tag
- Added hreflang (en + ar + x-default)
- Fixed OG url (was pointing to EN URL, now points to AR URL)
- Added OG tags
- Added Twitter card tags
- Added BreadcrumbList schema
- Added Service schema

### 5. hreflang — Missing "ar" Annotations Fixed on ALL Pages
Every EN page was missing `hreflang="ar"` pointing to its AR counterpart. Fixed:
- index.html
- about.html, agency.html, ensign-os.html, work.html, careers.html
- privacy-policy.html, terms-and-conditions.html
- blog/index.html
- All 9 EN blog posts

Every AR page was missing `hreflang="ar"` pointing to itself. Fixed:
- ar/index.html, ar/about.html, ar/agency.html, ar/ensign-os.html, ar/work.html, ar/careers.html
- ar/privacy-policy.html, ar/terms-and-conditions.html
- ar/blog/index.html
- All 9 AR blog posts

### 6. og:url Bug Fixed on AR Pages
All AR pages had `og:url` pointing to the EN URL. Fixed to point to the correct AR URL:
- ar/index.html, ar/about.html, ar/agency.html, ar/ensign-os.html, ar/work.html
- ar/careers.html, ar/privacy-policy.html, ar/terms-and-conditions.html
- ar/blog/index.html
- All 9 AR blog posts

### 7. Title Improvements
- **agency.html**: "Marketing Agency | Ensign" → "Marketing Agency in Saudi Arabia | Ensign Ai Marketing Agency"
- **ensign-os.html**: "Ensign OS | Coming Soon" → "Ensign OS | AI Revenue Operating System — Saudi Arabia"
- **ar/ensign-os.html**: OG/Twitter titles updated to match

---

## Page-by-Page Recommended Titles & Meta Descriptions

### EN Pages
| Page | Recommended Title | Meta Description |
|------|-------------------|-----------------|
| index.html | Ensign Ai Marketing Agency — AI Systems. Human Leadership. | Ensign Ai Marketing Agency is a Riyadh-based AI marketing consultancy that builds intelligent marketing systems, automation frameworks, and high-performance campaigns for businesses in Saudi Arabia and the UAE. |
| about.html | About Ensign \| Marketing, AI Solutions & Digital Products | Ensign is a Saudi-born marketing and technology company connecting brand strategy, AI systems, revenue operations, and digital product development for growth-focused businesses. |
| agency.html | Marketing Agency in Saudi Arabia \| Ensign Ai Marketing Agency | Ensign's marketing practice in Saudi Arabia: brand strategy, content, paid media, production, events, and performance for businesses building consistent presence and measurable growth. |
| ai-solutions.html | AI Solutions \| Ensign Ai Marketing Agency — Saudi Arabia | Ensign's AI solutions for Saudi businesses: intelligent agents, marketing automation, AI-powered lead qualification, and custom AI systems built for KSA and UAE markets. |
| ensign-os.html | Ensign OS \| AI Revenue Operating System — Saudi Arabia | Ensign OS is the revenue operating system that connects lead capture, AI qualification, sales follow-up, marketing intelligence, and reporting in one environment. |
| work.html | Our Work — Ensign Ai Marketing Agency | Films, audience growth, performance results, AI-generated media, and live experiences — built for ambitious brands across Saudi Arabia and the UAE. |
| careers.html | Careers — Ensign Ai Marketing Agency | Join Ensign Ai Marketing Agency. We're looking for ambitious AI and marketing minds ready to build the future of intelligent marketing in Saudi Arabia. |
| blog/index.html | Blog — Ensign Ai Marketing Agency \| AI & Marketing Insights | Expert insights on AI marketing, automation strategies, and digital transformation in Saudi Arabia. |

---

## Priority Keywords Per Page

| Page | Primary Keyword | Secondary Keywords |
|------|----------------|-------------------|
| index.html | AI marketing agency Saudi Arabia | AI marketing consultancy, intelligent marketing systems, Riyadh |
| about.html | About Ensign AI | AI marketing company Saudi Arabia, brand strategy AI |
| agency.html | Marketing agency Saudi Arabia | Marketing agency Riyadh, brand strategy Saudi, paid media KSA |
| ai-solutions.html | AI solutions Saudi Arabia | AI agents, marketing automation, AI lead generation, KSA |
| ensign-os.html | Revenue operating system AI | AI CRM, marketing automation Saudi, sales automation |
| work.html | AI marketing results Saudi | Marketing portfolio KSA, brand campaigns Saudi Arabia |
| Blog posts | Varies per post | AI marketing, Saudi Arabia, 2026 |

---

## Remaining Manual Tasks

### High Priority
1. **Canonical URL mismatch on some blog posts**: Several blog posts have `canonical` pointing to URL without `.html` extension (e.g., `https://ensignksa.com/blog/crm-setup-saudi-businesses` instead of `.html`). These should be verified — if Vercel redirects the non-.html URL to .html, the canonical should use the final URL with `.html`. Affected posts: crm-setup, marketing-automation-guide, signs-marketing-wasting-budget, ai-lead-generation, ai-content-creation.
2. **Schema on ensign-os.html**: Missing a Service schema — only has BreadcrumbList.
3. **Schema on work.html**: Missing a Service or CollectionPage schema.
4. **Missing hreflang on AR index**: The EN index links to AR homepage — ensure Google Search Console shows no hreflang errors.
5. **OG images**: Most pages use `assets/logos/3.png` as OG image — should use a proper 1200x630 social sharing image. Blog posts have specific OG images which is correct.

### Medium Priority
6. **ALT text audit**: Not audited — check all `<img>` tags for missing or weak alt attributes.
7. **Internal linking**: Blog posts should cross-link to each other and to relevant service pages. Currently limited.
8. **Blog "Back to blog" links**: Verified present in blog post structure — confirm in HTML.
9. **AR about page og:description**: Currently in English, should be in Arabic.
10. **AR agency page og:description**: Currently in English, should be in Arabic.
11. **AR blog posts og:description**: Several AR blog posts have English og:description — should be in Arabic.

### Low Priority
12. **Page speed**: Images not audited for WebP optimization.
13. **Structured data testing**: Use Google's Rich Results Test on each page after deployment.
14. **GSC Coverage report**: Check after 48h for any new index errors.

---

## Internal Linking Gaps Found
- EN service pages (about, agency, ai-solutions, ensign-os, work) are linked from nav — good.
- Blog posts do not cross-link to AI Solutions or Agency pages — missed opportunity.
- No "Related Posts" section on blog posts — users leave after reading one post.
- ensign-os.html and work.html have no schema — orphan from structured data perspective.

---

## Sitemap Status (after this audit)
- **Total URLs:** 40 pages
- **Missing before audit:** 12 pages
- **Added:** 12 pages (service pages EN+AR, ai-content-creation blog EN+AR)
- **Sitemap URL:** https://ensignksa.com/sitemap.xml
- **Submit to GSC:** https://search.google.com/search-console → Sitemaps → Enter URL → Submit

---

## Analytics Status
- **GA4 Measurement ID:** G-LWTQMQ08D4
- **Coverage:** 40/40 pages (ai-solutions.html and ar/ai-solutions.html added in this audit)
- **Verification:** Check GA4 Realtime report after deployment

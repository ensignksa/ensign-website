# Ensign Website Translation Extraction Summary

- **Date of extraction:** 2026-05-04
- **Output file:** `ensign-website-translation-master.xlsx`
- **Total sheets:** 19
- **Total English phrases:** 2225

## Sheets and phrase counts

| Sheet | Phrases | Notes |
|---|---|---|
| Home | 43 |  |
| About | 68 |  |
| Agency | 67 |  |
| AI Solutions | 111 |  |
| Ensign OS | 24 |  |
| Our Work | 178 |  |
| Careers | 49 |  |
| Privacy Policy | 94 |  |
| Terms & Conditions | 74 |  |
| Blog Index | 60 |  |
| Blog AI Content vs Human | 200 |  |
| Blog AI Lead Generation | 203 |  |
| Blog AI Marketing Automations | 90 |  |
| Blog AI Reshaping Marketing | 143 |  |
| Blog CRM Setup | 168 |  |
| Blog In-house vs AI Agency | 169 |  |
| Blog Marketing Automation Guide | 191 |  |
| Blog Signs Wasting Budget | 116 |  |
| Blog What is AI Marketing Agency | 177 |  |

## Pages NOT extracted (intentionally)

- `ar/` Arabic pages — disabled site-wide and excluded from extraction
- `concepts/` — internal design concept pages, not public
- `*.bak` files — backups
- `index.html.pre-cinematic.bak` and similar dev artefacts

## Assumptions

- 'Visible English text' means user-facing copy rendered in the browser, plus the page `<title>` and `<meta name=description>` (search-result visible).
- Aria-hidden subtrees and elements with decorative-only classes (atmos, mist, grain, hero-video, sparklines, etc.) were excluded.
- Inline emphasis (`<em>`, `<strong>`) is preserved as plain text within its parent phrase — the headline `It was *built.*` renders as `It was built.`.
- Decorative SVG content, icons, and `nav-toggle` button spans were excluded as they have no semantic copy.
- Phrases longer than 800 characters were skipped as likely wrapper over-captures.
- Duplicate phrases within the same page were deduplicated; phrases that recur across different pages appear in each page sheet.
- The Arabic column is intentionally left empty for the translator.

## Verification

- Workbook re-opened programmatically post-write
- Confirmed every sheet has headers `En phrase` and `Ar phrase`
- Confirmed Ar column is empty on every row
- Confirmed no obvious developer/code strings included
- First row frozen, columns auto-sized, headers bold
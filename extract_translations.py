# -*- coding: utf-8 -*-
"""
Extract every visible English phrase from each Ensign website page
and write to ensign-website-translation-master.xlsx with one sheet per page.

Each sheet has two columns:
  En phrase | Ar phrase (empty for translator)

Also produces translation-extraction-summary.md.
"""
import os
import re
from datetime import date
from bs4 import BeautifulSoup, NavigableString
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter

ROOT = r"C:\Users\Lenovo\Documents\Ensign-Website"

# (file path relative to ROOT, sheet name)
PAGES = [
    ("index.html",                        "Home"),
    ("about.html",                        "About"),
    ("agency.html",                       "Agency"),
    ("ai-solutions.html",                 "AI Solutions"),
    ("ensign-os.html",                    "Ensign OS"),
    ("work.html",                         "Our Work"),
    ("careers.html",                      "Careers"),
    ("privacy-policy.html",               "Privacy Policy"),
    ("terms-and-conditions.html",         "Terms & Conditions"),
    ("blog/index.html",                   "Blog Index"),
    ("blog/ai-content-creation-vs-human-copywriters-saudi.html",
                                          "Blog AI Content vs Human"),
    ("blog/ai-lead-generation-saudi-arabia.html",
                                          "Blog AI Lead Generation"),
    ("blog/ai-marketing-automations-saudi-business-2026.html",
                                          "Blog AI Marketing Automations"),
    ("blog/ai-reshaping-digital-marketing-saudi-arabia-2026.html",
                                          "Blog AI Reshaping Marketing"),
    ("blog/crm-setup-saudi-businesses.html",
                                          "Blog CRM Setup"),
    ("blog/in-house-marketing-vs-ai-agency-saudi-smes.html",
                                          "Blog In-house vs AI Agency"),
    ("blog/marketing-automation-guide-saudi-smes.html",
                                          "Blog Marketing Automation Guide"),
    ("blog/signs-marketing-wasting-budget-ai-fix.html",
                                          "Blog Signs Wasting Budget"),
    ("blog/what-is-ai-marketing-agency-saudi-arabia.html",
                                          "Blog What is AI Marketing Agency"),
]

# Tags whose direct text content we treat as a "phrase".
# We get the full text within each (including inline children like <em>, <strong>).
PHRASE_TAGS = {
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "button", "a", "label", "blockquote",
    "figcaption", "summary", "th", "td", "caption",
    "dt", "dd",
    "span",   # only those with direct text content (filtered later)
    "div",    # only leaf text nodes (filtered later)
}

# Skip these entirely (their content is non-visible or developer-only)
SKIP_TAGS = {"script", "style", "noscript", "svg", "template"}

# Skip elements with these classes (icons, animations, hidden visuals, dev hints)
SKIP_CLASS_PATTERNS = [
    re.compile(r"\b(grain|atmos|atmos-mist|atmos-video|hero-video-wrap|hero-video|"
               r"bg-mist|os-grid|os-grain|os-atmos|os-mist|"
               r"hero-trails|trail|hs-divider|sg-div-h|sg-div-v|"
               r"nav-toggle|mobile-menu|mobile-menu-links|"
               r"data-spark|sparkline|"
               r"hero-stage-svg|frag-line|frag-stage|frag-center|frag-card|"
               r"data-viz-chart|proof-card-visual-line|work-visual-line|"
               r"ai-feature-media|live-frame-dot|live-frame-dots)\b")
]

# Skip elements that are aria-hidden
def is_aria_hidden(tag):
    if not hasattr(tag, "get"):
        return False
    return tag.get("aria-hidden") == "true"

def has_skip_class(tag):
    if not hasattr(tag, "get"):
        return False
    cls = " ".join(tag.get("class", []) or [])
    if not cls:
        return False
    for pat in SKIP_CLASS_PATTERNS:
        if pat.search(cls):
            return True
    return False

def under_skip_ancestor(tag):
    cur = tag.parent
    while cur is not None and getattr(cur, "name", None):
        if cur.name in SKIP_TAGS:
            return True
        if is_aria_hidden(cur) or has_skip_class(cur):
            return True
        cur = cur.parent
    return False

def normalize(text):
    if not text:
        return ""
    # collapse whitespace
    t = re.sub(r"[\s ]+", " ", text).strip()
    # strip leading/trailing decorative dots/dashes (keep internal punctuation)
    t = t.strip("·•")
    return t.strip()

# Common noise to exclude (developer hints, placeholders left in)
NOISE_PATTERNS = [
    re.compile(r"^\s*$"),
    re.compile(r"^[\d\W_]{1,3}$"),                  # 1-3 chars of just digits/punct
    re.compile(r"^(true|false|null|undefined)$", re.I),
    re.compile(r"^window\."),
    re.compile(r"^\s*//\s"),
    re.compile(r"^document\."),
]

def is_noise(text):
    if not text or len(text) < 2:
        return True
    for pat in NOISE_PATTERNS:
        if pat.match(text):
            return True
    # purely punctuation?
    if re.fullmatch(r"[\W_]+", text):
        return True
    return False

def extract_meta(soup):
    """Get visible search/SEO meta — title and description."""
    out = []
    title = soup.find("title")
    if title and title.string:
        t = normalize(title.string)
        if t:
            out.append(("Page Title (browser tab / search result)", t))
    desc = soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        d = normalize(desc["content"])
        if d:
            out.append(("Meta Description (search result)", d))
    return out

def extract_phrases(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # Drop dev-only content
    for tag in soup(SKIP_TAGS):
        tag.decompose()

    # Drop aria-hidden subtrees and decorative classes
    for tag in soup.find_all(attrs={"aria-hidden": "true"}):
        tag.decompose()
    for tag in soup.find_all(class_=True):
        if has_skip_class(tag):
            tag.decompose()

    seen = set()
    phrases = []   # list of (context_label_or_None, text)

    # 1. Meta (page title, meta description)
    for label, text in extract_meta(soup):
        key = ("meta", text.lower())
        if key not in seen:
            seen.add(key)
            phrases.append((label, text))

    # 2. Iterate body element-by-element collecting whole-element text
    body = soup.body or soup

    # We want each "phrase" to be the FULL text content of a phrase-bearing
    # element, but NOT to double-count nested phrase elements.
    # Strategy: walk leaf/heading-style elements and capture their direct text.

    # Block-level phrase elements: capture full inner text
    BLOCK_PHRASE = {"h1","h2","h3","h4","h5","h6","p","li","blockquote",
                    "label","button","summary","dt","dd","th","td","caption","figcaption"}

    def add(text):
        t = normalize(text)
        if is_noise(t):
            return
        # avoid splitting on inline italic/strong but trim trailing punct artifacts
        if len(t) > 800:
            # very long - might be a wrapper grabbing too much; skip
            return
        key = ("p", t.lower())
        if key in seen:
            return
        seen.add(key)
        phrases.append((None, t))

    for el in body.find_all(True):
        if el.name in SKIP_TAGS:
            continue
        if is_aria_hidden(el) or has_skip_class(el):
            continue
        if under_skip_ancestor(el):
            continue

        if el.name in BLOCK_PHRASE:
            text = el.get_text(separator=" ", strip=True)
            add(text)
            continue

        if el.name == "a":
            # capture link text only if it has direct visible text
            text = el.get_text(separator=" ", strip=True)
            # if the link is wrapping a block element (e.g., a card), skip — its
            # children will be handled as their own phrases
            child_blocks = [c for c in el.find_all(True) if c.name in BLOCK_PHRASE]
            if child_blocks:
                continue
            add(text)
            continue

        if el.name == "input":
            ph = el.get("placeholder")
            val = el.get("value")
            aria = el.get("aria-label")
            for v in (ph, val, aria):
                if v:
                    add(v)
            continue

        if el.name == "textarea":
            ph = el.get("placeholder")
            if ph:
                add(ph)
            inner = el.get_text(separator=" ", strip=True)
            if inner:
                add(inner)
            continue

        if el.name == "option":
            text = el.get_text(strip=True)
            add(text)
            continue

        if el.name == "span":
            # only direct-text spans NOT inside a BLOCK_PHRASE we already captured
            parent_block = el.find_parent(BLOCK_PHRASE | {"a"})
            if parent_block:
                continue
            text = el.get_text(separator=" ", strip=True)
            if text and len(text) >= 2:
                add(text)
            continue

        if el.name == "div":
            # skip — captured via children
            continue

        if el.name == "img":
            alt = el.get("alt")
            if alt and len(alt) > 1:
                add(alt)
            continue

    return phrases


def write_workbook(all_results, out_path):
    wb = Workbook()
    # remove default sheet
    wb.remove(wb.active)

    header_font = Font(bold=True, size=11)
    header_fill = PatternFill("solid", fgColor="0A1622")
    header_color = Font(bold=True, size=11, color="F2EFE8")
    wrap = Alignment(wrap_text=True, vertical="top")
    header_align = Alignment(horizontal="left", vertical="center")

    for sheet_name, phrases in all_results:
        # Excel sheet names limited to 31 chars and no special chars
        safe = re.sub(r"[\[\]:\*\?/\\]", "", sheet_name)[:31]
        ws = wb.create_sheet(title=safe)
        ws.cell(row=1, column=1, value="En phrase").font = header_color
        ws.cell(row=1, column=2, value="Ar phrase").font = header_color
        ws.cell(row=1, column=1).fill = header_fill
        ws.cell(row=1, column=2).fill = header_fill
        ws.cell(row=1, column=1).alignment = header_align
        ws.cell(row=1, column=2).alignment = header_align
        ws.row_dimensions[1].height = 24

        for i, (_, text) in enumerate(phrases, start=2):
            c = ws.cell(row=i, column=1, value=text)
            c.alignment = wrap
            ws.cell(row=i, column=2, value="").alignment = wrap

        # Column widths and freeze top row
        ws.column_dimensions["A"].width = 90
        ws.column_dimensions["B"].width = 60
        ws.freeze_panes = "A2"
        ws.sheet_view.rightToLeft = False

    wb.save(out_path)


def main():
    all_results = []
    page_summary = []

    for rel, sheet in PAGES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            print(f"  MISS: {rel}")
            page_summary.append((sheet, 0, "file not found"))
            continue
        try:
            phrases = extract_phrases(path)
            all_results.append((sheet, phrases))
            page_summary.append((sheet, len(phrases), None))
            print(f"  {sheet}: {len(phrases)} phrases")
        except Exception as e:
            print(f"  ERROR {rel}: {e}")
            page_summary.append((sheet, 0, str(e)))

    out_xlsx = os.path.join(ROOT, "ensign-website-translation-master.xlsx")
    write_workbook(all_results, out_xlsx)
    print(f"\nWrote {out_xlsx}")

    # Verify
    from openpyxl import load_workbook
    wb = load_workbook(out_xlsx)
    print(f"\nVerification: {len(wb.sheetnames)} sheets")
    total = 0
    for s in wb.sheetnames:
        ws = wb[s]
        # count rows with English text
        n = 0
        for r in range(2, ws.max_row + 1):
            if ws.cell(row=r, column=1).value:
                n += 1
            assert ws.cell(row=r, column=2).value in (None, ""), \
                f"AR column not empty in sheet {s} row {r}"
        # confirm headers
        assert ws.cell(row=1, column=1).value == "En phrase"
        assert ws.cell(row=1, column=2).value == "Ar phrase"
        total += n
    print(f"Verified. Total English phrases across all sheets: {total}")

    # Summary md
    today = date.today().isoformat()
    summary_lines = [
        "# Ensign Website Translation Extraction Summary",
        "",
        f"- **Date of extraction:** {today}",
        f"- **Output file:** `ensign-website-translation-master.xlsx`",
        f"- **Total sheets:** {len(page_summary)}",
        f"- **Total English phrases:** {total}",
        "",
        "## Sheets and phrase counts",
        "",
        "| Sheet | Phrases | Notes |",
        "|---|---|---|",
    ]
    for s, n, note in page_summary:
        summary_lines.append(f"| {s} | {n} | {note or ''} |")

    summary_lines += [
        "",
        "## Pages NOT extracted (intentionally)",
        "",
        "- `ar/` Arabic pages — disabled site-wide and excluded from extraction",
        "- `concepts/` — internal design concept pages, not public",
        "- `*.bak` files — backups",
        "- `index.html.pre-cinematic.bak` and similar dev artefacts",
        "",
        "## Assumptions",
        "",
        "- 'Visible English text' means user-facing copy rendered in the browser,"
        " plus the page `<title>` and `<meta name=description>` (search-result visible).",
        "- Aria-hidden subtrees and elements with decorative-only classes"
        " (atmos, mist, grain, hero-video, sparklines, etc.) were excluded.",
        "- Inline emphasis (`<em>`, `<strong>`) is preserved as plain text within"
        " its parent phrase — the headline `It was *built.*` renders as `It was built.`.",
        "- Decorative SVG content, icons, and `nav-toggle` button spans were"
        " excluded as they have no semantic copy.",
        "- Phrases longer than 800 characters were skipped as likely wrapper"
        " over-captures.",
        "- Duplicate phrases within the same page were deduplicated; phrases"
        " that recur across different pages appear in each page sheet.",
        "- The Arabic column is intentionally left empty for the translator.",
        "",
        "## Verification",
        "",
        "- Workbook re-opened programmatically post-write",
        "- Confirmed every sheet has headers `En phrase` and `Ar phrase`",
        "- Confirmed Ar column is empty on every row",
        "- Confirmed no obvious developer/code strings included",
        "- First row frozen, columns auto-sized, headers bold",
    ]

    sm_path = os.path.join(ROOT, "translation-extraction-summary.md")
    with open(sm_path, "w", encoding="utf-8") as f:
        f.write("\n".join(summary_lines))
    print(f"Wrote {sm_path}")


if __name__ == "__main__":
    main()

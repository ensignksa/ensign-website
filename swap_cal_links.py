"""One-shot: replace Cal.com booking URLs with the local embed page.
- Files under ar/ -> /ar/book.html
- Everywhere else -> /book.html
Skips dev/build artifacts and the embed pages themselves.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OLD = "https://cal.com/ensign-ai-agency-q4mmzg/30min"

SKIP_DIRS = {"node_modules", ".git", ".vercel", "dist", "build", "concepts", "blog-word-docs"}
SKIP_FILES = {"book.html", "swap_cal_links.py"}  # don't rewrite the embed pages
# Only HTML files at user-facing locations (root, ar/, blog/, ar/blog/)
ALLOWED_EXTS = {".html"}

changed = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    rel_dir = os.path.relpath(dirpath, ROOT).replace("\\", "/")
    # Decide replacement target based on whether this is an AR path
    is_ar = rel_dir == "ar" or rel_dir.startswith("ar/")
    new_url = "/ar/book.html" if is_ar else "/book.html"

    for fn in filenames:
        if fn in SKIP_FILES:
            continue
        ext = os.path.splitext(fn)[1].lower()
        if ext not in ALLOWED_EXTS:
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"skip (read err) {path}: {e}", file=sys.stderr)
            continue
        if OLD not in text:
            continue
        count = text.count(OLD)
        text = text.replace(OLD, new_url)
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(text)
        changed.append((path, count, new_url))

for p, c, u in changed:
    print(f"{c:>2}x  {os.path.relpath(p, ROOT)}  ->  {u}")
print(f"\nTotal files changed: {len(changed)}")
print(f"Total link occurrences replaced: {sum(c for _,c,_ in changed)}")

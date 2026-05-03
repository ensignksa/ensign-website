# -*- coding: utf-8 -*-
"""
Prepare all Our Work page assets:
- Copy + resize photos (Pillow)
- Convert HEIC to JPG (ffmpeg)
- Convert .mov to .mp4 silent (ffmpeg)
- Copy .mp4 videos with audio stripped
"""
import os, shutil, subprocess, sys
from PIL import Image

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


FFMPEG = r"C:\Users\Lenovo\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
SRC    = r"C:\Users\Lenovo\Desktop\Our work content"
DST    = r"C:\Users\Lenovo\Documents\Ensign-Website\assets\work"
QUALITY = 84
MAX_W   = 1400

def mkdir(p):
    os.makedirs(p, exist_ok=True)

def resize_jpg(src, dst, max_w=MAX_W, q=QUALITY):
    mkdir(os.path.dirname(dst))
    img = Image.open(src).convert("RGB")
    w, h = img.size
    if w > max_w:
        img = img.resize((max_w, int(h * max_w / w)), Image.Resampling.LANCZOS)
    img.save(dst, "JPEG", quality=q, optimize=True)
    print(f"  IMG  {os.path.basename(src):50s} → {os.path.basename(dst)}")

def heic_to_jpg(src, dst, max_w=MAX_W, q=QUALITY):
    mkdir(os.path.dirname(dst))
    tmp = dst + ".tmp.jpg"
    subprocess.run([
        FFMPEG, "-y", "-i", src,
        "-frames:v", "1", "-update", "1",
        "-q:v", "3", tmp
    ], check=True, capture_output=True)
    # resize via Pillow
    img = Image.open(tmp).convert("RGB")
    w, h = img.size
    if w > max_w:
        img = img.resize((max_w, int(h * max_w / w)), Image.Resampling.LANCZOS)
    img.save(dst, "JPEG", quality=q, optimize=True)
    os.remove(tmp)
    print(f"  HEIC {os.path.basename(src):50s} -> {os.path.basename(dst)}")

def to_mp4_silent(src, dst):
    mkdir(os.path.dirname(dst))
    subprocess.run([
        FFMPEG, "-y", "-i", src,
        "-an",                       # strip audio
        "-vcodec", "libx264",
        "-crf", "26",
        "-preset", "fast",
        "-movflags", "+faststart",
        "-vf", "scale='min(1280,iw)':-2",
        dst
    ], check=True, capture_output=True)
    print(f"  VID  {os.path.basename(src):50s} → {os.path.basename(dst)}")

# ─────────────────────────────────────────────
# FILMS & CONTENT  →  assets/work/films/
# ─────────────────────────────────────────────
films_src = os.path.join(SRC, "Human media Production")
films_dst = os.path.join(DST, "films")

FILMS_PHOTOS = [
    ("Pictures/IMG_2677.jpg",  "cocktail-shaker.jpg"),
    ("Pictures/IMG_2679.jpg",  "food-spread.jpg"),
    ("Pictures/IMG_9727.png",  "signature-cocktail.jpg"),
    ("Pictures/IMG111.jpg",    "cocktail-lineup.jpg"),
]
FILMS_VIDEOS = [
    ("Videos/IMG_3816.mp4",             "film-01.mp4"),
    ("Videos/IMG_0692.mov",             "film-02.mp4"),
    ("Videos/Knowledge is endless.mov", "film-03.mp4"),
    ("Videos/Story time with lida.mov", "film-04.mp4"),
]

print("\n-- Films & Content --")
for rel, name in FILMS_PHOTOS:
    resize_jpg(os.path.join(films_src, rel), os.path.join(films_dst, name))
for rel, name in FILMS_VIDEOS:
    to_mp4_silent(os.path.join(films_src, rel), os.path.join(films_dst, name))

# ─────────────────────────────────────────────
# AUDIENCE GROWTH  →  assets/work/growth/
# ─────────────────────────────────────────────
growth_src = os.path.join(SRC, "Account Growth")
growth_dst = os.path.join(DST, "growth")

# Best 3 per brand
GROWTH_LIDA = [
    ("Lida/WhatsApp Image 2026-05-02 at 12.48.41 PM (2).jpeg",  "lida-01.jpg"),
    ("Lida/WhatsApp Image 2026-05-02 at 12.48.41 PM (3).jpeg",  "lida-02.jpg"),
    ("Lida/WhatsApp Image 2026-05-02 at 12.48.41 PM (4).jpeg",  "lida-03.jpg"),
]
GROWTH_PT = [
    ("Pt/WhatsApp Image 2026-05-02 at 12.48.38 PM.jpeg",        "pt-01.jpg"),
    ("Pt/WhatsApp Image 2026-05-02 at 12.48.39 PM (3).jpeg",    "pt-02.jpg"),
    ("Pt/WhatsApp Image 2026-05-02 at 12.48.38 PM (2).jpeg",    "pt-03.jpg"),
]
GROWTH_VHOOKAH = [
    ("Vhookah/WhatsApp Image 2026-05-02 at 12.48.40 PM (1).jpeg",  "vhookah-01.jpg"),
    ("Vhookah/WhatsApp Image 2026-05-02 at 12.48.40 PM (3).jpeg",  "vhookah-02.jpg"),
    ("Vhookah/WhatsApp Image 2026-05-02 at 12.48.39 PM (5).jpeg",  "vhookah-03.jpg"),
]

print("\n── Audience Growth ──")
for items in [GROWTH_LIDA, GROWTH_PT, GROWTH_VHOOKAH]:
    for rel, name in items:
        resize_jpg(os.path.join(growth_src, rel), os.path.join(growth_dst, name), max_w=600)

# ─────────────────────────────────────────────
# PERFORMANCE RESULTS  →  assets/work/performance/
# ─────────────────────────────────────────────
perf_src = os.path.join(SRC, "Ads result")
perf_dst = os.path.join(DST, "performance")

PERF = [
    ("Keller william-ads.png",          "kw-ads.jpg"),
    ("Vhookah ads.png",                 "vhookah-ads.jpg"),
    ("PT-ads.png",                      "pt-ads-01.jpg"),
    ("PT-ads (2).png",                  "pt-ads-02.jpg"),
    ("Screenshot 2025-01-05 214051.png","lead-gen-01.jpg"),
    ("Screenshot 2025-10-25 121930.png","lead-gen-02.jpg"),
]

print("\n── Performance Results ──")
for rel, name in PERF:
    resize_jpg(os.path.join(perf_src, rel), os.path.join(perf_dst, name), max_w=1400)

# ─────────────────────────────────────────────
# AI GENERATED MEDIA  →  assets/work/ai-media/
# ─────────────────────────────────────────────
ai_src = os.path.join(SRC, "Ai generated media")
ai_dst = os.path.join(DST, "ai-media")

AI_PICS = [
    ("Ai genertaed Pictures/97efcfc8-d0c6-4705-8c6b-a9a03ed9a3ad (1).png",             "ai-pic-01.jpg"),
    ("Ai genertaed Pictures/fde36070-3648-4072-87fe-b7de09521e7f.png",                  "ai-pic-02.jpg"),
    ("Ai genertaed Pictures/hf_20260117_223922_753ba70f-d886-41d0-ab2f-1dccd09b4b72 (1).png", "ai-pic-03.jpg"),
    ("Ai genertaed Pictures/hf_20260127_114838_d1203575-4c55-4e45-a469-58a05c17a089.png",     "ai-pic-04.jpg"),
    ("Ai genertaed Pictures/hf_20260128_071358_96100812-f1a3-404d-b51a-da2007fed59f.png",     "ai-pic-05.jpg"),
    ("Ai genertaed Pictures/hf_20260128_073145_61ee90ff-4d33-405c-a867-b92d041ac437.png",     "ai-pic-06.jpg"),
    ("Ai genertaed Pictures/bbefa880-a721-48b6-be05-90f9130858a7 (1).png",              "ai-pic-07.jpg"),
    ("Ai genertaed Pictures/e9665dda-f212-422b-ae7f-54a4e7c88126 (2).png",              "ai-pic-08.jpg"),
]
AI_VIDS_RAW = sorted([
    f for f in os.listdir(os.path.join(ai_src, "Ai generated Video"))
    if f.endswith(".mp4")
])

print("\n── AI Generated Media ──")
for rel, name in AI_PICS:
    resize_jpg(os.path.join(ai_src, rel), os.path.join(ai_dst, name))
for i, fname in enumerate(AI_VIDS_RAW, 1):
    src_path = os.path.join(ai_src, "Ai generated Video", fname)
    dst_path = os.path.join(ai_dst, f"ai-vid-{i:02d}.mp4")
    to_mp4_silent(src_path, dst_path)

# ─────────────────────────────────────────────
# EVENTS  →  assets/work/events/
# ─────────────────────────────────────────────
ev_src = os.path.join(SRC, "Events")
ev_dst = os.path.join(DST, "events")

CORP_HEIC = sorted([
    f for f in os.listdir(os.path.join(ev_src, "Cooperate events"))
    if f.endswith(".HEIC")
])
PRIVATE_HEIC = sorted([
    f for f in os.listdir(os.path.join(ev_src, "Private events"))
    if f.endswith(".HEIC")
])
PRIVATE_JPG = sorted([
    f for f in os.listdir(os.path.join(ev_src, "Private events"))
    if f.lower().endswith(".jpeg") or f.lower().endswith(".jpg")
])

print("\n── Events ──")
for i, fname in enumerate(CORP_HEIC, 1):
    heic_to_jpg(
        os.path.join(ev_src, "Cooperate events", fname),
        os.path.join(ev_dst, f"corp-{i:02d}.jpg")
    )
for i, fname in enumerate(PRIVATE_HEIC, 1):
    heic_to_jpg(
        os.path.join(ev_src, "Private events", fname),
        os.path.join(ev_dst, f"private-{i:02d}.jpg")
    )
for i, fname in enumerate(PRIVATE_JPG, 1):
    n = len(PRIVATE_HEIC) + i
    resize_jpg(
        os.path.join(ev_src, "Private events", fname),
        os.path.join(ev_dst, f"private-{n:02d}.jpg")
    )

print("\n✓ All assets prepared.")

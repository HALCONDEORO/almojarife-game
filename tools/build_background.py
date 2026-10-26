#!/usr/bin/env python3
"""Builds assets/map/background.webp: a period portolan sea-chart from public-domain
Natural Earth 50m land polygons (tools/fetch_data.sh downloads data/ne_50m_land.geojson).
Style: aged vellum, hand-inked coasts with stipple, a 32-wind rhumb-line network and
ornate compass roses. No raster input: every texture is procedural (own work).
The map frame (extent, projection) matches web/main.mjs: x = (lon-x0)*sc, y = (y1-lat)*sc*1.25.
Usage: python3 tools/build_background.py"""
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W = 2400
world = json.load(open("data/world.json"))
pts = list(world["cities"]) + list(world["waypoints"].values())
lo = [p["lon"] for p in pts]; la = [p["lat"] for p in pts]
x0, x1, y0, y1 = min(lo) - 1, max(lo) + 1, min(la) - 1, max(la) + 1
sc = 800 / (x1 - x0); VH = round((y1 - y0) * sc * 1.25); H = round(VH * W / 800)
k = W / 800
P = lambda lon, lat: ((lon - x0) * sc * k, (y1 - lat) * sc * 1.25 * k)

# --- land mask from the 50m polygons, drawn at 2x and reduced -----------------
S = 2
mask = Image.new("L", (W * S, H * S), 0); d = ImageDraw.Draw(mask)
land = json.load(open("data/ne_50m_land.geojson"))
def rings(g):
    if g["type"] == "Polygon": yield g["coordinates"]
    elif g["type"] == "MultiPolygon": yield from g["coordinates"]
for f in land["features"]:
    for poly in rings(f["geometry"]):
        for i, ring in enumerate(poly):
            xy = [tuple(v * S for v in P(lon, lat)) for lon, lat in ring]
            if len(xy) > 2: d.polygon(xy, fill=255 if i == 0 else 0)
mask = mask.resize((W, H), Image.LANCZOS)
m = np.asarray(mask).astype(np.float32) / 255

# --- aged vellum base ---------------------------------------------------------
rng = np.random.default_rng(11)
def noise(scale, amp, seed=None):
    r = np.random.default_rng(seed) if seed else rng
    n = r.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    return (n - 0.5) * amp
vellum = np.array([0.925, 0.862, 0.700], np.float32)          # light calfskin
base = np.ones((H, W, 3), np.float32) * vellum
base += noise(3, 0.030)[..., None]                            # fine grain
base += noise(28, 0.055)[..., None]                           # scraped patches
base += noise(150, 0.075)[..., None]                          # broad age bands
# a few darker stains
for _ in range(9):
    cx, cy = rng.integers(0, W), rng.integers(0, H); r = int(rng.integers(40, 150))
    stain = Image.new("L", (W, H), 0); ImageDraw.Draw(stain).ellipse([cx - r, cy - r, cx + r, cy + r], fill=26)
    st = np.asarray(stain.filter(ImageFilter.GaussianBlur(r * 0.45))).astype(np.float32) / 255
    base *= (1 - st[..., None] * 0.35)
# sea is a touch cooler and darker than the land
seacast = np.array([-0.010, 0.001, 0.007], np.float32)
landcast = np.array([0.016, 0.006, -0.016], np.float32)
soft = np.asarray(mask.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
base = base + seacast * (1 - soft[..., None]) + landcast * soft[..., None]

img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
dr = ImageDraw.Draw(img, "RGBA")

# --- rhumb-line network (drawn under the coast ink) ----------------------------
# classic 32-wind system radiating from two roses; cardinal/ordinal brown, half-winds red, quarter-winds green
ROSES = [P(-9.2, 36.2) + (150,), P(1.5, 37.8) + (185,)]  # open water: Gulf of Cadiz, Balearic basin
def rhumbs(cx, cy):
    for i in range(32):
        ang = math.radians(i * 11.25)
        dx, dy = math.sin(ang), -math.cos(ang)
        p1 = (cx + dx * 2000, cy + dy * 2000); p2 = (cx - dx * 2000, cy - dy * 2000)
        if i % 8 == 0: col, wd = (74, 48, 24, 105), 3        # cardinal
        elif i % 4 == 0: col, wd = (74, 48, 24, 85), 2       # ordinal
        elif i % 2 == 0: col, wd = (140, 44, 30, 62), 2      # half-winds
        else: col, wd = (52, 84, 48, 50), 1                  # quarter-winds
        dr.line([p1, p2], fill=col, width=wd)
for cx, cy, _r in ROSES: rhumbs(int(cx), int(cy))

# --- coasts: dark ink line, inner hatch stipple, sea-side shadow ---------------
edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.1))
e = np.asarray(edge).astype(np.float32) / 255
e = np.clip(e * 3.4, 0, 1)
a = np.asarray(img).astype(np.float32) / 255
ink = np.array([0.235, 0.160, 0.085], np.float32)
a = a * (1 - 0.9 * e[..., None]) + ink * 0.9 * e[..., None]
# soft sea-side shadow: blur the coast line, keep only the sea half
sh = np.asarray(edge.filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255
sh = np.clip(sh * 2.2 - e, 0, 1) * (1 - m)
a = a * (1 - 0.30 * sh[..., None])
img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)); dr = ImageDraw.Draw(img, "RGBA")
# stipple dots just inside the land along the coast (portolan texture)
stip = Image.new("L", (W, H), 0); ImageDraw.Draw(stip).bitmap((0, 0), edge.filter(ImageFilter.MaxFilter(13)), fill=255)
stip = stip.filter(ImageFilter.GaussianBlur(2.5))
st = (np.asarray(stip).astype(np.float32) / 255) * m
dots = (rng.random((H, W)) < st * 0.16)
a = np.asarray(img).astype(np.float32) / 255
a[dots] *= 0.78
img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)); dr = ImageDraw.Draw(img, "RGBA")

# --- compass roses --------------------------------------------------------------
def rose(cx, cy, R, small=False):
    dr.ellipse([cx - R, cy - R, cx + R, cy + R], outline=(74, 48, 24, 220), width=3)
    dr.ellipse([cx - R * 0.80, cy - R * 0.80, cx + R * 0.80, cy + R * 0.80], outline=(74, 48, 24, 160), width=2)
    dr.ellipse([cx - R * 0.16, cy - R * 0.16, cx + R * 0.16, cy + R * 0.16], fill=(74, 48, 24, 235))
    for i in range(32):
        ang = math.radians(i * 11.25)
        major, mid = i % 8 == 0, i % 4 == 0
        L = R * (0.96 if major else 0.72 if mid else 0.42)
        wdt = R * (0.085 if major else 0.05 if mid else 0.028)
        tip = (cx + L * math.sin(ang), cy - L * math.cos(ang))
        l = (cx + wdt * math.sin(ang - 1.5708), cy - wdt * math.cos(ang - 1.5708))
        r = (cx + wdt * math.sin(ang + 1.5708), cy + wdt * math.cos(ang + 1.5708))
        c1 = (141, 44, 30, 255) if major else (74, 48, 24, 235)  # red primary winds
        dr.polygon([tip, l, (cx, cy)], fill=c1)
        dr.polygon([tip, r, (cx, cy)], fill=(46, 30, 16, 235))
    if not small:
        # fleur-de-lis north
        fy = cy - R * 1.10
        dr.polygon([(cx, fy - R * 0.34), (cx - R * 0.10, fy), (cx + R * 0.10, fy)], fill=(74, 48, 24, 255))
        dr.ellipse([cx - R * 0.13, fy - R * 0.02, cx + R * 0.13, fy + R * 0.12], outline=(74, 48, 24, 255), width=3)
for cx, cy, R in ROSES: rose(int(cx), int(cy), R, small=R < 170)

# --- frame and vignette ---------------------------------------------------------
for off, wd, col in ((16, 7, (95, 66, 36, 255)), (34, 2, (95, 66, 36, 220)), (44, 1, (95, 66, 36, 140))):
    dr.rectangle([off, off, W - off, H - off], outline=col, width=wd)
a = np.asarray(img).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W]
v = 1 - 0.30 * np.clip(((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2) * 2.1, 0, 1)
a = np.clip(a * v[..., None], 0, 1)
Image.fromarray((a * 255).astype(np.uint8)).save("assets/map/background.webp", quality=90, method=6)
print("wrote assets/map/background.webp", W, "x", H)

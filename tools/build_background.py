#!/usr/bin/env python3
"""Builds assets/map/background.webp: an aged sea-chart look from public-domain Natural Earth data.
Usage: python3 tools/build_background.py /path/to/NE1_LR_LC_SR_W_DR.tif
Inputs: Natural Earth I raster (public domain) and data/ne_50m_land.geojson (public domain).
The map frame (extent, projection) matches web/main.mjs: x = (lon-x0)*sc, y = (y1-lat)*sc*1.25."""
import json, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
Image.MAX_IMAGE_PIXELS = None
W = 2400
world = json.load(open("data/world.json"))
pts = list(world["cities"]) + list(world["waypoints"].values())
lo = [p["lon"] for p in pts]; la = [p["lat"] for p in pts]
x0, x1, y0, y1 = min(lo) - 1, max(lo) + 1, min(la) - 1, max(la) + 1
sc = 800 / (x1 - x0); VH = round((y1 - y0) * sc * 1.25); H = round(VH * W / 800)
k = W / 800
P = lambda lon, lat: ((lon - x0) * sc * k, (y1 - lat) * sc * 1.25 * k)
# land mask from the 50m polygons, drawn at 2x and reduced
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
# relief crop from the raster (45 px per degree), upscaled smoothly
src = Image.open(sys.argv[1]); sw, sh = src.size
# the Natural Earth TIFF is uncompressed RGB: read only the rows we need (keeps memory low)
tile = src.tile[0]; assert tile.codec_name == "raw"
mm = np.memmap(sys.argv[1], dtype=np.uint8, mode="r", offset=tile.offset, shape=(sh, sw, 3))
px = lambda lon, lat: ((lon + 180) / 360 * sw, (90 - lat) / 180 * sh)
a, b = px(x0, y1), px(x1, y0)
rel = Image.fromarray(np.array(mm[int(a[1]):int(b[1]) + 1, int(a[0]):int(b[0]) + 1])).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
r = np.asarray(rel).astype(np.float32) / 255
lum = (0.3 * r[..., 0] + 0.59 * r[..., 1] + 0.11 * r[..., 2])
m = np.asarray(mask).astype(np.float32) / 255
rng = np.random.default_rng(7)
def noise(scale, amp):
    n = rng.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    return (n - 0.5) * amp
paper = np.array([0.89, 0.82, 0.66], np.float32)
sea = np.array([0.62, 0.74, 0.76], np.float32)
# sea: soft shallow band near coast, darker far away, light grain
dist = np.asarray(mask.filter(ImageFilter.GaussianBlur(28))).astype(np.float32) / 255
near = np.clip(dist * 1.6, 0, 1)[..., None]
seaimg = sea * (0.86 + 0.14 * near) + np.array([0.03, 0.02, 0.0]) * near + noise(6, 0.05)[..., None] + noise(60, 0.06)[..., None]
# land: warm parchment tinted by the relief colour and shading
tint = 0.55 * paper + 0.45 * r
shade = (0.78 + 0.5 * (lum - lum.mean()))[..., None]
landimg = np.clip(tint * shade, 0, 1) + noise(4, 0.04)[..., None] + noise(50, 0.05)[..., None]
out = seaimg * (1 - m[..., None]) + landimg * m[..., None]
# coast line and a soft shadow on the sea side
edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.4))
e = np.asarray(edge).astype(np.float32) / 255
e = np.clip(e * 3.0, 0, 1)[..., None]
out = out * (1 - 0.75 * e) + np.array([0.28, 0.19, 0.10]) * 0.75 * e
# vignette
yy, xx = np.mgrid[0:H, 0:W]
v = 1 - 0.28 * np.clip(((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2) * 2.2, 0, 1)
out = np.clip(out * v[..., None], 0, 1)
img = Image.fromarray((out * 255).astype(np.uint8))
# border frame and a compass rose
dr = ImageDraw.Draw(img)
for off, wd in ((14, 6), (30, 2)):
    dr.rectangle([off, off, W - off, H - off], outline=(95, 66, 36), width=wd)
cx, cy, R = W - 330, H - 330, 200
for ang in range(0, 360, 45):
    rad = math.radians(ang); L = R if ang % 90 == 0 else R * 0.6
    tip = (cx + L * math.sin(rad), cy - L * math.cos(rad))
    l = (cx + 30 * math.sin(rad - 1.57), cy - 30 * math.cos(rad - 1.57)); rr = (cx + 30 * math.sin(rad + 1.57), cy - 30 * math.cos(rad + 1.57))
    dr.polygon([tip, l, (cx, cy)], fill=(120, 40, 30) if ang % 90 == 0 else (95, 66, 36))
    dr.polygon([tip, rr, (cx, cy)], fill=(70, 45, 25))
dr.ellipse([cx - R * 0.45, cy - R * 0.45, cx + R * 0.45, cy + R * 0.45], outline=(95, 66, 36), width=4)
img.save("assets/map/background.webp", quality=90, method=6)
print(W, H, "->", "assets/map/background.webp")

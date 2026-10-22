#!/usr/bin/env python3
"""Builds the README banner (animated SVG) and the social preview (static SVG + PNG).

Reads data/world.json (ports, waypoints, lanes) and assets/map/background.webp, so the
images grow with the game: add a port or a lane and re-run.

  python3 tools/build_banner.py            # writes docs/images/banner.svg and social.svg
  python3 tools/build_banner.py --png      # also renders docs/images/social.png (needs Chrome/Chromium)
  python3 tools/build_banner.py --check    # exit 1 if the committed files differ from a fresh build

Needs Pillow only. The animation is plain SVG (SMIL), no JavaScript, so GitHub shows it in the README.
Frame maths match tools/build_background.py: x = (lon-x0)*sc*k, y = (y1-lat)*sc*1.25*k.
Own work, CC BY 4.0 (see LICENSE-ART.md). Map: Natural Earth, public domain."""
import base64, heapq, io, json, math, os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "images")
world = json.load(open(os.path.join(ROOT, "data", "world.json")))
bg = Image.open(os.path.join(ROOT, "assets", "map", "background.webp")).convert("RGB")
BW, BH = bg.size

# Palette: parchment and ink from the game UI, accents from the MACD palette.
INK, PAPER, SEA, RED, ACCENT = "#2F2838", "#F5F0E6", "#5E8298", "#8c3b2a", "#786883"
FONT = "Georgia, 'Times New Roman', serif"

# Frame of the game map (same as build_background.py)
pts = list(world["cities"]) + list(world["waypoints"].values())
lo = [p["lon"] for p in pts]; la = [p["lat"] for p in pts]
x0, x1, y0, y1 = min(lo) - 1, max(lo) + 1, min(la) - 1, max(la) + 1
sc = 800 / (x1 - x0); k = BW / 800
def P(p):  # lon/lat -> pixel in background.webp
    return ((p["lon"] - x0) * sc * k, (y1 - p["lat"]) * sc * 1.25 * k)
nodes = {c["id"]: c for c in world["cities"]}; nodes.update(world["waypoints"])
cities = {c["id"]: c for c in world["cities"]}

# Lane graph and shortest sea route between two ports
adj = {}
for a, b in world["lanes"]:
    d = math.dist(P(nodes[a]), P(nodes[b])); adj.setdefault(a, []).append((b, d)); adj.setdefault(b, []).append((a, d))
def route(a, b):
    dist = {a: 0}; prev = {}; q = [(0, a)]
    while q:
        d, u = heapq.heappop(q)
        if u == b: break
        if d > dist.get(u, 1e18): continue
        for v, w in adj.get(u, []):
            if d + w < dist.get(v, 1e18): dist[v] = d + w; prev[v] = u; heapq.heappush(q, (d + w, v))
    path = [b]
    while path[-1] != a: path.append(prev[path[-1]])
    return path[::-1]

# Ships on the banner: (from, to). Edit this list to change the traffic.
ROUTES = [("cadiz", "tanger"), ("malaga", "oran"), ("tanger", "cadiz"), ("almeria", "melilla"),
          ("cartagena", "argel"), ("ceuta", "malaga"), ("huelva", "cadiz"), ("alicante", "oran")]
# Ships caught at sea on the social image (whole map). Edit to taste.
SOCIAL_ROUTES = [("lisboa", "cadiz"), ("barcelona", "palma"), ("valencia", "ibiza"), ("cartagena", "argel"), ("malaga", "oran"), ("bilbao", "la_coruna"), ("casablanca", "tanger")]
ROUTES = [r for r in ROUTES if r[0] in cities and r[1] in cities]
SOCIAL_ROUTES = [r for r in SOCIAL_ROUTES if r[0] in cities and r[1] in cities]

SHIP = ('<g><path d="M-14 0 L14 0 L10 7 L-10 7 Z" fill="#4a2f1d"/><path d="M-14 0 L-18 -3 L-14 -3 Z" fill="#4a2f1d"/>'
        '<rect x="-1" y="-22" width="2" height="22" fill="#4a2f1d"/><path d="M-9 -20 L9 -20 L8 -5 L-8 -5 Z" fill="#f3ead8" stroke="#4a2f1d" stroke-width="1"/>'
        '<path d="M-1 -20 L1 -20 L1 -5 L-1 -5 Z M-9 -13 L9 -13 L9 -11 L-9 -11 Z" fill="#8c3b2a"/>'
        '<path d="M1 -22 L8 -20 L1 -18 Z" fill="#8c3b2a"/></g>')
esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;")
def jpeg(img, q=85):
    b = io.BytesIO(); img.save(b, "JPEG", quality=q, optimize=True); return base64.b64encode(b.getvalue()).decode()
def f(n): return ("%.1f" % n).rstrip("0").rstrip(".")

def polyline(ids, tf):
    xy = [tf(P(nodes[i])) for i in ids]
    return xy, "M" + " L".join(f"{f(x)} {f(y)}" for x, y in xy)
def length(xy): return sum(math.dist(xy[i], xy[i + 1]) for i in range(len(xy) - 1))
def at(xy, t):
    target = length(xy) * t; acc = 0
    for i in range(len(xy) - 1):
        d = math.dist(xy[i], xy[i + 1])
        if acc + d >= target:
            r = (target - acc) / d if d else 0
            return (xy[i][0] + (xy[i + 1][0] - xy[i][0]) * r, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * r)
        acc += d
    return xy[-1]

def banner():
    W, H = 1280, 320; MW = 900; s = MW / BW; MX = W - MW
    cy = P(cities["cadiz"])[1] * s + 40                 # keep the Cadiz row inside the band
    top = max(0, min(BH * s - H, cy - H / 2))
    crop = bg.resize((MW, round(BH * s)), Image.LANCZOS).crop((0, round(top), MW, round(top) + H))
    tf = lambda p: (MX + p[0] * s, p[1] * s - round(top))
    parts = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
             f'<image x="{MX}" y="0" width="{MW}" height="{H}" href="data:image/jpeg;base64,{jpeg(crop)}"/>',
             f'<defs><linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="{PAPER}"/><stop offset="0.55" stop-color="{PAPER}" stop-opacity="0.85"/><stop offset="1" stop-color="{PAPER}" stop-opacity="0"/></linearGradient></defs>',
             f'<rect x="{MX - 40}" width="{MW // 2}" height="{H}" fill="url(#fade)"/>',
             f'<rect y="{H - 10}" width="{W}" height="10" fill="{SEA}"/>']
    inband = lambda p: -10 < p[1] < H and MX - 10 < p[0] < W + 10
    for c in world["cities"]:
        x, y = tf(P(c))
        if inband((x, y)): parts.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="3.4" fill="{RED}" stroke="{PAPER}" stroke-width="1.2"/>')
    for i, (a, b) in enumerate(ROUTES):
        xy, d = polyline(route(a, b), tf)
        if not any(inband(p) for p in xy): continue
        dur = max(8, length(xy) / 28); sign = -1 if xy[-1][0] < xy[0][0] else 1
        parts.append(f'<g><animateMotion dur="{f(dur)}s" begin="-{f(i * dur / len(ROUTES))}s" repeatCount="indefinite" path="{d}" rotate="0"/><g transform="scale({sign} 1)">{SHIP}</g></g>')
    parts.append(f'<text x="70" y="150" font-family="{FONT}" font-size="76" font-weight="bold" fill="{INK}">The Almojarife</text>')
    parts.append(f'<rect x="74" y="172" width="110" height="4" fill="{ACCENT}"/>')
    parts.append(f'<text x="74" y="212" font-family="{FONT}" font-size="22" letter-spacing="2.5" fill="{SEA}">SEA TRADE, 15TH-16TH CENTURY</text>')
    parts.append(f'<text x="74" y="250" font-family="{FONT}" font-size="20" fill="#5F5668">An open, free game. Play it in your browser.</text>')
    return svg(W, H, "".join(parts), "The Almojarife: ships sailing between ports on a 15th-century sea chart")

# Label placement on the social image: name -> (dx, dy, anchor). Unlisted ports go right of the dot.
LABELS = {'Lisboa': (-7, -5, 'end'), 'Oporto': (-7, 4, 'end'), 'Vigo': (-7, 4, 'end'), 'La Coruña': (-7, 4, 'end'), 'Setúbal': (-7, 12, 'end'),
          'Faro': (-7, 7, 'end'), 'Huelva': (-7, 7, 'end'), 'Cádiz': (-7, 9, 'end'), 'Sevilla': (-7, -5, 'end'), 'Tánger': (-7, 7, 'end'),
          'Arcila': (-7, 5, 'end'), 'Larache': (-7, 5, 'end'), 'Rabat': (-7, 5, 'end'), 'Casablanca': (-7, 5, 'end'), 'Mazagán': (-7, 5, 'end'),
          'Santander': (-7, -3, 'end'), 'Tetuán': (7, 14, 'start'), 'Bilbao': (7, 10, 'start'), 'San Sebastián': (7, -4, 'start')}

def social():
    W, H = 1280, 640; MH = H; MW = MH * BW / BH; MX = W - MW; s = MW / BW
    tf = lambda p: (MX + p[0] * s, p[1] * s)
    img = bg.resize((round(MW * 2), MH * 2), Image.LANCZOS)
    parts = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>', f'<image x="{f(MX)}" y="0" width="{f(MW)}" height="{MH}" href="data:image/jpeg;base64,{jpeg(img, 88)}"/>']
    for i, (a, b) in enumerate(SOCIAL_ROUTES):             # ships caught at sea
        xy, d = polyline(route(a, b), tf)
        if length(xy) < 140: continue                       # too short to show a ship between ports
        x, y = at(xy, 0.5); sign = -1 if xy[-1][0] < xy[0][0] else 1
        parts.append(f'<g transform="translate({f(x)} {f(y)}) scale({1.3 * sign} 1.3)">{SHIP}</g>')
    for c in world["cities"]:
        x, y = tf(P(c)); dx, dy, anchor = LABELS.get(c["name"], (7, 5, "start"))
        parts.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="3.4" fill="{RED}" stroke="{PAPER}" stroke-width="1.2"/>')
        parts.append(f'<text x="{f(x + dx)}" y="{f(y + dy)}" text-anchor="{anchor}" font-family="{FONT}" font-size="12" font-weight="bold" fill="{INK}" stroke="{PAPER}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">{esc(c["name"])}</text>')
    parts.append(f'<rect width="{f(MX)}" height="{H}" fill="{PAPER}"/><rect y="{H - 14}" width="{f(MX)}" height="14" fill="{SEA}"/>')
    ports = len(world["cities"]); goods = len(world["goods"])
    for y, size, txt, fill, extra in [(232, 72, "The Almojarife", INK, ' font-weight="bold"'), (314, 22, "SEA TRADE, 15TH-16TH CENTURY", SEA, ' letter-spacing="2.5"'),
                                      (376, 26, "An open, free game.", "#5F5668", ""), (414, 26, "Play it in your browser.", "#5F5668", ""),
                                      (500, 20, f"{ports} ports · {goods} goods · English and Spanish", SEA, ""), (610, 13, "Map: Natural Earth (public domain). Art: CC BY 4.0", "#5F5668", "")]:
        parts.append(f'<text x="72" y="{y}" font-family="{FONT}" font-size="{size}" fill="{fill}"{extra}>{esc(txt)}</text>')
    parts.insert(-1, f'<rect x="74" y="262" width="110" height="4" fill="{ACCENT}"/>')
    return svg(W, H, "".join(parts), "The Almojarife: sea trading game, 15th-16th century")

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{esc(title)}"><title>{esc(title)}</title>{body}</svg>\n'

def render_png(svg_path, png_path):
    chrome = next((shutil.which(c) for c in ("google-chrome", "chromium", "chromium-browser") if shutil.which(c)), None)
    if not chrome: sys.exit("No Chrome/Chromium found for --png")
    subprocess.run([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,640",
                    f"--screenshot={png_path}", "file://" + svg_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    files = {"banner.svg": banner(), "social.svg": social()}
    if "--check" in sys.argv:
        import re  # compare everything except the embedded JPEG bytes, which can differ between Pillow versions
        strip = lambda t: re.sub(r"base64,[A-Za-z0-9+/=]+", "base64,...", t)
        bad = [n for n, t in files.items() if not os.path.exists(os.path.join(OUT, n)) or strip(open(os.path.join(OUT, n)).read()) != strip(t)]
        print("stale: " + ", ".join(bad) if bad else "banner and social are up to date"); sys.exit(1 if bad else 0)
    for n, t in files.items(): open(os.path.join(OUT, n), "w").write(t); print("wrote", os.path.join("docs/images", n), len(t) // 1024, "KB")
    if "--png" in sys.argv: render_png(os.path.join(OUT, "social.svg"), os.path.join(OUT, "social.png")); print("wrote docs/images/social.png")

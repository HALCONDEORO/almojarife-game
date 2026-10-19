#!/usr/bin/env python3
"""Procedural low-poly cog (medieval trading ship). Own work, CC BY 4.0.
Writes assets/models/cog.gltf (embedded buffer, vertex colours) and a preview PNG.
No third-party model, texture or reference mesh is used."""
import json, base64, struct, math, sys
import numpy as np

tris = []  # (a,b,c, rgb)
def quad(a, b, c, d, col): tris.append((a, b, c, col)); tris.append((a, c, d, col))
def box(x0, x1, y0, y1, z0, z1, col):
    p = lambda x, y, z: (x, y, z)
    quad(p(x0,y0,z1), p(x1,y0,z1), p(x1,y1,z1), p(x0,y1,z1), col)
    quad(p(x1,y0,z0), p(x0,y0,z0), p(x0,y1,z0), p(x1,y1,z0), col)
    quad(p(x0,y0,z0), p(x0,y0,z1), p(x0,y1,z1), p(x0,y1,z0), col)
    quad(p(x1,y0,z1), p(x1,y0,z0), p(x1,y1,z0), p(x1,y1,z1), col)
    quad(p(x0,y1,z1), p(x1,y1,z1), p(x1,y1,z0), p(x0,y1,z0), col)
    quad(p(x0,y0,z0), p(x1,y0,z0), p(x1,y0,z1), p(x0,y0,z1), col)

WOOD, DARK, SAIL, RED, ROPE = (0.55, 0.36, 0.2), (0.33, 0.2, 0.1), (0.93, 0.88, 0.76), (0.7, 0.12, 0.1), (0.2, 0.15, 0.1)
# Hull: stations along x (bow +x). Each station: (x, half-width, keel y, deck y)
st = [(-3.0, 0.9, 0.5, 2.0), (-2.2, 1.35, 0.1, 1.6), (-0.8, 1.6, 0.0, 1.3), (0.8, 1.6, 0.0, 1.3), (2.2, 1.25, 0.15, 1.5), (3.4, 0.6, 0.6, 1.9)]
for (x0, w0, k0, d0), (x1, w1, k1, d1) in zip(st, st[1:]):
    for s in (1, -1):
        quad((x0, d0, s*w0), (x1, d1, s*w1), (x1, k1, s*w1*0.45), (x0, k0, s*w0*0.45), WOOD if s > 0 else DARK) if s > 0 else \
        quad((x1, d1, s*w1), (x0, d0, s*w0), (x0, k0, s*w0*0.45), (x1, k1, s*w1*0.45), DARK)
    quad((x0, k0, -w0*0.45), (x1, k1, -w1*0.45), (x1, k1, w1*0.45), (x0, k0, w0*0.45), DARK)
    quad((x0, d0, -w0), (x0, d0, w0), (x1, d1, w1), (x1, d1, -w1), (0.62, 0.45, 0.28))  # deck
# stern post and stem
box(-3.1, -2.9, 0.4, 3.0, -0.12, 0.12, DARK)
box(3.3, 3.5, 0.5, 2.6, -0.1, 0.1, DARK)
# castles
box(-3.0, -1.6, 1.6, 2.7, -1.0, 1.0, WOOD)   # aftcastle
box(2.3, 3.2, 1.5, 2.3, -0.7, 0.7, WOOD)       # forecastle
# mast, yard, square sail, pennant
box(-0.15, 0.15, 1.3, 7.4, -0.15, 0.15, DARK)
box(-0.1, 0.1, 5.9, 6.0, -2.3, 2.3, DARK)
quad((0.05, 6.0, -2.2), (0.05, 6.0, 2.2), (0.35, 2.6, 2.4), (0.35, 2.6, -2.4), SAIL)
quad((0.05, 4.7, -0.4), (0.05, 4.7, 0.4), (0.4, 3.7, 0.4), (0.4, 3.7, -0.4), RED)  # cross
box(0.0, 0.05, 7.4, 7.9, -0.02, 0.02, RED)
quad((0.0, 7.9, 0.0), (-1.2, 7.7, 0.0), (-1.2, 7.4, 0.0), (0.0, 7.4, 0.0), RED)
# shields along the rail
for i in range(-3, 4):
    box(i*0.35-0.1, i*0.35+0.1, 1.3, 1.65, 1.62, 1.68, RED if i % 2 else SAIL)
    box(i*0.35-0.1, i*0.35+0.1, 1.3, 1.65, -1.68, -1.62, RED if i % 2 else SAIL)

V = np.array([t[i] for t in tris for i in range(3)], dtype=np.float32)
C = np.array([t[3] for t in tris for _ in range(3)], dtype=np.float32)
# flat normals
N = np.zeros_like(V)
for i in range(0, len(V), 3):
    n = np.cross(V[i+1]-V[i], V[i+2]-V[i]); l = np.linalg.norm(n); N[i:i+3] = n / l if l else (0, 1, 0)
buf = V.tobytes() + N.tobytes() + C.tobytes()
gltf = {
 "asset": {"version": "2.0", "generator": "tools/make_cog.py (own work, CC BY 4.0)"},
 "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "cog"}],
 "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2}, "material": 0}]}],
 "materials": [{"pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": 1}}],
 "buffers": [{"byteLength": len(buf), "uri": "data:application/octet-stream;base64," + base64.b64encode(buf).decode()}],
 "bufferViews": [{"buffer": 0, "byteOffset": i*len(V)*12, "byteLength": len(V)*12} for i in range(3)],
 "accessors": [
   {"bufferView": 0, "componentType": 5126, "count": len(V), "type": "VEC3", "min": V.min(0).tolist(), "max": V.max(0).tolist()},
   {"bufferView": 1, "componentType": 5126, "count": len(V), "type": "VEC3"},
   {"bufferView": 2, "componentType": 5126, "count": len(V), "type": "VEC3"}]}
json.dump(gltf, open("assets/models/cog.gltf", "w"))
print("triangles", len(tris), "bytes", len(buf))

if len(sys.argv) > 1:
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    light = np.array([0.4, 0.8, 0.5]); light /= np.linalg.norm(light)
    fig = plt.figure(figsize=(12, 6.5))
    for k, (el, az) in enumerate([(14, -75), (22, 35)]):
        ax = fig.add_subplot(1, 2, k+1, projection="3d")
        polys, cols = [], []
        for i in range(0, len(V), 3):
            sh = 0.45 + 0.55 * max(0, float(np.dot(N[i], light)))
            polys.append([(v[0], v[2], v[1]) for v in V[i:i+3]]); cols.append(tuple(np.clip(C[i]*sh, 0, 1)))
        ax.add_collection3d(Poly3DCollection(polys, facecolors=cols, edgecolors=(0, 0, 0, 0.15), linewidths=0.3))
        ax.set_xlim(-3.6, 3.6); ax.set_ylim(-2.4, 2.4); ax.set_zlim(0, 8); ax.set_box_aspect((7.2, 4.8, 8)); ax.dist = 6.5; ax.view_init(el, az); ax.set_axis_off()
    fig.suptitle("Almojarife: procedural low-poly cog (own work, %d triangles)" % len(tris))
    plt.savefig(sys.argv[1], dpi=110, bbox_inches="tight")

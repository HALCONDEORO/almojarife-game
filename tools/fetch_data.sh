#!/bin/sh
# Downloads Natural Earth 50m land (public domain) into data/. Source: github.com/nvkelso/natural-earth-vector
set -e
cd "$(dirname "$0")/.."
[ -f data/ne_50m_land.geojson ] && exit 0  # cached (CI) or already downloaded
curl -fsSL -o data/ne_50m_land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_50m_land.geojson

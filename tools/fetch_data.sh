#!/bin/sh
# Downloads Natural Earth 50m land (public domain) into data/. Source: github.com/nvkelso/natural-earth-vector
set -e
cd "$(dirname "$0")/.."
curl -fsSL -o data/ne_50m_land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson

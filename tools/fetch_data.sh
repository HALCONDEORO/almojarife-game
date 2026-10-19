#!/bin/sh
# Downloads Natural Earth 50m land (public domain) into data/. Source: github.com/nvkelso/natural-earth-vector
curl -sL -o data/ne_50m_land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson

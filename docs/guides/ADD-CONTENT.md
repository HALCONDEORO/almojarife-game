# Add content without writing game code

Everything here is a small, focused pull request. Run `npm test` before you open it. Only add data you can source and describe in your own words, and add a CREDITS.md row for any third-party material.

## Add a port
Edit `data/world.json`, in `cities`. A port looks like this:

    {
      "id": "cadiz", "name": "Cádiz", "lat": 36.53, "lon": -6.29, "pop": 12000,
      "makes": ["salt", "fish"],
      "needs": ["wool", "cloth"]
    }

- `id`: lower case, no spaces, unique. `lat` and `lon`: decimal degrees. `pop`: rough population around 1500.
- `makes`: goods the port produces (cheap there). `needs`: goods it lacks (dear there). Use ids from `goods`.
- Add `"river": true` if big ships cannot reach it.
- Connect it to the sea network in `lanes`: pairs of `[from, to]` using port ids and waypoint ids from `waypoints`. Add a waypoint (`{"lat": .., "lon": ..}`) if the route needs to round a headland. Routes must stay at sea.
- In your pull request, give one historical source for the port (a short note, no copied text).

## Add a good
1. In `data/world.json`, add it to `goods` with a base price: `"saffron": { "base": 60 }`.
2. Add its id to `makes` or `needs` of at least two ports.
3. Add a name in every language block of `T` in `web/main.mjs` (`goods`).
4. Add a flat SVG icon in `web/icons.mjs` (24x24, own drawing, CC BY 4.0, row in CREDITS.md).

## Add or fix a language
See [TRANSLATING.md](../../TRANSLATING.md).

## Report a historical mistake
Open an issue with the port or good, what is wrong, and a source.

## Later
Missions, events and ranks will be data files too, with a validator in CI. Until then, open an issue with your idea.

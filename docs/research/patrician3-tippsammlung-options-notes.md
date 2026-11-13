# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), options chapter (first pass: start options and difficulty)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 1.1-1.2 (start options and difficulty settings, printed pages ~12-15) of the full German community compilation. Also assessed: Kapitel 9.2-9.4.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. The start year is a difficulty axis in disguise
The source: the start year (a century range in fixed intervals) shapes the whole opening - later starts mean bigger cities (more demand, but needier citizens), more capable shipyards (the top hull available immediately, faster repairs), and more active AI competitors; a quirk shifts the start DATE forward with the start year, pushing the first winter closer. All start choices are locked once the game begins, except game speed.
Our state (verified: our newGame has a fixed start year (game state startYear; no start-year picker found); difficulty.mjs offers three presets touching starting cash and upkeep only).
Open question: a start-conditions axis (era, world maturity) is content-zone design input; flagged only.

### 2. Difficulty as several independently adjustable factors with a named rating
The source exposes several factors (trade margins, reputation gain rate, citizen neediness, battle AI, pirate activity, prince activity, starting capital, starting fleet size), individually configurable; named presets bundle them, and the overall rating changes with the mix - preserving the same rating with an easier setting may require harder choices elsewhere.
Our state (verified: src/game/difficulty.mjs - three presets (easy/normal/hard) varying starting cash and an upkeep multiplier; the difficulty presets/UI have no independently configurable difficulty factors - other modules do carry their own option flags and tuning).
Open question: per-system difficulty knobs (esp. trade margins and reputation gain) are design input for the balance zone; flagged only. The compensating-rating idea is recorded as an interesting guard against self-degrading difficulty, with no formula claimed.

### 3. Assessed: Kapitel 9.2-9.4
9.2 (printed pages ~175-182) is the source's building-grid road auto-generation rules (block optimization for maximum population) - layout mechanics of the source's specific city grid with no counterpart in our procedural 3D town scenes; discarding it on scope grounds is reasonable.
9.3-9.4 are non-exhaustive playthrough guides (peaceful trader, pirate) whose mechanics point back to the market/production/politics/piracy notes, but they contribute sequencing: build trading capital by hand before automating routes, then invest in construction; and the pirate path as a temporary windfall phase. No separate note filed; sequencing observations recorded here only.

## Open work
- Kapitel 8.4.4-8.5 (settlement costs/influence) and the rest of Kapitel 2 (shipyard, market hall, own buildings) remain; both mostly catalog detail.
- Chapters beyond 9 per the table of contents: 10 (FAQ, printed p189) and 11 (multiplayer, printed p195); not covered, assessment pending if wanted.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.

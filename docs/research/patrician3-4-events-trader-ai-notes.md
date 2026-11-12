# P3/P4 events and trader AI: clean-room notes (pass 5, v3)

Focused pass on the two least-covered areas of the assignment: EVENTS and TRADER AI. Same rules: ideas only, own words, no copied text/data, numbers as orders of magnitude. One reverse-engineering/modding documentation site appeared in searches and was excluded: it is decompiled binary internals, outside the permitted method (behavior observation, wikis/guides/forums, documentation).

Sources, per claim group:
- P3 official manual, ch. 12 (career/politics) and 13 (fights/battles): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf
- P4 official manual: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf ; Rise of a Dynasty addon manual: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- P3 wiki, siege defense details: https://patrician3.fandom.com/wiki/Siege ; reputation/infrastructure guidance: https://patrician3.fandom.com/wiki/Simple_guidelines_on_increasing_reputation
- Steam thread "Why is the AI not growing?", Patrician IV: Rise of a Dynasty discussions (Aug 2014, incl. answers from a Gaming Minds developer): https://steamcommunity.com/app/57730/discussions/0/34093781838849554/
- FX Spanish tips PDF (via Wayback Machine): http://web.archive.org/web/20091229000619/http://www.fxinteractive.com/p228/images/Secretos%20del%20Imperio%20de%20los%20Mares.pdf

## 1. Event taxonomy (what exists)

- ECONOMIC: local shortages/surpluses driving prices (P4 manual, "Supply and Demand"); seasonal winter famine - stockpile grain in summer, sell into winter shortage (FX tips PDF, section 10); scheduled external imports (P3 manual 8.5.3); trader bulk offers and storage-rental requests in taverns (P3 manual 10.6).
- HAZARD: fire in towns, wells/water coverage prevent spread (P3 wiki reputation guide; FX tips); plague/epidemic, road development lowers the chance (P3 wiki reputation guide); in the P4 addon epidemics can kill your spouse, fountains/hospitals protect (addon manual, "Counting house"); storms/icebergs at sea mitigated by captains (P3 manual 9); hull damage on dangerous crossings (FX tips, section 8).
- POLITICAL: prince tribute escalating with city prosperity up to siege (P4 manual "Princes"; P3 manual 13.4); town-misbehavior events judged at extraordinary League Days with voted sanctions - fine, boycott, blockade, pirate-hunt convoy (P3 manual 12); P4 guild measures: world event -> council picks a response -> assignment for reputable traders (P4 manual "Guild").
- SEA: pirate clans with hideouts (P4 manual "Pirates"; P3 manual 13.3); positive sea finds (P4 wiki pass, note 1); treasure-map pieces (addon manual "Treasure maps").
- PERSONAL: marriage/family (P4 manual "Your Counting House"); tavern rotating characters incl. illegal dealers, guards can catch you talking to outlaws (P3 manual 10.6); scarce tavern captains (P3 manual 9.3).
- CIVIC: celebrations/feasts with a real logistics bill per guest (FX tips section 10); elections; assignment boards (P3/P4 manuals, town hall/tavern/guild sections).

## 2. Documented couplings (observed in the sources) and MY proposal

Documented couplings: beer stock affects guard morale in sieges, and gate cannons mainly distract trebuchet fire (P3 wiki, Siege); road level affects plague chance, wells affect fire spread (P3 wiki, reputation guide); grain stockpiles turn winter famine into profit (FX tips). Documented tells: a prince requesting a loan often precedes an attack (P3 wiki, Siege); tavern rumors carry pirate last-seen locations (P4 manual "Tavern"); prince troop strengths visible at the city gate (P4 manual "Princes"). Documented timing plays: a celebration right before an election nudges it (P3 wiki, reputation guide); waiting a few days before striking a pirate hideout lets more ships gather (P4 manual "Pirates").

MY PROPOSAL (not a P3/P4 property): raise these patterns to a design law for Almojarife - every hazard event mitigable by one infrastructure decision and one logistics decision, and telegraphed by at least one tell. The sources support the pattern in cases; the universal rule is my own extension.

## 3. Trader AI

DEVELOPER-CONFIRMED, P4/RoaD ONLY (daan_hugo, Gaming Minds, Steam, 8 Aug 2014): independent town growth was deliberately limited - making towns grow is the player's task - to protect relaxed players (especially those avoiding piracy) from being overtaken. This statement covers P4-family titles (the dev repeats it for Rise of Venice in the same thread); it says nothing about P3, and it is about town growth, not about every form of AI progress.

PLAYER TESTIMONY (same thread): competitors operate anchored to their home region (Dray Prescot, 2017); the P4 manual adds that rivals expand their own production when you expand yours and when demand rises (P4 manual "Competitors"). Several players in that thread report that pirates threaten more than merchant AI and that a non-growing world hurts their motivation (player opinions, 2014-2017).

## 4. What Almojarife already has (repo state at main c4b7e8e)

Before proposing anything, the current state:
- src/game/rivalhouses.mjs: opt-in (`g.regionalRivals`) fictional REGIONAL houses with profiles (regional/staples/diverse), private paid intel reports (botintel), and per-step trading via aiStep. The header is explicit: no construction, finance or workforce capabilities - rivals trade, they do not build or hire.
- src/game/events.mjs: data-driven sea events (world.events in data/world.json), opt-in via g.eventsOn, seeded and reproducible outcomes; autoChoice auto-resolves events whose every outcome is risk-free, so favorable events do not pause the game.
- src/game/encounterdaily.mjs: seeded encounter cadence; storms; pirate encounters fought as real seeded ships only with the pirateFight opt-in, else the legacy seeded outcome.
- src/game/shocks.mjs: seeded regional economic/sanitary shocks only (poor harvest, new demand, short port closure). No politics layer here.
- src/game/portmeasures.mjs: the political measures live here, as two DISTINCT sanctions, never one hostility flag: BOYCOTT prevents new courses to the harbour (ships inside may still leave and trade); BLOCKADE seals it both ways (nothing sails for it, docked ships are held until it lifts). Ships already en route still arrive under either measure. Neither touches the market - the grain embargo (embargo.mjs) is a separate trade refusal. Nothing declares measures yet, so the default game is unchanged.

## 5. Proposals (delta over c4b7e8e only)

- RIVAL GROWTH is the actually-new piece: houses that found businesses, hire and finance, at least in their home region. Everything else in rivalhouses (profiles, reports, trading) already exists. Suggested shape: a "living world" option alongside the existing opt-ins (eventsOn, pirateFight, regionalRivals), so the relaxed sandbox stays available - the exact concern the P4 dev cited.
- LEGIBLE AI INTENTIONS as tells: a rival buying up one good is a signal the player can read, like the prince's-loan tell. Our private intel reports (botintel) are the natural surface for this.
- EVENT COUPLING: apply the section-2 design law to new event families. Note the repo already separates concerns the way the sources suggest: economic shocks (shocks.mjs), sea events (events.mjs), combat encounters (encounterdaily.mjs) - new families should land in the matching lane instead of a global event pool.
- AUTO-RESOLVE FOR SAFE EVENTS already exists (autoChoice); keep that pattern: events pause only when a real risk decision exists.

## 6. Status of the research assignment

- P4 wiki + community guide: note 1. P3 manual ch. 8-12: note 2. P4 manuals incl. addon: note 3. P3 ch. 13-14 + FX Spanish tips: note 4. Events + trader AI: this note (v3 after two Auditoria review passes).
- Remaining optional: behavior observation via videos/streams for feel/pacing.

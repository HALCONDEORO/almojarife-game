# P4 Alderman and League measures: the office that answers world events

13 November 2026. Main checked: `30ec686` (through PR904).
Scope: public P4 documentation and accounts of the Alderman office and the
Hanseatic League's event-response measures: eligibility, official duties,
measure selection and League reputation. The base game and the Rise of a
Dynasty expansion are identified separately where a source distinguishes
them; no expansion-specific Alderman change was found in the sections read.

## Finding

Almojarife's politics stop at the port. Port-level sanctions exist as
declared-but-never-declaring types (`src/game/portmeasures.mjs:1-8`), town
shortage jobs are local contracts (`src/game/contracts.mjs:1-4`). Urban
world events do exist - city calamities, plague and festivals
(`src/game/calamities.mjs:1-7`, `src/game/plague.mjs:1-6`,
`src/game/festivals.mjs:1-7`) - but each stays inside its own city, and
the only sea events are per-ship encounters (`src/game/events.mjs:1-6`).
What is missing is the link from a problem to a League response. P4
documents that League-wide layer:
world events (a pirate plague, a city recession) call for a League response,
the Alderman is the officer who picks the response, and the response becomes
a Guild assignment open to reputable traders. Our engine has neither the
League event loop nor the office. Our rank table also reuses the word
`alderman` for a mid-ladder wealth rank (`src/game/rank.mjs:5-7`), while
P4's Alderman is the single top office above the Patrician rank - a naming
divergence to keep in mind, not a parity claim. This note does not approve
any office, election, event or measure system.

## Sources and method

Relevant sections of these public pages were fetched and read on the date
above; the publisher manual was downloaded in full and searched as text. No
binary, extracted data, utility chart, modding-internals reference,
competitor code, art, dialogue, numerical table or copied source wording was
used. No game experiment was performed. Described mechanics are not measured
formulas, and source figures are deliberately not imported.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Alderman chapter, Guild (Measures, Official duties), Reputation (Hanseatic League) and introduction: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Becoming Alderman requires the best League reputation among traders, built from city reputation and Guild reputation, with Guild assignments helping; when certain events occur the Alderman and the Hanseatic Council decide appropriate measures, and carrying out a measure raises League reputation considerably; as Alderman the player checks whether a suitable measure exists for an event and decides it immediately, after which the Council draws up an assignment open to all reputable traders including the player; League reputation sinks when an accepted assignment fails or when the Alderman fails to react to global events. The manual gives one example trigger (too many pirates) and no measure catalogue. |
| S2 | GRYOnline, Polityka, page updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/polityka/zfb328 | Politics begins at a council rank and can end at mayor of a city or Alderman of the whole Hanse; the measures screen lists current problems above and possible solutions below; some problems admit only one solution (a discovered pirate hideout calls only for its destruction), while others let the Alderman choose the shape of the response - the guide's recession example contrasts commissioning one merchant, for a fee, with an appeal to all merchants to supply the city. Player guide, no figures adopted. |
| S3 | Heraclitus, Steam guide, Guild screens: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | An official-duties screen lets the Alderman hand out selected quests to the whole Guild, which the Alderman can then personally accept through the measures screen; the author notes some situations offer more than one handling. Player experience, consistent with S1. |
| S4 | Sothis Spielwiese rank overview, September 2010: https://blog.sothi.de/2010/09/patrizier-4-welcher-rang-was.html | Describes the Alderman as the highest attainable position, with the right and the duty to issue appropriate measures in response to Hanse events. Explicitly derived from a PC Games article; same lineage, not independent corroboration. |

## What the sources support

- The Alderman is a single League-wide office at the top of the political
  ladder, gated on League reputation rather than on one city (S1, S2, S4).
- League reputation is a distinct stock, composed of city reputation and
  Guild reputation, raised by Guild assignments and lost by failing them
  (S1).
- The office's content is reactive governance: world events produce
  problems, the Alderman matches them with measures, and the chosen
  measure becomes a public Guild assignment (S1, S2, S3). The manual
  describes the incumbent acting together with the Hanseatic Council;
  whether the Council acts the same way before the player holds the
  office is not stated.
- How the office is won is documented by S2: eligibility requires the
  top wealth rank plus completed Hanseatic Council assignments (tracked
  in a Guild tab); the player then declares candidacy in the Guild's
  traders tab, and the office goes to the most popular trader on
  election day, with trader popularity decisive as in mayor elections.
  No figures adopted.
- The response can be shaped: some events admit exactly one measure, others
  a choice between, for example, a paid single-trader commission and an
  open appeal (S2, S3).
- The office carries a duty, not only a privilege: failing to react to
  global events costs League reputation (S1, S4).
- An Alderman may accept the assignment his own decision created (S1, S3) -
  a self-dealing channel the sources present without a conflict rule.

## Comparison with current code

- No League-wide office, election or League reputation was found in the
  inspected source: per-port reputation (`src/game/reputation.mjs:4-5`),
  per-city respect and wealth ranks (`src/game/rank.mjs`) exist, and the
  word `alderman` names a mid wealth rank there, not an office.
- No problem-to-measure link exists: the urban events
  (`src/game/calamities.mjs:1-7`, `src/game/plague.mjs:1-6`,
  `src/game/festivals.mjs:1-7`) and the per-ship sea encounters
  (`src/game/events.mjs:1-6`) never feed a measure; measure types exist
  for port sanctions but nothing declares them and no event feeds them
  (`src/game/portmeasures.mjs:1-8`).
- Town shortage contracts are local and posted by the port
  (`src/game/contracts.mjs:1-4`); no Guild assignment with League scope or
  a choice of response shape exists.
- A mission/campaign scaffold exists (`src/game/campaigns.mjs`), a possible
  delivery seam for assignments, but no reactive League governance rides
  on it.

## Open questions

- Election cadence and loss of office: how often elections are held and
  whether the office can be lost once won. S2 documents eligibility,
  candidacy and the popularity rule but not the cadence or the loss
  condition.
- The catalogue of world events and their measures: only pirate
  overpopulation (S1) and a city recession (S2) are documented examples.
- Who decides measures before the player becomes Alderman, and whether an
  AI Alderman governs. Not covered by the sources read.
- Whether failing to react has consequences beyond reputation (S1 names
  only reputation), and what not reacting means mechanically: a
  deadline, a reminder, a refused screen.
- Whether an AI trader can hold the office and issue measures the player
  must live under. Unverified in every source read.
- The exact rewards of carried-out measures beyond the manual's
  qualitative League-reputation gain (S1).

## Design observation (own, not implementation)

If this gap were ever filled, the sources suggest a thin reactive layer:
a League event feed, a small problem-to-measure table with single- and
multi-answer problems, assignments published through the existing mission
scaffold, and a League reputation stock beside the per-port one, with the
top office as the reward for it. The self-dealing channel (deciding and
then accepting) is documented and would need an explicit stance. Any such
work would need its own design approval; this note records the research
boundary only.

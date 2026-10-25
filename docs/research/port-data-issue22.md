# Port data audit: first correction for issue 22

Scope: `data/world.json` at 71ed80d, reviewed 23 October 2026. This is a first,
small correction, not a claim that every population and goods tag is verified.

## Change: Bilbao needs grain

Add `grain` to Bilbao's `needs`, leaving its population and exports unchanged.
Beatriz Arizaga Bolumburu, *El abastecimiento de las villas vizcaínas medievales:
política comercial de las villas respecto al entorno y a su interior* (1985),
pp. 293-296, describes regional cereal insufficiency, Bilbao's council reporting
food dependence, and grain imports during the second half of the fifteenth
century. The paper cites municipal and royal records, including 1497 supply
orders. It supports import dependence, not an exact demand quantity.

Source read: https://revistas.ucm.es/index.php/ELEM/article/download/ELEM8585120293A/24775

Corroboration: José Damián González Arce, *Bilbao y el mar* (Universidad Nacional
de Mar del Plata, 2021), introduction, describes iron exports financing food and
manufactured imports. Only the accessible introduction is used here, not an
unread import chapter.
https://giemmardelplata.org/wp-content/uploads/2021/06/BILBAO-Y-EL-MAR-web.pdf

The simulation mapping is a design inference: `grain` represents cereal supply,
not wheat tonnage. A `needs` tag changes the initial stock target from 135 to 90
and applies the existing demand multiplier. Those numbers are game tuning,
not values measured in the historical sources. New markets pick up the tag;
existing saved market rows are not retroactively rewritten.

Do not remove wool simply because it came from inland. A port can redistribute
hinterland goods. González Arce's study of Burgos and Bilbao in 1450-1515 supports
that distinction: https://revistas.um.es/mimemur/article/download/103371/98361/413451
The current `makes` field conflates local production and export availability;
untangling those requires an engine/data contract, not silent deletion of trade.

## Population review, not automatic replacement

`data/population-1500.json` already holds an inactive secondary transcription of
Bairoch's estimates. Its note explicitly defers their use until a balance change.
The comparison below identifies discrepancies, not approved corrections or
independent confirmation of Bairoch. Null is not zero. No population changes are
included in this patch.

| Port | Current game population | Inactive comparator | Status |
|---|---:|---:|---|
| Cádiz | 12000 | 2000 | Differs, needs source and balance review |
| Sevilla | 40000 | 45000 | Differs, needs source and balance review |
| Lisboa | 50000 | 65000 | Differs, needs source and balance review |
| Valencia | 30000 | 42000 | Differs, needs source and balance review |
| Barcelona | 35000 | 20000 | Differs, needs source and balance review |
| Palma | 12000 | 13000 | Differs, needs source and balance review |
| Bilbao | 9000 | null | Not listed, unresolved |
| Tánger | 10000 | null | Not listed, unresolved |
| Cartagena | 6000 | 4000 | Differs, needs source and balance review |
| Oporto | 14000 | 14000 | Agrees with comparator, not independently verified |
| Setúbal | 6000 | 6000 | Agrees with comparator, not independently verified |
| Faro | 4000 | 4000 | Agrees with comparator, not independently verified |
| Huelva | 3000 | null | Not listed, unresolved |
| Málaga | 15000 | 42000 | Differs, needs source and balance review |
| Almería | 8000 | 30000 | Differs, needs source and balance review |
| Alicante | 3000 | 3000 | Agrees with comparator, not independently verified |
| Ibiza | 2500 | null | Not listed, unresolved |
| Tarragona | 4000 | 4000 | Agrees with comparator, not independently verified |
| Santander | 2500 | 1000 | Differs, needs source and balance review |
| San Sebastián | 3000 | null | Not listed, unresolved |
| La Coruña | 3000 | 3000 | Agrees with comparator, not independently verified |
| Vigo | 5000 | 5000 | Agrees with comparator, not independently verified |
| Ceuta | 2500 | null | Not listed, unresolved |
| Melilla | 1500 | null | Not listed, unresolved |
| Tetuán | 8000 | null | Not listed, unresolved |
| Arcila | 2000 | null | Not listed, unresolved |
| Larache | 3000 | null | Not listed, unresolved |
| Rabat | 3000 | null | Not listed, unresolved |
| Casablanca | 2000 | null | Not listed, unresolved |
| Mazagán | 2500 | null | Not listed, unresolved |
| Orán | 8000 | null | Not listed, unresolved |
| Argel | 15000 | null | Not listed, unresolved |
| Mostaganem | 4000 | null | Not listed, unresolved |

A separate academic source confirms that Cádiz deserves investigation rather
than accepting 12000 as a historical census: Francisco Javier Fornell Fernández,
*Linajes gaditanos en la Baja Edad Media*, Universidad de Cádiz. Its preface
places late-fifteenth-century Cádiz at no more than about 2000 people; another
estimate cited in note 75 spans 2000-5000. The disagreement and dates prevent
pretending there is a single exact census for 1500. This patch does not select a
new number or copy a historical table into the game.
https://rodin.uca.es/bitstream/handle/10498/27183/Linajes%20gaditanos%20en%20la%20Baja%20Edad%20Media.pdf?isAllowed=y&sequence=1

## Remaining work

- Population migration needs source-by-source verification and paired balance.
- Goods tags outside Bilbao grain remain unverified by this patch. Absence of a
  source here is not evidence that an export or import did not exist.
- No new goods, artwork, mechanics, citylife tuning or population defaults.
- The historical discussion is original paraphrase; no third-party text, tables
  or assets are bundled. Linked scholarship is evidence, not relicensed content.

# Free images for Almojarife: sources, licences, risks (19 Oct 2026)

Purpose: find reusable images for the "old nautical chart" art plan (decision A, 19 Oct 2026) without breaking docs/design/asset-licences.md. That policy allows only our own work, CC0, CC BY and verified public domain. CC BY-SA, CC BY-NC and CC BY-ND are never allowed.

Method: licence and policy pages below were read on 19 Oct 2026. Terms change, so check the item page again before adding any file, and record the row in CREDITS.md first. "Not found, not confirmed" means I did not find it; it does not mean it does not exist.

## Sources

| Source | What it gives us | Licence and use | Attribution | Fits asset-licences.md? | Verified page |
|---|---|---|---|---|---|
| Wikimedia Commons | Portolan charts, old maps, ship engravings | Per file. Commons accepts only free licences that allow commercial use, or public domain (non-commercial-only is not accepted). Many files are CC BY-SA, which we cannot use. | Depends on the file (PD none; CC BY required) | Only files marked public domain or CC0 or CC BY; reject BY-SA | https://commons.wikimedia.org/wiki/Commons:Licensing ; https://commons.wikimedia.org/wiki/Category:Portolan_charts_made_in_the_16th_century |
| Rijksmuseum (NL) | Dutch ships, prints, maps | Most items Public Domain or CC0, usable commercially without permission. Some items CC BY 4.0. Some items carry restrictions, shown on the item page. | None for PD/CC0; credit Rijksmuseum for CC BY 4.0 | Yes for PD/CC0/CC BY items; skip items with restrictions | https://www.rijksmuseum.nl/en/research/conduct-research/data/policy |
| The Met (New York) | Prints, ship and map images | Open Access images of public-domain works under CC0, unrestricted | Not required | Yes (check the item shows "Open Access") | https://www.metmuseum.org/about-the-met/policies-and-documents/open-access |
| Europeana | Aggregator of European museums and libraries | Rights are set per item: Public Domain Mark, CC0, CC BY, and others. Some items are NC, ND or SA. | Per item | Only PDM, CC0, CC BY | https://pro.europeana.eu/page/available-rights-statements |
| Biblioteca Nacional de España (BNE Digital, Biblioteca Digital Hispánica) | Spanish maps, atlases, manuscripts | Open-access images are under CC BY 4.0 or equivalent; use is free including commercial, no prior authorisation. Public-domain works may be reproduced. | Required: cite the BNE as the source (wording on the page) | Yes, as CC BY with credit in CREDITS and in the credits screen | https://www.bne.es/es/servicios/reproduccion-documentos/uso-reproducciones ; https://bnedigital.bne.es/bd/es/faq |
| Library of Congress "Free to use" sets | Mostly US prints and maps | The set pages say free to use and reuse; rights are still checked per item | Per item | Only after the item's rights statement is read | https://www.loc.gov/free-to-use/ |
| Kenney | Icons, UI packs, 2D and 3D game assets | All assets CC0, commercial use allowed | Not required (credit "Kenney" is optional; do not use their logo) | Yes | https://kenney.nl/support |
| OpenGameArt | Game art from many authors | Licence per submission; commercial use allowed if the terms are followed. Many items are CC BY-SA or GPL. | Per submission | Only CC0 and CC BY items; reject CC BY-SA and GPL | https://opengameart.org/content/faq |
| David Rumsey Map Collection | Large old-map collection | Images are CC BY-NC-SA 3.0; commercial use needs written permission | n/a | NO (NC and SA are both banned) | https://www.davidrumsey.com/about/copyright-and-permissions |

## Examples for the chart style (to verify per file before use)
- Wikimedia Commons category of 16th-century portolan charts, including the Cantino map and charts by the circle of Vesconte Maggiolo: https://commons.wikimedia.org/wiki/Category:Portolan_charts_made_in_the_16th_century (also 14th and 15th century categories). The category page lists works that are old, but each file page must show its own licence line and it must be public domain, CC0 or CC BY.
- BNE Digital open-access maps and atlases (Spanish coast and port plans), CC BY 4.0 with credit.
- Rijksmuseum and Met ship prints for flat icon inspiration; their images may be used directly when marked PD or CC0.

## Risks
1. Photographs of old paintings and maps: some countries give the photographer or museum a right in the reproduction. Prefer sources that state CC0, PDM or CC BY on the item (Rijksmuseum, Met, BNE), and avoid museums that sell reproductions under restrictive terms.
2. Licence drift: a licence on a page can change. Save the licence text and URL and the date in CREDITS.md with the file.
3. Mixed items: Commons, Europeana and OpenGameArt contain BY-SA and NC items next to good ones; a filter by licence is not enough, read the item page.
4. Trademarks and people: old maps are fine; do not use modern logos, living people or photos with identifiable faces.
5. Credits are shipped: CC BY (BNE, some Commons items) needs a line in the in-game credits screen as well as CREDITS.md.
6. Our own derived work: if we redraw a public-domain chart as vector art, the result is our own CC BY 4.0 work, and the CREDITS row names the source chart.

## Recommendation
- Primary style source: our own vector map art plus flat icons (decision A, cost 0). It avoids all third-party licence questions.
- For old-chart texture, borders, ship engravings and compass roses: use only Rijksmuseum, The Met (CC0) and BNE (CC BY with credit), plus Commons files individually verified as public domain.
- For game UI icons and sound placeholders: Kenney (CC0).
- Do not use: David Rumsey, any BY-SA, NC or ND item, OpenGameArt items that are not CC0 or CC BY.
- Process: no image enters the repo without a CREDITS.md row (file, source URL, licence, date checked); the CI check in asset-licences.md enforces that.

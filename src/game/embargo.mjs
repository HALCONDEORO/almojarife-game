// Grain embargo (hunger consequence of a short harvest or lost shipping): when a port's grain runs critically short its council
// stops grain leaving the port by sale to outsiders. Own design, pure, no DOM. Off unless g.embargo === true.
// Basis (public sources, own words): Barcelona's municipality held, in shortages, the right to seize grain carried past the city (Vi vel gratia, 1328)
// and, by the Annona of 1511, to ban wheat leaving the city even against the viceroy (Museu d'Història de Barcelona, "City, food supply and health":
// https://www.barcelona.cat/museuhistoria/sites/default/files/activitats_pdf/2022-01/llibret_alimentar_barcelona_ENG.pdf). In 1587 Cádiz told the Crown
// of bread shortage after a bad harvest, wheat brought in by carriage at 20 reales the fanega, and asked for a remedy (Cortés Peña, "Abastecimiento urbano
// y embargos de trigo en la Andalucía de Felipe II", 1999: https://doi.org/10.20350/digitalcsic/11527; read from the abstract excerpt only).
// That shortage can follow from lost shipping or piracy is NOT shown by these sources: it is our design inference. The threshold is a tuning knob.
export const EMBARGO_BELOW = 0.4; // grain stock / target under which the council closes the grain door
export const GRAIN = "grain";
export const grainShort = (g, port) => { const e = g.market?.[port]?.[GRAIN]; return !!e && e.stock / Math.max(1, e.target) < EMBARGO_BELOW; };
export const embargoOn = (g, port) => g?.embargo === true && grainShort(g, port);

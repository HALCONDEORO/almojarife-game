# Economía

[Versión en inglés (English version)](../economy.md)

Esqueleto más las decisiones ya tomadas. Fuentes existentes: `docs/design/economy-33-ports.md`, `docs/research/economy-audit.md`, las bases de medición `balance-*.json`.

## Establecido (en main)
- El suelo de precios y los topes no se tocan (decisión del proyecto, 22 oct).
- La demanda se reparte por clase (pobres, artesanos y mercaderes, ricos); ver [classes.md](classes.md).
- Estaciones de producción y ritmo de la demanda diaria: [generated/es/seasons.md](../generated/es/seasons.md), a partir de `SEASON_PEAK`, `SEASON_AMPLITUDE`, `seasonMul`, `seasonOf`, `DEMAND_SCALE`, `NEEDS_MUL` y `MAKES_MUL` en `src/sim/market.mjs`.

## En revisión o en espera (no en main)
- Rediseño de la saturación del mercado, fase 1: infraestructura contable (bolsa mayorista por puerto, bolsa doméstica por clase). Abierta en la PR #229. No resuelve la seda y no es el rediseño terminado.
- Cestas de consumo y raciones por clase (la carne, cara para los ricos): en espera de la calibración final única.
- Notas de investigación (Drive, no en el repo): cómo modelan otros juegos la saturación y la importación.

## Por rellenar
Tabla de mercancías: [generated/es/goods.md](../generated/es/goods.md). Por rellenar: importaciones y oferta finita, puertas de equilibrio (bandas de patrimonio PNJ por horizonte).

# Decisiones (desde el 22 oct 2026)

[Versión en inglés (English version)](../decisions.md)

Continúa `docs/DECISIONS.md`. Formato: fecha, decisión, por qué, dónde vive. La fuente se nombra con neutralidad; las aprobaciones se registran, no se citan desde archivos.

| Fecha | Decisión | Por qué | Dónde |
|---|---|---|---|
| 22 oct | El suelo de precios y los topes se quedan como están | Mantener el mercado estable mientras cambia el diseño de saturación | economy.md |
| 22 oct | Rediseñar la saturación del mercado en vez de ensanchar las bandas PNJ | El problema es el arbitraje regenerativo en el mercado, no los bots | economy.md, PR #229 |
| 22 oct | Los bots siguen las mismas reglas que el jugador | Los bots deben comportarse como jugadores reales | bots.md |
| 22 oct | El texto del repo público no lleva nombres personales | El repositorio es público | PR #228 |
| 22 oct | La wiki interna vive en docs/, con tablas generadas desde el código, y cada PR del juego actualiza su página | Una fuente versionada que no puede desviarse | README.md |
| 22 oct | La carne es cara para los ricos; la comida se reparte entre tres clases | Coincide con el reparto histórico del consumo por clase | classes.md (aún no en el juego) |

| 26 Oct | Nombres de reinos más discretos, Granada separada y leyenda alineada | Leer reinos y puertos juntos en la vista completa de escritorio; colores aproximados, no fronteras | src/view/historicalmap.mjs |

| 26 Oct | Veladura castellana del norte y Navarra solo cartográfica | Cubrir la costa norte, detener Portugal en el Miño y mostrar la Navarra peninsular aparte antes de su incorporación de 1515; contexto aproximado, sin cambiar tenencias ni patentes | data/realms.json |

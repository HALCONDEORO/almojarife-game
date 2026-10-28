<p align="center"><img src="docs/images/banner.svg" alt="El Almojarife: barcos y puertos en una carta de navegación" width="900"></p>

# El Almojarife

Un juego de comercio marítimo: funda una casa mercantil, compra mercancías, navega entre puertos y vende con beneficio. Administra barcos, tripulaciones, rutas automáticas, edificios y las cuentas de tu casa.

**Para ordenador**, con teclado y ratón, en Windows, macOS o Linux. No está diseñado ni probado para móviles o tabletas. Interfaz en español e inglés. La partida funciona localmente en el navegador, sin cuenta.

- [Jugar en el navegador](https://halcondeoro.github.io/almojarife-game/).
- [Guía de cómo jugar en español](docs/COMO-JUGAR.md).
- [Versiones y descargas](https://github.com/HALCONDEORO/almojarife-game/releases).

## Estado real de esta versión

Este documento describe el código integrado en `main` hasta `ace71d6feb14f80a42e3c61fabe7e49719d27167`, no garantiza que la web o una descarga contengan ese mismo código. Los PR abiertos no se presentan como funciones publicadas.

- [v0.5.0-beta.3](https://github.com/HALCONDEORO/almojarife-game/releases/tag/v0.5.0-beta.3) es una **pre-release de código fuente**, publicada el 28 de octubre de 2026, fijada en `0a885d4db2b698bbe33ba4cf3d2b62407ba82bc1`. No tiene instaladores adjuntos y no incluye los cambios posteriores de navegación de este README.
- `v0.5.0-beta.2` sigue marcada como `Latest`. Para instalar, comprueba los archivos realmente adjuntos a la versión elegida y sus notas; no supongas que cada beta contiene binarios o `SHA256SUMS.txt`.
- La firma, la instalación y las pruebas de los paquetes tienen sus propios límites: consulta [la política de firma](docs/code-signing-policy.md) y [la verificación de versiones](docs/release-signing.md). No desactives las protecciones del sistema para instalar una beta.
- Es una beta en desarrollo. El equilibrio, la campaña y la presentación siguen cambiando. Conserva una exportación de tus partidas; no se promete migración de todos los guardados antiguos.

## Cómo jugar: primeros pasos

1. Elige **Nueva partida**, el nombre de tu casa, tu personaje y el puerto de origen. La partida nueva abre la ciudad y el tutorial.
2. Entra en el **Mercado**, elige la cantidad y compra una mercancía. Consulta el precio, la carga disponible y el dinero antes de confirmar.
3. Pulsa **Volver al mapa**. Con tu barco seleccionado, haz **clic derecho** sobre un puerto explorado para ordenar el viaje en las partidas nuevas con navegación libre. El clic izquierdo no es una orden de zarpar.
4. Deja avanzar el reloj con **Reanudar**; usa el control de velocidad si hace falta. Al llegar, vende en el Mercado del destino. El tutorial exige una venta con beneficio de carga comprada, no una simple reventa con pérdida en el mismo puerto.
5. En la ciudad, **Barcos** abre las rutas. Configura una ruta automática con **Fijar ruta** y visita después el **Ayuntamiento** para terminar el tutorial actual de cinco pasos.
6. Reserva dinero para gastos y liquidaciones. **Informes** reúne historial de operaciones y cuentas; **Mensajes** muestra avisos y sucesos.

[La guía completa](docs/COMO-JUGAR.md) explica también los guardados, la navegación libre, las rutas y los controles. Las partidas antiguas pueden conservar reglas, objetivos o tutoriales anteriores.

## Controles del mapa

| Acción | Control |
| --- | --- |
| Dar una orden de navegación libre | Clic derecho sobre un destino navegable; puerto explorado o mar permitido |
| Ver la previsión de un destino | Mover el puntero sobre el mapa: recorrido y tiempo estimado; el aviso rojo indica destino inválido |
| Acercar / alejar | Rueda del ratón; `+` / `-`; gesto de pinza compatible |
| Mover la vista | Arrastrar; flechas o `W`, `A`, `S`, `D` |
| Centrar barco / puerto | Botones del mapa; `Inicio` / `C` |
| Mover la vista desde el minimapa | Clic o arrastre dentro del minimapa, visible al acercar |
| Restablecer la vista | Doble clic |
| Pausar / reanudar | Botón del reloj; espacio en el mapa, fuera de campos de texto |
| Cerrar una ventana o cancelar selección | `Esc`; para guardado y ajustes, usa **Menú** |

Los atajos de cámara no escriben en los campos de texto. Acercar o centrar no da una orden al barco. La leyenda del mapa distingue red tenue, viaje activo, automática, plan y destino no válido. El seguimiento continuo de un barco no forma parte de este punto de control de `main`.

## La ciudad y la casa mercantil

- La ciudad es una vista 2D con edificios seleccionables y ventanas. **Volver al mapa** regresa a la carta; **Barcos**, **Informes**, **Mensajes** y **Menú** están a mano.
- Mercado: compra y vende, compara existencias y precios. Los precios cambian; una estimación o rumor no garantiza beneficio.
- Astillero: construcción y reparación. La venta de barcos está en la **almoneda del Ayuntamiento**, no en el astillero; se rechaza vender el último barco o uno con carga.
- Almacén y mayordomo, taberna, banco, edificios, contratos y concejo añaden decisiones a la campaña. Costes, requisitos y disponibilidad se muestran en cada ventana.
- Las rutas automáticas comercian según su configuración; las opciones avanzadas añaden escalas, límites de compra/venta y reserva de dinero. Revisa resultados, no des por hecho que una ruta siempre sea rentable.
- El nombre de un barco se cambia desde el desplegable **Renombrar** de Flota o desde su ventana.

## Capturas y prueba jugada

Estas tres capturas son de una **partida nueva real**, en español a 1280×720, jugada en `main` `ace71d6` el 28 de octubre de 2026. Sin inyección de estado: compra en Cádiz, viaje a Huelva, venta con beneficio, ruta automática y Ayuntamiento. La prueba completó los cinco pasos y verificó **Continuar** tras recargar. No certifica una instalación ni la versión desplegada.

| Mercado al llegar | Configurar una ruta |
| --- | --- |
| ![Mercado de Huelva durante una venta de la partida de prueba](docs/img/player-guide/market.png) | ![Ventana de Barcos y rutas en la ciudad](docs/img/player-guide/routes.png) |

![Ayuntamiento de Huelva durante la partida real del tutorial](docs/img/player-guide/council.png)

Las capturas antiguas de `docs/img/` se conservan para no romper referencias, pero ya no se usan aquí como prueba de la interfaz actual.

## Ejecutarlo localmente

Node 20 o posterior y Python 3 para el servidor de desarrollo:

```sh
npm run serve
# Abrir http://localhost:8080/web/index.html
sh tools/fetch_data.sh  # Datos de costa necesarios para las pruebas del mundo
npm test
```

La prueba de tutorial por interfaz está en `test/browser/tutorial-playthrough.mjs`; requiere Playwright proporcionado por quien la ejecuta y una instancia local indicada con `BASE_URL`. No se ejecuta por el mero hecho de abrir el juego.

## Documentación y colaboración

- [Documentación](docs/README.md), [estado de desarrollo](docs/CURRENT-STATE.md), [diseño](docs/DESIGN.md) y [hoja de ruta](docs/ROADMAP.md).
- [Referencia del juego en español](docs/wiki/es/README.md). Las tablas generadas se actualizan con `node tools/gen_wiki.mjs`, no a mano.
- [Contribuir](CONTRIBUTING.md), [código de conducta](CODE_OF_CONDUCT.md), [traducciones](TRANSLATING.md).
- Para trabajar en el código: [AGENTS.md](AGENTS.md) y [política de modelos](docs/politica-modelos.md).

`src/sim/`: simulación; `src/game/`: reglas y guardados; `src/view/`: presentación; `web/`: interfaz; `data/`: contenido; `assets/`: recursos; `test/`: pruebas.

## Licencias

Código y datos: [MIT](LICENSE). Arte y documentos originales: [CC BY 4.0](LICENSE-ART.md). Créditos y licencias de terceros: [CREDITS.md](CREDITS.md). Cartografía: Natural Earth. El nombre "Almojarife" es provisional.

<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Rutas (generado)

Fuente: `lanes` y `waypoints` en `data/world.json` (97 rutas marítimas) leídas con `buildWorld`/`route` (`src/sim/world.mjs`: km haversine por tramo, camino más corto por Dijkstra); velocidades de `SHIP_TYPES` en `src/sim/trade.mjs`. Tipo de dato: diseño del juego (supuesto); los puntos de paso siguen la costa del mapa.

## Desde Cádiz (el puerto de inicio)

Distancia por mar y días a la velocidad base de cada barco, antes de los factores de tripulación, capitán y viento (`src/game/traveltime.mjs`).

| Puerto | km | Barca (100 km/día) | Coca (90 km/día) | Carabela (140 km/día) | Nao (80 km/día) |
| --- | --- | --- | --- | --- | --- |
| Sevilla | 154 | 1.5 | 1.7 | 1.1 | 1.9 |
| Lisboa | 536 | 5.4 | 6.0 | 3.8 | 6.7 |
| Valencia | 951 | 9.5 | 10.6 | 6.8 | 11.9 |
| Barcelona | 1174 | 11.7 | 13.0 | 8.4 | 14.7 |
| Palma | 1040 | 10.4 | 11.6 | 7.4 | 13.0 |
| Bilbao | 1675 | 16.7 | 18.6 | 12.0 | 20.9 |
| Tánger | 161 | 1.6 | 1.8 | 1.1 | 2.0 |
| Cartagena | 626 | 6.3 | 7.0 | 4.5 | 7.8 |
| Oporto | 829 | 8.3 | 9.2 | 5.9 | 10.4 |
| Setúbal | 593 | 5.9 | 6.6 | 4.2 | 7.4 |
| Faro | 211 | 2.1 | 2.3 | 1.5 | 2.6 |
| Huelva | 134 | 1.3 | 1.5 | 1.0 | 1.7 |
| Málaga | 287 | 2.9 | 3.2 | 2.0 | 3.6 |
| Almería | 469 | 4.7 | 5.2 | 3.4 | 5.9 |
| Alicante | 786 | 7.9 | 8.7 | 5.6 | 9.8 |
| Ibiza | 899 | 9.0 | 10.0 | 6.4 | 11.2 |
| Tarragona | 1184 | 11.8 | 13.2 | 8.5 | 14.8 |
| Santander | 1593 | 15.9 | 17.7 | 11.4 | 19.9 |
| San Sebastián | 1748 | 17.5 | 19.4 | 12.5 | 21.9 |
| La Coruña | 1104 | 11.0 | 12.3 | 7.9 | 13.8 |
| Vigo | 944 | 9.4 | 10.5 | 6.7 | 11.8 |
| Ceuta | 157 | 1.6 | 1.7 | 1.1 | 2.0 |
| Melilla | 424 | 4.2 | 4.7 | 3.0 | 5.3 |
| Tetuán | 228 | 2.3 | 2.5 | 1.6 | 2.9 |
| Arcila | 163 | 1.6 | 1.8 | 1.2 | 2.0 |
| Larache | 192 | 1.9 | 2.1 | 1.4 | 2.4 |
| Rabat | 325 | 3.2 | 3.6 | 2.3 | 4.1 |
| Casablanca | 422 | 4.2 | 4.7 | 3.0 | 5.3 |
| Mazagán | 516 | 5.2 | 5.7 | 3.7 | 6.5 |
| Orán | 624 | 6.2 | 6.9 | 4.5 | 7.8 |
| Argel | 997 | 10.0 | 11.1 | 7.1 | 12.5 |
| Mostaganem | 716 | 7.2 | 8.0 | 5.1 | 8.9 |

## Las rutas marítimas

Todos los tramos del grafo de navegación. Los puntos de paso conservan su identificador de carta (`w_*`).

| Desde | Hasta | km |
| --- | --- | --- |
| Alicante | w_alicante_off | 26 |
| Almería | w_almeria_off | 21 |
| Arcila | w_arcila_off | 26 |
| Argel | w_argel_off | 26 |
| Barcelona | w_bcn_off | 24 |
| Bilbao | w_bilbao_off | 49 |
| Cádiz | w_cadiz_off | 31 |
| Cartagena | w_cartagena_off | 17 |
| Casablanca | w_casa_off | 21 |
| Ceuta | w_gibraltar | 23 |
| Faro | w_faro_off | 25 |
| Huelva | w_huelva_off | 34 |
| Ibiza | w_nao | 81 |
| Ibiza | w_palma_sw | 73 |
| La Coruña | w_coruna_off | 23 |
| Larache | w_larache_off | 25 |
| Lisboa | w_lisboa_off | 42 |
| Málaga | w_malaga_off | 29 |
| Mazagán | w_mazagan_off | 20 |
| Melilla | w_melilla_off | 24 |
| Mostaganem | w_mosta_off | 30 |
| Oporto | w_porto_off | 49 |
| Orán | w_oran_off | 17 |
| Palma | w_palma_bay | 19 |
| Rabat | w_rabat_off | 11 |
| San Sebastián | w_ss_off | 42 |
| Santander | w_santander_off | 32 |
| Setúbal | w_sado | 11 |
| Sevilla | w_sanlucar | 85 |
| Tánger | w_spartel | 27 |
| Tarragona | w_tarragona_off | 28 |
| Tetuán | w_ceuta_e | 49 |
| Valencia | w_valencia_off | 16 |
| Vigo | w_vigo_off | 47 |
| w_alboran | w_gata | 146 |
| w_alicante_off | w_nao | 77 |
| w_alicante_off | w_palos | 102 |
| w_almeria_off | w_alboran | 126 |
| w_almeria_off | w_gata | 42 |
| w_arcila_off | w_cadiz_off | 106 |
| w_arcila_off | w_larache_off | 29 |
| w_argel_off | w_palma_sw | 254 |
| w_bcn_off | w_mallorca_ne | 166 |
| w_biscay | w_bilbao_off | 243 |
| w_cadiz_off | w_gibraltar | 103 |
| w_cadiz_off | w_stvincent | 263 |
| w_cartagena_off | w_palos | 49 |
| w_casa_off | w_mazagan_off | 95 |
| w_ceuta_e | w_alboran | 144 |
| w_ceuta_e | w_gibraltar | 45 |
| w_coruna_off | w_finisterre | 98 |
| w_coruna_off | w_galicia_nw | 98 |
| w_espichel | w_lisboa_off | 40 |
| w_faro_off | w_huelva_off | 86 |
| w_faro_off | w_stvincent | 142 |
| w_finisterre | w_galicia_nw | 111 |
| w_galicia_nw | w_biscay | 288 |
| w_gata | w_cartagena_off | 141 |
| w_gibraltar | Tánger | 27 |
| w_gibraltar | w_alboran | 189 |
| w_huelva_off | w_cadiz_off | 69 |
| w_ibiza_n | w_bcn_off | 206 |
| w_ibiza_n | w_palma_sw | 89 |
| w_larache_off | w_rabat_off | 148 |
| w_lisboa_off | w_finisterre | 489 |
| w_lisboa_off | w_porto_off | 286 |
| w_malaga_off | w_alboran | 98 |
| w_malaga_off | w_gibraltar | 124 |
| w_mallorca_e | w_mallorca_se | 48 |
| w_mallorca_ne | w_mallorca_e | 89 |
| w_mallorca_s | w_palma_sw | 73 |
| w_mallorca_se | w_mallorca_s | 36 |
| w_mazagan_off | w_stvincent | 396 |
| w_melilla_off | w_alboran | 78 |
| w_melilla_off | w_oran_off | 207 |
| w_mosta_off | w_oran_off | 78 |
| w_mosta_off | w_tenes | 98 |
| w_nao | w_ibiza_n | 127 |
| w_nao | w_valencia_off | 117 |
| w_oran_off | w_cartagena_off | 180 |
| w_oran_off | w_gata | 141 |
| w_palma_sw | w_palma_bay | 48 |
| w_palos | w_nao | 160 |
| w_porto_off | w_vigo_off | 117 |
| w_rabat_off | w_casa_off | 88 |
| w_sado | w_espichel | 48 |
| w_sanlucar | w_cadiz_off | 38 |
| w_santander_off | w_bilbao_off | 65 |
| w_santander_off | w_biscay | 179 |
| w_spartel | w_arcila_off | 40 |
| w_ss_off | w_bilbao_off | 80 |
| w_stvincent | w_lisboa_off | 200 |
| w_tarragona_off | w_bcn_off | 82 |
| w_tarragona_off | w_valencia_off | 221 |
| w_tenes | w_argel_off | 188 |
| w_valencia_off | w_ibiza_n | 130 |
| w_vigo_off | w_finisterre | 92 |

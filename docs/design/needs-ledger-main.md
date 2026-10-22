# Needs ledger and UI, main-compatible prototype

Base main43ed367895fb835b6a69236e683baefdaeffa349. Review routing: BO and Ingresos review the exact SHA independently; Estudio publishes/merges after double PASS. No merge authorization is supplied by this file.

This replaces the earlier #229-dependent series for review. It does NOT carry the blocked household/wholesale integration onto main. NEEDS_LEDGER_ENABLED=false. Default market cells, prices, consumption, traders and saves remain unchanged. City tab shows a disabled notice. An explicit per-call needsLedger:true option supports tests and component previews; production game does not pass it.

When telemetry is enabled, actual city whole-unit consumption comes from the unchanged market stock removal. Class attribution uses proportional largest remainders from legacy class wishes: an ESTIMATE, not per-class observed purchases or household spending. No household purse exists in main. UI labels this explicitly. A future accepted purse integration must use its exact settlement receipt instead and migrate policy.

The legacy grain cell already has a boolean `needs` field. Telemetry is stored under `grain.needsLedger`, never overwriting that economic tag. Daily and cumulative totals and class sections use game units and explicitly label each cell a game assumption without historical source. Physical rates and adult-equivalent coefficient1.00 remain inactive. Ledger is bounded latest-day plus accumulated totals, not a growing time series. Negative net need-minus-consumed balance reflects whole-unit rounding and the legacy stock factor, not negative hunger.

The physical candidate module contains no active calibration. Kg bread is not kg grain without a yield assumption. A reconstructed adult male worker basket1521-1540 is not a direct late-fifteenth-century requirement for every inhabitant. Middle/rich quantities remain cell-specific assumptions or different source populations. No legumes, production rescale, imports, price clamps or balance bands changed.

## Meat source check

Full text verified directly: González Arce2022, https://revistascientificas.us.es/index.php/HID/article/download/22543/19779/95098 . It reconstructs0.8kg/person/day for the Abencemerro household and servants from fiscal records (not all elites). It reconstructs0.22kg mammal meat/person/day for the average Sevilla resident1481:0.10 beef +0.03 mutton +0.09 pork (not a middle-class observation). The source stresses these are estimates with species/carcass-weight and annualization assumptions. Inactive data labels now preserve that distinction.

## Verification

657/657 tests passed in complete disjoint groups261+205+184+7. A first monolithic npm test exceeded tool time; complete verification then ran in partitions without exclusions other than running all7 AI tests as their own group. New tests prove default flag off and no telemetry metadata, enabled telemetry leaves every economic cell field unchanged, class estimates sum exactly to city consumption, save continuation matches, ES/EN labels preserve estimated provenance. No numeric gates changed.

Actual component pixels inspected: ES1120x1000, EN420x950, telemetry explicitly enabled with real makeMarket/tickMarket data. Mobile table scrolls with cue. These are shared-component previews, not end-to-end game-navigation screenshots. Game default only shows disabled notice. Estudio should verify integrated game before any global visual PASS.

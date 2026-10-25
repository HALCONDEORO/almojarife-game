# Town houses by class (poor / comfortable / rich)

Marco 25/10: "falta añadir los tipos de casas pobres acomodados y ricos" (on the published
build-offer cards).

## Record (P3 manual, ch. 11.2.2)

Three types of town houses: half-timbered houses for the poor, gabled houses for the well off and
merchant's houses for the rich. Rent is set per house class, with three rent levels; the class
mix of a town drives what its market consumes (ch. 8.1: staples for the poor, comforts for the
well off, luxuries for the rich).

## Adaptation

- Three buildable types: `house_poor`, `house_comfortable`, `house_rich`. The legacy generic
  `house` stays for old saves and almoneda lots (still upgradeable) but is no longer offered.
- Each house shelters residents of ITS class. The market reads them as explicit class counts
  (`e.classExtra`, set per good on the same scale as `e.pop`) instead of re-splitting them by
  the town's class shares: poor residents buy staples, rich residents buy luxuries
  (`demandOf` in classes.mjs, `cityDemandBy` in market.mjs). Mixed pool + typed residents =
  the same total population everyone reads (header, free labor, city life).
- Residents per active level: poor 60 (crammed half-timbered), comfortable 50 (the old generic
  rate), rich 40. Costs follow the calibration formula (days = ceil(units/3) + ceil(fee/100)):
  poor timber 8 + bricks 3, fee 100, 5 days; comfortable = the old house recipe, fee 150, 8 days;
  rich timber 8 + bricks 16 + cloth 4, fee 300, 13 days, upkeep 2.
- All house classes give housing room for the weekly newcomer drift (citylife).
- Rent per class (the P3 mechanic) is NOT in this piece: it is a new income mechanic that needs
  its own economy review.

## Out of scope / notes

- The class mix of the weekly newcomer drift stays the town's own (typed houses give room, not a
  class pipeline) - a richer model can come with rent.
- Rich residents count as hands for hire like everyone else (read: their households include
  servants), same convention as the old generic house.

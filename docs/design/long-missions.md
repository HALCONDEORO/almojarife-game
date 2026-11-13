# Optional long missions

Own-design experiment, off by default. Enable only with
`newGame(world, start, { longMissions: true, noGoal: true })` and a campaign.
Standard games still end at day 365 and do not offer these multi-year missions.
Free play has no campaign. There is no UI control enabling this experiment.

The first optional mission follows the completed trade tutorial mission and asks
for home-port respect 30 within 730 campaign days from activation. These values,
the reputation penalty of up to 2 points and the 14-day optional-offer cooldown
are original tuning, not measured reference-game constants. Bankruptcy remains
possible in open-ended mode; mission failure itself removes no cash or ships.

Expiry revokes only this mission, adjusts port reputation through its existing
clamped helper once and delays new optional campaign offers. The clamp can make
the actual loss smaller near the minimum. Previously accepted missions and the
main chain continue. The cooldown can also delay existing optional mission types
that have not yet been offered. The long inbox message explains consequences;
the on-screen chip uses a short revoked label and no progress counter.

Daily tutorial ticks pause the relative clock. Disabling the feature hides its
missions and consequences without erasing history. Re-enabling counts days since
the last enabled observation and can expire a mission immediately. It is not a
way to reset the deadline. Saves without the flag gain no timing fields.

The founding-mission research in
`docs/research/patrician3-tippsammlung-expansion3-notes.md` supplies only a design
pattern: generous deadline, revocation, a small reputation cost and temporary
suspension. This experiment does not implement settlement founding or alter
trade, justice or council contract systems. Balance playtesting is still needed.

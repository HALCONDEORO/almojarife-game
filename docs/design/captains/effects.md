# Captain effects integration, recruitment UI not yet connected

Builds on captain-domain branch. Player travel estimate and departure now share crew plus captain navigation rounding, minimum one day, zero crew factor still prevents departure. NPC raw sail unchanged. Old/missing captains give neutral1.0 speed and zero wages.

Captain wage accrues daily in port or at sea, included in accruedTotal/dueNow/netWorth and weekly cost. The report row separates captain wage from crew/cannons; no hidden salary inside crew. Reset after settlement prevents repeat charge. Low-cash warning's next-day estimate includes captain wage. Other effects remain absent.

Recruitment UI is not in this PR. No new game starts with a captain, and no web action hires one. Optional captain fields in imported saves now have effects; read helpers bound navigation0..3 and wage0..10. Candidate hires still require port/owned identity/cash checks. Next PR must connect clear hire/dismiss review UI and show assigned captain ES+EN.

Focused34tests passed including domain, ledger, nav and effects. Tests compare actual departure/estimate across all32other ports and insufficient crew, docked/sailing salary, due/worth, weekly charge and reset. Full CI before merge. Navigation is the only active skill; no claim about storm/defence/trade.

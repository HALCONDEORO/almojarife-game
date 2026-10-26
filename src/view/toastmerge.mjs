/** Sum two trades of the same good and kind into one, so repeated clicks show one toast. */
export function mergeTrade(a, b) { return { ...b, q: a.q + b.q, c: a.c + b.c }; }

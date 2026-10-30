// Optional campaign seed typed at founding: blank means a random seed; digits within uint32 keep the run reproducible.
export function parseSeed(text) {
  const v = (text ?? "").trim();
  if (!v) return undefined;
  return /^\d{1,10}$/.test(v) && Number(v) <= 4294967295 ? Number(v) : null;
}

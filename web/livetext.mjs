// Set the text of a live region only when it changed. Renders run many times a second, and
// rewriting the same string makes a screen reader announce it again each time.
export function setLiveText(el, text) {
  if (!el) return false;
  const next = text ?? "";
  if (el.textContent === next) return false;
  el.textContent = next;
  return true;
}

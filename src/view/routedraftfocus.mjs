// Restore editing focus after render replaces a route draft's controls.
export function routeDraftFocusId(action, index, count) {
 if (!Number.isInteger(count) || count < 0) return null;
 if (action === 'add') return count > 0 ? `rts-city-${count - 1}` : 'rts-add';
 if (action !== 'remove' || !Number.isInteger(index) || index < 0) return null;
 return count === 0 ? 'rts-add' : `rts-city-${Math.min(index, count - 1)}`;
}
export function focusRouteDraft(getElement, action, index, count) {
 const id = routeDraftFocusId(action, index, count);
 if (id) getElement(id)?.focus();
}

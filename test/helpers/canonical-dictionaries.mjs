// Test-only comparison: erase only the null-vs-Object dictionary prototype
// difference. Preserve own keys (including symbols and undefined), descriptors,
// array holes/length, non-finite numbers and the entire runtime world.
export function canonicalDictionaries(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== null && prototype !== Object.prototype) return value;
  const result = Array.isArray(value) ? [] : Object.create(Object.prototype);
  seen.set(value, result);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor) descriptor.value = canonicalDictionaries(descriptor.value, seen);
    Object.defineProperty(result, key, descriptor);
  }
  return result;
}

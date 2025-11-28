const keyCache = new Map<number, readonly string[]>();

function defaultRandomUUID(): string {
  return `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

const randomUUID =
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
    : defaultRandomUUID;

export function getSkeletonKeys(count: number): readonly string[] {
  const cached = keyCache.get(count);
  if (cached) {
    return cached;
  }

  const keys = Array.from({ length: count }, () => `skeleton-${randomUUID()}`);
  Object.freeze(keys);
  keyCache.set(count, keys);

  return keys;
}

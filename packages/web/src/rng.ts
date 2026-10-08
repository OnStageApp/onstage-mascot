/**
 * mulberry32: a tiny seeded PRNG returning numbers in [0, 1). Players accept any `() => number`;
 * this one exists so web and Flutter can replay the same blink schedule in tests.
 * All arithmetic is unsigned 32-bit (see docs/renderer-contract.md, "Random source").
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

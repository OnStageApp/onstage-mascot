/**
 * mulberry32: a tiny seeded PRNG returning numbers in [0, 1). Players accept any `() => number`;
 * this one exists so web and Flutter can replay the same blink schedule in tests.
 * All arithmetic is unsigned 32-bit (see docs/renderer-contract.md, "Random source").
 */
export declare function mulberry32(seed: number): () => number;

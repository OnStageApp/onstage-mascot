// mulberry32: a tiny seeded PRNG returning numbers in [0, 1), identical to the web player's.
// docs/renderer-contract.md section 10. Every intermediate is masked to 32 bits and no product
// exceeds 2^53, so the result is the same on the Dart VM and on the web (where ints are doubles).

const int _mask32 = 0xFFFFFFFF;

/// 32-bit multiplication keeping the low 32 bits (JavaScript `Math.imul`, as unsigned).
int imul32(int a, int b) {
  final aHi = (a >>> 16) & 0xFFFF;
  final aLo = a & 0xFFFF;
  final bHi = (b >>> 16) & 0xFFFF;
  final bLo = b & 0xFFFF;
  final cross = ((aHi * bLo + aLo * bHi) & 0xFFFF) * 0x10000;
  return (aLo * bLo + cross) & _mask32;
}

/// A seeded random source in [0, 1). Seed 7 gives 0.011704753153026104, 0.06195825757458806,
/// 0.97690763277933.
double Function() mulberry32(int seed) {
  var a = seed & _mask32;
  return () {
    a = (a + 0x6D2B79F5) & _mask32;
    var t = a;
    t = imul32((t ^ (t >>> 15)) & _mask32, t | 1);
    t =
        (t ^ ((t + imul32((t ^ (t >>> 7)) & _mask32, t | 61)) & _mask32)) &
        _mask32;
    return ((t ^ (t >>> 14)) & _mask32) / 4294967296;
  };
}

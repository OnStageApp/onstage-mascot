import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/src/rng.dart';

void main() {
  test('mulberry32 check values (renderer contract section 10)', () {
    final r = mulberry32(7);
    expect(
      [r(), r(), r()],
      [0.011704753153026104, 0.06195825757458806, 0.97690763277933],
    );
  });

  test('mulberry32 stays in [0, 1) and handles seeds outside 32 bits', () {
    for (final seed in [0, 1, 0xFFFFFFFF, -1, 0x1FFFFFFFF]) {
      final r = mulberry32(seed);
      for (var i = 0; i < 2000; i++) {
        final v = r();
        expect(v >= 0 && v < 1, isTrue, reason: 'seed $seed: $v');
      }
    }
    // Seeds are taken modulo 2^32, as JavaScript's `>>> 0` does.
    final a = mulberry32(-1), b = mulberry32(0xFFFFFFFF);
    expect([a(), a()], [b(), b()]);
  });

  test('imul32 matches Math.imul (as unsigned) on edge values', () {
    expect(imul32(0xFFFFFFFF, 0xFFFFFFFF), 1);
    expect(imul32(0x80000000, 2), 0);
    expect(imul32(123456789, 987654321), 0xFBFF5385); // (Math.imul(...) >>> 0)
    expect(
      imul32(0x6D2B79F5, 0x6D2B79F5 | 1),
      (0x6D2B79F5 * 0x6D2B79F5) & 0xFFFFFFFF,
    );
  });
}

// The bundled data must equal the repo's spec/. If this fails, run in packages/flutter:
//   dart run tool/gen_spec_data.dart
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';

import '../tool/gen_spec_data.dart' as gen;

void main() {
  test('lib/src/spec_data.g.dart is up to date with spec/', () {
    final spec = Directory(gen.specPath);
    expect(spec.existsSync(), isTrue, reason: 'run from packages/flutter');
    final expected = gen.generate(spec);
    final actual = File(gen.outputPath).readAsStringSync();
    expect(
      actual == expected,
      isTrue,
      reason:
          'spec/ changed: run `dart run tool/gen_spec_data.dart` in packages/flutter',
    );
  });

  test('the bundled spec parses: 85 states, every clip they name', () {
    final s = MascotSpec.instance;
    expect(s.states, hasLength(85));
    expect(s.stateKeys.toSet(), hasLength(85));
    for (final st in s.states) {
      expect(s.clip(st.motion.id), isNotNull, reason: st.key);
    }
    expect(s.clip(s.idleMotion), isNotNull);
    expect(s.clip(s.blink.motion), isNotNull);
  });
}

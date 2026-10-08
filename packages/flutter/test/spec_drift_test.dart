// The bundled data must equal the repo's spec/. If this fails, run in packages/flutter:
//   dart run tool/gen_spec_data.dart
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';

import '../tool/gen_spec_data.dart' as gen;

void main() {
  test(
    'lib/src/states_data.g.dart and motion_data.g.dart are up to date with spec/',
    () {
      final spec = Directory(gen.specPath);
      expect(spec.existsSync(), isTrue, reason: 'run from packages/flutter');
      final expected = gen.generate(spec);
      expect(expected.keys, [gen.statesOutputPath, gen.motionOutputPath]);
      for (final e in expected.entries) {
        expect(
          File(e.key).readAsStringSync() == e.value,
          isTrue,
          reason:
              '${e.key} is out of date: run `dart run tool/gen_spec_data.dart` in packages/flutter',
        );
      }
    },
  );

  test('the data is split: states without clips, clips without states', () {
    final states = File(gen.statesOutputPath).readAsStringSync();
    final motion = File(gen.motionOutputPath).readAsStringSync();
    expect(states, contains('const String paletteJson'));
    expect(states, contains('const String statesJson'));
    expect(states, isNot(contains('motionJson')));
    expect(states, isNot(contains('"rows"')));
    expect(motion, contains('const Map<String, String> motionJson'));
    expect(motion, isNot(contains('statesJson')));
    expect(motion, isNot(contains('paletteJson')));
    expect(File('lib/src/spec_data.g.dart').existsSync(), isFalse);
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

  test('MascotSpec shares its parsed states with MascotStates', () {
    expect(
      identical(MascotSpec.instance.states, MascotStates.instance.states),
      isTrue,
    );
    expect(MascotStates.instance.stateKeys, MascotSpec.instance.stateKeys);
  });
}

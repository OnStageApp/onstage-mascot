// mascot.config.json is the one place for names (see the repo README); this package must agree.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('package and widget names agree with mascot.config.json', () {
    final cfg =
        jsonDecode(File('../../mascot.config.json').readAsStringSync())
            as Map<String, Object?>;
    final pubspec = File('pubspec.yaml').readAsStringSync();
    expect(
      RegExp(r'^name:\s*(\S+)', multiLine: true).firstMatch(pubspec)![1],
      cfg['dartPackage'],
    );
    final widget = File('lib/src/buddy.dart').readAsStringSync();
    expect(
      widget.contains('class ${cfg['component']} extends StatefulWidget'),
      isTrue,
    );
    expect(
      File('example/pubspec.yaml').readAsStringSync(),
      contains('${cfg['dartPackage']}:'),
    );
  });
}

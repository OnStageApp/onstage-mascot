import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';
import 'package:onstage_mascot_example/main.dart';

void main() {
  testWidgets('lists all 85 states and switches state and surface', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1400, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const MascotExampleApp());
    expect(find.byType(Buddy), findsOneWidget);
    expect(MascotSpec.instance.states, hasLength(85));
    final third = MascotSpec.instance.states[2];
    await tester.tap(find.text(third.name).first);
    await tester.pump();
    expect(tester.widget<Buddy>(find.byType(Buddy)).state, third.key);
    await tester.tap(find.byType(Switch));
    await tester.pump();
    expect(
      tester.widget<Buddy>(find.byType(Buddy)).surface,
      MascotSurface.dark,
    );
    await tester.pumpWidget(const SizedBox());
  });
}

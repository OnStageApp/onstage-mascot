// Every mascot state with a surface toggle. Run: flutter run -d macos (after `flutter create
// --platforms=macos .` once in this folder), or just `flutter test` here.
import 'package:flutter/material.dart';
import 'package:onstage_mascot/mascot.dart';

void main() => runApp(const MascotExampleApp());

class MascotExampleApp extends StatelessWidget {
  const MascotExampleApp({super.key});

  @override
  Widget build(BuildContext context) =>
      const MaterialApp(title: 'Mascot states', home: StatePicker());
}

class StatePicker extends StatefulWidget {
  const StatePicker({super.key});

  @override
  State<StatePicker> createState() => _StatePickerState();
}

class _StatePickerState extends State<StatePicker> {
  final List<MascotStateDef> _states = MascotSpec.instance.states;
  String _key = 'hello';
  MascotSurface _surface = MascotSurface.light;
  int _replay = 0;

  @override
  Widget build(BuildContext context) {
    final dark = _surface == MascotSurface.dark;
    final st = MascotSpec.instance.state(_key);
    return Scaffold(
      appBar: AppBar(
        title: Text('${st.name} (${st.key})'),
        actions: [
          IconButton(
            tooltip: 'Play again',
            icon: const Icon(Icons.replay),
            onPressed: () => setState(() => _replay++),
          ),
          Row(
            children: [
              const Text('Dark'),
              Switch(
                value: dark,
                onChanged: (v) => setState(
                  () => _surface = v ? MascotSurface.dark : MascotSurface.light,
                ),
              ),
            ],
          ),
        ],
      ),
      body: Row(
        children: [
          SizedBox(
            width: 260,
            child: ListView(
              children: [
                for (final s in _states)
                  ListTile(
                    dense: true,
                    selected: s.key == _key,
                    title: Text(s.name),
                    subtitle: Text('${s.group} · ${s.key}'),
                    onTap: () => setState(() => _key = s.key),
                  ),
              ],
            ),
          ),
          Expanded(
            child: ColoredBox(
              color: dark ? const Color(0xFF0B1B33) : const Color(0xFFF4F4F2),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Buddy(
                      key: ValueKey('$_key/$_replay'),
                      state: _key,
                      surface: _surface,
                      size: 280,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      st.use,
                      style: TextStyle(
                        color: dark ? Colors.white70 : Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

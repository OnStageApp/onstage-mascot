// The static entry (@onstageapp/mascot/static): the resting pose of every state, with no player and no
// motion data. Proves it draws exactly what the animated player draws at rest, that it really does not
// load the motion data, and that BuddyStatic works in a server component.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, web, webStatic, importClosure, checkSvg, readJson } from './helpers.mjs';

const DIST = path.join(ROOT, 'packages/web/dist');
const SURFACES = ['light', 'dark'];

test('static: STATE_KEYS and STATE_INFO list the 85 states of the full entry', async () => {
  const [m, s] = [await web(), await webStatic()];
  assert.deepEqual([...s.STATE_KEYS], [...m.STATE_KEYS]);
  assert.equal(s.STATE_INFO.length, 85);
  s.STATE_INFO.forEach((info, i) => {
    const st = m.getState(info.key);
    assert.deepEqual(info, { key: st.key, group: st.group, name: st.name, use: st.use });
    assert.equal(info.key, s.STATE_KEYS[i]);
  });
  assert.throws(() => s.renderRestSvg('nope'), /Unknown mascot state/);
});

test('static: renderRestSvg equals the animated player\'s resting frame, 85 states x 2 surfaces', async () => {
  const [m, s] = [await web(), await webStatic()];
  let checked = 0;
  for (const key of m.STATE_KEYS) {
    for (const surface of SURFACES) {
      for (const size of [undefined, 160]) {
        const stat = s.renderRestSvg(key, { surface, size });
        checkSvg(stat);
        // The pure frame function at rest.
        assert.equal(stat, m.renderFrameSvg(key, {}, { surface, size }), `${key} ${surface} ${size} vs renderFrameSvg`);
        // The player under reduced motion (rest phase only), which is what a no-motion user sees.
        const reduced = m.createPlayer({ state: key, surface, size, autoStart: false, reducedMotion: true });
        assert.equal(stat, reduced.svg(), `${key} ${surface} ${size} vs reduced-motion player`);
        reduced.destroy();
      }
      checked++;
    }
  }
  assert.equal(checked, 170);
  assert.equal(s.renderRestSvg('hello'), s.renderRestSvg('hello', { surface: 'light' }), 'light is the default');
  assert.notEqual(s.renderRestSvg('hello', { surface: 'dark' }), s.renderRestSvg('hello'));
  console.log(`static rest frames: ${m.STATE_KEYS.length} states x ${SURFACES.length} surfaces identical to the player`);
});

test('static: restSvgDataUri decodes back to the SVG and is safe in attributes and url()', async () => {
  const s = await webStatic();
  for (const key of ['hello', 'no-events', 'loading']) {
    for (const surface of SURFACES) {
      const uri = s.restSvgDataUri(key, { surface, size: 96 });
      assert.ok(uri.startsWith('data:image/svg+xml;charset=utf-8,'));
      assert.doesNotMatch(uri, /["'<>()\s#]/);
      assert.equal(decodeURIComponent(uri.slice(uri.indexOf(',') + 1)), s.renderRestSvg(key, { surface, size: 96 }));
    }
  }
});

test('static: the entry loads no motion data (import graph and contents)', () => {
  const NOT_ALLOWED = ['spec-data', 'player', 'pose', 'rng', 'render', 'svg', 'index', 'react'];
  const { files, bare } = importClosure(path.join(DIST, 'static.js'));
  const names = files.map(f => path.basename(f, '.js'));
  for (const bad of NOT_ALLOWED) assert.ok(!names.includes(bad), `static must not import ${bad}.js (loaded: ${names})`);
  assert.deepEqual(bare.sort(), ['react/jsx-runtime']);
  const pure = importClosure(path.join(DIST, 'static-svg.js'));
  assert.deepEqual(pure.bare, [], 'static-svg has no dependency at all');

  const text = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  // Fields only a motion clip or the player's settings carry.
  for (const marker of ['introFrames', 'eyeTypes', 'mouthTypes', 'gapMin', 'doubleChance', 'doubleGap', 'actorOffset', '\\"fps\\"', '\\"rows\\"', '\\"frames\\"', '\\"plays\\"', '\\"fields\\"', '\\"constants\\"', 'requestAnimationFrame', 'mulberry', 'setInterval', 'setTimeout']) {
    assert.ok(!text.includes(marker), `static closure contains ${marker}`);
  }
  // No clip: each clip is stored with its own id in "id":"<clip>" form, and no state carries a motion reference.
  const clipIds = fs.readdirSync(path.join(ROOT, 'spec/motion')).map(f => f.slice(0, -5));
  assert.ok(clipIds.length > 15);
  for (const id of clipIds) assert.ok(!text.includes(`\\"id\\":\\"${id}\\"`), `static closure contains clip ${id}`);
  assert.ok(!text.includes('\\"motion\\"'), 'static closure carries a motion reference');
  // Control: the same scan does find them in the full entry, so the checks above can fail.
  const fullText = importClosure(path.join(DIST, 'index.js')).files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  for (const marker of ['introFrames', 'gapMin', 'requestAnimationFrame', '\\"motion\\"']) assert.ok(fullText.includes(marker), `control: full entry has ${marker}`);
  // And the data module really is the states-only one.
  const staticData = fs.readFileSync(path.join(DIST, 'static-data.js'), 'utf8');
  assert.ok(staticData.length < fs.readFileSync(path.join(DIST, 'spec-data.js'), 'utf8').length / 2);
});

test('static: size of the static entry against the full entry (raw and gzip)', () => {
  const size = entry => {
    const { files } = importClosure(path.join(DIST, entry));
    const raw = files.map(f => fs.readFileSync(f));
    const all = Buffer.concat(raw);
    return { files: files.length, raw: all.length, gzip: zlib.gzipSync(all, { level: 9 }).length };
  };
  const full = size('index.js'), react = size('react.js'), stat = size('static.js'), pure = size('static-svg.js');
  const row = (n, s) => `${n.padEnd(22)} ${String(s.files).padStart(2)} files  ${String(s.raw).padStart(7)} B raw  ${String(s.gzip).padStart(6)} B gzip`;
  console.log([
    'bundle-free dist sizes (every file the entry loads, concatenated):',
    row('@onstageapp/mascot', full), row('@onstageapp/mascot/react', react), row('@onstageapp/mascot/static', stat), row('.../static-svg', pure),
    `static is ${(100 * stat.raw / full.raw).toFixed(1)}% of the full entry raw, ${(100 * stat.gzip / full.gzip).toFixed(1)}% gzip`,
  ].join('\n'));
  assert.ok(stat.raw < full.raw * 0.6);
  assert.ok(stat.gzip < full.gzip * 0.6);
  assert.ok(pure.raw < stat.raw);
});

test('static: BuddyStatic renders in a server component (no client directive, no hooks)', async () => {
  const React = await import('react');
  const { renderToString, renderToStaticMarkup } = await import('react-dom/server');
  const { BuddyStatic, renderRestSvg } = await webStatic();
  const src = fs.readFileSync(path.join(ROOT, 'packages/web/src/buddy-static.tsx'), 'utf8');
  const built = fs.readFileSync(path.join(DIST, 'buddy-static.js'), 'utf8');
  for (const t of [src, built]) {
    assert.doesNotMatch(t, /^\s*['"]use client['"]/m, 'no client directive');
    assert.doesNotMatch(t, /\buse(State|Effect|Ref|Memo|LayoutEffect|Callback|Reducer|Context)\b/);
  }

  const html = renderToStaticMarkup(React.createElement(BuddyStatic, { state: 'no-events', size: 120 }));
  assert.match(html, /^<span role="img" aria-label="No events yet" style="display:inline-block;width:120px;height:120px;line-height:0">/);
  assert.ok(html.includes(renderRestSvg('no-events', { size: 120 })));
  assert.doesNotMatch(html, /aria-hidden/);

  const titled = renderToStaticMarkup(React.createElement(BuddyStatic, { state: 'no-events', title: 'Nothing planned yet' }));
  assert.match(titled, /aria-label="Nothing planned yet"/);

  const decorative = renderToStaticMarkup(React.createElement(BuddyStatic, { state: 'hello', decorative: true }));
  assert.match(decorative, /aria-hidden="true"/);

  const empty = renderToStaticMarkup(React.createElement(BuddyStatic, { state: 'hello', title: '' }));
  assert.doesNotMatch(empty, /role=|aria-label/);
  assert.match(empty, /aria-hidden="true"/);

  const dark = renderToString(React.createElement(BuddyStatic, { state: 'hello', surface: 'dark', className: 'x', style: { margin: 4 } }));
  assert.match(dark, /class="x"/);
  assert.match(dark, /margin:4px/);
  assert.ok(dark.includes(renderRestSvg('hello', { surface: 'dark', size: 160 })));
});

test('static: the entries resolve by package name; static-svg runs without React', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    "const s = await import('@onstageapp/mascot/static'); const v = await import('@onstageapp/mascot/static-svg'); console.log(typeof s.BuddyStatic, typeof s.renderRestSvg, typeof v.renderRestSvg, v.STATE_KEYS.length)"], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.stdout.trim(), 'function function function 85', r.stderr);
  // static-svg alone, with module resolution of react blocked: it must not need it.
  const hooks = `data:text/javascript,${encodeURIComponent("export async function resolve(s, c, n) { if (s.startsWith('react')) throw new Error('react is not available'); return n(s, c); }")}`;
  const reg = `import { register } from 'node:module'; register(${JSON.stringify(hooks)}); const v = await import(${JSON.stringify(pathToFileURL(path.join(DIST, 'static-svg.js')).href)}); console.log(v.renderRestSvg('hello').length > 100)`;
  const q = spawnSync(process.execPath, ['--input-type=module', '-e', reg], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(q.stdout.trim(), 'true', q.stderr);
  const pkg = readJson('package.json');
  assert.equal(pkg.exports['./static'].import, './packages/web/dist/static.js');
  assert.equal(pkg.exports['./static'].types, './packages/web/dist/static.d.ts');
});

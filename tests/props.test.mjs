// Props on their own (spec/props.json, 0.4.0): renderPropSvg and PropStatic in the static entry.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, webStatic, checkSvg, readJson } from './helpers.mjs';

const palette = readJson('spec/palette.json'), props = readJson('spec/props.json');
const KEYS = ['microphone', 'acousticGuitar', 'electricGuitar', 'bass', 'keys', 'drums', 'sound', 'slides', 'lights', 'camera', 'livestream', 'clipboard'];

function walk(layers, visit) { for (const l of layers) { visit(l); if (l.type === 'group') walk(l.children, visit); } }

test('props.json: the keys of MascotProp, valid tokens, a box around the drawing', () => {
  assert.equal(props.format, 1);
  assert.deepEqual(props.props.map(p => p.key), KEYS);
  const union = fs.readFileSync(path.join(ROOT, 'packages/web/src/types.ts'), 'utf8').match(/export type MascotProp =([^;]+);/)[1];
  assert.deepEqual([...union.matchAll(/'([^']+)'/g)].map(m => m[1]), KEYS, 'types.ts MascotProp lists the same keys');
  const tokens = new Set(palette.tokens);
  for (const p of props.props) {
    assert.ok(p.name && p.use, p.key);
    assert.equal(p.box.length, 4); assert.ok(p.box[2] > 0 && p.box[3] > 0, p.key);
    walk(p.layers, l => {
      assert.notEqual(l.type, 'actor', `${p.key}: no Buddy in a prop`);
      for (const k of ['fill', 'stroke']) if (l[k] != null) assert.ok(tokens.has(l[k]), `${p.key}: ${l[k]}`);
      if (l.type === 'path') assert.match(l.d, /^M[-\d. MLCZ]+$/, `${p.key}: absolute M L C Z only`);
    });
  }
});

test('renderPropSvg: every prop on both surfaces, well formed and deterministic', async () => {
  const s = await webStatic();
  assert.deepEqual([...s.PROP_KEYS], KEYS);
  for (const key of KEYS) {
    for (const surface of ['light', 'dark']) {
      const svg = s.renderPropSvg(key, { surface, size: 96 });
      checkSvg(svg);
      assert.equal(svg, s.renderPropSvg(key, { surface, size: 96 }));
      assert.doesNotMatch(svg, /<animate|<script/);
    }
    assert.equal(s.renderPropSvg(key), s.renderPropSvg(key, { surface: 'light' }), 'light is the default');
  }
  assert.throws(() => s.renderPropSvg('tuba'), /Unknown mascot prop/);
});

test('renderPropSvg: size sets the area; no side over 1.5 times size; the box sets the viewBox', async () => {
  const s = await webStatic();
  for (const p of props.props) {
    const svg = s.renderPropSvg(p.key, { size: 100 });
    const [, w, h] = svg.match(/width="([\d.]+)" height="([\d.]+)"/).map(Number);
    assert.ok(w <= 150 && h <= 150, `${p.key}: ${w} x ${h}`);
    assert.ok(Math.sqrt(w * h) <= 101, `${p.key}: area`);
    assert.ok(Math.abs(w / h - p.box[2] / p.box[3]) < 0.05, `${p.key}: proportions`);
    assert.ok(svg.includes(`viewBox="${p.box.join(' ')}"`), p.key);
    assert.doesNotMatch(s.renderPropSvg(p.key).match(/^<svg[^>]*>/)[0], /width=/, 'no size, no width');
  }
});

test('renderPropSvg: on dark, the parts that sit on the page turn light', async () => {
  const s = await webStatic();
  const { light, dark } = palette.surfaces;
  assert.notEqual(light.propInk, dark.propInk);
  for (const key of ['microphone', 'acousticGuitar', 'livestream', 'lights', 'camera']) {
    assert.ok(s.renderPropSvg(key).includes(light.propInk), key);
    assert.ok(s.renderPropSvg(key, { surface: 'dark' }).includes(dark.propInk), key);
  }
});

test('PropStatic renders on the server: named by default, hidden when decorative', async () => {
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { PropStatic } = await import(pathToFileURL(path.join(ROOT, 'packages/web/dist/static.js')).href);
  const s = await webStatic();
  const named = renderToString(React.createElement(PropStatic, { prop: 'camera', size: 64 }));
  assert.match(named, /role="img"/); assert.match(named, /aria-label="Camera"/);
  assert.ok(named.includes(s.renderPropSvg('camera', { size: 64 })));
  const titled = renderToString(React.createElement(PropStatic, { prop: 'bass', title: 'Bass player' }));
  assert.match(titled, /aria-label="Bass player"/);
  const hidden = renderToString(React.createElement(PropStatic, { prop: 'drums', decorative: true }));
  assert.match(hidden, /aria-hidden="true"/); assert.doesNotMatch(hidden, /role=/);
  const dark = renderToString(React.createElement(PropStatic, { prop: 'microphone', surface: 'dark', decorative: true }));
  assert.ok(dark.includes(palette.surfaces.dark.propInk));
});

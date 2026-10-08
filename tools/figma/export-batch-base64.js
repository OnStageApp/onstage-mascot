// use_figma script. Alternative to the screenshot route: export variants as base64 PNG at scale 2.
// Costly in tokens (about 13 KB of base64 per variant), so the get_screenshot route in
// make-export-instances.js is preferred. Keep each batch to about 6 variants (< 100 KB response).
const KEYS = ['hello', 'welcome-team'];   // replace with a batch of keys
const cs = await figma.getNodeByIdAsync('65119:17579');
const out = {};
for (const k of KEYS) {
  const v = cs.children.find(c => c.name === 'state=' + k);
  if (!v) { out[k] = null; continue; }
  const bytes = await v.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
  out[k] = figma.base64Encode(bytes);
}
return out;

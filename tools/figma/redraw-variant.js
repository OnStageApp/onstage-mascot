// use_figma script. Redraw ONE flagged variant in place from the code's SVG (code wins).
// Keeps the variant node, its name and its position. Before running:
//   1. save the old export to reports/figma-parity/before/<key>.png
//   2. node tools/render-svg.mjs <key> --size 240 --out /tmp/<key>.svg   (no --background, so it stays transparent)
//   3. paste the SVG text into SVG below and set KEY.
// Afterwards re-export and re-run compare.py (the tool returns the evidence below).
const PAGE_ID = '63974:99457';
const SET_ID = '65119:17579';
const KEY = '__KEY__';
const SVG = `__SVG__`;
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const cs = await figma.getNodeByIdAsync(SET_ID);
const c = cs.children.find(v => v.name === 'state=' + KEY);   // by name, never by position
if (!c || c.type !== 'COMPONENT') throw new Error('variant not found: ' + KEY);
const keep = { x: c.x, y: c.y, name: c.name };
const tmp = figma.createNodeFromSvg(SVG);
for (const ch of [...c.children]) ch.remove();
for (const ch of [...tmp.children]) c.appendChild(ch);
tmp.remove();
// ASCII layer names, in draw order
c.children.forEach((ch, i) => { ch.name = 'layer-' + String(i + 1).padStart(2, '0'); });
c.fills = [];            // transparent
c.clipsContent = true;
if (c.width !== 240 || c.height !== 240) c.resize(240, 240);
return { id: c.id, name: c.name, x: c.x, y: c.y, keep, w: c.width, h: c.height, layers: c.children.length, fills: c.fills.length };

// use_figma script. Step 2a of the sync: build a temporary frame holding one 2x instance (480 x 480)
// of every variant, to the right of everything on the page. Then call get_screenshot on each
// returned instance id with maxDimension 480 and contentsOnly true (a 240 px node would be
// exported at 240 only, hence the 2x instances), and download each URL with curl into
// reports/figma-parity/figma/<key>.png. Instances follow the variants, so after a redraw the same
// ids can be exported again. Finish with remove-export-instances.js.
const PAGE_ID = '63974:99457';
const SET_ID = '65119:17579';
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
let maxR = 0;
for (const n of page.children) maxR = Math.max(maxR, n.x + n.width);
const cs = await figma.getNodeByIdAsync(SET_ID);
if (!cs || cs.type !== 'COMPONENT_SET') throw new Error('component set missing');
const tmp = figma.createFrame();
tmp.name = 'tmp-parity-export';
tmp.fills = [];
tmp.clipsContent = false;
const COLS = 10, ids = [];
cs.children.forEach((v, i) => {
  const inst = v.createInstance();
  inst.rescale(2);
  tmp.appendChild(inst);
  inst.x = (i % COLS) * 500; inst.y = Math.floor(i / COLS) * 500;
  inst.name = v.name;
  ids.push([v.name.replace('state=', ''), inst.id]);
});
tmp.resize(COLS * 500, Math.ceil(cs.children.length / COLS) * 500);
tmp.x = maxR + 400; tmp.y = 0;
return { tmpId: tmp.id, ids };

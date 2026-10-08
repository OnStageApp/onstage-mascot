// use_figma script. Write the variant descriptions and the component set description.
// Generate the payload with: node tools/figma/build-descriptions.mjs
// and paste its output in place of __DESCRIPTIONS__. Descriptions only exist on COMPONENT and
// COMPONENT_SET nodes, which is what these are. Variants are found by name, never by position.
const D = __DESCRIPTIONS__;
const PAGE_ID = '63974:99457';
const SET_ID = '65119:17579';
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const cs = await figma.getNodeByIdAsync(SET_ID);
if (!cs || cs.type !== 'COMPONENT_SET') throw new Error('component set missing');
const missing = [], changed = [], same = [];
for (const [key, text] of Object.entries(D.variants)) {
  const v = cs.children.find(c => c.name === 'state=' + key);
  if (!v || v.type !== 'COMPONENT') { missing.push(key); continue; }
  if (v.description === text) { same.push(key); continue; }
  v.description = text;
  changed.push(key);
}
// keep the existing set text, replace only our own trailing paragraph (idempotent)
const base = cs.description.split('\n\n' + D.mark)[0].trim();
cs.description = base + '\n\n' + D.setDescriptionTail;
return { changed: changed.length, same: same.length, missing, set: cs.description };

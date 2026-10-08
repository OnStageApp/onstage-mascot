// use_figma script. Step 1 of the sync: read the variant names of the component set.
// Pass skillNames "figma-use". Compare the result with spec/states.json (compare.py does it
// from reports/figma-parity/figma-names.json). Never rename or delete a variant, only report.
const PAGE_ID = '63974:99457';   // BRAND page
const SET_ID = '65119:17579';    // Mascot/Buddy App
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const cs = await figma.getNodeByIdAsync(SET_ID);
if (!cs || cs.type !== 'COMPONENT_SET' || cs.name !== 'Mascot/Buddy App') throw new Error('component set not found by id, look it up by name');
return {
  count: cs.children.length,
  names: cs.children.map(c => c.name),
  ids: cs.children.map(c => c.id),
  sizes: [...new Set(cs.children.map(c => c.width + 'x' + c.height))],
  fills: [...new Set(cs.children.map(c => c.fills.length))],
};

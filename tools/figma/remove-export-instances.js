// use_figma script. Step 2b: remove the temporary export frame made by make-export-instances.js.
const PAGE_ID = '63974:99457';
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const gone = [];
for (const n of page.children) {
  if (n.type === 'FRAME' && n.name === 'tmp-parity-export') { gone.push(n.id); n.remove(); }
}
return { removed: gone };

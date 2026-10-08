// npm run preview [-- --port 5178]
// Static file server for the repo root (no dependencies), so examples/playground.html can import the
// built ES modules. Open http://localhost:5178/examples/playground.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, args } from './lib/web.mjs';

const port = +(args().port || 5178);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css' };
http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, path.normalize(url === '/' ? '/examples/playground.html' : url));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/examples/playground.html`));

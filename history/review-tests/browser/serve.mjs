import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2], page = new URL('./page.html', import.meta.url).pathname;
const types = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2' };
http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = u === '/__page.html' ? page : path.join(root, u);
  if (!f.startsWith(root) && f !== page || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(Number(process.argv[3] ?? 8765));

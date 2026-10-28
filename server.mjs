import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const files = new Set(['index.html', 'styles.css', 'app.js', 'blog-reader.js', 'favicon.ico', 'assets/favicon.svg', 'assets/favicon.png', 'assets/apple-touch-icon.png', 'assets/fonts/ChicagoKare-Regular.woff2', 'assets/fonts/ChicagoKare-LICENSE.txt']);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (name === '__preview/mobile') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head><title>Mobile layout preview</title></head><body style="margin:0;background:#ddd;display:flex;justify-content:center"><iframe title="Portfolio at phone width" src="/" style="width:390px;height:844px;border:0;max-width:100vw"></iframe></body></html>');
    return;
  }
  if (!files.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const file = await readFile(path.join(root, name));
    const type = types[path.extname(name)];
    res.writeHead(200, { 'Content-Type': type.startsWith('text/') ? `${type}; charset=utf-8` : type, 'Cache-Control': 'no-store' });
    res.end(file);
  } catch { res.writeHead(500); res.end('Unable to load file'); }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));

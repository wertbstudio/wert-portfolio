// Локальный сервер без зависимостей. На Vercel этот файл не используется.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const handler = require('./api/send');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/send') {
    let body = '', size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 4096) { res.writeHead(413); res.end(); return; } body += chunk; }
    req.body = body;
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    await handler(req, res); return;
  }
  let filename;
  try { filename = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); } catch { res.writeHead(400); res.end(); return; }
  // Явный список публичных файлов: .env, сервер и тесты недоступны по HTTP.
  if (!['/index.html', '/style.css', '/script.js', '/projects.js'].includes(filename) && !/^\/assets\/[\w-]+\.(svg|webp|png|jpe?g|avif)$/.test(filename)) { res.writeHead(404); res.end('Not found'); return; }
  try { const content = await fs.readFile(path.join(root, filename)); res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' }); res.end(content); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));

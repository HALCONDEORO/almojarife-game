// Static-file server for the desktop shell. No Electron imports here so the
// logic is unit-testable with plain `node --test`.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.map': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary',
};

// External pages the shell may open in the system browser. Anything else is
// denied: the game is self-contained and links out only to its own sites.
const ALLOWED_EXTERNAL = [
  'https://github.com/HALCONDEORO/almojarife-game',
  'https://halcondeoro.github.io/almojarife-game',
  'https://www.naturalearthdata.com',
  'https://www.openstreetmap.org',
];

function isAllowedExternal(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  return ALLOWED_EXTERNAL.some((origin) => url === origin || url.startsWith(origin + '/'));
}

// Resolve a URL path inside root, or return null (missing file, traversal,
// or a symlink escaping root). The realpath + separator check rejects the
// classic sibling-prefix bypass (root=/x/app, requested=/x/app2/...).
function resolveGameFile(root, pathname) {
  const candidate = path.normalize(path.join(root, pathname));
  let real;
  try { real = fs.realpathSync(candidate); } catch { return null; }
  if (real !== root && !real.startsWith(root + path.sep)) return null;
  return real;
}

function createStaticServer(root) {
  const realRoot = fs.realpathSync(root);
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400); res.end(); return; }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolveGameFile(realRoot, pathname);
    if (!file) { res.writeHead(404); res.end('Not found'); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server.address().port));
  });
}

module.exports = { createStaticServer, resolveGameFile, isAllowedExternal, listen, ALLOWED_EXTERNAL };

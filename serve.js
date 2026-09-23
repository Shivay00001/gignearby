// GigNearby — zero-dependency static file server (Node stdlib only).
// Serves the three front-end apps:
//   /         -> customer-app
//   /admin    -> admin-app
//   /worker   -> worker-app
// Run:  npm start   (then open http://localhost:8080)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const ROUTES = {
  '/admin': 'admin-app',
  '/worker': 'worker-app',
  '/': 'customer-app',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function resolveApp(urlPath) {
  for (const prefix of ['/admin', '/worker']) {
    if (urlPath === prefix || urlPath.startsWith(prefix + '/')) {
      return { app: ROUTES[prefix], rest: urlPath.slice(prefix.length) || '/' };
    }
  }
  return { app: ROUTES['/'], rest: urlPath };
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const { app, rest } = resolveApp(urlPath);

  let filePath = path.join(__dirname, app, rest === '/' ? 'index.html' : rest.slice(1));
  // Prevent path traversal
  const root = path.join(__dirname, app);
  if (!path.resolve(filePath).startsWith(path.resolve(root))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve the app's index.html
      fs.readFile(path.join(root, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`GigNearby static server on http://localhost:${PORT}`);
  console.log('  /        -> customer app');
  console.log('  /admin   -> admin app');
  console.log('  /worker  -> worker app');
});

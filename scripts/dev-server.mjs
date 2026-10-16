import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8085;

// Load .env
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Mock Response Helper for Vercel Serverless Function compatibility
function createResponseAdapter(res) {
  let statusCode = 200;
  return {
    setHeader(k, v) { res.setHeader(k, v); return this; },
    status(code) { statusCode = code; res.statusCode = code; return this; },
    json(data) {
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    },
    send(data) {
      res.writeHead(statusCode);
      res.end(data);
    },
    end(data) {
      res.writeHead(statusCode);
      res.end(data);
    }
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:8085'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Routing
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').split('?')[0];
    const apiFile = path.join(ROOT_DIR, 'api', `${apiName}.js`);

    if (fs.existsSync(apiFile)) {
      try {
        // Read Body if POST/PUT
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          req.body = body;
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());

          try {
            const mod = await import(`file://${apiFile}?t=${Date.now()}`);
            const handler = mod.default || mod;
            const resAdapter = createResponseAdapter(res);
            await handler(req, resAdapter);
          } catch (handlerErr) {
            console.error(`[API Error] ${pathname}:`, handlerErr);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: handlerErr.message }));
          }
        });
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
      return;
    }
  }

  // 2. Static File Serving
  let relativePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(ROOT_DIR, relativePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const fallback = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[jian_chat] Dev Server running at http://127.0.0.1:${PORT}`);
});

// Static file server + a tiny "share" API, no framework dependencies.
//
// Sharing needs somewhere durable to put book data (Render's free web
// services have no persistent disk — see render.com/docs/free — so we can't
// just write a JSON file to local disk and expect it to survive a restart).
// Instead we proxy two endpoints to a free Supabase Postgres table:
//   POST /api/share      body: the book object   -> { id }
//   GET  /api/share/:id                            -> the book object
//
// Configure these on Render (Environment tab), or in a local .env-style
// export before running `npm start`:
//   SUPABASE_URL          e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY   the "service_role" secret key (NOT the anon key)
//
// See README.md for the one-time Supabase setup (create project, run one
// SQL snippet to make the table).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SHARING_ON = !!(SUPABASE_URL && SUPABASE_KEY);
const MAX_BODY = 20 * 1024 * 1024; // 20MB — generous for a book's worth of downsized JPEGs

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null);
      } catch (e) {
        reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function newShareId() {
  return crypto.randomBytes(6).toString('base64url'); // ~8 chars, URL-safe
}

const SUPABASE_TIMEOUT_MS = 10000;

async function supabaseInsert(id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/shares`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ id, data }),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  return r; // caller checks r.status (201 = created, 409 = id collision)
}

async function supabaseGet(id) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/shares?id=eq.${encodeURIComponent(id)}&select=data`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    }
  );
  if (!r.ok) throw new Error('Supabase read failed: ' + r.status);
  const rows = await r.json();
  return rows[0]?.data ?? null;
}

async function handleCreateShare(req, res) {
  if (!SHARING_ON) return sendJson(res, 503, { error: 'Sharing is not configured on this server yet.' });
  let book;
  try {
    book = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, e.statusCode || 400, { error: e.message });
  }
  if (!book || typeof book !== 'object' || !Array.isArray(book.pages)) {
    return sendJson(res, 400, { error: "That doesn't look like a book." });
  }
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const id = newShareId();
      const r = await supabaseInsert(id, book);
      if (r.status === 201 || r.status === 200) return sendJson(res, 200, { id });
      if (r.status !== 409) {
        const text = await r.text().catch(() => '');
        throw new Error(`Supabase insert failed: ${r.status} ${text}`);
      }
      // 409 = id collision, loop and try a fresh id
    }
    throw new Error('Could not generate a unique share id');
  } catch (e) {
    console.error(e);
    return sendJson(res, 502, { error: 'Could not save the share right now. Try again in a moment.' });
  }
}

async function handleGetShare(req, res, id) {
  if (!SHARING_ON) return sendJson(res, 503, { error: 'Sharing is not configured on this server yet.' });
  try {
    const book = await supabaseGet(id);
    if (!book) return sendJson(res, 404, { error: "This link doesn't point to a journal anymore." });
    return sendJson(res, 200, book);
  } catch (e) {
    console.error(e);
    return sendJson(res, 502, { error: 'Could not load that journal right now. Try again in a moment.' });
  }
}

function serveStatic(req, res, reqPath) {
  const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  // Prevent path traversal outside the public directory
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const hasExtension = path.extname(filePath) !== '';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Only fall back to index.html for extension-less routes (client-side
      // paths like /share/abc123). A missing asset — style.css, app.js, an
      // image — should be a real 404, not a silently-wrong text/html
      // response that browsers then refuse to use as CSS/JS.
      if (hasExtension) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found: ' + reqPath);
        return;
      }
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent(req.url.split('?')[0]);

  if (req.method === 'POST' && reqPath === '/api/share') return void handleCreateShare(req, res);
  const shareMatch = reqPath.match(/^\/api\/share\/([A-Za-z0-9_-]+)$/);
  if (req.method === 'GET' && shareMatch) return void handleGetShare(req, res, shareMatch[1]);

  serveStatic(req, res, reqPath === '/' ? '/index.html' : reqPath);
});

server.listen(PORT, () => {
  console.log(`Date journal running at http://localhost:${PORT}`);
  console.log(`Sharing is ${SHARING_ON ? 'ON' : 'OFF (set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable)'}`);
});

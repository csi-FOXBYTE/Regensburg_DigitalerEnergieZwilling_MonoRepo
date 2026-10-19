// Serves the frontend build; everything not in the build comes from UPSTREAM.
// With MATOMO_TRACKER_URL set it also answers the analytics config, like a
// backend with MATOMO_URL and MATOMO_SITE_ID would.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = process.env.DIST ?? '/dist';
const UPSTREAM = process.env.UPSTREAM ?? 'https://det.rg.foxbyte.de';
const PORT = Number(process.env.PORT ?? 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.xml': 'application/xml',
};

const isFile = (path) =>
  stat(path).then(
    (s) => s.isFile(),
    () => false,
  );

async function localFile(pathname) {
  const base = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!base.startsWith(DIST)) return null;
  const candidates = pathname.endsWith('/')
    ? [join(base, 'index.html')]
    : [base, `${base}.html`, join(base, 'index.html')];
  for (const candidate of candidates)
    if (await isFile(candidate)) return candidate;
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/public/analytics-config') {
      const trackerUrl = process.env.MATOMO_TRACKER_URL;
      const siteId = Number(process.env.MATOMO_SITE_ID);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(
        JSON.stringify({ matomo: trackerUrl ? { trackerUrl, siteId } : null }),
      );
    }
    const file =
      !url.pathname.startsWith('/api/') && (await localFile(url.pathname));
    if (file) {
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      return res.end(await readFile(file));
    }
    const body = ['GET', 'HEAD'].includes(req.method)
      ? undefined
      : Buffer.concat(await req.toArray());
    const upstream = await fetch(UPSTREAM + url.pathname + url.search, {
      method: req.method,
      body,
      headers: { 'content-type': req.headers['content-type'] ?? '' },
    });
    const headers = {};
    for (const name of ['content-type', 'cache-control', 'location']) {
      const value = upstream.headers.get(name);
      if (value) headers[name] = value;
    }
    res.writeHead(upstream.status, headers);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.writeHead(502);
    res.end(String(error));
  }
}).listen(PORT, () => console.log(`Serving ${DIST} on port ${PORT}`));

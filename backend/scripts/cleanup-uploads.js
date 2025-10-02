/*
 Cleanup orphan uploads: compare DB references to files under public/uploads.
 Usage:
   node scripts/cleanup-uploads.js --mode=quarantine --dry-run
 Options:
   --mode=quarantine|delete (default: quarantine)
   --dry-run (no file changes)
   --days=30 (only affect files older than N days; default 7)
*/

const path = require('path');
const fs = require('fs');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k === '--dry-run') acc.dryRun = true; else if (k.startsWith('--')) acc[k.slice(2)] = v || true; return acc;
}, {});

const mode = (args.mode || 'quarantine').toLowerCase();
const dryRun = !!args.dryRun;
const days = parseInt(args.days || '7', 10);

const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const quarantineDir = path.join(uploadsDir, '_quarantine');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function collectFiles(dir) {
  const list = [];
  function walk(d) {
    const entries = fs.existsSync(d) ? fs.readdirSync(d) : [];
    for (const name of entries) {
      const p = path.join(d, name);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p); else list.push({ path: p, mtimeMs: s.mtimeMs });
    }
  }
  walk(dir);
  return list;
}

function toAbsFromUrl(url) {
  const clean = url.replace(/\\/g, '/');
  if (!clean.startsWith('/uploads/')) return null;
  return path.join(publicDir, clean);
}

async function getDbUrls() {
  const cfg = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
  };
  const pool = new sql.ConnectionPool(cfg);
  await pool.connect();
  const urls = new Set();

  try {
    const products = await pool.request().query('SELECT ImageURL, ThumbnailURLs, Model3D FROM Products');
    for (const r of products.recordset) {
      if (r.ImageURL) urls.add(r.ImageURL);
      if (r.Model3D) urls.add(r.Model3D);
      if (r.ThumbnailURLs) { try { JSON.parse(r.ThumbnailURLs).forEach(u => u && urls.add(u)); } catch {} }
    }
  } catch {}

  try {
    const vars = await pool.request().query('SELECT VariationImageURL FROM ProductVariations');
    for (const r of vars.recordset) if (r.VariationImageURL) urls.add(r.VariationImageURL);
  } catch {}

  try {
    const items = await pool.request().query('SELECT main_image_url FROM project_items');
    for (const r of items.recordset) if (r.main_image_url) urls.add(r.main_image_url);
  } catch {}
  try {
    const thumbs = await pool.request().query('SELECT image_url FROM project_thumbnails');
    for (const r of thumbs.recordset) if (r.image_url) urls.add(r.image_url);
  } catch {}

  try {
    const t = await pool.request().query('SELECT ImageUrl FROM Testimonials');
    for (const r of t.recordset) if (r.ImageUrl) urls.add(r.ImageUrl);
  } catch {}

  try {
    const hb = await pool.request().query('SELECT HeroBannerImages FROM HeroBanner');
    for (const r of hb.recordset) { try { (JSON.parse(r.HeroBannerImages)||[]).forEach(u => u && urls.add(u)); } catch {} }
  } catch {}

  await pool.close();
  return Array.from(urls);
}

function moveOrDelete(filePath) {
  if (mode === 'delete') {
    if (dryRun) return { action: 'delete', path: filePath, ok: true };
    try { fs.unlinkSync(filePath); return { action: 'delete', path: filePath, ok: true }; } catch (e) { return { action: 'delete', path: filePath, ok: false, error: e.message }; }
  }
  // quarantine
  const rel = path.relative(uploadsDir, filePath);
  const dest = path.join(quarantineDir, rel);
  ensureDir(path.dirname(dest));
  if (dryRun) return { action: 'quarantine', from: filePath, to: dest, ok: true };
  try { fs.renameSync(filePath, dest); return { action: 'quarantine', from: filePath, to: dest, ok: true }; } catch (e) { return { action: 'quarantine', from: filePath, to: dest, ok: false, error: e.message }; }
}

(async function main() {
  ensureDir(quarantineDir);
  const dbUrls = await getDbUrls();
  const dbPaths = new Set(dbUrls.map(u => toAbsFromUrl(u)).filter(Boolean).map(p => p.replace(/\\/g, '/')));
  const files = collectFiles(uploadsDir);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const orphans = files.filter(f => !dbPaths.has(f.path.replace(/\\/g, '/')) && f.mtimeMs < cutoff);
  const actions = orphans.map(f => moveOrDelete(f.path));

  console.log(JSON.stringify({
    config: { mode, dryRun, days },
    counts: { totalFiles: files.length, dbUrlCount: dbPaths.size, orphanCandidates: orphans.length },
    actionsPreview: actions.slice(0, 50)
  }, null, 2));
})();



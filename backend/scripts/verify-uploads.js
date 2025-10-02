/*
 Verify uploads: cross-check DB URLs with filesystem under public/uploads.
 Reports missing files (referenced in DB but not on disk) and orphans (files on disk not referenced in DB).
*/

const path = require('path');
const fs = require('fs');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');

function collectFiles(dir) {
  const list = [];
  function walk(d) {
    const entries = fs.existsSync(d) ? fs.readdirSync(d) : [];
    for (const name of entries) {
      const p = path.join(d, name);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p); else list.push(p);
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

(async function main() {
  const dbConfig = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
  };

  const pool = new sql.ConnectionPool(dbConfig);
  await pool.connect();

  const urls = new Set();

  // Products
  try {
    const products = await pool.request().query('SELECT ImageURL, ThumbnailURLs, Model3D FROM Products');
    for (const r of products.recordset) {
      if (r.ImageURL) urls.add(r.ImageURL);
      if (r.Model3D) urls.add(r.Model3D);
      if (r.ThumbnailURLs) {
        try { JSON.parse(r.ThumbnailURLs).forEach(u => u && urls.add(u)); } catch {}
      }
    }
  } catch {}

  // Variations
  try {
    const vars = await pool.request().query("SELECT VariationImageURL FROM ProductVariations");
    for (const r of vars.recordset) if (r.VariationImageURL) urls.add(r.VariationImageURL);
  } catch {}

  // Projects
  try {
    const items = await pool.request().query('SELECT main_image_url FROM project_items');
    for (const r of items.recordset) if (r.main_image_url) urls.add(r.main_image_url);
  } catch {}
  try {
    const thumbs = await pool.request().query('SELECT image_url FROM project_thumbnails');
    for (const r of thumbs.recordset) if (r.image_url) urls.add(r.image_url);
  } catch {}

  // Testimonials
  try {
    const t = await pool.request().query('SELECT ImageUrl FROM Testimonials');
    for (const r of t.recordset) if (r.ImageUrl) urls.add(r.ImageUrl);
  } catch {}

  // HeroBanner (best-effort based on code expectations)
  try {
    const hb = await pool.request().query('SELECT HeroBannerImages FROM HeroBanner');
    for (const r of hb.recordset) {
      try { (JSON.parse(r.HeroBannerImages)||[]).forEach(u => u && urls.add(u)); } catch {}
    }
  } catch {}

  await pool.close();

  const dbPaths = new Set(Array.from(urls).map(u => toAbsFromUrl(u)).filter(Boolean));
  const allFiles = collectFiles(uploadsDir).map(p => p.replace(/\\/g, '/'));
  const allSet = new Set(allFiles);

  const missing = Array.from(dbPaths).filter(p => !fs.existsSync(p)).map(p => p.replace(/\\/g, '/'));
  const orphans = allFiles.filter(p => !dbPaths.has(p));

  console.log(JSON.stringify({
    counts: {
      dbUrlCount: urls.size,
      fsFileCount: allFiles.length,
      missingCount: missing.length,
      orphanCount: orphans.length
    },
    missing,
    orphansPreview: orphans.slice(0, 50)
  }, null, 2));
})();



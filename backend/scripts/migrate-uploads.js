/*
 Migration: Reorganize existing uploads into feature-based folders and update DB URLs.

 Moves files in backend/public/uploads into:
 - products/images, products/thumbnails, products/models
 - variations
 - projects/main, projects/thumbnails
 - hero-banners
 - testimonials

 Updates MSSQL tables/columns to reflect new URLs.
*/

const path = require('path');
const fs = require('fs');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');

const targetDirs = {
  productImages: path.join(uploadsDir, 'products', 'images'),
  productThumbnails: path.join(uploadsDir, 'products', 'thumbnails'),
  productModels: path.join(uploadsDir, 'products', 'models'),
  variations: path.join(uploadsDir, 'variations'),
  projectsMain: path.join(uploadsDir, 'projects', 'main'),
  projectsThumbnails: path.join(uploadsDir, 'projects', 'thumbnails'),
  heroBanners: path.join(uploadsDir, 'hero-banners'),
  testimonials: path.join(uploadsDir, 'testimonials')
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
Object.values(targetDirs).forEach(ensureDir);

const dbConfig = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true }
};

// Ensure a thumbnail URL uses the thumbnails folder and move the file if needed
async function forceThumbnailUrlAndMove(oldUrl) {
  if (!oldUrl) return oldUrl;
  const clean = String(oldUrl).replace(/\\/g, '/');
  const filename = clean.split('/').pop();
  if (!filename) return oldUrl;

  const dest = path.join(targetDirs.productThumbnails, filename);
  const srcCandidates = [
    path.join(targetDirs.productThumbnails, filename),
    path.join(targetDirs.productImages, filename)
  ];
  try {
    // If file exists in images but not in thumbnails, move it
    if (fs.existsSync(srcCandidates[1]) && !fs.existsSync(dest)) {
      ensureDir(path.dirname(dest));
      await moveSafe(srcCandidates[1], dest);
    }
  } catch (_) {}
  return '/uploads/products/thumbnails/' + filename;
}

function moveSafe(src, dest) {
  return new Promise((resolve) => {
    fs.rename(src, dest, (err) => {
      if (!err) return resolve({ ok: true, dest });
      // If cross-device or exists, fallback to copy+unlink
      if (err) {
        fs.copyFile(src, dest, (copyErr) => {
          if (copyErr) return resolve({ ok: false, error: copyErr });
          fs.unlink(src, (unlinkErr) => resolve({ ok: !unlinkErr, error: unlinkErr || null, dest }));
        });
      }
    });
  });
}

function detectTargetSubpath(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('testimonial')) return path.join('testimonials', filename);
  if (lower.includes('hero') || lower.includes('banner')) return path.join('hero-banners', filename);
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return path.join('products', 'models', filename);
  if (lower.includes('thumb')) return path.join('products', 'thumbnails', filename);
  if (lower.includes('variation')) return path.join('variations', filename);
  if (lower.includes('project') || lower.includes('gallery')) return path.join('projects', 'thumbnails', filename);
  // Default product image
  return path.join('products', 'images', filename);
}

async function moveLooseFiles() {
  const entries = fs.readdirSync(uploadsDir);
  let moved = 0;
  for (const name of entries) {
    const src = path.join(uploadsDir, name);
    const stat = fs.statSync(src);
    if (stat.isFile()) {
      const subpath = detectTargetSubpath(name);
      const dest = path.join(uploadsDir, subpath);
      ensureDir(path.dirname(dest));
      const res = await moveSafe(src, dest);
      if (res.ok) moved++;
    }
  }
  return moved;
}

function rewriteUrl(oldUrl) {
  if (!oldUrl) return oldUrl;
  // Normalize
  const clean = oldUrl.replace(/\\/g, '/');
  if (!clean.startsWith('/uploads/')) return oldUrl;
  const filename = clean.split('/').pop();
  const subpath = detectTargetSubpath(filename);
  return '/uploads/' + subpath.replace(/\\/g, '/');
}

async function updateDb(pool) {
  // Ensure Products.ThumbnailURLs exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
    ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
  `);

  // Products: ImageURL, ThumbnailURLs (JSON array of URLs), Model3D
  const products = await pool.request().query('SELECT ProductID, ImageURL, ThumbnailURLs, Model3D FROM Products');
  for (const row of products.recordset) {
    const newImage = rewriteUrl(row.ImageURL);
    let newThumbs = row.ThumbnailURLs;
    try {
      const arr = row.ThumbnailURLs ? JSON.parse(row.ThumbnailURLs) : [];
      // Force all thumbnail URLs into thumbnails folder regardless of filename
      const mapped = [];
      for (const u of arr) {
        // Also move underlying file from images -> thumbnails if necessary
        // and always emit a thumbnails path
        const forced = await forceThumbnailUrlAndMove(u);
        mapped.push(forced);
      }
      newThumbs = JSON.stringify(mapped);
    } catch (e) {
      // skip on parse error
    }
    const newModel = rewriteUrl(row.Model3D);
    await pool.request()
      .input('id', sql.Int, row.ProductID)
      .input('img', sql.NVarChar, newImage)
      .input('thumbs', sql.NVarChar, newThumbs)
      .input('model', sql.NVarChar, newModel)
      .query('UPDATE Products SET ImageURL=@img, ThumbnailURLs=@thumbs, Model3D=@model WHERE ProductID=@id');
  }

  // Variations: VariationImageURL (force into /uploads/variations/<filename>)
  if ((await pool.request().query("SELECT COUNT(*) c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ProductVariations' AND COLUMN_NAME='VariationImageURL'"))
        .recordset[0].c > 0) {
    const vars = await pool.request().query('SELECT VariationID, VariationImageURL FROM ProductVariations');
    for (const row of vars.recordset) {
      const current = (row.VariationImageURL || '').replace(/\\/g, '/');
      const filename = current ? current.split('/').pop() : null;
      const forced = filename ? ('/uploads/variations/' + filename) : null;
      const url = forced || row.VariationImageURL;
      await pool.request().input('id', sql.Int, row.VariationID).input('u', sql.NVarChar, url)
        .query('UPDATE ProductVariations SET VariationImageURL=@u WHERE VariationID=@id');
    }
  }

  // Projects: project_items.main_image_url, project_thumbnails.image_url
  const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('project_items','project_thumbnails')");
  const tableNames = tables.recordset.map(r => r.TABLE_NAME);
  if (tableNames.includes('project_items')) {
    const items = await pool.request().query('SELECT id, main_image_url FROM project_items');
    for (const row of items.recordset) {
      const url = rewriteUrl(row.main_image_url);
      await pool.request().input('id', sql.Int, row.id).input('u', sql.NVarChar, url)
        .query('UPDATE project_items SET main_image_url=@u WHERE id=@id');
    }
  }
  if (tableNames.includes('project_thumbnails')) {
    const thumbs = await pool.request().query('SELECT project_item_id, image_url FROM project_thumbnails');
    for (const row of thumbs.recordset) {
      const url = rewriteUrl(row.image_url);
      await pool.request().input('pid', sql.Int, row.project_item_id).input('u', sql.NVarChar, url)
        .query('UPDATE project_thumbnails SET image_url=@u WHERE project_item_id=@pid AND image_url=@u');
    }
  }

  // Testimonials: ImageURL
  if ((await pool.request().query("SELECT COUNT(*) c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Testimonials'"))
        .recordset[0].c > 0) {
    const t = await pool.request().query('SELECT ID, ImageUrl FROM Testimonials');
    for (const row of t.recordset) {
      const url = rewriteUrl(row.ImageUrl);
      await pool.request().input('id', sql.Int, row.ID).input('u', sql.NVarChar, url)
        .query('UPDATE Testimonials SET ImageUrl=@u WHERE ID=@id');
    }
  }

  // HeroBanner: HeroBannerImages (JSON array)
  if ((await pool.request().query("SELECT COUNT(*) c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='HeroBanner'"))
        .recordset[0].c > 0) {
    const hb = await pool.request().query('SELECT ID, HeroBannerImages FROM HeroBanner');
    for (const row of hb.recordset) {
      let newArr = row.HeroBannerImages;
      try {
        const arr = row.HeroBannerImages ? JSON.parse(row.HeroBannerImages) : [];
        newArr = JSON.stringify(arr.map(rewriteUrl));
      } catch (e) {}
      await pool.request().input('id', sql.Int, row.ID).input('a', sql.NVarChar, newArr)
        .query('UPDATE HeroBanner SET HeroBannerImages=@a WHERE ID=@id');
    }
  }
}

(async function main() {
  console.log('Starting uploads migration...');
  // Move loose files first
  const moved = await moveLooseFiles();
  console.log(`Moved ${moved} loose files.`);

  // Update database URLs
  const pool = new sql.ConnectionPool(dbConfig);
  try {
    await pool.connect();
    console.log('Connected to MSSQL. Updating URLs...');
    await updateDb(pool);
    console.log('Database URL updates complete.');
  } catch (e) {
    console.error('DB update failed:', e);
  } finally {
    try { await pool.close(); } catch {}
  }

  console.log('Uploads migration finished.');
})();



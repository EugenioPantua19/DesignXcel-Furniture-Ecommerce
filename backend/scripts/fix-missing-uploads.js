/*
 Fix missing upload references by setting them to NULL or a placeholder.
 Options:
   --mode=null|placeholder (default: null)
   --placeholder=/uploads/products/images/placeholder.png (when mode=placeholder)
*/

const path = require('path');
const fs = require('fs');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2).reduce((acc, cur) => { const [k,v]=cur.split('='); if(k.startsWith('--')) acc[k.slice(2)] = v||true; return acc; }, {});
const mode = (args.mode || 'null').toLowerCase();
const placeholderUrl = args.placeholder || '/uploads/products/images/placeholder.png';

const publicDir = path.join(__dirname, '..', 'public');

function toAbsFromUrl(url) { const clean=url.replace(/\\/g,'/'); if(!clean.startsWith('/uploads/')) return null; return path.join(publicDir, clean); }

async function main() {
  const cfg = { server: process.env.DB_SERVER, user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, options: { encrypt:false, trustServerCertificate:true } };
  const pool = new sql.ConnectionPool(cfg);
  await pool.connect();

  const updates = [];

  // Products: ImageURL, Model3D and thumbnails array entries
  try {
    const result = await pool.request().query('SELECT ProductID, ImageURL, ThumbnailURLs, Model3D FROM Products');
    for (const r of result.recordset) {
      const missingImage = r.ImageURL && !fs.existsSync(toAbsFromUrl(r.ImageURL));
      const missingModel = r.Model3D && !fs.existsSync(toAbsFromUrl(r.Model3D));
      let thumbs = []; let changedThumbs = false;
      try { thumbs = r.ThumbnailURLs ? JSON.parse(r.ThumbnailURLs) : []; } catch {}
      const newThumbs = thumbs.map(u => (u && !fs.existsSync(toAbsFromUrl(u))) ? (mode==='null'? null : placeholderUrl) : u).filter(u => u);
      if (JSON.stringify(newThumbs) !== JSON.stringify(thumbs)) changedThumbs = true;

      if (missingImage || missingModel || changedThumbs) {
        const req = pool.request().input('id', sql.Int, r.ProductID);
        let setClauses = [];
        if (missingImage) { req.input('img', sql.NVarChar, mode==='null'? null : placeholderUrl); setClauses.push('ImageURL=@img'); }
        if (missingModel) { req.input('mdl', sql.NVarChar, mode==='null'? null : placeholderUrl); setClauses.push('Model3D=@mdl'); }
        if (changedThumbs) { req.input('ths', sql.NVarChar, JSON.stringify(newThumbs)); setClauses.push('ThumbnailURLs=@ths'); }
        if (setClauses.length) {
          await req.query(`UPDATE Products SET ${setClauses.join(', ')} WHERE ProductID=@id`);
          updates.push({ table:'Products', id:r.ProductID, fields:setClauses });
        }
      }
    }
  } catch {}

  // Variations
  try {
    const result = await pool.request().query('SELECT VariationID, VariationImageURL FROM ProductVariations');
    for (const r of result.recordset) {
      if (r.VariationImageURL && !fs.existsSync(toAbsFromUrl(r.VariationImageURL))) {
        await pool.request()
          .input('id', sql.Int, r.VariationID)
          .input('u', sql.NVarChar, mode==='null'? null : placeholderUrl)
          .query('UPDATE ProductVariations SET VariationImageURL=@u WHERE VariationID=@id');
        updates.push({ table:'ProductVariations', id:r.VariationID, fields:['VariationImageURL'] });
      }
    }
  } catch {}

  // Projects
  try {
    const items = await pool.request().query('SELECT id, main_image_url FROM project_items');
    for (const r of items.recordset) {
      if (r.main_image_url && !fs.existsSync(toAbsFromUrl(r.main_image_url))) {
        await pool.request()
          .input('id', sql.Int, r.id)
          .input('u', sql.NVarChar, mode==='null'? null : placeholderUrl)
          .query('UPDATE project_items SET main_image_url=@u WHERE id=@id');
        updates.push({ table:'project_items', id:r.id, fields:['main_image_url'] });
      }
    }
  } catch {}

  try {
    const thumbs = await pool.request().query('SELECT project_item_id, image_url FROM project_thumbnails');
    for (const r of thumbs.recordset) {
      if (r.image_url && !fs.existsSync(toAbsFromUrl(r.image_url))) {
        await pool.request()
          .input('pid', sql.Int, r.project_item_id)
          .input('u', sql.NVarChar, mode==='null'? null : placeholderUrl)
          .input('old', sql.NVarChar, r.image_url)
          .query('UPDATE project_thumbnails SET image_url=@u WHERE project_item_id=@pid AND image_url=@old');
        updates.push({ table:'project_thumbnails', id:r.project_item_id, fields:['image_url'] });
      }
    }
  } catch {}

  // Testimonials
  try {
    const t = await pool.request().query('SELECT ID, ImageUrl FROM Testimonials');
    for (const r of t.recordset) {
      if (r.ImageUrl && !fs.existsSync(toAbsFromUrl(r.ImageUrl))) {
        await pool.request()
          .input('id', sql.Int, r.ID)
          .input('u', sql.NVarChar, mode==='null'? null : placeholderUrl)
          .query('UPDATE Testimonials SET ImageUrl=@u WHERE ID=@id');
        updates.push({ table:'Testimonials', id:r.ID, fields:['ImageUrl'] });
      }
    }
  } catch {}

  // HeroBanner best-effort (if present and JSON array)
  try {
    const hb = await pool.request().query('SELECT ID, HeroBannerImages FROM HeroBanner');
    for (const r of hb.recordset) {
      try {
        const arr = r.HeroBannerImages ? JSON.parse(r.HeroBannerImages) : [];
        const newArr = arr.map(u => (u && !fs.existsSync(toAbsFromUrl(u))) ? (mode==='null'? null : placeholderUrl) : u).filter(u => u);
        if (JSON.stringify(newArr) !== JSON.stringify(arr)) {
          await pool.request().input('id', sql.Int, r.ID).input('a', sql.NVarChar, JSON.stringify(newArr))
            .query('UPDATE HeroBanner SET HeroBannerImages=@a WHERE ID=@id');
          updates.push({ table:'HeroBanner', id:r.ID, fields:['HeroBannerImages'] });
        }
      } catch {}
    }
  } catch {}

  console.log(JSON.stringify({ mode, placeholderUrl, updated: updates.length, updates }, null, 2));
  await pool.close();
}

main().catch(e => { console.error(e); process.exit(1); });



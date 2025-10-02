const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sql = require('mssql');

module.exports = function(sql, pool) {
    const router = express.Router();

    // Middleware to check if user is logged in
    function isAuthenticated(req, res, next) {
        if (req.session.user) {
            return next();
        }
        
        // Check if this is an AJAX/API request
        const isAjaxRequest = req.xhr || 
                            (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                            (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
                            req.path.startsWith('/api/');
        
        if (isAjaxRequest) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please log in again.',
                requiresLogin: true
            });
        }
        
        req.flash('error', 'Please log in to access this page.');
        res.redirect('/login');
    }

    // Middleware to check user role
    function hasRole(role) {
        return function(req, res, next) {
            const userRole = req.session.user?.role || req.session.user?.roleName || req.session.user?.RoleName;
            console.log('hasRole middleware - checking role:', role, 'user role:', userRole);
            if (req.session.user && userRole === role) {
                return next();
            }
            console.log('hasRole middleware - access denied for role:', role);
            req.flash('error', 'You do not have permission to access this page.');
            res.redirect('/login'); // Or a different unauthorized page
        };
    }

    // Multer storage config with feature-based folders
    const publicDir = path.join(__dirname, 'public');
    const uploadDir = path.join(publicDir, 'uploads');
    const ensureDir = (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log('Created uploads directory:', dirPath);
        }
    };
    ensureDir(uploadDir);

    // Feature subfolders
    const uploadsPaths = {
        testimonials: path.join(uploadDir, 'testimonials'),
        productImages: path.join(uploadDir, 'products', 'images'),
        productThumbnails: path.join(uploadDir, 'products', 'thumbnails'),
        productModels: path.join(uploadDir, 'products', 'models'),
        variations: path.join(uploadDir, 'variations'),
        projectsMain: path.join(uploadDir, 'projects', 'main'),
        projectsThumbnails: path.join(uploadDir, 'projects', 'thumbnails'),
        heroBanners: path.join(uploadDir, 'hero-banners')
    };
    Object.values(uploadsPaths).forEach(ensureDir);

    // Map a request and field to a destination folder
    function resolveUploadDestination(req, file) {
        // Multer runs before the route handler is matched, so req.route may be undefined.
        // Prefer originalUrl, then fallback to baseUrl+path.
        const routePath = (req && (req.originalUrl || ((req.baseUrl || '') + (req.path || '')))) || '';
        const field = file && file.fieldname;

        // Testimonials
        if (routePath.includes('testimonials')) return uploadsPaths.testimonials;

        // Projects
        if (routePath.includes('/api/admin/projects')) {
            if (field === 'mainImage') return uploadsPaths.projectsMain;
            if (field === 'thumbnails') return uploadsPaths.projectsThumbnails;
            // Default for any other files under projects endpoint
            return uploadsPaths.projectsMain;
        }

        // Products (Admin + Inventory)
        if (routePath.includes('/Products/')) {
            if (field === 'image') return uploadsPaths.productImages;
            if (field === 'thumbnails') return uploadsPaths.productThumbnails;
            if (field === 'model3d' || field === 'model') return uploadsPaths.productModels;
            if (/^thumbnail\d+$/.test(field || '')) return uploadsPaths.productThumbnails;
        }

        // Variations
        if (routePath.includes('/Variations/')) return uploadsPaths.variations;

        // Hero banner
        if (routePath.includes('/api/admin/hero-banner')) return uploadsPaths.heroBanners;

        // Heuristics for projects by fieldname, to handle mismatched client keys
        // If any project-like upload slips through without the exact route or field names
        if (/projects/i.test(routePath)) {
            if (/^thumbnails?(\[\])?$/i.test(field || '') || /(thumbnail\d+)/i.test(field || '')) {
                return uploadsPaths.projectsThumbnails;
            }
            if (/^main(image)?$/i.test(field || '') || /^image$/i.test(field || '') || /^file$/i.test(field || '')) {
                return uploadsPaths.projectsMain;
            }
        }

        // Purely by field name fallbacks (route-agnostic) to avoid placing in root uploads
        if (/^thumbnails?(\[\])?$/i.test(field || '') || /(thumbnail\d+)/i.test(field || '')) {
            return uploadsPaths.projectsThumbnails;
        }
        if (/^main(image)?$/i.test(field || '')) {
            return uploadsPaths.projectsMain;
        }

        // Default
        return uploadDir;
    }

    // Build a public URL from a Multer file object
    function getPublicUrl(file) {
        // file.path is absolute or relative; compute path from public root
        const absolutePath = path.isAbsolute(file.path) ? file.path : path.join(process.cwd(), file.path);
        let relativeToPublic = path.relative(publicDir, absolutePath).replace(/\\/g, '/');
        if (!relativeToPublic.startsWith('uploads/')) {
            // fallback for destinations outside publicDir
            return '/uploads/' + (file.filename || path.basename(absolutePath));
        }
        return '/' + relativeToPublic;
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const dest = resolveUploadDestination(req, file);
                ensureDir(dest);
                cb(null, dest);
            } catch (e) {
                console.error('Destination resolve failed, using default uploads folder:', e);
                cb(null, uploadDir);
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    });
    const upload = multer({ storage: storage });

    // Create ProductVariations table if it doesn't exist
    async function ensureProductVariationsTable() {
        try {
            await pool.connect();
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductVariations]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE ProductVariations (
                        VariationID INT IDENTITY(1,1) PRIMARY KEY,
                        ProductID INT NOT NULL,
                        VariationName NVARCHAR(255) NOT NULL,
                        Color NVARCHAR(100) NULL,
                        Quantity INT NOT NULL DEFAULT 1,
                        VariationImageURL NVARCHAR(500) NULL,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE(),
                        IsActive BIT NOT NULL DEFAULT(1),
                        CreatedBy INT NULL,
                        
                        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
                        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL
                    );
                    PRINT 'ProductVariations table created successfully';
                END
            `);
        } catch (error) {
            console.error('Error creating ProductVariations table:', error);
        }
    }

    // Create Testimonials table if it doesn't exist
    async function ensureTestimonialsTable() {
        try {
            await pool.connect();
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Testimonials]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE Testimonials (
                        TestimonialID INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(255) NOT NULL,
                        Profession NVARCHAR(255) NOT NULL,
                        Rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
                        Text NVARCHAR(MAX) NOT NULL,
                        ImageURL NVARCHAR(500) NULL,
                        IsActive BIT NOT NULL DEFAULT(1),
                        DisplayOrder INT NOT NULL DEFAULT 0,
                        CreatedBy INT NULL,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE(),
                        
                        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL
                    );
                    PRINT 'Testimonials table created successfully';
                END
            `);
        } catch (error) {
            console.error('Error creating Testimonials table:', error);
        }
    }

    // Initialize tables on startup
    ensureProductVariationsTable();
    ensureTestimonialsTable();

    // Admin route
    router.get('/Employee/AdminIndex', isAuthenticated, hasRole('Admin'), (req, res) => {
        res.render('Employee/Admin/AdminIndex', { user: req.session.user });
    });

    // Transaction Manager route
    router.get('/Employee/TransactionManager', isAuthenticated, hasRole('TransactionManager'), (req, res) => {
        res.render('Employee/Transaction/TransactionManager', { user: req.session.user });
    });

    // Inventory Manager route
    router.get('/Employee/InventoryManager', isAuthenticated, hasRole('InventoryManager'), (req, res) => {
        res.render('Employee/Inventory/InventoryManager', { user: req.session.user });
    });

    // User Manager route
    router.get('/Employee/UserManager', isAuthenticated, hasRole('UserManager'), (req, res) => {
        res.render('Employee/UserManager/UserManager', { user: req.session.user });
    });

    // Order Support route
    router.get('/Employee/OrderSupport', isAuthenticated, hasRole('OrderSupport'), (req, res) => {
        res.render('Employee/Support/OrderSupport', { user: req.session.user });
    });

    // Admin Products route
    router.get('/Employee/Admin/Products', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            // Get total count
            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);
            // Get paginated products with discount information
            const result = await pool.request().query(`
                SELECT 
                    p.*,
                    pd.DiscountID,
                    pd.DiscountType,
                    pd.DiscountValue,
                    pd.StartDate as DiscountStartDate,
                    pd.EndDate as DiscountEndDate,
                    pd.IsActive as DiscountIsActive,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price - (p.Price * pd.DiscountValue / 100)
                        WHEN pd.DiscountType = 'fixed' THEN 
                            GREATEST(p.Price - pd.DiscountValue, 0)
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            LEAST(pd.DiscountValue, p.Price)
                        ELSE 0
                    END as DiscountAmount
                FROM Products p
                LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                    AND pd.IsActive = 1 
                    AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
                WHERE p.IsActive = 1
                ORDER BY p.ProductID DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
            `);
            const products = result.recordset;
            res.render('Employee/Admin/AdminProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            req.flash('error', 'Could not fetch products.');
            res.render('Employee/Admin/AdminProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    // Admin Variations route
    router.get('/Employee/Admin/Variations', isAuthenticated, hasRole('Admin'), (req, res) => {
        res.render('Employee/Admin/AdminVariations', { user: req.session.user });
    });

    // Admin Raw Materials route
    router.get('/Employee/Admin/RawMaterials', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect(); // Ensure pool is connected
            const result = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 1');
            const materials = result.recordset;
            res.render('Employee/Admin/AdminMaterials', { user: req.session.user, materials: materials });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            req.flash('error', 'Could not fetch raw materials.');
            res.render('Employee/Admin/AdminMaterials', { user: req.session.user, materials: [] });
        }
    });

    // API endpoint to get all raw materials for frontend dropdowns
    router.get('/api/rawmaterials', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MaterialID, Name FROM RawMaterials WHERE IsActive = 1');
            res.json({ success: true, materials: result.recordset });
        } catch (err) {
            console.error('Error fetching raw materials for API:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve raw materials.', error: err.message });
        }
    });

    // Dashboard API endpoints
    router.get('/api/dashboard/products-count', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            res.json({ success: true, count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching products count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve products count.', error: err.message });
        }
    });

    router.get('/api/dashboard/materials-count', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT COUNT(*) as count FROM RawMaterials WHERE IsActive = 1');
            res.json({ success: true, count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching materials count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve materials count.', error: err.message });
        }
    });

    // --- Products API for AdminCMS ---
    // Get all products
    router.get('/api/admin/products', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    ImageURL,
                    DateAdded,
                    IsActive,
                    Dimensions,
                    IsFeatured,
                    Has3DModel
                FROM Products
            `);
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching products for CMS:', err);
            res.status(500).json({ error: 'Failed to fetch products', details: err.message });
        }
    });

    // Set/unset featured
    router.post('/api/admin/products/:id/feature', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { isFeatured } = req.body;
            const productId = req.params.id;
            await pool.connect();
            await pool.request()
                .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsFeatured = @isFeatured WHERE ProductID = @productId');
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating featured status:', err);
            res.status(500).json({ error: 'Failed to update featured status', details: err.message });
        }
    });


    // Get product discount
    router.get('/api/admin/products/:productId/discount', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { productId } = req.params;
            await pool.connect();
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        DiscountID,
                        DiscountType,
                        DiscountValue,
                        StartDate,
                        EndDate,
                        IsActive
                    FROM ProductDiscounts 
                    WHERE ProductID = @productId
                `);
            res.json({ success: true, discount: result.recordset[0] || null });
        } catch (err) {
            console.error('Error fetching product discount:', err);
            res.status(500).json({ error: 'Failed to fetch discount', details: err.message });
        }
    });

    // Add/Update product discount
    router.post('/api/admin/products/:productId/discount', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { productId } = req.params;
            const { discountType, discountValue, startDate, endDate } = req.body;
            await pool.connect();
            
            // Check if discount already exists
            const existingResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT DiscountID FROM ProductDiscounts WHERE ProductID = @productId');
            
            if (existingResult.recordset.length > 0) {
                // Update existing discount
                await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('discountType', sql.VarChar, discountType)
                    .input('discountValue', sql.Decimal(10,2), discountValue)
                    .input('startDate', sql.DateTime, startDate)
                    .input('endDate', sql.DateTime, endDate)
                    .query(`
                        UPDATE ProductDiscounts 
                        SET DiscountType = @discountType, 
                            DiscountValue = @discountValue, 
                            StartDate = @startDate, 
                            EndDate = @endDate,
                            IsActive = 1
                        WHERE ProductID = @productId
                    `);
            } else {
                // Insert new discount
                await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('discountType', sql.VarChar, discountType)
                    .input('discountValue', sql.Decimal(10,2), discountValue)
                    .input('startDate', sql.DateTime, startDate)
                    .input('endDate', sql.DateTime, endDate)
                    .query(`
                        INSERT INTO ProductDiscounts (ProductID, DiscountType, DiscountValue, StartDate, EndDate, IsActive)
                        VALUES (@productId, @discountType, @discountValue, @startDate, @endDate, 1)
                    `);
            }
            
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating product discount:', err);
            res.status(500).json({ error: 'Failed to update discount', details: err.message });
        }
    });

    // Test route to verify routing is working
    router.get('/api/admin/products/test', (req, res) => {
        console.log('TEST ROUTE HIT - /api/admin/products/test');
        res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
    });

    // Delete product (must come before more specific routes)
    router.delete('/api/admin/products/:productId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            console.log('=== DELETE PRODUCT ROUTE HIT ===');
            console.log('DELETE /api/admin/products/:productId - Request received');
            console.log('Product ID:', req.params.productId);
            console.log('User:', req.session.user);
            console.log('Request method:', req.method);
            console.log('Request URL:', req.url);
            
            const productId = req.params.productId;
            await pool.connect();
            
            // First, delete related records (discounts, materials, etc.)
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('DELETE FROM ProductDiscounts WHERE ProductID = @productId');
            
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
            
            // Then delete the product
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('DELETE FROM Products WHERE ProductID = @productId');
            
            res.json({ success: true, message: 'Product deleted successfully' });
        } catch (err) {
            console.error('Error deleting product:', err);
            res.status(500).json({ error: 'Failed to delete product', details: err.message });
        }
    });

    // Delete product discount (must come after general delete route)
    router.delete('/api/admin/products/:productId/discount', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { productId } = req.params;
            await pool.connect();
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('DELETE FROM ProductDiscounts WHERE ProductID = @productId');
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting product discount:', err);
            res.status(500).json({ error: 'Failed to delete discount', details: err.message });
        }
    });

    // Add Product POST route
    router.post('/Employee/Admin/Products/Add', isAuthenticated, hasRole('Admin'), upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnails', maxCount: 4 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        console.log('Received add product request');
        console.log('Request body:', req.body);
        console.log('Files:', req.files);
        try {
            const { name, description, price, stockquantity, category, dimensions, requiredMaterials } = req.body;
            let imageUrl = null;
            let thumbnailUrls = [];
            let model3dUrl = null;
            
            // Handle main product image
            if (req.files && req.files.image && req.files.image[0]) {
                imageUrl = getPublicUrl(req.files.image[0]);
                console.log('Main image saved at:', imageUrl);
            } else {
                console.log('No main image uploaded.');
            }
            
            // Handle thumbnail images
            if (req.files && req.files.thumbnails) {
                thumbnailUrls = req.files.thumbnails.map(file => getPublicUrl(file));
                console.log('Thumbnails saved:', thumbnailUrls);
            } else {
                console.log('No thumbnails uploaded.');
            }

            // Handle 3D model file
            if (req.files && req.files.model3d && req.files.model3d[0]) {
                model3dUrl = getPublicUrl(req.files.model3d[0]);
                console.log('3D model saved at:', model3dUrl);
            } else {
                console.log('No 3D model uploaded.');
            }

            // Get has3dModel from request body
            const has3dModel = req.body.has3dModel;

            // More detailed validation logging
            console.log('Validation check:', {
                name: name,
                price: price,
                stockquantity: stockquantity,
                hasName: !!name,
                hasPrice: !!price,
                hasStockQuantity: !!stockquantity
            });

            // Basic validation
            if (!name || !price || !stockquantity) {
                console.log('Validation failed:', { name, price, stockquantity });
                req.flash('error', 'Name, Price, and Stock Quantity are required.');
                return res.json({ success: false, message: 'Name, Price, and Stock Quantity are required.' });
            }

            await pool.connect();
            
            // Add ThumbnailURLs column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
                ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
            `);
            
            // Add Model3D column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Model3D')
                ALTER TABLE Products ADD Model3D NVARCHAR(500) NULL;
            `);
            
            // Add Has3DModel column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Has3DModel')
                ALTER TABLE Products ADD Has3DModel BIT NOT NULL DEFAULT 0;
            `);
            
            let transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);

                request.input('name', sql.NVarChar, name);
                request.input('description', sql.NVarChar, description || null);
                request.input('price', sql.Decimal(10, 2), parseFloat(price));
                request.input('stockquantity', sql.Int, parseInt(stockquantity));
                request.input('category', sql.NVarChar, category || null);
                request.input('dimensions', sql.NVarChar, dimensions || null);
                request.input('imageurl', sql.NVarChar, imageUrl);
                request.input('thumbnailurls', sql.NVarChar, JSON.stringify(thumbnailUrls));
                request.input('model3d', sql.NVarChar, model3dUrl);
                request.input('has3dmodel', sql.Bit, has3dModel === '1' ? 1 : 0);

                const productResult = await request.query(`
                    INSERT INTO Products (Name, Description, Price, StockQuantity, Category, Dimensions, ImageURL, ThumbnailURLs, Model3D, Has3DModel)
                    OUTPUT INSERTED.ProductID
                    VALUES (@name, @description, @price, @stockquantity, @category, @dimensions, @imageurl, @thumbnailurls, @model3d, @has3dmodel)
                `);

                const newProductID = productResult.recordset[0].ProductID;

                // Insert required materials
                const materials = JSON.parse(requiredMaterials || '[]');
                for (const material of materials) {
                    const materialRequest = new sql.Request(transaction);
                    materialRequest.input('productid', sql.Int, newProductID);
                    materialRequest.input('materialid', sql.Int, material.materialId);
                    materialRequest.input('quantityrequired', sql.Int, material.quantityRequired);
                    await materialRequest.query(`
                        INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                        VALUES (@productid, @materialid, @quantityrequired)
                    `);
                }

                // Log the activity
                const activityRequest = new sql.Request(transaction);
                activityRequest.input('userid', sql.Int, req.session.user.id);
                activityRequest.input('action', sql.NVarChar, 'INSERT');
                activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                activityRequest.input('description', sql.NVarChar,
                    `Added new product "${name}" with initial stock of ${stockquantity}`
                );
                
                await activityRequest.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);

                await transaction.commit();
                req.flash('success', 'Product added successfully!');
                res.json({ success: true, message: 'Product added successfully!' }); // Send JSON response
            } catch (innerErr) {
                await transaction.rollback();
                console.error('Transaction failed:', innerErr);
                req.flash('error', 'An error occurred while adding the product: ' + innerErr.message);
                res.status(500).json({ success: false, message: 'Failed to add product.', error: innerErr.message }); // Send JSON response
            }
        } catch (err) {
            console.error('Error adding product to database (outer catch):', err);
            req.flash('error', 'An unexpected error occurred: ' + err.message);
            res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: err.message }); // Send JSON response
        }
    });

    // Add Raw Material POST route
    router.post('/Employee/Admin/RawMaterials/Add', isAuthenticated, hasRole('Admin'), async (req, res) => {
        console.log('Received add raw material request');
        console.log('Request body:', req.body);
        try {
            const { name, quantity, unit } = req.body;

            // More detailed validation logging
            console.log('Validation check:', {
                name: name,
                quantity: quantity,
                unit: unit,
                hasName: !!name,
                hasQuantity: !!quantity,
                hasUnit: !!unit
            });

            // Basic validation
            if (!name || !quantity || !unit) {
                console.log('Validation failed:', { name, quantity, unit });
                req.flash('error', 'Name, Quantity, and Unit are required.');
                return res.redirect('/Employee/Admin/RawMaterials');
            }

            await pool.connect(); // Ensure pool is connected
            const request = pool.request();

            // Log the values being inserted
            console.log('Inserting values:', {
                name,
                quantity: parseInt(quantity),
                unit
            });

            request.input('name', sql.NVarChar, name);
            request.input('quantity', sql.Int, parseInt(quantity));
            request.input('unit', sql.NVarChar, unit);

            const result = await request.query(`
                INSERT INTO RawMaterials (Name, QuantityAvailable, Unit)
                OUTPUT INSERTED.*
                VALUES (@name, @quantity, @unit)
            `);

            console.log('Insert result:', result);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'INSERT');
                request.input('tableaffected', sql.NVarChar, 'RawMaterials');
                request.input('description', sql.NVarChar,
                    `Added new raw material "${name}" with initial quantity ${quantity} ${unit}`
                );
                
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);

                req.flash('success', 'Raw material added successfully!');
            } else {
                req.flash('error', 'Failed to add raw material. Please try again.');
            }
            res.redirect('/Employee/Admin/RawMaterials');
        } catch (err) {
            console.error('Error adding raw material to database:', err);
            req.flash('error', 'An error occurred while adding the raw material. Details: ' + err.message);
            res.redirect('/Employee/Admin/RawMaterials');
        }
    });

    // Edit Raw Material POST route
    router.post('/Employee/Admin/RawMaterials/Edit', isAuthenticated, hasRole('Admin'), async (req, res) => {
        console.log('Received edit raw material request');
        console.log('Request body:', req.body);
        try {
            const { materialid, name, quantity, unit } = req.body;

            // Basic validation
            if (!materialid || !name || !quantity || !unit) {
                req.flash('error', 'All fields are required for editing raw material.');
                return res.redirect('/Employee/Admin/RawMaterials');
            }

            await pool.connect();
            const request = pool.request();

            request.input('materialid', sql.Int, materialid);
            request.input('name', sql.NVarChar, name);
            request.input('quantity', sql.Int, parseInt(quantity));
            request.input('unit', sql.NVarChar, unit);

            const result = await request.query(`
                UPDATE RawMaterials
                SET Name = @name,
                    QuantityAvailable = @quantity,
                    Unit = @unit,
                    LastUpdated = GETDATE()
                WHERE MaterialID = @materialid
            `);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'UPDATE');
                request.input('tableaffected', sql.NVarChar, 'RawMaterials');
                request.input('description', sql.NVarChar,
                    `Updated raw material "${name}" (ID: ${materialid}) to quantity ${quantity} ${unit}`
                );
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);
                req.flash('success', 'Raw material updated successfully!');
            } else {
                req.flash('error', 'Failed to update raw material. Material not found or no changes made.');
            }
            res.redirect('/Employee/Admin/RawMaterials');
        } catch (err) {
            console.error('Error updating raw material:', err);
            req.flash('error', 'An error occurred while updating the raw material. Details: ' + err.message);
            res.redirect('/Employee/Admin/RawMaterials');
        }
    });

    // Delete Raw Material POST route
    router.post('/Employee/Admin/RawMaterials/Delete/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const materialId = req.params.id;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('materialid', sql.Int, materialId);

            // Fetch material name for logging
            const materialResult = await request.query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialid');
            const materialName = materialResult.recordset[0]?.Name || '';

            const result = await request.query(`
                UPDATE RawMaterials
                SET IsActive = 0
                WHERE MaterialID = @materialid
            `);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'DELETE');
                request.input('tableaffected', sql.NVarChar, 'RawMaterials');
                request.input('recordid', sql.Int, materialId);
                request.input('description', sql.NVarChar, `Deactivated raw material "${materialName}" (ID: ${materialId})`);
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                    VALUES (@userid, @action, @tableaffected, @recordid, @description)
                `);
                req.flash('success', 'Raw material deactivated successfully!');
            } else {
                req.flash('error', 'Failed to deactivate raw material. Material not found.');
            }
            res.redirect('/Employee/Admin/RawMaterials');
        } catch (err) {
            console.error('Error deactivating raw material:', err);
            req.flash('error', 'An error occurred while deactivating the raw material. Details: ' + err.message);
            res.redirect('/Employee/Admin/RawMaterials');
        }
    });

    // Edit Product POST route
    router.post('/Employee/Admin/Products/Edit', isAuthenticated, hasRole('Admin'), upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnails', maxCount: 4 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        console.log('Received edit product request');
        console.log('Request body:', req.body);
        console.log('Files:', req.files);
        console.log('Files structure:', {
            hasFiles: !!req.files,
            imageFiles: req.files?.image,
            thumbnailFiles: req.files?.thumbnails,
            thumbnailCount: req.files?.thumbnails?.length || 0,
            individualThumbnails: {
                thumbnail1: req.files?.thumbnail1,
                thumbnail2: req.files?.thumbnail2,
                thumbnail3: req.files?.thumbnail3,
                thumbnail4: req.files?.thumbnail4
            }
        });
        try {
            const { productid, name, description, price, stockquantity, category, dimensions, requiredMaterials, has3dModel } = req.body;
            let imageUrl = req.body.currentImageURL; // Assuming you send current image URL from frontend
            let thumbnailUrls = [];
            let model3dUrl = req.body.currentModel3dURL; // Current 3D model URL

            // Fetch old product data for comparison
            await pool.connect();
            
            // Add ThumbnailURLs column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
                ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
            `);
            
            // Add Model3D column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Model3D')
                ALTER TABLE Products ADD Model3D NVARCHAR(500) NULL;
            `);
            
            // Add Has3DModel column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Has3DModel')
                ALTER TABLE Products ADD Has3DModel BIT NOT NULL DEFAULT 0;
            `);
            
            const oldProductResult = await pool.request()
                .input('productid', sql.Int, productid)
                .query('SELECT * FROM Products WHERE ProductID = @productid');
            const oldProduct = oldProductResult.recordset[0];

            // Handle main product image
            if (req.files && req.files.image && req.files.image[0]) {
                // Delete old image if it exists and is not a default/placeholder
                if (imageUrl && !imageUrl.startsWith('/uploads/placeholder_')) {
                    const oldImagePath = path.join(__dirname, '..', 'public', imageUrl); // Correct path to public folder
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error('Error deleting old image:', err);
                    });
                }
                imageUrl = getPublicUrl(req.files.image[0]);
                console.log('New main image saved at:', imageUrl);
            }
            
            // Handle thumbnail images - support both bulk and individual uploads
            let newThumbnails = [];
            
            // Handle bulk thumbnail uploads (existing functionality)
            if (req.files && req.files.thumbnails && req.files.thumbnails.length > 0) {
                newThumbnails = req.files.thumbnails.map(file => '/uploads/' + file.filename);
                console.log('Bulk thumbnails uploaded:', newThumbnails);
            }
            
            // Handle individual thumbnail uploads
            const individualThumbnails = [];
            for (let i = 1; i <= 4; i++) {
                const thumbnailKey = `thumbnail${i}`;
                if (req.files && req.files[thumbnailKey] && req.files[thumbnailKey][0]) {
                    individualThumbnails[i - 1] = getPublicUrl(req.files[thumbnailKey][0]);
                    console.log(`Individual thumbnail ${i} uploaded:`, individualThumbnails[i - 1]);
                }
            }
            
            // Get existing thumbnails
            let existingThumbnails = [];
            try {
                if (oldProduct && oldProduct.ThumbnailURLs) {
                    existingThumbnails = JSON.parse(oldProduct.ThumbnailURLs);
                    console.log('Existing thumbnails:', existingThumbnails);
                }
            } catch (error) {
                console.error('Error parsing existing thumbnails:', error);
                existingThumbnails = [];
            }
            
            // Merge thumbnails: use bulk upload if provided, otherwise merge individual uploads with existing
            if (newThumbnails.length > 0) {
                thumbnailUrls = newThumbnails;
            } else {
                // Merge individual uploads with existing thumbnails
                thumbnailUrls = [];
                for (let i = 0; i < 4; i++) {
                    if (individualThumbnails[i]) {
                        thumbnailUrls[i] = individualThumbnails[i];
                    } else if (existingThumbnails[i]) {
                        thumbnailUrls[i] = existingThumbnails[i];
                    }
                }
                // Remove empty slots
                thumbnailUrls = thumbnailUrls.filter(url => url);
            }
            
            console.log('Final thumbnails:', thumbnailUrls);

            // Handle 3D model file
            if (req.files && req.files.model3d && req.files.model3d[0]) {
                // Delete old 3D model if it exists and is not a default/placeholder
                if (model3dUrl && !model3dUrl.startsWith('/uploads/placeholder_')) {
                    const oldModelPath = path.join(__dirname, '..', 'public', model3dUrl);
                    fs.unlink(oldModelPath, (err) => {
                        if (err) console.error('Error deleting old 3D model:', err);
                    });
                }
                model3dUrl = getPublicUrl(req.files.model3d[0]);
                console.log('New 3D model saved at:', model3dUrl);
            } else {
                // Keep existing 3D model if no new one uploaded
                if (oldProduct && oldProduct.Model3D) {
                    model3dUrl = oldProduct.Model3D;
                    console.log('Keeping existing 3D model:', model3dUrl);
                } else {
                    model3dUrl = null;
                    console.log('No existing 3D model found');
                }
            }

            // Basic validation
            if (!productid || !name || !price || !stockquantity) {
                req.flash('error', 'Product ID, Name, Price, and Stock Quantity are required.');
                return res.json({ success: false, message: 'Product ID, Name, Price, and Stock Quantity are required.' });
            }

            console.log('Starting database transaction for product edit...');
            let transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                console.log('Creating SQL request for product update...');
                const request = new sql.Request(transaction);

                request.input('productid', sql.Int, productid);
                request.input('name', sql.NVarChar, name);
                request.input('description', sql.NVarChar, description || null);
                request.input('price', sql.Decimal(10, 2), parseFloat(price));
                request.input('stockquantity', sql.Int, parseInt(stockquantity));
                request.input('category', sql.NVarChar, category || null);
                request.input('dimensions', sql.NVarChar, dimensions || null);
                request.input('imageurl', sql.NVarChar, imageUrl);
                request.input('thumbnailurls', sql.NVarChar, JSON.stringify(thumbnailUrls));
                request.input('model3d', sql.NVarChar, model3dUrl);
                request.input('has3dmodel', sql.Bit, has3dModel === '1' ? 1 : 0);

                console.log('Executing UPDATE query with thumbnailUrls:', JSON.stringify(thumbnailUrls));
                await request.query(`
                    UPDATE Products
                    SET Name = @name,
                        Description = @description,
                        Price = @price,
                        StockQuantity = @stockquantity,
                        Category = @category,
                        Dimensions = @dimensions,
                        ImageURL = @imageurl,
                        ThumbnailURLs = @thumbnailurls,
                        Model3D = @model3d,
                        Has3DModel = @has3dmodel
                    WHERE ProductID = @productid
                `);
                console.log('UPDATE query executed successfully');
                
                // Verify the update by fetching the product
                const verifyRequest = new sql.Request(transaction);
                verifyRequest.input('productid', sql.Int, productid);
                const verifyResult = await verifyRequest.query(`
                    SELECT ThumbnailURLs FROM Products WHERE ProductID = @productid
                `);
                console.log('Verification - ThumbnailURLs in database:', verifyResult.recordset[0]?.ThumbnailURLs);

                // Delete existing ProductMaterials
                const deleteMaterialsRequest = new sql.Request(transaction);
                deleteMaterialsRequest.input('productid', sql.Int, productid);
                await deleteMaterialsRequest.query(`
                    DELETE FROM ProductMaterials WHERE ProductID = @productid
                `);

                // Insert new required materials
                const materials = JSON.parse(requiredMaterials || '[]');
                for (const material of materials) {
                    const materialRequest = new sql.Request(transaction);
                    materialRequest.input('productid', sql.Int, productid);
                    materialRequest.input('materialid', sql.Int, material.materialId);
                    materialRequest.input('quantityrequired', sql.Int, material.quantityRequired);
                    await materialRequest.query(`
                        INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                        VALUES (@productid, @materialid, @quantityrequired)
                    `);
                }

                // Compare old and new values for logging
                let changes = [];
                if (oldProduct.Name !== name) changes.push(`Name: "${oldProduct.Name}" â†' '${name}"`);
                if ((oldProduct.Description || '') !== (description || '')) changes.push(`Description changed`);
                if (parseFloat(oldProduct.Price) !== parseFloat(price)) changes.push(`Price: ${oldProduct.Price} â†' ${price}`);
                if (parseInt(oldProduct.StockQuantity) !== parseInt(stockquantity)) changes.push(`Stock: ${oldProduct.StockQuantity} â†' ${stockquantity}`);
                if ((oldProduct.Category || '') !== (category || '')) changes.push(`Category: "${oldProduct.Category}" â†' "${category}"`);
                if ((oldProduct.Dimensions || '') !== (dimensions || '')) changes.push(`Dimensions: "${oldProduct.Dimensions}" â†' "${dimensions}"`);
                if ((oldProduct.ImageURL || '') !== (imageUrl || '')) changes.push(`Image changed`);
                // For requiredMaterials, just log if changed (deep compare is complex)
                // Optionally, you could fetch old materials and compare arrays for more detail
                changes.push('Required materials updated');

                let changeSummary = changes.length > 0 ? changes.join('; ') : 'No changes detected';

                // Log activity
                const activityRequest = new sql.Request(transaction);
                activityRequest.input('userid', sql.Int, req.session.user.id);
                activityRequest.input('action', sql.NVarChar, 'UPDATE');
                activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                activityRequest.input('description', sql.NVarChar,
                    `Updated product "${name}" (ID: ${productid}): ${changeSummary}`
                );
                await activityRequest.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);

                await transaction.commit();
                req.flash('success', 'Product updated successfully!');
                res.json({ success: true, message: 'Product updated successfully!' });
            } catch (innerErr) {
                await transaction.rollback();
                console.error('Transaction failed during product edit:', innerErr);
                req.flash('error', 'An error occurred while updating the product: ' + innerErr.message);
                res.status(500).json({ success: false, message: 'Failed to update product.', error: innerErr.message });
            }
        } catch (err) {
            console.error('Error editing product (outer catch):', err);
            req.flash('error', 'An unexpected error occurred during product edit: ' + err.message);
            res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: err.message });
        }
    });

    // Delete Product POST route
    router.post('/Employee/Admin/Products/Delete/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const productId = req.params.id;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('productid', sql.Int, productId);

            // Fetch product name for logging
            const productResult = await request.query('SELECT Name FROM Products WHERE ProductID = @productid');
            const productName = productResult.recordset[0]?.Name || '';

            const result = await request.query(`
                UPDATE Products
                SET IsActive = 0
                WHERE ProductID = @productid
            `);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'DELETE');
                request.input('tableaffected', sql.NVarChar, 'Products');
                request.input('recordid', sql.Int, productId);
                request.input('description', sql.NVarChar, `Deactivated product "${productName}" (ID: ${productId})`);
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                    VALUES (@userid, @action, @tableaffected, @recordid, @description)
                `);
                req.flash('success', 'Product deactivated successfully!');
            } else {
                req.flash('error', 'Failed to deactivate product. Product not found.');
            }
            res.redirect('/Employee/Admin/Products');
        } catch (err) {
            console.error('Error deactivating product:', err);
            req.flash('error', 'An error occurred while deactivating the product. Details: ' + err.message);
            res.redirect('/Employee/Admin/Products');
        }
    });

    // ==================== PRODUCT VARIATIONS ROUTES ====================

    // Admin: Add Variation
    router.post('/Employee/Admin/Variations/Add', isAuthenticated, hasRole('Admin'), upload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { productID, variationName, color, quantity } = req.body;
            const parsedProductId = parseInt(productID);
            const parsedQuantity = parseInt(quantity);

            if (!parsedProductId || !variationName || isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return res.json({ success: false, message: 'Invalid input for creating variation.' });
            }
            
            let variationImageURL = null;
            if (req.file) {
                variationImageURL = getPublicUrl(req.file);
            }
            
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                const txRequest = new sql.Request(transaction);

                // Lock the product row and get current stock
                const stockResult = await txRequest
                    .input('productID', sql.Int, parsedProductId)
                    .query('SELECT StockQuantity, Name FROM Products WITH (ROWLOCK, UPDLOCK) WHERE ProductID = @productID');

                if (stockResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.json({ success: false, message: 'Product not found.' });
                }

                const currentStock = parseInt(stockResult.recordset[0].StockQuantity) || 0;
                if (currentStock < parsedQuantity) {
                    await transaction.rollback();
                    return res.json({ success: false, message: 'Not enough product stock to allocate to the new variation.' });
                }

                // Insert variation
                const insertRequest = new sql.Request(transaction);
                await insertRequest
                    .input('productID', sql.Int, parsedProductId)
                    .input('variationName', sql.NVarChar, variationName)
                    .input('color', sql.NVarChar, color || null)
                    .input('quantity', sql.Int, parsedQuantity)
                    .input('variationImageURL', sql.NVarChar, variationImageURL)
                    .input('createdBy', sql.Int, req.session.user.id)
                    .query(`
                        INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, CreatedBy)
                        VALUES (@productID, @variationName, @color, @quantity, @variationImageURL, @createdBy)
                    `);
            
                // Decrement product stock
                const updateRequest = new sql.Request(transaction);
                await updateRequest
                    .input('quantity', sql.Int, parsedQuantity)
                    .input('productID', sql.Int, parsedProductId)
                    .query('UPDATE Products SET StockQuantity = StockQuantity - @quantity WHERE ProductID = @productID');

                await transaction.commit();
                return res.json({ success: true, message: 'Variation added and product stock updated.' });
            } catch (innerErr) {
                try { await transaction.rollback(); } catch (_) {}
                throw innerErr;
            }
        } catch (error) {
            console.error('Error adding variation:', error);
            res.json({ success: false, message: 'Failed to add variation: ' + error.message });
        }
    });

    // Admin: Get Variations for a specific product
    router.get('/Employee/Admin/Variations/Get/:productId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productID', sql.Int, productId)
                .query(`
                    SELECT 
                        pv.VariationID,
                        pv.ProductID,
                        p.Name as ProductName,
                        pv.VariationName,
                        pv.Color,
                        pv.Quantity,
                        pv.VariationImageURL,
                        pv.CreatedAt,
                        pv.UpdatedAt,
                        pv.IsActive,
                        u.FullName as CreatedByUser
                    FROM ProductVariations pv
                    INNER JOIN Products p ON pv.ProductID = p.ProductID
                    LEFT JOIN Users u ON pv.CreatedBy = u.UserID
                    WHERE pv.ProductID = @productID 
                    AND pv.IsActive = 1 
                    AND p.IsActive = 1
                    ORDER BY pv.CreatedAt DESC
                `);
            
            res.json({ 
                success: true, 
                variations: result.recordset 
            });
        } catch (error) {
            console.error('Error fetching variations:', error);
            res.json({ 
                success: false, 
                message: 'Failed to fetch variations: ' + error.message,
                variations: []
            });
        }
    });

    // Admin: Edit Variation
    router.post('/Employee/Admin/Variations/Edit', isAuthenticated, hasRole('Admin'), upload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            
            const { variationID, variationName, color, quantity, isActive } = req.body;
            const parsedVariationId = parseInt(variationID);
            const newQuantity = Math.max(0, parseInt(quantity) || 0);

            if (!parsedVariationId || !variationName) {
                return res.json({ success: false, message: 'Invalid input for updating variation.' });
            }
            
            // Handle file upload for variation image
            let variationImageURL = null;
            if (req.file) {
                variationImageURL = getPublicUrl(req.file);
            }
            
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                const tx = new sql.Request(transaction);

                // Get current variation and its product
                const varResult = await tx
                    .input('variationID', sql.Int, parsedVariationId)
                    .query('SELECT VariationID, ProductID, Quantity FROM ProductVariations WITH (ROWLOCK, UPDLOCK) WHERE VariationID = @variationID');
                if (varResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.json({ success: false, message: 'Variation not found.' });
                }
                const productId = varResult.recordset[0].ProductID;
                const currentVarQty = parseInt(varResult.recordset[0].Quantity) || 0;

                // Lock product and read stock
                const prodResult = await tx
                    .input('productID', sql.Int, productId)
                    .query('SELECT StockQuantity FROM Products WITH (ROWLOCK, UPDLOCK) WHERE ProductID = @productID');
                if (prodResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.json({ success: false, message: 'Parent product not found.' });
                }
                const currentProductStock = parseInt(prodResult.recordset[0].StockQuantity) || 0;

                // Determine delta and enforce limit: cannot increase variation beyond available product stock
                const delta = newQuantity - currentVarQty; // positive means allocating more from product
                if (delta > 0 && currentProductStock < delta) {
                    await transaction.rollback();
                    return res.json({ success: false, message: 'Not enough product stock to set this variation quantity.' });
                }

                // Update variation
                const baseUpdate = [
                    { name: 'variationName', type: sql.NVarChar, value: variationName },
                    { name: 'color', type: sql.NVarChar, value: color || null },
                    { name: 'quantity', type: sql.Int, value: newQuantity },
                    { name: 'isActive', type: sql.Bit, value: isActive === '1' ? 1 : 0 },
                    { name: 'variationID', type: sql.Int, value: parsedVariationId }
                ];
                if (variationImageURL) {
                    baseUpdate.push({ name: 'variationImageURL', type: sql.NVarChar, value: variationImageURL });
                }

                const txUpdate = new sql.Request(transaction);
                baseUpdate.forEach(i => txUpdate.input(i.name, i.type, i.value));
                let updateSql = `UPDATE ProductVariations SET VariationName = @variationName, Color = @color, Quantity = @quantity, IsActive = @isActive, UpdatedAt = GETDATE()`;
                if (variationImageURL) updateSql += ', VariationImageURL = @variationImageURL';
                updateSql += ' WHERE VariationID = @variationID';
                await txUpdate.query(updateSql);

                // Update product stock according to delta
                if (delta !== 0) {
                    const prodUpdate = new sql.Request(transaction);
                    prodUpdate.input('productID', sql.Int, productId);
                    prodUpdate.input('delta', sql.Int, Math.abs(delta));
                    const stockSql = delta > 0
                        ? 'UPDATE Products SET StockQuantity = StockQuantity - @delta WHERE ProductID = @productID'
                        : 'UPDATE Products SET StockQuantity = StockQuantity + @delta WHERE ProductID = @productID';
                    await prodUpdate.query(stockSql);
                }

                await transaction.commit();
                return res.json({ success: true, message: 'Variation updated successfully!' });
            } catch (innerErr) {
                try { await transaction.rollback(); } catch (_) {}
                throw innerErr;
            }
        } catch (error) {
            console.error('Error updating variation:', error);
            res.json({ success: false, message: 'Failed to update variation: ' + error.message });
        }
    });

    // Admin: Delete Variation
    router.post('/Employee/Admin/Variations/Delete/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const variationId = req.params.id;
            
            const result = await pool.request()
                .input('variationID', sql.Int, variationId)
                .query('UPDATE ProductVariations SET IsActive = 0 WHERE VariationID = @variationID');
            
            res.json({ success: true, message: 'Variation deleted successfully!' });
        } catch (error) {
            console.error('Error deleting variation:', error);
            res.json({ success: false, message: 'Failed to delete variation' });
        }
    });

    // API endpoint to get materials for a specific product
    router.get('/api/products/:productId/materials', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { productId } = req.params;
            await pool.connect();
            const result = await pool.request()
                .input('productid', sql.Int, productId)
                .query(`
                    SELECT pm.MaterialID, pm.QuantityRequired, rm.Name as MaterialName
                    FROM ProductMaterials pm
                    JOIN RawMaterials rm ON pm.MaterialID = rm.MaterialID
                    WHERE pm.ProductID = @productid
                `);
            res.json({ success: true, materials: result.recordset });
        } catch (err) {
            console.error('Error fetching product materials:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve product materials.', error: err.message });
        }
    });

    // Update Product Stock POST route (now uses stored procedure)
    router.post('/Employee/Admin/Products/UpdateStock', isAuthenticated, hasRole('Admin'), async (req, res) => {
        console.log('Received update stock request');
        console.log('Request body:', req.body);
        const { productId, newStock } = req.body;

        if (!productId || newStock === undefined || newStock < 0) {
            return res.json({ success: false, message: 'Invalid product ID or stock quantity.' });
        }

        try {
            await pool.connect();

            // Get current stock and product name to calculate quantity to add
            const currentProductResult = await pool.request()
                .input('productid', sql.Int, productId)
                .query('SELECT StockQuantity, Name FROM Products WHERE ProductID = @productid');

            if (currentProductResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Product not found.' });
            }
            const oldStockQuantity = currentProductResult.recordset[0].StockQuantity;
            const productName = currentProductResult.recordset[0].Name;
            const quantityToAdd = newStock - oldStockQuantity;

            // Only call stored procedure if stock is increasing
            if (quantityToAdd > 0) {
                const request = pool.request();
                request.input('ProductID', sql.Int, productId);
                request.input('QuantityToAdd', sql.Int, quantityToAdd);
                request.input('PerformedBy', sql.Int, req.session.user.id); // Assuming user ID is in session

                await request.execute('AddProductStock'); // Execute the stored procedure

                // Log the activity for stock increase
                const activityRequest = pool.request();
                activityRequest.input('userid', sql.Int, req.session.user.id);
                activityRequest.input('action', sql.NVarChar, 'UPDATE');
                activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                activityRequest.input('description', sql.NVarChar,
                    `Updated Product: Changed stock for "${productName}" (ID: ${productId}) from ${oldStockQuantity} to ${newStock}`
                );
                await activityRequest.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);

                res.json({ success: true, message: 'Stock updated and materials deducted successfully!' });
            } else if (quantityToAdd < 0) {
                 // Handle stock reduction separately (not via AddProductStock procedure)
                 // For now, directly update if stock is reduced (e.g., manual correction or removal)
                 const updateStockRequest = pool.request();
                 updateStockRequest.input('newStock', sql.Int, newStock);
                 updateStockRequest.input('productid', sql.Int, productId);
                 await updateStockRequest.query('UPDATE Products SET StockQuantity = @newStock WHERE ProductID = @productid');

                 // Log the activity for manual stock reduction
                 const activityRequest = pool.request();
                 activityRequest.input('userid', sql.Int, req.session.user.id);
                 activityRequest.input('action', sql.NVarChar, 'UPDATE');
                 activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                 activityRequest.input('description', sql.NVarChar,
                     `Updated Product: Changed stock for "${productName}" (ID: ${productId}) from ${oldStockQuantity} to ${newStock}`
                 );
                 await activityRequest.query(`
                     INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                     VALUES (@userid, @action, @tableaffected, @description)
                 `);
                 res.json({ success: true, message: 'Stock reduced successfully.' });
            } else {
                // No change in stock
                res.json({ success: true, message: 'No change in stock quantity.' });
            }
        } catch (err) {
            console.error('Error updating product stock:', err);
            // Check if the error is from the stored procedure (e.g., not enough materials)
            if (err.message.includes('Not enough raw materials available')) {
                res.status(400).json({ success: false, message: err.message, error: err.message });
            } else {
                res.status(500).json({ success: false, message: 'Failed to update stock.', error: err.message });
            }
        }
    });

    // Admin Alerts route
    router.get('/Employee/Admin/Alerts', isAuthenticated, hasRole('Admin'), async (req, res) => {
        res.render('Employee/Admin/AdminAlerts', { user: req.session.user });
    });

    // Admin Manage Users route
    router.get('/Employee/Admin/ManageUsers', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.RoleID, r.RoleName, u.IsActive, u.CreatedAt
                FROM Users u
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY u.CreatedAt DESC
            `);
            const users = result.recordset;
            res.render('Employee/Admin/AdminManageUsers', { user: req.session.user, users: users });
        } catch (err) {
            console.error('Error fetching users:', err);
            req.flash('error', 'Could not fetch user data.');
            res.render('Employee/Admin/AdminManageUsers', { user: req.session.user, users: [] });
        }
    });

    // API endpoint to fetch low stock data
    router.get('/Employee/Admin/Alerts/Data', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();

            // Fetch low stock products (quantity between 1 and 15 or 0)
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity
                FROM Products
                WHERE StockQuantity <= 15
                ORDER BY StockQuantity ASC
            `);
            const lowStockProducts = productsResult.recordset;

            // Fetch low stock raw materials (quantity between 1 and 15 or 0) and only active ones
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit
                FROM RawMaterials
                WHERE QuantityAvailable <= 15 AND IsActive = 1
                ORDER BY QuantityAvailable ASC
            `);
            const lowStockMaterials = materialsResult.recordset;

            res.json({ success: true, products: lowStockProducts, rawMaterials: lowStockMaterials });
        } catch (err) {
            console.error('Error fetching low stock data:', err);
            res.json({ success: false, message: 'Failed to fetch alerts data.' });
        }
    });

    // API to fetch all employee accounts for AdminManageUsers.js
    router.get('/Employee/Admin/Users/EmployeesData', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT U.UserID, U.Username, U.FullName, U.Email, U.RoleID, R.RoleName, U.IsActive, U.CreatedAt
                FROM Users U
                JOIN Roles R ON U.RoleID = R.RoleID
                WHERE R.RoleName != 'Admin'
                ORDER BY U.CreatedAt DESC
            `);
            res.json({ success: true, employees: result.recordset });
        } catch (err) {
            console.error('Error fetching employee accounts:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch employee accounts.', error: err.message });
        }
    });

    // API to fetch all customer accounts for AdminManageUsers.js
    router.get('/Employee/Admin/Users/CustomersData', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT CustomerID, FullName, Email, PhoneNumber, IsActive, CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            res.json({ success: true, customers: result.recordset });
        } catch (err) {
            console.error('Error fetching customer accounts:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch customer accounts.', error: err.message });
        }
    });

    // Admin Logs route
    router.get('/Employee/Admin/Logs', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY al.Timestamp DESC
            `);
            const logs = result.recordset;
            res.render('Employee/Admin/AdminLogs', { user: req.session.user, logs: logs });
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            req.flash('error', 'Could not fetch activity logs.');
            res.render('Employee/Admin/AdminLogs', { user: req.session.user, logs: [] });
        }
    });

    // API endpoint for Activity Logs data
    router.get('/Employee/Admin/Logs/Data', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY al.Timestamp DESC
            `);
            const logs = result.recordset;
            res.json({ success: true, logs: logs });
        } catch (err) {
            console.error('Error fetching activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // --- About Us API Routes ---
    // GET /api/admin/about - Fetch about us content
    router.get('/api/admin/about', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            // Check if about us table exists, if not return default structure
            try {
                const result = await pool.request().query(`
                    SELECT TOP 1 
                        StoryTitle, StorySubtitle, StoryDescription, ProjectsCount, ClientsCount,
                        MissionTitle, MissionDescription, Feature1, Feature2, Feature3,
                        ValuesTitle, Value1Title, Value1Description, Value2Title, Value2Description,
                        Value3Title, Value3Description, Value4Title, Value4Description,
                        PhilosophyTitle, PhilosophySubtitle, PhilosophyDescription,
                        Typo1Title, Typo1Description, Typo2Title, Typo2Description,
                        Typo3Title, Typo3Description, Layout, CreatedAt, UpdatedAt
                    FROM AboutUs
                `);
                
                if (result.recordset.length > 0) {
                    res.json(result.recordset[0]);
                } else {
                    // Return default structure if no data exists
                    res.json({
                        StoryTitle: '',
                        StorySubtitle: '',
                        StoryDescription: '',
                        ProjectsCount: '',
                        ClientsCount: '',
                        MissionTitle: '',
                        MissionDescription: '',
                        Feature1: '',
                        Feature2: '',
                        Feature3: '',
                        ValuesTitle: '',
                        Value1Title: '',
                        Value1Description: '',
                        Value2Title: '',
                        Value2Description: '',
                        Value3Title: '',
                        Value3Description: '',
                        Value4Title: '',
                        Value4Description: '',
                        PhilosophyTitle: '',
                        PhilosophySubtitle: '',
                        PhilosophyDescription: '',
                        Typo1Title: '',
                        Typo1Description: '',
                        Typo2Title: '',
                        Typo2Description: '',
                        Typo3Title: '',
                        Typo3Description: '',
                        Layout: 'default'
                    });
                }
            } catch (tableError) {
                // Table doesn't exist, return default structure
                res.json({
                    StoryTitle: '',
                    StorySubtitle: '',
                    StoryDescription: '',
                    ProjectsCount: '',
                    ClientsCount: '',
                    MissionTitle: '',
                    MissionDescription: '',
                    Feature1: '',
                    Feature2: '',
                    Feature3: '',
                    ValuesTitle: '',
                    Value1Title: '',
                    Value1Description: '',
                    Value2Title: '',
                    Value2Description: '',
                    Value3Title: '',
                    Value3Description: '',
                    Value4Title: '',
                    Value4Description: '',
                    PhilosophyTitle: '',
                    PhilosophySubtitle: '',
                    PhilosophyDescription: '',
                    Typo1Title: '',
                    Typo1Description: '',
                    Typo2Title: '',
                    Typo2Description: '',
                    Typo3Title: '',
                    Typo3Description: '',
                    Layout: 'default'
                });
            }
        } catch (error) {
            console.error('Error fetching about us content:', error);
            res.status(500).json({ error: 'Failed to fetch about us content' });
        }
    });

    // POST /api/admin/about - Save about us content
    router.post('/api/admin/about', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            console.log('Received about us save request:', req.body);
            
            const {
                StoryTitle, StorySubtitle, StoryDescription, ProjectsCount, ClientsCount,
                MissionTitle, MissionDescription, Feature1, Feature2, Feature3,
                ValuesTitle, Value1Title, Value1Description, Value2Title, Value2Description,
                Value3Title, Value3Description, Value4Title, Value4Description,
                PhilosophyTitle, PhilosophySubtitle, PhilosophyDescription,
                Typo1Title, Typo1Description, Typo2Title, Typo2Description,
                Typo3Title, Typo3Description, Layout
            } = req.body;
            
            await pool.connect();
            
            // Ensure table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AboutUs' and xtype='U')
                CREATE TABLE AboutUs (
                    ID INT PRIMARY KEY IDENTITY(1,1),
                    StoryTitle NVARCHAR(200),
                    StorySubtitle NVARCHAR(300),
                    StoryDescription NVARCHAR(MAX),
                    ProjectsCount NVARCHAR(50),
                    ClientsCount NVARCHAR(50),
                    MissionTitle NVARCHAR(200),
                    MissionDescription NVARCHAR(MAX),
                    Feature1 NVARCHAR(200),
                    Feature2 NVARCHAR(200),
                    Feature3 NVARCHAR(200),
                    ValuesTitle NVARCHAR(200),
                    Value1Title NVARCHAR(200),
                    Value1Description NVARCHAR(MAX),
                    Value2Title NVARCHAR(200),
                    Value2Description NVARCHAR(MAX),
                    Value3Title NVARCHAR(200),
                    Value3Description NVARCHAR(MAX),
                    Value4Title NVARCHAR(200),
                    Value4Description NVARCHAR(MAX),
                    PhilosophyTitle NVARCHAR(200),
                    PhilosophySubtitle NVARCHAR(300),
                    PhilosophyDescription NVARCHAR(MAX),
                    Typo1Title NVARCHAR(200),
                    Typo1Description NVARCHAR(MAX),
                    Typo2Title NVARCHAR(200),
                    Typo2Description NVARCHAR(MAX),
                    Typo3Title NVARCHAR(200),
                    Typo3Description NVARCHAR(MAX),
                    Layout NVARCHAR(50) DEFAULT 'default',
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                )
            `);
            
            // Check if record exists
            const existingRecord = await pool.request().query(`
                SELECT ID FROM AboutUs
            `);
            
            if (existingRecord.recordset.length > 0) {
                // Update existing record
                await pool.request()
                    .input('StoryTitle', sql.NVarChar, StoryTitle)
                    .input('StorySubtitle', sql.NVarChar, StorySubtitle)
                    .input('StoryDescription', sql.NVarChar, StoryDescription)
                    .input('ProjectsCount', sql.NVarChar, ProjectsCount)
                    .input('ClientsCount', sql.NVarChar, ClientsCount)
                    .input('MissionTitle', sql.NVarChar, MissionTitle)
                    .input('MissionDescription', sql.NVarChar, MissionDescription)
                    .input('Feature1', sql.NVarChar, Feature1)
                    .input('Feature2', sql.NVarChar, Feature2)
                    .input('Feature3', sql.NVarChar, Feature3)
                    .input('ValuesTitle', sql.NVarChar, ValuesTitle)
                    .input('Value1Title', sql.NVarChar, Value1Title)
                    .input('Value1Description', sql.NVarChar, Value1Description)
                    .input('Value2Title', sql.NVarChar, Value2Title)
                    .input('Value2Description', sql.NVarChar, Value2Description)
                    .input('Value3Title', sql.NVarChar, Value3Title)
                    .input('Value3Description', sql.NVarChar, Value3Description)
                    .input('Value4Title', sql.NVarChar, Value4Title)
                    .input('Value4Description', sql.NVarChar, Value4Description)
                    .input('PhilosophyTitle', sql.NVarChar, PhilosophyTitle)
                    .input('PhilosophySubtitle', sql.NVarChar, PhilosophySubtitle)
                    .input('PhilosophyDescription', sql.NVarChar, PhilosophyDescription)
                    .input('Typo1Title', sql.NVarChar, Typo1Title)
                    .input('Typo1Description', sql.NVarChar, Typo1Description)
                    .input('Typo2Title', sql.NVarChar, Typo2Title)
                    .input('Typo2Description', sql.NVarChar, Typo2Description)
                    .input('Typo3Title', sql.NVarChar, Typo3Title)
                    .input('Typo3Description', sql.NVarChar, Typo3Description)
                    .input('Layout', sql.NVarChar, Layout)
                    .query(`
                        UPDATE AboutUs SET
                            StoryTitle = @StoryTitle,
                            StorySubtitle = @StorySubtitle,
                            StoryDescription = @StoryDescription,
                            ProjectsCount = @ProjectsCount,
                            ClientsCount = @ClientsCount,
                            MissionTitle = @MissionTitle,
                            MissionDescription = @MissionDescription,
                            Feature1 = @Feature1,
                            Feature2 = @Feature2,
                            Feature3 = @Feature3,
                            ValuesTitle = @ValuesTitle,
                            Value1Title = @Value1Title,
                            Value1Description = @Value1Description,
                            Value2Title = @Value2Title,
                            Value2Description = @Value2Description,
                            Value3Title = @Value3Title,
                            Value3Description = @Value3Description,
                            Value4Title = @Value4Title,
                            Value4Description = @Value4Description,
                            PhilosophyTitle = @PhilosophyTitle,
                            PhilosophySubtitle = @PhilosophySubtitle,
                            PhilosophyDescription = @PhilosophyDescription,
                            Typo1Title = @Typo1Title,
                            Typo1Description = @Typo1Description,
                            Typo2Title = @Typo2Title,
                            Typo2Description = @Typo2Description,
                            Typo3Title = @Typo3Title,
                            Typo3Description = @Typo3Description,
                            Layout = @Layout,
                            UpdatedAt = GETDATE()
                    `);
            } else {
                // Insert new record
                await pool.request()
                    .input('StoryTitle', sql.NVarChar, StoryTitle)
                    .input('StorySubtitle', sql.NVarChar, StorySubtitle)
                    .input('StoryDescription', sql.NVarChar, StoryDescription)
                    .input('ProjectsCount', sql.NVarChar, ProjectsCount)
                    .input('ClientsCount', sql.NVarChar, ClientsCount)
                    .input('MissionTitle', sql.NVarChar, MissionTitle)
                    .input('MissionDescription', sql.NVarChar, MissionDescription)
                    .input('Feature1', sql.NVarChar, Feature1)
                    .input('Feature2', sql.NVarChar, Feature2)
                    .input('Feature3', sql.NVarChar, Feature3)
                    .input('ValuesTitle', sql.NVarChar, ValuesTitle)
                    .input('Value1Title', sql.NVarChar, Value1Title)
                    .input('Value1Description', sql.NVarChar, Value1Description)
                    .input('Value2Title', sql.NVarChar, Value2Title)
                    .input('Value2Description', sql.NVarChar, Value2Description)
                    .input('Value3Title', sql.NVarChar, Value3Title)
                    .input('Value3Description', sql.NVarChar, Value3Description)
                    .input('Value4Title', sql.NVarChar, Value4Title)
                    .input('Value4Description', sql.NVarChar, Value4Description)
                    .input('PhilosophyTitle', sql.NVarChar, PhilosophyTitle)
                    .input('PhilosophySubtitle', sql.NVarChar, PhilosophySubtitle)
                    .input('PhilosophyDescription', sql.NVarChar, PhilosophyDescription)
                    .input('Typo1Title', sql.NVarChar, Typo1Title)
                    .input('Typo1Description', sql.NVarChar, Typo1Description)
                    .input('Typo2Title', sql.NVarChar, Typo2Title)
                    .input('Typo2Description', sql.NVarChar, Typo2Description)
                    .input('Typo3Title', sql.NVarChar, Typo3Title)
                    .input('Typo3Description', sql.NVarChar, Typo3Description)
                    .input('Layout', sql.NVarChar, Layout)
                    .query(`
                        INSERT INTO AboutUs (
                            StoryTitle, StorySubtitle, StoryDescription, ProjectsCount, ClientsCount,
                            MissionTitle, MissionDescription, Feature1, Feature2, Feature3,
                            ValuesTitle, Value1Title, Value1Description, Value2Title, Value2Description,
                            Value3Title, Value3Description, Value4Title, Value4Description,
                            PhilosophyTitle, PhilosophySubtitle, PhilosophyDescription,
                            Typo1Title, Typo1Description, Typo2Title, Typo2Description,
                            Typo3Title, Typo3Description, Layout
                        ) VALUES (
                            @StoryTitle, @StorySubtitle, @StoryDescription, @ProjectsCount, @ClientsCount,
                            @MissionTitle, @MissionDescription, @Feature1, @Feature2, @Feature3,
                            @ValuesTitle, @Value1Title, @Value1Description, @Value2Title, @Value2Description,
                            @Value3Title, @Value3Description, @Value4Title, @Value4Description,
                            @PhilosophyTitle, @PhilosophySubtitle, @PhilosophyDescription,
                            @Typo1Title, @Typo1Description, @Typo2Title, @Typo2Description,
                            @Typo3Title, @Typo3Description, @Layout
                        )
                    `);
            }
            
            res.json({ success: true, message: 'About Us content saved successfully' });
        } catch (error) {
            console.error('Error saving about us content:', error);
            res.status(500).json({ error: 'Failed to save about us content' });
        }
    });

    // --- Auto Messages API Routes ---
    // GET /api/admin/auto-messages - Fetch all auto messages
    router.get('/api/admin/auto-messages', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            // Check if AutoMessages table exists
            try {
                const result = await pool.request().query(`
                    SELECT 
                        ID, Question, Answer, Keywords, IsActive, CreatedAt, UpdatedAt
                    FROM AutoMessages
                    ORDER BY CreatedAt DESC
                `);
                
                res.json({ items: result.recordset });
            } catch (tableError) {
                // Table doesn't exist, return empty array
                res.json({ items: [] });
            }
        } catch (error) {
            console.error('Error fetching auto messages:', error);
            res.status(500).json({ error: 'Failed to fetch auto messages' });
        }
    });

    // POST /api/admin/auto-messages - Create new auto message
    router.post('/api/admin/auto-messages', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { question, answer, keywords, isActive } = req.body;
            
            if (!question || !answer) {
                return res.status(400).json({ error: 'Question and answer are required' });
            }
            
            await pool.connect();
            
            // Ensure table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AutoMessages' and xtype='U')
                CREATE TABLE AutoMessages (
                    ID INT PRIMARY KEY IDENTITY(1,1),
                    Question NVARCHAR(500) NOT NULL,
                    Answer NVARCHAR(MAX) NOT NULL,
                    Keywords NVARCHAR(500),
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                )
            `);
            
            const result = await pool.request()
                .input('Question', sql.NVarChar, question)
                .input('Answer', sql.NVarChar, answer)
                .input('Keywords', sql.NVarChar, keywords || '')
                .input('IsActive', sql.Bit, isActive !== false)
                .query(`
                    INSERT INTO AutoMessages (Question, Answer, Keywords, IsActive)
                    VALUES (@Question, @Answer, @Keywords, @IsActive)
                `);
            
            res.json({ success: true, message: 'Auto message created successfully' });
        } catch (error) {
            console.error('Error creating auto message:', error);
            res.status(500).json({ error: 'Failed to create auto message' });
        }
    });

    // PUT /api/admin/auto-messages/:id - Update auto message
    router.put('/api/admin/auto-messages/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { id } = req.params;
            const { question, answer, keywords, isActive } = req.body;
            
            if (!question || !answer) {
                return res.status(400).json({ error: 'Question and answer are required' });
            }
            
            await pool.connect();
            
            const result = await pool.request()
                .input('ID', sql.Int, id)
                .input('Question', sql.NVarChar, question)
                .input('Answer', sql.NVarChar, answer)
                .input('Keywords', sql.NVarChar, keywords || '')
                .input('IsActive', sql.Bit, isActive !== false)
                .query(`
                    UPDATE AutoMessages 
                    SET Question = @Question, Answer = @Answer, Keywords = @Keywords, 
                        IsActive = @IsActive, UpdatedAt = GETDATE()
                    WHERE ID = @ID
                `);
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: 'Auto message not found' });
            }
            
            res.json({ success: true, message: 'Auto message updated successfully' });
        } catch (error) {
            console.error('Error updating auto message:', error);
            res.status(500).json({ error: 'Failed to update auto message' });
        }
    });

    // DELETE /api/admin/auto-messages/:id - Delete auto message
    router.delete('/api/admin/auto-messages/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { id } = req.params;
            
            await pool.connect();
            
            const result = await pool.request()
                .input('ID', sql.Int, id)
                .query(`
                    DELETE FROM AutoMessages WHERE ID = @ID
                `);
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: 'Auto message not found' });
            }
            
            res.json({ success: true, message: 'Auto message deleted successfully' });
        } catch (error) {
            console.error('Error deleting auto message:', error);
            res.status(500).json({ error: 'Failed to delete auto message' });
        }
    });

    // GET /api/auto-messages - Public endpoint to fetch active auto messages for FAQ page
    router.get('/api/auto-messages', async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    ID, Question, Answer, Keywords, CreatedAt, UpdatedAt
                FROM AutoMessages
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC
            `);
            
            res.json({ 
                success: true, 
                items: result.recordset 
            });
        } catch (error) {
            console.error('Error fetching auto messages:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch auto messages' 
            });
        }
    });

    // --- Terms and Conditions API Routes ---
    // GET /api/admin/terms - Fetch terms and conditions
    router.get('/api/admin/terms', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            // Check if terms table exists
            try {
                const query = 'SELECT TOP 1 * FROM terms_and_conditions ORDER BY id DESC';
                const result = await pool.request().query(query);
                
                if (result.recordset.length === 0) {
                    return res.json({
                        signupTermsTitle: 'Terms & Conditions',
                        signupTermsContent: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                        signupTermsCheckboxText: 'I agree to the Terms and Conditions',
                        checkoutTermsTitle: 'Terms and Conditions',
                        checkoutTermsContent: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                        checkoutTermsCheckboxText: 'I have read and agree to the Terms and Conditions',
                        termsLastUpdated: '',
                        termsVersion: '1.0',
                        requireAgreement: true
                    });
                }
                
                const terms = result.recordset[0];
                res.json({
                    signupTermsTitle: terms.signup_terms_title,
                    signupTermsContent: terms.signup_terms_content,
                    signupTermsCheckboxText: terms.signup_terms_checkbox_text,
                    checkoutTermsTitle: terms.checkout_terms_title,
                    checkoutTermsContent: terms.checkout_terms_content,
                    checkoutTermsCheckboxText: terms.checkout_terms_checkbox_text,
                    termsLastUpdated: terms.terms_last_updated,
                    termsVersion: terms.terms_version,
                    requireAgreement: terms.require_agreement
                });
            } catch (tableError) {
                // Table doesn't exist, return default values
                console.log('Terms table does not exist, returning default values');
                res.json({
                    signupTermsTitle: 'Terms & Conditions',
                    signupTermsContent: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                    signupTermsCheckboxText: 'I agree to the Terms and Conditions',
                    checkoutTermsTitle: 'Terms and Conditions',
                    checkoutTermsContent: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                    checkoutTermsCheckboxText: 'I have read and agree to the Terms and Conditions',
                    termsLastUpdated: '',
                    termsVersion: '1.0',
                    requireAgreement: true
                });
            }
        } catch (error) {
            console.error('Error fetching terms and conditions:', error);
            res.status(500).json({ error: 'Failed to fetch terms and conditions' });
        }
    });

    // POST /api/admin/terms - Save terms and conditions
    router.post('/api/admin/terms', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            console.log('Received terms save request:', req.body);
            
            const {
                signupTermsTitle,
                signupTermsContent,
                signupTermsCheckboxText,
                checkoutTermsTitle,
                checkoutTermsContent,
                checkoutTermsCheckboxText,
                termsLastUpdated,
                termsVersion,
                requireAgreement
            } = req.body;
            
            // Validate required fields
            if (!signupTermsTitle || !checkoutTermsTitle) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Sign-up and checkout titles are required' 
                });
            }
            
            await pool.connect();
            
            // Check if terms table exists, if not create it
            try {
                await pool.request().query('SELECT TOP 1 * FROM terms_and_conditions');
            } catch (tableError) {
                console.log('Terms table does not exist, creating it...');
                const createTableQuery = `
                    CREATE TABLE terms_and_conditions (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        signup_terms_title NVARCHAR(255) DEFAULT 'Terms & Conditions',
                        signup_terms_content NTEXT,
                        signup_terms_checkbox_text NVARCHAR(255) DEFAULT 'I agree to the Terms and Conditions',
                        checkout_terms_title NVARCHAR(255) DEFAULT 'Terms and Conditions',
                        checkout_terms_content NTEXT,
                        checkout_terms_checkbox_text NVARCHAR(255) DEFAULT 'I have read and agree to the Terms and Conditions',
                        terms_last_updated DATE,
                        terms_version NVARCHAR(50) DEFAULT '1.0',
                        require_agreement BIT DEFAULT 1,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        updated_at DATETIME2 DEFAULT GETDATE()
                    )
                `;
                await pool.request().query(createTableQuery);
                console.log('Terms table created successfully');
            }
            
            // Check if terms already exist
            const checkQuery = 'SELECT TOP 1 id FROM terms_and_conditions ORDER BY id DESC';
            const checkResult = await pool.request().query(checkQuery);
            
            if (checkResult.recordset.length > 0) {
                // Update existing terms
                const updateQuery = `
                    UPDATE terms_and_conditions SET
                        signup_terms_title = @signupTermsTitle,
                        signup_terms_content = @signupTermsContent,
                        signup_terms_checkbox_text = @signupTermsCheckboxText,
                        checkout_terms_title = @checkoutTermsTitle,
                        checkout_terms_content = @checkoutTermsContent,
                        checkout_terms_checkbox_text = @checkoutTermsCheckboxText,
                        terms_last_updated = @termsLastUpdated,
                        terms_version = @termsVersion,
                        require_agreement = @requireAgreement,
                        updated_at = GETDATE()
                    WHERE id = @id
                `;
                
                await pool.request()
                    .input('signupTermsTitle', sql.NVarChar, signupTermsTitle || 'Terms & Conditions')
                    .input('signupTermsContent', sql.NText, signupTermsContent || '')
                    .input('signupTermsCheckboxText', sql.NVarChar, signupTermsCheckboxText || 'I agree to the Terms and Conditions')
                    .input('checkoutTermsTitle', sql.NVarChar, checkoutTermsTitle || 'Terms and Conditions')
                    .input('checkoutTermsContent', sql.NText, checkoutTermsContent || '')
                    .input('checkoutTermsCheckboxText', sql.NVarChar, checkoutTermsCheckboxText || 'I have read and agree to the Terms and Conditions')
                    .input('termsLastUpdated', sql.Date, termsLastUpdated || new Date().toISOString().split('T')[0])
                    .input('termsVersion', sql.NVarChar, termsVersion || '1.0')
                    .input('requireAgreement', sql.Bit, requireAgreement !== undefined ? requireAgreement : true)
                    .input('id', sql.Int, checkResult.recordset[0].id)
                    .query(updateQuery);
                    
                console.log('Terms updated successfully');
            } else {
                // Insert new terms
                const insertQuery = `
                    INSERT INTO terms_and_conditions (
                        signup_terms_title,
                        signup_terms_content,
                        signup_terms_checkbox_text,
                        checkout_terms_title,
                        checkout_terms_content,
                        checkout_terms_checkbox_text,
                        terms_last_updated,
                        terms_version,
                        require_agreement
                    ) VALUES (
                        @signupTermsTitle,
                        @signupTermsContent,
                        @signupTermsCheckboxText,
                        @checkoutTermsTitle,
                        @checkoutTermsContent,
                        @checkoutTermsCheckboxText,
                        @termsLastUpdated,
                        @termsVersion,
                        @requireAgreement
                    )
                `;
                
                await pool.request()
                    .input('signupTermsTitle', sql.NVarChar, signupTermsTitle || 'Terms & Conditions')
                    .input('signupTermsContent', sql.NText, signupTermsContent || '')
                    .input('signupTermsCheckboxText', sql.NVarChar, signupTermsCheckboxText || 'I agree to the Terms and Conditions')
                    .input('checkoutTermsTitle', sql.NVarChar, checkoutTermsTitle || 'Terms and Conditions')
                    .input('checkoutTermsContent', sql.NText, checkoutTermsContent || '')
                    .input('checkoutTermsCheckboxText', sql.NVarChar, checkoutTermsCheckboxText || 'I have read and agree to the Terms and Conditions')
                    .input('termsLastUpdated', sql.Date, termsLastUpdated || new Date().toISOString().split('T')[0])
                    .input('termsVersion', sql.NVarChar, termsVersion || '1.0')
                    .input('requireAgreement', sql.Bit, requireAgreement !== undefined ? requireAgreement : true)
                    .query(insertQuery);
                    
                console.log('Terms inserted successfully');
            }
            
            res.json({ success: true, message: 'Terms and conditions saved successfully' });
        } catch (error) {
            console.error('Error saving terms and conditions:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to save terms and conditions',
                details: error.message 
            });
        }
    });

    // GET /api/terms - Public endpoint to fetch terms for frontend
    router.get('/api/terms', async (req, res) => {
        try {
            await pool.connect();
            
            // Check if terms table exists
            try {
                const query = 'SELECT TOP 1 * FROM terms_and_conditions ORDER BY id DESC';
                const result = await pool.request().query(query);
                
                if (result.recordset.length === 0) {
                    return res.json({
                        signupTerms: {
                            title: 'Terms & Conditions',
                            content: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                            checkboxText: 'I agree to the Terms and Conditions'
                        },
                        checkoutTerms: {
                            title: 'Terms and Conditions',
                            content: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                            checkboxText: 'I have read and agree to the Terms and Conditions'
                        },
                        requireAgreement: true
                    });
                }
                
                const terms = result.recordset[0];
                res.json({
                    signupTerms: {
                        title: terms.signup_terms_title,
                        content: terms.signup_terms_content,
                        checkboxText: terms.signup_terms_checkbox_text
                    },
                    checkoutTerms: {
                        title: terms.checkout_terms_title,
                        content: terms.checkout_terms_content,
                        checkboxText: terms.checkout_terms_checkbox_text
                    },
                    requireAgreement: terms.require_agreement,
                    lastUpdated: terms.terms_last_updated,
                    version: terms.terms_version
                });
            } catch (tableError) {
                // Table doesn't exist, return default values
                console.log('Terms table does not exist, returning default values for public API');
                res.json({
                    signupTerms: {
                        title: 'Terms & Conditions',
                        content: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                        checkboxText: 'I agree to the Terms and Conditions'
                    },
                    checkoutTerms: {
                        title: 'Terms and Conditions',
                        content: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                        checkboxText: 'I have read and agree to the Terms and Conditions'
                    },
                    requireAgreement: true
                });
            }
        } catch (error) {
            console.error('Error fetching public terms:', error);
            res.status(500).json({ error: 'Failed to fetch terms and conditions' });
        }
    });

    // Other routes will go here

    router.post('/Employee/Admin/ManageUsers/ToggleActive/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const userId = req.params.id;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('userid', sql.Int, userId);

            const userResult = await request.query('SELECT IsActive, FullName FROM Users WHERE UserID = @userid');
            if (userResult.recordset.length === 0) {
                req.flash('error', 'User not found.');
                return res.redirect('/Employee/Admin/ManageUsers');
            }
            const currentIsActive = userResult.recordset[0].IsActive;
            const newIsActive = !currentIsActive;
            const fullName = userResult.recordset[0].FullName;

            const result = await request.query(`
                UPDATE Users
                SET IsActive = @newIsActive
                WHERE UserID = @userid
            `);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                const action = newIsActive ? 'Activated' : 'Deactivated';
                request.input('action', sql.NVarChar, 'UPDATE');
                request.input('tableaffected', sql.NVarChar, 'Users');
                request.input('recordid', sql.Int, userId);
                request.input('description', sql.NVarChar, `${action} user: ${fullName} (ID: ${userId})`);
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                    VALUES (@userid, @action, @tableaffected, @recordid, @description)
                `);
                req.flash('success', `User ${fullName} successfully ${action.toLowerCase()}.`);
            } else {
                req.flash('error', 'Failed to toggle user status. User not found.');
            }
            res.redirect('/Employee/Admin/ManageUsers');
        } catch (err) {
            console.error('Error toggling user active status:', err);
            req.flash('error', 'An error occurred while toggling user status. Details: ' + err.message);
            res.redirect('/Employee/Admin/ManageUsers');
        }
    });

    router.post('/Employee/Admin/ManageUsers/Delete/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const userId = req.params.id;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('userid', sql.Int, userId);

            const userResult = await request.query('SELECT FullName FROM Users WHERE UserID = @userid');
            if (userResult.recordset.length === 0) {
                req.flash('error', 'User not found.');
                return res.redirect('/Employee/Admin/ManageUsers');
            }
            const fullName = userResult.recordset[0].FullName;

            const result = await request.query(`
                DELETE FROM Users
                WHERE UserID = @userid
            `);

            if (result.rowsAffected[0] > 0) {
                // Log the activity
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'DELETE');
                request.input('tableaffected', sql.NVarChar, 'Users');
                request.input('recordid', sql.Int, userId);
                request.input('description', sql.NVarChar, `Deleted user: ${fullName} (ID: ${userId})`);
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                    VALUES (@userid, @action, @tableaffected, @recordid, @description)
                `);
                req.flash('success', `User ${fullName} successfully deleted.`);
            } else {
                req.flash('error', 'Failed to delete user. User not found.');
            }
            res.redirect('/Employee/Admin/ManageUsers');
        } catch (err) {
            console.error('Error deleting user:', err);
            req.flash('error', 'An error occurred while deleting the user. Details: ' + err.message);
            res.redirect('/Employee/Admin/ManageUsers');
        }
    });

    // Get User Permissions
    router.get('/Employee/Admin/Users/GetPermissions/:userId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const userId = req.params.userId;
            await pool.connect();
            
            // For now, return default permissions (all false)
            // In a real implementation, you would fetch from a UserPermissions table
            const defaultPermissions = {
                inventory: false,
                transactions: false,
                users: false,
                chat: false,
                content: false,
                logs: false
            };
            
            res.json({ success: true, permissions: defaultPermissions });
        } catch (err) {
            console.error('Error fetching user permissions:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch permissions.' });
        }
    });

    // Set User Permissions
    router.post('/Employee/Admin/Users/SetPermissions', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { userId, permissions } = req.body;
            await pool.connect();
            
            // For now, just log the permissions
            // In a real implementation, you would save to a UserPermissions table
            console.log(`Setting permissions for user ${userId}:`, permissions);
            
            res.json({ success: true, message: 'Permissions updated successfully.' });
        } catch (err) {
            console.error('Error setting user permissions:', err);
            res.status(500).json({ success: false, message: 'Failed to update permissions.' });
        }
    });

    // Toggle Customer Status
    router.post('/Employee/Admin/Customers/ToggleActive/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const customerId = req.params.id;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('customerId', sql.Int, customerId);

            const customerResult = await request.query('SELECT IsActive, FullName FROM Customers WHERE CustomerID = @customerId');
            if (customerResult.recordset.length === 0) {
                req.flash('error', 'Customer not found.');
                return res.redirect('/Employee/Admin/ManageUsers');
            }
            const currentIsActive = customerResult.recordset[0].IsActive;
            const newIsActive = !currentIsActive;
            const fullName = customerResult.recordset[0].FullName;

            const updateResult = await request.query(`
                UPDATE Customers 
                SET IsActive = @newIsActive, UpdatedAt = GETDATE()
                WHERE CustomerID = @customerId
            `);
            request.input('newIsActive', sql.Bit, newIsActive);

            if (updateResult.rowsAffected[0] > 0) {
                const action = newIsActive ? 'activated' : 'deactivated';
                
                // Log the activity
                await request.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                    VALUES (@userid, @action, @tableaffected, @recordid, @description)
                `);
                request.input('userid', sql.Int, req.session.user.id);
                request.input('action', sql.NVarChar, 'UPDATE');
                request.input('tableaffected', sql.NVarChar, 'Customers');
                request.input('recordid', sql.Int, customerId);
                request.input('description', sql.NVarChar, `Customer ${fullName} ${action}`);

                req.flash('success', `Customer ${fullName} successfully ${action}.`);
            } else {
                req.flash('error', 'Failed to toggle customer status. Customer not found.');
            }
            res.redirect('/Employee/Admin/ManageUsers');
        } catch (err) {
            console.error('Error toggling customer active status:', err);
            req.flash('error', 'An error occurred while toggling customer status. Details: ' + err.message);
            res.redirect('/Employee/Admin/ManageUsers');
        }
    });

    // Edit User (Admin)
    router.post('/Employee/Admin/Users/Edit', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const { userId, username, fullName, email, roleId, isActive } = req.body;
        try {
            await pool.connect();
            const request = pool.request();
            request.input('userId', sql.Int, userId);
            request.input('username', sql.NVarChar, username);
            request.input('fullName', sql.NVarChar, fullName);
            request.input('email', sql.NVarChar, email);
            request.input('roleId', sql.Int, roleId);
            request.input('isActive', sql.Bit, isActive);

            // Get old user info for logging
            const oldUserResult = await request.query('SELECT * FROM Users WHERE UserID = @userId');
            const oldUser = oldUserResult.recordset[0];

            // Update user
            await request.query(`
                UPDATE Users
                SET Username = @username, FullName = @fullName, Email = @email, RoleID = @roleId, IsActive = @isActive
                WHERE UserID = @userId
            `);

            // Log the update
            const changes = [];
            if (oldUser.Username !== username) changes.push(`Username: '${oldUser.Username}' â†' '${username}'`);
            if (oldUser.FullName !== fullName) changes.push(`FullName: '${oldUser.FullName}' â†' '${fullName}'`);
            if (oldUser.Email !== email) changes.push(`Email: '${oldUser.Email}' â†' '${email}'`);
            if (oldUser.RoleID !== parseInt(roleId)) changes.push(`RoleID: '${oldUser.RoleID}' â†' '${roleId}'`);
            if (oldUser.IsActive !== (isActive === '1' || isActive === 1 || isActive === true)) changes.push(`IsActive: '${oldUser.IsActive}' â†' '${isActive}'`);
            const description = changes.length > 0 ? `Updated user (ID: ${userId}): ` + changes.join('; ') : `Updated user (ID: ${userId})`;

            const logRequest = pool.request();
            logRequest.input('userid', sql.Int, req.session.user.id);
            logRequest.input('action', sql.NVarChar, 'UPDATE');
            logRequest.input('tableaffected', sql.NVarChar, 'Users');
            logRequest.input('recordid', sql.Int, userId);
            logRequest.input('description', sql.NVarChar, description);
            await logRequest.query(`
                INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
                VALUES (@userid, @action, @tableaffected, @recordid, @description)
            `);

            req.flash('success', 'User updated successfully.');
            res.redirect('/Employee/Admin/ManageUsers');
        } catch (err) {
            console.error('Error updating user:', err);
            req.flash('error', 'Failed to update user. ' + err.message);
            res.redirect('/Employee/Admin/ManageUsers');
        }
    });

    // EmpLogin routes
    router.get('/EmpLogin', (req, res) => {
        res.render('EmpLogin/EmpLogin', { message: req.flash('error') });
    });

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            await pool.connect();
            const request = pool.request();
            request.input('username', sql.NVarChar, username);
            const result = await request.query(`
                SELECT u.UserID, u.Username, u.PasswordHash, u.FullName, r.RoleName
                FROM Users u
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE u.Username = @username AND u.IsActive = 1
            `);

            const user = result.recordset[0];

            if (user && user.PasswordHash === password) { // Simple password check, use bcrypt in production
                req.session.user = {
                    id: user.UserID,
                    username: user.Username,
                    fullName: user.FullName,
                    role: user.RoleName
                };
                req.flash('success', 'Logged in successfully!');

                switch (user.RoleName) {
                    case 'Admin':
                        res.redirect('/Employee/AdminIndex');
                        break;
                    case 'InventoryManager':
                        res.redirect('/Employee/InventoryManager');
                        break;
                    case 'TransactionManager':
                        res.redirect('/Employee/TransactionManager');
                        break;
                    case 'UserManager':
                        res.redirect('/Employee/UserManager');
                        break;
                    case 'OrderSupport':
                        res.redirect('/Employee/OrderSupport');
                        break;
                    default:
                        req.flash('error', 'Unknown role.');
                        res.redirect('/EmpLogin');
                }
            } else {
                req.flash('error', 'Invalid username or password, or account is inactive.');
                res.redirect('/EmpLogin');
            }
        } catch (err) {
            console.error('Login error:', err);
            req.flash('error', 'An error occurred during login. Please try again.');
            res.redirect('/EmpLogin');
        }
    });

    router.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ success: false, message: 'Failed to logout' });
            }
            // Clear the session cookie
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    });

    router.post('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ success: false, message: 'Failed to logout' });
            }
            // Clear the session cookie
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // Admin Archived Items route
    router.get('/Employee/Admin/Archived', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const productsResult = await pool.request().query('SELECT * FROM Products WHERE IsActive = 0');
            const materialsResult = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 0');
            res.render('Employee/Admin/AdminArchived', {
                user: req.session.user,
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/Admin/AdminArchived', {
                user: req.session.user,
                archivedProducts: [],
                archivedMaterials: [],
                error: 'Failed to load archived items.'
            });
        }
    });

    // Reactivate archived product
    router.post('/Employee/Admin/Archived/ReactivateProduct/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const productId = req.params.id;
        try {
            await pool.connect();
            // Fetch product name for logging
            const productResult = await pool.request().input('productId', sql.Int, productId).query('SELECT Name FROM Products WHERE ProductID = @productId');
            const productName = productResult.recordset[0]?.Name || '';
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 1 WHERE ProductID = @productId');
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'REACTIVATE')
                .input('tableaffected', sql.NVarChar, 'Products')
                .input('recordid', sql.Int, productId)
                .input('description', sql.NVarChar, `Reactivated product "${productName}" (ID: ${productId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            res.redirect('/Employee/Admin/Archived?reactivated=1');
        } catch (err) {
            console.error('Error reactivating product:', err);
            res.redirect('/Employee/Admin/Archived');
        }
    });

    // Reactivate archived raw material
    router.post('/Employee/Admin/Archived/ReactivateMaterial/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const materialId = req.params.id;
        try {
            await pool.connect();
            // Fetch material name for logging
            const materialResult = await pool.request().input('materialId', sql.Int, materialId).query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            const materialName = materialResult.recordset[0]?.Name || '';
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 1 WHERE MaterialID = @materialId');
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'REACTIVATE')
                .input('tableaffected', sql.NVarChar, 'RawMaterials')
                .input('recordid', sql.Int, materialId)
                .input('description', sql.NVarChar, `Reactivated raw material "${materialName}" (ID: ${materialId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            res.redirect('/Employee/Admin/Archived?reactivated=1');
        } catch (err) {
            console.error('Error reactivating material:', err);
            res.redirect('/Employee/Admin/Archived');
        }
    });

    // Inventory Manager routes (duplicated from Admin, but for InventoryManager role)
    router.get('/Employee/Inventory/InvManagerProducts', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            // Get total count
            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);
            // Get paginated products with discount information
            const result = await pool.request().query(`
                SELECT 
                    p.*,
                    pd.DiscountID,
                    pd.DiscountType,
                    pd.DiscountValue,
                    pd.StartDate as DiscountStartDate,
                    pd.EndDate as DiscountEndDate,
                    pd.IsActive as DiscountIsActive,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price - (p.Price * pd.DiscountValue / 100)
                        WHEN pd.DiscountType = 'fixed' THEN 
                            GREATEST(p.Price - pd.DiscountValue, 0)
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            LEAST(pd.DiscountValue, p.Price)
                        ELSE 0
                    END as DiscountAmount
                FROM Products p
                LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                    AND pd.IsActive = 1 
                    AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
                WHERE p.IsActive = 1
                ORDER BY p.ProductID DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
            `);
            const products = result.recordset;
            res.render('Employee/Inventory/InvManagerProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            req.flash('error', 'Could not fetch products.');
            res.render('Employee/Inventory/InvManagerProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    router.get('/Employee/Inventory/InvManagerMaterials', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 1');
            const materials = result.recordset;
            res.render('Employee/Inventory/InvManagerMaterials', { user: req.session.user, materials: materials });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            req.flash('error', 'Could not fetch raw materials.');
            res.render('Employee/Inventory/InvManagerMaterials', { user: req.session.user, materials: [] });
        }
    });

    router.get('/Employee/Inventory/InvManagerAlerts', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), (req, res) => {
        res.render('Employee/Inventory/InvManagerAlerts', { user: req.session.user });
    });

    router.get('/Employee/Inventory/InvManagerArchived', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), async (req, res) => {
        try {
            await pool.connect();
            const productsResult = await pool.request().query('SELECT * FROM Products WHERE IsActive = 0');
            const materialsResult = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 0');
            res.render('Employee/Inventory/InvManagerArchived', {
                user: req.session.user,
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/Inventory/InvManagerArchived', {
                user: req.session.user,
                archivedProducts: [],
                archivedMaterials: [],
                error: 'Failed to load archived items.'
            });
        }
    });

    router.get('/Employee/Inventory/InvManagerLogs', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('logs'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY al.Timestamp DESC
            `);
            const logs = result.recordset;
            res.render('Employee/Inventory/InvManagerLogs', { user: req.session.user, logs: logs });
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            req.flash('error', 'Could not fetch activity logs.');
            res.render('Employee/Inventory/InvManagerLogs', { user: req.session.user, logs: [] });
        }
    });

    router.get('/Employee/Inventory/InvManagerManUsers', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('users'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.UserID, u.Username, u.FullName, u.Email, r.RoleName, u.IsActive, u.CreatedAt
                FROM Users u
                JOIN Roles r ON u.RoleID = r.RoleID
            `);
            const users = result.recordset;
            res.render('Employee/Inventory/InvManagerManUsers', { user: req.session.user, users: users });
        } catch (err) {
            console.error('Error fetching users:', err);
            req.flash('error', 'Could not fetch user data.');
            res.render('Employee/Inventory/InvManagerManUsers', { user: req.session.user, users: [] });
        }
    });

    // API endpoints for Inventory Manager (copy of Admin, but for InventoryManager role)
    router.get('/Employee/Inventory/InvManagerAlerts/Data', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity
                FROM Products
                WHERE StockQuantity <= 15
                ORDER BY StockQuantity ASC
            `);
            const lowStockProducts = productsResult.recordset;
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit
                FROM RawMaterials
                WHERE QuantityAvailable <= 15 AND IsActive = 1
                ORDER BY QuantityAvailable ASC
            `);
            const lowStockMaterials = materialsResult.recordset;
            res.json({ success: true, products: lowStockProducts, rawMaterials: lowStockMaterials });
        } catch (err) {
            console.error('Error fetching low stock data:', err);
            res.json({ success: false, message: 'Failed to fetch alerts data.' });
        }
    });

    // Dashboard API endpoints for Inventory Manager
    router.get('/api/inventory/dashboard/products-count', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            res.json({ success: true, count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching products count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve products count.', error: err.message });
        }
    });

    router.get('/api/inventory/dashboard/materials-count', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT COUNT(*) as count FROM RawMaterials WHERE IsActive = 1');
            res.json({ success: true, count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching materials count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve materials count.', error: err.message });
        }
    });

    router.get('/api/inventory/dashboard/alerts-count', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const productsResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE StockQuantity <= 15 AND IsActive = 1');
            const materialsResult = await pool.request().query('SELECT COUNT(*) as count FROM RawMaterials WHERE QuantityAvailable <= 15 AND IsActive = 1');
            const totalAlerts = productsResult.recordset[0].count + materialsResult.recordset[0].count;
            res.json({ success: true, count: totalAlerts });
        } catch (err) {
            console.error('Error fetching alerts count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve alerts count.', error: err.message });
        }
    });

    router.get('/api/inventory/dashboard/logs-count', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM ActivityLogs 
                WHERE Timestamp >= DATEADD(day, -1, GETDATE())
            `);
            res.json({ success: true, count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching logs count:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve logs count.', error: err.message });
        }
    });

    // API endpoint to get all raw materials for frontend dropdowns (Inventory Manager)
    router.get('/api/inventory/rawmaterials', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT MaterialID, Name FROM RawMaterials WHERE IsActive = 1');
            res.json({ success: true, materials: result.recordset });
        } catch (err) {
            console.error('Error fetching raw materials for API:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve raw materials.', error: err.message });
        }
    });

    // Shared API: Products for Walk In Orders (Admin + InventoryManager)
    router.get('/api/walkin/products', isAuthenticated, async (req, res) => {
        try {
            const role = req.session?.user?.role || req.session?.user?.roleName || req.session?.user?.RoleName;
            if (!['Admin', 'InventoryManager'].includes(role)) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            await pool.connect();
            const products = await pool.request().query(`
                SELECT ProductID, Name, Price, StockQuantity, IsActive
                FROM Products
                WHERE IsActive = 1
                ORDER BY Name ASC
            `);
            res.json({ success: true, products: products.recordset });
        } catch (err) {
            console.error('Error fetching products for walk in orders:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch products' });
        }
    });

    router.get('/Employee/Inventory/InvManagerLogs/Data', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY al.Timestamp DESC
            `);
            const logs = result.recordset;
            res.json({ success: true, logs: logs });
        } catch (err) {
            console.error('Error fetching activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // Add, Edit, Delete, Reactivate, and User Management POST routes for Inventory Manager
    // (Repeat the same logic as Admin, but change the role and EJS paths)
    // ... (For brevity, you would repeat all Admin POST/PUT/DELETE routes here, changing paths and role to InventoryManager)

    // Add Product POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerProducts/Add', isAuthenticated, hasRole('InventoryManager'), upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnails', maxCount: 4 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        console.log('Received add product request');
        console.log('Request body:', req.body);
        console.log('Files:', req.files);
        try {
            const { name, description, price, stockquantity, category, dimensions, requiredMaterials } = req.body;
            let imageUrl = null;
            let thumbnailUrls = [];
            let model3dUrl = null;
            
            // Handle main product image
            if (req.files && req.files.image && req.files.image[0]) {
                imageUrl = getPublicUrl(req.files.image[0]);
                console.log('Main image saved at:', imageUrl);
            } else {
                console.log('No main image uploaded.');
            }
            
            // Handle thumbnail images
            if (req.files && req.files.thumbnails) {
                thumbnailUrls = req.files.thumbnails.map(file => getPublicUrl(file));
                console.log('Thumbnails saved:', thumbnailUrls);
            } else {
                console.log('No thumbnails uploaded.');
            }

            // Handle 3D model file
            if (req.files && req.files.model3d && req.files.model3d[0]) {
                model3dUrl = getPublicUrl(req.files.model3d[0]);
                console.log('3D model saved at:', model3dUrl);
            } else {
                console.log('No 3D model uploaded.');
            }

            // Get has3dModel from request body
            const has3dModel = req.body.has3dModel;

            // Basic validation
            if (!name || !price || !stockquantity) {
                console.log('Validation failed:', { name, price, stockquantity });
                req.flash('error', 'Name, Price, and Stock Quantity are required.');
                return res.json({ success: false, message: 'Name, Price, and Stock Quantity are required.' });
            }

            await pool.connect();
            
            // Add ThumbnailURLs column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
                ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
            `);
            
            // Add Model3D column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Model3D')
                ALTER TABLE Products ADD Model3D NVARCHAR(500) NULL;
            `);
            
            let transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);

                request.input('name', sql.NVarChar, name);
                request.input('description', sql.NVarChar, description || null);
                request.input('price', sql.Decimal(10, 2), parseFloat(price));
                request.input('stockquantity', sql.Int, parseInt(stockquantity));
                request.input('category', sql.NVarChar, category || null);
                request.input('dimensions', sql.NVarChar, dimensions || null);
                request.input('imageurl', sql.NVarChar, imageUrl);
                request.input('thumbnailurls', sql.NVarChar, JSON.stringify(thumbnailUrls));
                request.input('model3durl', sql.NVarChar, model3dUrl);
                request.input('has3dmodel', sql.Bit, has3dModel === '1' ? 1 : 0);

                const productResult = await request.query(`
                    INSERT INTO Products (Name, Description, Price, StockQuantity, Category, Dimensions, ImageURL, ThumbnailURLs, Model3D, Has3DModel)
                    OUTPUT INSERTED.ProductID
                    VALUES (@name, @description, @price, @stockquantity, @category, @dimensions, @imageurl, @thumbnailurls, @model3durl, @has3dmodel)
                `);

                const newProductID = productResult.recordset[0].ProductID;

                // Insert required materials
                const materials = JSON.parse(requiredMaterials || '[]');
                for (const material of materials) {
                    const materialRequest = new sql.Request(transaction);
                    materialRequest.input('productid', sql.Int, newProductID);
                    materialRequest.input('materialid', sql.Int, material.materialId);
                    materialRequest.input('quantityrequired', sql.Int, material.quantityRequired);
                    await materialRequest.query(`
                        INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                        VALUES (@productid, @materialid, @quantityrequired)
                    `);
                }

                await transaction.commit();

                // Log the activity
                await pool.request()
                    .input('userid', sql.Int, req.session.user.id)
                    .input('action', sql.NVarChar, 'CREATE')
                    .input('tableaffected', sql.NVarChar, 'Products')
                    .input('recordid', sql.Int, newProductID)
                    .input('description', sql.NVarChar, `Added new product "${name}" (ID: ${newProductID})`)
                    .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');

                req.flash('success', 'Product added successfully!');
                res.json({ success: true, message: 'Product added successfully!' });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error adding product:', err);
            req.flash('error', 'Failed to add product.');
            res.json({ success: false, message: 'Failed to add product.' });
        }
    });

    // Edit Product POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerProducts/Edit', isAuthenticated, hasRole('InventoryManager'), upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnails', maxCount: 4 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            const { productid, name, description, price, stockquantity, category, dimensions, currentImageURL, currentModel3dURL, has3dModel } = req.body;
            let imageUrl = currentImageURL;
            let thumbnailUrls = [];
            let model3dUrl = currentModel3dURL;
            
            // Handle main product image
            if (req.files && req.files.image && req.files.image[0]) {
                imageUrl = getPublicUrl(req.files.image[0]);
            }
            
            // Handle thumbnail images - support both bulk and individual uploads
            let newThumbnails = [];
            
            // Handle bulk thumbnail uploads (existing functionality)
            if (req.files && req.files.thumbnails && req.files.thumbnails.length > 0) {
                newThumbnails = req.files.thumbnails.map(file => getPublicUrl(file));
                console.log('Bulk thumbnails uploaded:', newThumbnails);
            }
            
            // Handle individual thumbnail uploads
            const individualThumbnails = [];
            for (let i = 1; i <= 4; i++) {
                const thumbnailKey = `thumbnail${i}`;
                if (req.files && req.files[thumbnailKey] && req.files[thumbnailKey][0]) {
                    individualThumbnails[i - 1] = getPublicUrl(req.files[thumbnailKey][0]);
                    console.log(`Individual thumbnail ${i} uploaded:`, individualThumbnails[i - 1]);
                }
            }
            
            // Get existing thumbnails
            let existingThumbnails = [];
            try {
                const oldProductResult = await pool.request()
                    .input('productid', sql.Int, productid)
                    .query('SELECT ThumbnailURLs FROM Products WHERE ProductID = @productid');
                
                if (oldProductResult.recordset.length > 0 && oldProductResult.recordset[0].ThumbnailURLs) {
                    existingThumbnails = JSON.parse(oldProductResult.recordset[0].ThumbnailURLs);
                    console.log('Existing thumbnails:', existingThumbnails);
                }
            } catch (error) {
                console.error('Error parsing existing thumbnails:', error);
                existingThumbnails = [];
            }
            
            // Merge thumbnails: use bulk upload if provided, otherwise merge individual uploads with existing
            if (newThumbnails.length > 0) {
                thumbnailUrls = newThumbnails;
            } else {
                // Merge individual uploads with existing thumbnails
                thumbnailUrls = [];
                for (let i = 0; i < 4; i++) {
                    if (individualThumbnails[i]) {
                        thumbnailUrls[i] = individualThumbnails[i];
                    } else if (existingThumbnails[i]) {
                        thumbnailUrls[i] = existingThumbnails[i];
                    }
                }
                // Remove empty slots
                thumbnailUrls = thumbnailUrls.filter(url => url);
            }
            
            console.log('Final thumbnails:', thumbnailUrls);

            // Handle 3D model file
            if (req.files && req.files.model3d && req.files.model3d[0]) {
                model3dUrl = getPublicUrl(req.files.model3d[0]);
                console.log('New 3D model saved at:', model3dUrl);
            } else {
                // Keep existing 3D model if no new one uploaded
                if (currentModel3dURL) {
                    model3dUrl = currentModel3dURL;
                    console.log('Keeping existing 3D model:', model3dUrl);
                } else {
                    model3dUrl = null;
                    console.log('No existing 3D model found');
                }
            }

            await pool.connect();
            
            // Add ThumbnailURLs column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
                ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
            `);
            
            // Add Model3D column if it doesn't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Model3D')
                ALTER TABLE Products ADD Model3D NVARCHAR(500) NULL;
            `);
            
            let transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);
                request.input('productid', sql.Int, productid);
                request.input('name', sql.NVarChar, name);
                request.input('description', sql.NVarChar, description || null);
                request.input('price', sql.Decimal(10, 2), parseFloat(price));
                request.input('stockquantity', sql.Int, parseInt(stockquantity));
                request.input('category', sql.NVarChar, category || null);
                request.input('dimensions', sql.NVarChar, dimensions || null);
                request.input('imageurl', sql.NVarChar, imageUrl);
                request.input('thumbnailurls', sql.NVarChar, JSON.stringify(thumbnailUrls));
                request.input('model3durl', sql.NVarChar, model3dUrl);
                request.input('has3dmodel', sql.Bit, has3dModel === '1' ? 1 : 0);

                await request.query(`
                    UPDATE Products 
                    SET Name = @name, Description = @description, Price = @price, 
                        StockQuantity = @stockquantity, Category = @category, 
                        Dimensions = @dimensions, ImageURL = @imageurl, ThumbnailURLs = @thumbnailurls,
                        Model3D = @model3durl, Has3DModel = @has3dmodel
                    WHERE ProductID = @productid
                `);

                await transaction.commit();

                // Log the activity
                await pool.request()
                    .input('userid', sql.Int, req.session.user.id)
                    .input('action', sql.NVarChar, 'UPDATE')
                    .input('tableaffected', sql.NVarChar, 'Products')
                    .input('recordid', sql.Int, productid)
                    .input('description', sql.NVarChar, `Updated product "${name}" (ID: ${productid})`)
                    .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');

                req.flash('success', 'Product updated successfully!');
                res.json({ success: true, message: 'Product updated successfully!' });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            req.flash('error', 'Failed to update product.');
            res.json({ success: false, message: 'Failed to update product.' });
        }
    });

    // Delete Product POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerProducts/Delete/:id', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        const productId = req.params.id;
        try {
            await pool.connect();
            // Fetch product name for logging
            const productResult = await pool.request().input('productId', sql.Int, productId).query('SELECT Name FROM Products WHERE ProductID = @productId');
            const productName = productResult.recordset[0]?.Name || '';
            
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0 WHERE ProductID = @productId');
            
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'DELETE')
                .input('tableaffected', sql.NVarChar, 'Products')
                .input('recordid', sql.Int, productId)
                .input('description', sql.NVarChar, `Deleted product "${productName}" (ID: ${productId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            
            req.flash('success', 'Product deleted successfully!');
            res.redirect('/Employee/Inventory/InvManagerProducts');
        } catch (err) {
            console.error('Error deleting product:', err);
            req.flash('error', 'Failed to delete product.');
            res.redirect('/Employee/Inventory/InvManagerProducts');
        }
    });

    // Update Stock POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerProducts/UpdateStock', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        console.log('Received update stock request');
        console.log('Request body:', req.body);
            const { productId, newStock } = req.body;

        if (!productId || newStock === undefined || newStock < 0) {
            return res.json({ success: false, message: 'Invalid product ID or stock quantity.' });
        }

        try {
            await pool.connect();
            
            // Get current stock and product name to calculate quantity to add
            const currentProductResult = await pool.request()
                .input('productid', sql.Int, productId)
                .query('SELECT StockQuantity, Name FROM Products WHERE ProductID = @productid');

            if (currentProductResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Product not found.' });
            }
            const oldStockQuantity = currentProductResult.recordset[0].StockQuantity;
            const productName = currentProductResult.recordset[0].Name;
            const quantityToAdd = newStock - oldStockQuantity;

            // Only call stored procedure if stock is increasing
            if (quantityToAdd > 0) {
                const request = pool.request();
                request.input('ProductID', sql.Int, productId);
                request.input('QuantityToAdd', sql.Int, quantityToAdd);
                request.input('PerformedBy', sql.Int, req.session.user.id); // Assuming user ID is in session

                await request.execute('AddProductStock'); // Execute the stored procedure

                // Log the activity for stock increase
                const activityRequest = pool.request();
                activityRequest.input('userid', sql.Int, req.session.user.id);
                activityRequest.input('action', sql.NVarChar, 'UPDATE');
                activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                activityRequest.input('description', sql.NVarChar,
                    `Updated Product: Changed stock for "${productName}" (ID: ${productId}) from ${oldStockQuantity} to ${newStock}`
                );
                await activityRequest.query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                    VALUES (@userid, @action, @tableaffected, @description)
                `);

                res.json({ success: true, message: 'Stock updated and materials deducted successfully!' });
            } else if (quantityToAdd < 0) {
                 // Handle stock reduction separately (not via AddProductStock procedure)
                 // For now, directly update if stock is reduced (e.g., manual correction or removal)
                 const updateStockRequest = pool.request();
                 updateStockRequest.input('newStock', sql.Int, newStock);
                 updateStockRequest.input('productid', sql.Int, productId);
                 await updateStockRequest.query('UPDATE Products SET StockQuantity = @newStock WHERE ProductID = @productid');

                 // Log the activity for manual stock reduction
                 const activityRequest = pool.request();
                 activityRequest.input('userid', sql.Int, req.session.user.id);
                 activityRequest.input('action', sql.NVarChar, 'UPDATE');
                 activityRequest.input('tableaffected', sql.NVarChar, 'Products');
                 activityRequest.input('description', sql.NVarChar,
                     `Updated Product: Changed stock for "${productName}" (ID: ${productId}) from ${oldStockQuantity} to ${newStock}`
                 );
                 await activityRequest.query(`
                     INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description)
                     VALUES (@userid, @action, @tableaffected, @description)
                 `);
                 res.json({ success: true, message: 'Stock reduced successfully.' });
            } else {
                // No change in stock
                res.json({ success: true, message: 'No change in stock quantity.' });
            }
        } catch (err) {
            console.error('Error updating product stock:', err);
            // Check if the error is from the stored procedure (e.g., not enough materials)
            if (err.message.includes('Not enough raw materials available')) {
                res.status(400).json({ success: false, message: err.message, error: err.message });
            } else {
                res.status(500).json({ success: false, message: 'Failed to update stock.', error: err.message });
            }
        }
    });

    // Add Material POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerMaterials/Add', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            const { name, description, quantityavailable, unit, supplier, costperunit } = req.body;
            
            await pool.connect();
            const request = new sql.Request(pool);
            request.input('name', sql.NVarChar, name);
            request.input('description', sql.NVarChar, description || null);
            request.input('quantityavailable', sql.Int, parseInt(quantityavailable));
            request.input('unit', sql.NVarChar, unit || null);
            request.input('supplier', sql.NVarChar, supplier || null);
            request.input('costperunit', sql.Decimal(10, 2), parseFloat(costperunit) || 0);

            const result = await request.query(`
                INSERT INTO RawMaterials (Name, Description, QuantityAvailable, Unit, Supplier, CostPerUnit)
                OUTPUT INSERTED.MaterialID
                VALUES (@name, @description, @quantityavailable, @unit, @supplier, @costperunit)
            `);

            const newMaterialID = result.recordset[0].MaterialID;

            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'CREATE')
                .input('tableaffected', sql.NVarChar, 'RawMaterials')
                .input('recordid', sql.Int, newMaterialID)
                .input('description', sql.NVarChar, `Added new raw material "${name}" (ID: ${newMaterialID})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');

            req.flash('success', 'Raw material added successfully!');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        } catch (err) {
            console.error('Error adding raw material:', err);
            req.flash('error', 'Failed to add raw material.');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        }
    });

    // Edit Material POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerMaterials/Edit', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            const { materialid, name, quantityavailable, unit } = req.body;
            
            await pool.connect();
            const request = new sql.Request(pool);
            request.input('materialid', sql.Int, materialid);
            request.input('name', sql.NVarChar, name);
            request.input('quantityavailable', sql.Int, parseInt(quantityavailable));
            request.input('unit', sql.NVarChar, unit || null);

            await request.query(`
                UPDATE RawMaterials 
                SET Name = @name, QuantityAvailable = @quantityavailable, Unit = @unit, LastUpdated = GETDATE()
                WHERE MaterialID = @materialid
            `);

            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'UPDATE')
                .input('tableaffected', sql.NVarChar, 'RawMaterials')
                .input('recordid', sql.Int, materialid)
                .input('description', sql.NVarChar, `Updated raw material "${name}" (ID: ${materialid})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');

            req.flash('success', 'Raw material updated successfully!');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        } catch (err) {
            console.error('Error updating raw material:', err);
            req.flash('error', 'Failed to update raw material.');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        }
    });

    // Delete Material POST route for Inventory Manager
    router.post('/Employee/Inventory/InvManagerMaterials/Delete/:id', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        const materialId = req.params.id;
        try {
            await pool.connect();
            // Fetch material name for logging
            const materialResult = await pool.request().input('materialId', sql.Int, materialId).query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            const materialName = materialResult.recordset[0]?.Name || '';
            
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0 WHERE MaterialID = @materialId');
            
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'DELETE')
                .input('tableaffected', sql.NVarChar, 'RawMaterials')
                .input('recordid', sql.Int, materialId)
                .input('description', sql.NVarChar, `Deleted raw material "${materialName}" (ID: ${materialId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            
            req.flash('success', 'Raw material deleted successfully!');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        } catch (err) {
            console.error('Error deleting raw material:', err);
            req.flash('error', 'Failed to delete raw material.');
            res.redirect('/Employee/Inventory/InvManagerMaterials');
        }
    });

    // API endpoint to get product materials for Inventory Manager
    router.get('/api/inventory/products/:productId/materials', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request()
                .input('productId', sql.Int, req.params.productId)
                .query(`
                    SELECT pm.MaterialID, pm.QuantityRequired, rm.Name
                    FROM ProductMaterials pm
                    JOIN RawMaterials rm ON pm.MaterialID = rm.MaterialID
                    WHERE pm.ProductID = @productId
                `);
            res.json({ success: true, materials: result.recordset });
        } catch (err) {
            console.error('Error fetching product materials:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve product materials.', error: err.message });
        }
    });

    // API endpoint to get all distinct product categories (Admin)
    router.get('/api/categories', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query("SELECT DISTINCT Category FROM Products WHERE Category IS NOT NULL AND Category <> ''");
            res.json({ success: true, categories: result.recordset.map(row => row.Category) });
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
        }
    });

    // API endpoint to get all distinct product categories (Inventory Manager)
    router.get('/api/inventory/categories', isAuthenticated, hasRole('InventoryManager'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query("SELECT DISTINCT Category FROM Products WHERE Category IS NOT NULL AND Category <> ''");
            res.json({ success: true, categories: result.recordset.map(row => row.Category) });
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
        }
    });

    // Ensure SafetySettings table exists and has a row
    async function ensureSafetySettings(pool) {
        await pool.connect();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SafetySettings')
            BEGIN
                CREATE TABLE SafetySettings (
                    ID INT PRIMARY KEY IDENTITY(1,1),
                    SafetyStockValue INT NOT NULL DEFAULT 10
                );
                INSERT INTO SafetySettings (SafetyStockValue) VALUES (10);
            END
        `);
    }

    // Get current safety stock value (Admin only)
    router.get('/api/safety-stock-value', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await ensureSafetySettings(pool);
            const result = await pool.request().query('SELECT TOP 1 SafetyStockValue FROM SafetySettings');
            const value = result.recordset[0]?.SafetyStockValue || 10;
            res.json({ success: true, value });
        } catch (err) {
            res.status(500).json({ success: false, value: 10, error: err.message });
        }
    });

    // Set new safety stock value (Admin only)
    router.post('/api/safety-stock-value', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const { value } = req.body;
        if (!value || isNaN(value) || value < 1) {
            return res.status(400).json({ success: false, message: 'Invalid value' });
        }
        try {
            await ensureSafetySettings(pool);
            await pool.request().query('UPDATE SafetySettings SET SafetyStockValue = ' + parseInt(value));
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // Safety Stock Alert API (Admin only, uses adjustable value)
    router.get('/api/safety-stock-alert', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await ensureSafetySettings(pool);
            const valueResult = await pool.request().query('SELECT TOP 1 SafetyStockValue FROM SafetySettings');
            const safetyStock = valueResult.recordset[0]?.SafetyStockValue || 10;
            // Products at or below safety stock
            const productsResult = await pool.request().query(
                'SELECT ProductID, Name, StockQuantity FROM Products WHERE StockQuantity <= ' + safetyStock + ' AND IsActive = 1'
            );
            // Raw materials at or below safety stock
            const materialsResult = await pool.request().query(
                'SELECT MaterialID, Name, QuantityAvailable FROM RawMaterials WHERE QuantityAvailable <= ' + safetyStock + ' AND IsActive = 1'
            );
            const products = productsResult.recordset;
            const materials = materialsResult.recordset;
            const hasAlert = products.length > 0 || materials.length > 0;
            res.json({ hasAlert, products, materials, safetyStock });
        } catch (err) {
            res.status(500).json({ hasAlert: false, products: [], materials: [], error: err.message });
        }
    });

    // Admin Orders and Other Pages (Blank)
    router.get('/Employee/Admin/OrdersPending', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all pending orders with customer, address, and items including payment details
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost, o.StripeSessionID, o.PaymentStatus,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                OUTER APPLY (
                    SELECT TOP 1 ca.*
                    FROM CustomerAddresses ca
                    WHERE ca.CustomerID = c.CustomerID
                      AND (ca.AddressID = o.ShippingAddressID OR (o.ShippingAddressID IS NULL AND ca.IsDefault = 1))
                    ORDER BY CASE WHEN ca.AddressID = o.ShippingAddressID THEN 0 WHEN ca.IsDefault = 1 THEN 1 ELSE 2 END, ca.AddressID DESC
                ) a
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Pending'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminOrdersPending', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching pending orders:', err);
            res.render('Employee/Admin/AdminOrdersPending', { user: req.session.user, orders: [], error: 'Failed to load pending orders.' });
        }
    });

    // Helper to ensure WalkInOrders table exists
    async function ensureWalkInOrdersTable(pool) {
        try {
            console.log('Checking if WalkInOrders table exists...');
            
            // First check if table exists
            const tableExists = await pool.request().query(`
                SELECT COUNT(*) as count FROM sys.tables WHERE name = 'WalkInOrders'
            `);
            
            if (tableExists.recordset[0].count === 0) {
                console.log('Creating WalkInOrders table...');
                await pool.request().query(`
                    CREATE TABLE WalkInOrders (
                        BulkOrderID INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerName NVARCHAR(255) NOT NULL,
                        Address NVARCHAR(MAX) NULL,
                        ContactNumber NVARCHAR(100) NULL,
                        ContactEmail NVARCHAR(255) NULL,
                        OrderedProducts NVARCHAR(MAX) NULL, -- JSON or text description
                        Discount DECIMAL(10,2) NULL DEFAULT(0),
                        TotalAmount DECIMAL(10,2) NOT NULL,
                        Status NVARCHAR(50) NOT NULL DEFAULT('Processing'),
                        ExpectedArrival DATETIME NULL,
                        CompletedAt DATETIME NULL,
                        CreatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
                        DeliveryType NVARCHAR(20) NOT NULL DEFAULT('pickup')
                    )
                `);
                console.log('WalkInOrders table created successfully');
            } else {
                console.log('WalkInOrders table already exists');
                
                // Check if BulkOrderID column exists
                const columnExists = await pool.request().query(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'WalkInOrders' AND COLUMN_NAME = 'BulkOrderID'
                `);
                
                if (columnExists.recordset[0].count === 0) {
                    console.log('BulkOrderID column missing, recreating table...');
                    // Drop and recreate table
                    await pool.request().query(`DROP TABLE WalkInOrders`);
                    await pool.request().query(`
                        CREATE TABLE WalkInOrders (
                            BulkOrderID INT IDENTITY(1,1) PRIMARY KEY,
                            CustomerName NVARCHAR(255) NOT NULL,
                            Address NVARCHAR(MAX) NULL,
                            ContactNumber NVARCHAR(100) NULL,
                            ContactEmail NVARCHAR(255) NULL,
                            OrderedProducts NVARCHAR(MAX) NULL, -- JSON or text description
                            Discount DECIMAL(10,2) NULL DEFAULT(0),
                            TotalAmount DECIMAL(10,2) NOT NULL,
                            Status NVARCHAR(50) NOT NULL DEFAULT('Processing'),
                            ExpectedArrival DATETIME NULL,
                            CompletedAt DATETIME NULL,
                            CreatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
                            DeliveryType NVARCHAR(20) NOT NULL DEFAULT('pickup')
                        )
                    `);
                    console.log('WalkInOrders table recreated successfully');
                }
            }

            // Add constraints if they don't exist
            const statusConstraintExists = await pool.request().query(`
                SELECT COUNT(*) as count FROM sys.check_constraints 
                WHERE name = 'CHK_WalkInOrders_Status' AND parent_object_id = OBJECT_ID('WalkInOrders')
            `);
            
            if (statusConstraintExists.recordset[0].count === 0) {
                console.log('Adding Status constraint...');
                await pool.request().query(`
                    ALTER TABLE WalkInOrders WITH NOCHECK
                    ADD CONSTRAINT CHK_WalkInOrders_Status
                    CHECK (Status IN ('Processing', 'On delivery', 'Completed'))
                `);
                console.log('Status constraint added');
            }

            const deliveryConstraintExists = await pool.request().query(`
                SELECT COUNT(*) as count FROM sys.check_constraints 
                WHERE name = 'CHK_WalkInOrders_DeliveryType' AND parent_object_id = OBJECT_ID('WalkInOrders')
            `);
            
            if (deliveryConstraintExists.recordset[0].count === 0) {
                console.log('Adding DeliveryType constraint...');
                await pool.request().query(`
                    ALTER TABLE WalkInOrders WITH NOCHECK
                    ADD CONSTRAINT CHK_WalkInOrders_DeliveryType
                    CHECK (DeliveryType IN ('pickup', 'delivery'))
                `);
                console.log('DeliveryType constraint added');
            }
            
            console.log('WalkInOrders table setup completed');
        } catch (err) {
            console.error('Error in ensureWalkInOrdersTable:', err);
            throw err;
        }
    }

    // Admin Walk In page (list)
    router.get('/Employee/Admin/WalkIn', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            console.log('Walk-In route accessed by user:', req.session.user);
            console.log('User role:', req.session.user?.role || req.session.user?.roleName || req.session.user?.RoleName);
            console.log('Attempting to connect to database for Walk-In orders...');
            await pool.connect();
            console.log('Database connected successfully');
            
            console.log('Ensuring WalkInOrders table exists...');
            await ensureWalkInOrdersTable(pool);
            console.log('WalkInOrders table ensured');
            
            // Check table structure
            console.log('Checking WalkInOrders table structure...');
            const structureResult = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'WalkInOrders'
                ORDER BY ORDINAL_POSITION
            `);
            console.log('Table structure:', structureResult.recordset);
            
            console.log('Querying WalkInOrders...');
            const result = await pool.request().query(`SELECT * FROM WalkInOrders ORDER BY CreatedAt DESC`);
            console.log(`Found ${result.recordset.length} walk-in orders`);
            
            res.render('Employee/Admin/AdminWalkIn', { user: req.session.user, bulkOrders: result.recordset });
        } catch (err) {
            console.error('Error rendering Admin Walk In:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                number: err.number,
                state: err.state,
                class: err.class,
                serverName: err.serverName,
                procName: err.procName,
                lineNumber: err.lineNumber
            });
            res.render('Employee/Admin/AdminWalkIn', { user: req.session.user, bulkOrders: [], error: 'Failed to load walk in orders: ' + err.message });
        }
    });

    // Admin Walk In: Create
    router.post('/Employee/Admin/WalkIn/Add', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            await ensureWalkInOrdersTable(pool);
            const { customerName, address, contactNumber, contactEmail, orderedProducts, discount, totalAmount, expectedArrival, deliveryType } = req.body;
            const ordered = JSON.parse(orderedProducts || '[]');
            // Insert bulk order with ETA
            await pool.request()
                .input('CustomerName', customerName || '')
                .input('Address', address || '')
                .input('ContactNumber', contactNumber || '')
                .input('ContactEmail', contactEmail || '')
                .input('OrderedProducts', orderedProducts || '')
                .input('Discount', Number(discount || 0))
                .input('TotalAmount', Number(totalAmount || 0))
                .input('ExpectedArrival', expectedArrival ? new Date(expectedArrival) : null)
                .input('DeliveryType', deliveryType || 'pickup')
                .query(`INSERT INTO WalkInOrders (CustomerName, Address, ContactNumber, ContactEmail, OrderedProducts, Discount, TotalAmount, Status, ExpectedArrival, DeliveryType)
                        VALUES (@CustomerName, @Address, @ContactNumber, @ContactEmail, @OrderedProducts, @Discount, @TotalAmount, 'Processing', @ExpectedArrival, @DeliveryType)`);
            // Deduct stock quantities
            for (const item of ordered) {
                const pid = parseInt(item.productId || item.ProductID);
                const qty = parseInt(item.quantity || 0);
                if (pid && qty > 0) {
                    await pool.request().query(`UPDATE Products SET StockQuantity = CASE WHEN StockQuantity >= ${qty} THEN StockQuantity - ${qty} ELSE 0 END WHERE ProductID = ${pid}`);
                }
            }
            res.redirect('/Employee/Admin/WalkIn');
        } catch (err) {
            console.error('Error adding admin walk in order:', err);
            res.status(500).send('Failed to add walk in order');
        }
    });

    // Admin Walk In: Proceed to On delivery
    router.post('/Employee/Admin/WalkIn/ProceedToDelivery/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const id = parseInt(req.params.id);
            await pool.request().query(`UPDATE WalkInOrders SET Status = 'On delivery' WHERE BulkOrderID = ${id}`);
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating bulk order to delivery:', err);
            res.json({ success: false, message: 'Update failed' });
        }
    });

    // Admin Bulk Order: Complete
    router.post('/Employee/Admin/WalkIn/Complete/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const id = parseInt(req.params.id);
            await pool.request().query(`UPDATE WalkInOrders SET Status = 'Completed', CompletedAt = GETDATE() WHERE BulkOrderID = ${id}`);
            res.json({ success: true });
        } catch (err) {
            console.error('Error completing bulk order:', err);
            res.json({ success: false, message: 'Update failed' });
        }
    });

    router.get('/Employee/Inventory/InvManOrdersPending', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all pending orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                OUTER APPLY (
                    SELECT TOP 1 ca.*
                    FROM CustomerAddresses ca
                    WHERE ca.CustomerID = c.CustomerID
                      AND (ca.AddressID = o.ShippingAddressID OR (o.ShippingAddressID IS NULL AND ca.IsDefault = 1))
                    ORDER BY CASE WHEN ca.AddressID = o.ShippingAddressID THEN 0 WHEN ca.IsDefault = 1 THEN 1 ELSE 2 END, ca.AddressID DESC
                ) a
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Pending'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManOrdersPending', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching pending orders:', err);
            res.render('Employee/Inventory/InvManOrdersPending', { user: req.session.user, orders: [], error: 'Failed to load pending orders.' });
        }
    });

    // Inventory Manager Walk In page (list)
    router.get('/Employee/Inventory/WalkIn', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            await ensureWalkInOrdersTable(pool);
            const result = await pool.request().query(`SELECT BulkOrderID, * FROM WalkInOrders ORDER BY CreatedAt DESC`);
            res.render('Employee/Inventory/InvManagerWalkIn', { user: req.session.user, bulkOrders: result.recordset });
        } catch (err) {
            console.error('Error rendering Inventory Manager Walk In:', err);
            res.render('Employee/Inventory/InvManagerWalkIn', { user: req.session.user, bulkOrders: [], error: 'Failed to load walk in orders.' });
        }
    });

    // Inventory Manager Walk In: Create
    router.post('/Employee/Inventory/WalkIn/Add', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            await ensureWalkInOrdersTable(pool);
            const { customerName, address, contactNumber, contactEmail, orderedProducts, discount, totalAmount, expectedArrival, deliveryType } = req.body;
            const ordered = JSON.parse(orderedProducts || '[]');
            await pool.request()
                .input('CustomerName', customerName || '')
                .input('Address', address || '')
                .input('ContactNumber', contactNumber || '')
                .input('ContactEmail', contactEmail || '')
                .input('OrderedProducts', orderedProducts || '')
                .input('Discount', Number(discount || 0))
                .input('TotalAmount', Number(totalAmount || 0))
                .input('ExpectedArrival', expectedArrival ? new Date(expectedArrival) : null)
                .input('DeliveryType', deliveryType || 'pickup')
                .query(`INSERT INTO WalkInOrders (CustomerName, Address, ContactNumber, ContactEmail, OrderedProducts, Discount, TotalAmount, Status, ExpectedArrival, DeliveryType)
                        VALUES (@CustomerName, @Address, @ContactNumber, @ContactEmail, @OrderedProducts, @Discount, @TotalAmount, 'Processing', @ExpectedArrival, @DeliveryType)`);
            for (const item of ordered) {
                const pid = parseInt(item.productId || item.ProductID);
                const qty = parseInt(item.quantity || 0);
                if (pid && qty > 0) {
                    await pool.request().query(`UPDATE Products SET StockQuantity = CASE WHEN StockQuantity >= ${qty} THEN StockQuantity - ${qty} ELSE 0 END WHERE ProductID = ${pid}`);
                }
            }
            res.redirect('/Employee/Inventory/WalkIn');
        } catch (err) {
            console.error('Error adding inventory walk in order:', err);
            res.status(500).send('Failed to add walk in order');
        }
    });

    // Inventory Manager Bulk Order: Proceed to On delivery
    router.post('/Employee/Inventory/WalkIn/ProceedToDelivery/:id', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const id = parseInt(req.params.id);
            await pool.request().query(`UPDATE WalkInOrders SET Status = 'On delivery' WHERE BulkOrderID = ${id}`);
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating bulk order to delivery (inv):', err);
            res.json({ success: false, message: 'Update failed' });
        }
    });

    // Inventory Manager Bulk Order: Complete
    router.post('/Employee/Inventory/WalkIn/Complete/:id', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const id = parseInt(req.params.id);
            await pool.request().query(`UPDATE WalkInOrders SET Status = 'Completed', CompletedAt = GETDATE() WHERE BulkOrderID = ${id}`);
            res.json({ success: true });
        } catch (err) {
            console.error('Error completing bulk order (inv):', err);
            res.json({ success: false, message: 'Update failed' });
        }
    });

    router.get('/Employee/Admin/OrdersProcessing', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all processing orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                OUTER APPLY (
                    SELECT TOP 1 ca.*
                    FROM CustomerAddresses ca
                    WHERE ca.CustomerID = c.CustomerID
                      AND (ca.AddressID = o.ShippingAddressID OR (o.ShippingAddressID IS NULL AND ca.IsDefault = 1))
                    ORDER BY CASE WHEN ca.AddressID = o.ShippingAddressID THEN 0 WHEN ca.IsDefault = 1 THEN 1 ELSE 2 END, ca.AddressID DESC
                ) a
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Processing'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminOrdersProcessing', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching processing orders:', err);
            res.render('Employee/Admin/AdminOrdersProcessing', { user: req.session.user, orders: [], error: 'Failed to load processing orders.' });
        }
    });
    router.get('/Employee/Admin/OrdersShipping', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all shipping orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                OUTER APPLY (
                    SELECT TOP 1 ca.*
                    FROM CustomerAddresses ca
                    WHERE ca.CustomerID = c.CustomerID
                      AND (ca.AddressID = o.ShippingAddressID OR (o.ShippingAddressID IS NULL AND ca.IsDefault = 1))
                    ORDER BY CASE WHEN ca.AddressID = o.ShippingAddressID THEN 0 WHEN ca.IsDefault = 1 THEN 1 ELSE 2 END, ca.AddressID DESC
                ) a
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Shipping'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminOrdersShipping', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching shipping orders:', err);
            res.render('Employee/Admin/AdminOrdersShipping', { user: req.session.user, orders: [], error: 'Failed to load shipping orders.' });
        }
    });
    router.get('/Employee/Admin/OrdersDelivery', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all delivery orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Delivery'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminOrdersDelivery', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching delivery orders:', err);
            res.render('Employee/Admin/AdminOrdersDelivery', { user: req.session.user, orders: [], error: 'Failed to load delivery orders.' });
        }
    });
    router.get('/Employee/Admin/OrdersReceive', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all receive orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Receive'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminOrdersReceive', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching receive orders:', err);
            res.render('Employee/Admin/AdminOrdersReceive', { user: req.session.user, orders: [], error: 'Failed to load receive orders.' });
        }
    });
    router.get('/Employee/Admin/CancelledOrders', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all cancelled orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Cancelled'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminCancelledOrders', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching cancelled orders:', err);
            res.render('Employee/Admin/AdminCancelledOrders', { user: req.session.user, orders: [], error: 'Failed to load cancelled orders.' });
        }
    });
    router.get('/Employee/Admin/CompletedOrders', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all completed orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Completed'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Admin/AdminCompletedOrders', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching completed orders:', err);
            res.render('Employee/Admin/AdminCompletedOrders', { user: req.session.user, orders: [], error: 'Failed to load completed orders.' });
        }
    });
    router.get('/Employee/Admin/ChatSupport', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all threads
            const threadsResult = await pool.request().query(`
                SELECT c.CustomerID, c.FullName, c.Email,
                    MAX(m.SentAt) AS LastMessageAt,
                    (SELECT TOP 1 MessageText FROM ChatMessages WHERE CustomerID = c.CustomerID ORDER BY SentAt DESC) AS LastMessageText,
                    SUM(CASE WHEN m.SenderType = 'customer' AND m.IsRead = 0 THEN 1 ELSE 0 END) AS UnreadCount
                FROM Customers c
                LEFT JOIN ChatMessages m ON c.CustomerID = m.CustomerID
                WHERE EXISTS (SELECT 1 FROM ChatMessages WHERE CustomerID = c.CustomerID)
                GROUP BY c.CustomerID, c.FullName, c.Email
                ORDER BY LastMessageAt DESC
            `);
            const threads = threadsResult.recordset;
            // Select first thread by default
            const selectedThread = threads.length > 0 ? threads[0] : null;
            let messages = [];
            if (selectedThread) {
                const messagesResult = await pool.request()
                    .input('customerId', sql.Int, selectedThread.CustomerID)
                    .query('SELECT * FROM ChatMessages WHERE CustomerID = @customerId ORDER BY SentAt ASC');
                messages = messagesResult.recordset;
            }
            res.render('Employee/Admin/AdminChatSupport', {
                threads,
                selectedThread,
                messages
            });
        } catch (err) {
            res.render('Employee/Admin/AdminChatSupport', {
                threads: [],
                selectedThread: null,
                messages: [],
                error: err.message
            });
        }
    });
    router.get('/Employee/Admin/CMS', isAuthenticated, hasRole('Admin'), (req, res) => {
        res.render('Employee/Admin/AdminCMS', { user: req.session.user });
    });

    // Admin: Delivery Rates page
    router.get('/Employee/Admin/DeliveryRates', isAuthenticated, hasRole('Admin'), (req, res) => {
        res.render('Employee/Admin/AdminRates', { user: req.session.user });
    });

    // Inventory Manager: Delivery Rates page
    router.get('/Employee/Inventory/DeliveryRates', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), (req, res) => {
        res.render('Employee/Inventory/InvManagerRates', { user: req.session.user });
    });

    // Inventory Manager: New Transaction and Utility Pages
    router.get('/Employee/Inventory/InvManOrdersProcessing', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all processing orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Processing'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManOrdersProcessing', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching processing orders:', err);
            res.render('Employee/Inventory/InvManOrdersProcessing', { user: req.session.user, orders: [], error: 'Failed to load processing orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManOrdersShipping', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all shipping orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Shipping'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManOrdersShipping', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching shipping orders:', err);
            res.render('Employee/Inventory/InvManOrdersShipping', { user: req.session.user, orders: [], error: 'Failed to load shipping orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManOrdersDelivery', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all delivery orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Delivery'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManOrdersDelivery', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching delivery orders:', err);
            res.render('Employee/Inventory/InvManOrdersDelivery', { user: req.session.user, orders: [], error: 'Failed to load delivery orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManOrdersReceive', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all receive orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Receive'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManOrdersReceive', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching receive orders:', err);
            res.render('Employee/Inventory/InvManOrdersReceive', { user: req.session.user, orders: [], error: 'Failed to load receive orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManCancelledOrders', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all cancelled orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Cancelled'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManCancelledOrders', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching cancelled orders:', err);
            res.render('Employee/Inventory/InvManCancelledOrders', { user: req.session.user, orders: [], error: 'Failed to load cancelled orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManCompletedOrders', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            // Fetch all completed orders with customer, address, and items
            const ordersResult = await pool.request().query(`
                SELECT o.OrderID, o.OrderDate, 
                       FORMAT(o.OrderDate, 'MMM dd, yyyy hh:mm tt') AS FormattedOrderDate,
                       o.Status, o.TotalAmount, o.PaymentMethod, o.Currency, o.PaymentDate,
                       o.DeliveryType, o.DeliveryCost,
                       CASE 
                           WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                           WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                           ELSE o.DeliveryType
                       END as DeliveryTypeName,
                       c.FullName AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone,
                       a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.Region, a.PostalCode, a.Country
                FROM Orders o
                JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                WHERE o.Status = 'Completed'
                ORDER BY o.OrderDate ASC
            `);
            const orders = ordersResult.recordset;
            // Fetch items for each order
            for (let order of orders) {
                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(`
                        SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = @orderId
                    `);
                order.items = itemsResult.recordset;
            }
            res.render('Employee/Inventory/InvManCompletedOrders', { user: req.session.user, orders });
        } catch (err) {
            console.error('Error fetching completed orders:', err);
            res.render('Employee/Inventory/InvManCompletedOrders', { user: req.session.user, orders: [], error: 'Failed to load completed orders.' });
        }
    });
    router.get('/Employee/Inventory/InvManChatSupport', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('chat'), (req, res) => {
        res.render('Employee/Inventory/InvManChatSupport', { user: req.session.user });
    });
    router.get('/Employee/Inventory/InvManagerCMS', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('content'), (req, res) => {
        res.render('Employee/Inventory/InvManagerCMS', { user: req.session.user });
    });

    // --- USER PERMISSIONS ENDPOINTS ---
    router.post('/Employee/Admin/Users/SetPermissions', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const { userId, permissions } = req.body; // permissions: { inventory: true/false, ... }
        try {
            await pool.connect();
            for (const section of Object.keys(permissions)) {
                const canAccess = permissions[section] ? 1 : 0;
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('section', sql.NVarChar, section)
                    .input('canAccess', sql.Bit, canAccess)
                    .query(`
                        IF EXISTS (SELECT 1 FROM UserPermissions WHERE UserID = @userId AND Section = @section)
                            UPDATE UserPermissions SET CanAccess = @canAccess WHERE UserID = @userId AND Section = @section
                        ELSE
                            INSERT INTO UserPermissions (UserID, Section, CanAccess) VALUES (@userId, @section, @canAccess)
                    `);
            }
            res.json({ success: true });
        } catch (err) {
            console.error('Error saving permissions:', err);
            res.status(500).json({ success: false, message: 'Failed to save permissions.' });
        }
    });

    router.get('/Employee/Admin/Users/GetPermissions/:userId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        const userId = req.params.userId;
        try {
            await pool.connect();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Section, CanAccess FROM UserPermissions WHERE UserID = @userId');
            const permissions = {};
            result.recordset.forEach(row => {
                permissions[row.Section] = !!row.CanAccess;
            });
            res.json({ success: true, permissions });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to fetch permissions.' });
        }
    });

    // Helper for route protection
    async function hasSectionAccess(userId, section) {
        await pool.connect();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('section', sql.NVarChar, section)
            .query('SELECT CanAccess FROM UserPermissions WHERE UserID = @userId AND Section = @section');
        return result.recordset[0]?.CanAccess === true;
    }
    module.exports.hasSectionAccess = hasSectionAccess;

    // Helper for section access middleware
    function requireSectionAccess(section) {
        return async function(req, res, next) {
            const userId = req.session.user && req.session.user.id;
            if (!userId) return res.redirect('/login');
            const allowed = await hasSectionAccess(userId, section);
            if (!allowed) {
                // Render forbidden page for InventoryManager
                if (req.session.user && req.session.user.role === 'InventoryManager') {
                    return res.status(403).render('Employee/Inventory/Forbidden');
                }
                // Default: plain 403
                return res.status(403).send('Forbidden: No access to this section');
            }
            next();
        };
    }

    // Reactivate archived product for InventoryManager
    router.post('/Employee/Inventory/InvManagerArchived/ReactivateProduct/:id', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), async (req, res) => {
        const productId = req.params.id;
        try {
            await pool.connect();
            // Fetch product name for logging
            const productResult = await pool.request().input('productId', sql.Int, productId).query('SELECT Name FROM Products WHERE ProductID = @productId');
            const productName = productResult.recordset[0]?.Name || '';
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 1 WHERE ProductID = @productId');
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'REACTIVATE')
                .input('tableaffected', sql.NVarChar, 'Products')
                .input('recordid', sql.Int, productId)
                .input('description', sql.NVarChar, `Reactivated product "${productName}" (ID: ${productId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            res.redirect('/Employee/Inventory/InvManagerArchived?reactivated=1');
        } catch (err) {
            console.error('Error reactivating product:', err);
            res.redirect('/Employee/Inventory/InvManagerArchived');
        }
    });
    // Reactivate archived material for InventoryManager
    router.post('/Employee/Inventory/InvManagerArchived/ReactivateMaterial/:id', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('inventory'), async (req, res) => {
        const materialId = req.params.id;
        try {
            await pool.connect();
            // Fetch material name for logging
            const materialResult = await pool.request().input('materialId', sql.Int, materialId).query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            const materialName = materialResult.recordset[0]?.Name || '';
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 1 WHERE MaterialID = @materialId');
            // Log the activity
            await pool.request()
                .input('userid', sql.Int, req.session.user.id)
                .input('action', sql.NVarChar, 'REACTIVATE')
                .input('tableaffected', sql.NVarChar, 'RawMaterials')
                .input('recordid', sql.Int, materialId)
                .input('description', sql.NVarChar, `Reactivated raw material "${materialName}" (ID: ${materialId})`)
                .query('INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description) VALUES (@userid, @action, @tableaffected, @recordid, @description)');
            res.redirect('/Employee/Inventory/InvManagerArchived?reactivated=1');
        } catch (err) {
            console.error('Error reactivating material:', err);
            res.redirect('/Employee/Inventory/InvManagerArchived');
        }
    });


    // Public API endpoint to get all active products for the frontend
    router.get('/api/products', async (req, res) => {
        try {
            await pool.connect();
            
            // Check if IsFeatured column exists
            const featuredColumnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'IsFeatured'
            `);
            
            // Check if Has3DModel column exists
            const has3dModelColumnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Has3DModel'
            `);
            
            const hasIsFeatured = featuredColumnCheck.recordset.length > 0;
            const hasHas3DModel = has3dModelColumnCheck.recordset.length > 0;
            console.log('IsFeatured column exists:', hasIsFeatured);
            console.log('Has3DModel column exists:', hasHas3DModel);
            
            const result = await pool.request().query(`
                SELECT 
                    p.ProductID,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.StockQuantity,
                    p.Category,
                    p.ImageURL,
                    p.Dimensions,
                    p.DateAdded,
                    p.IsActive,
                    p.Model3D,
                    ${hasIsFeatured ? 'p.IsFeatured' : '0 as IsFeatured'},
                    ${hasHas3DModel ? 'p.Has3DModel' : '0 as Has3DModel'},
                    pd.DiscountID,
                    pd.DiscountType,
                    pd.DiscountValue,
                    pd.StartDate as discountStartDate,
                    pd.EndDate as discountEndDate,
                    COALESCE(sold.soldQuantity, 0) as soldQuantity,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price - (p.Price * pd.DiscountValue / 100)
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                        ELSE p.Price
                    END as discountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
                        ELSE 0
                    END as discountAmount
                FROM Products p
                LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                    AND pd.IsActive = 1
                LEFT JOIN (
                    SELECT 
                        oi.ProductID,
                        SUM(oi.Quantity) as soldQuantity
                    FROM OrderItems oi
                    INNER JOIN Orders o ON oi.OrderID = o.OrderID
                    WHERE o.Status = 'Completed'
                    GROUP BY oi.ProductID
                ) sold ON p.ProductID = sold.ProductID
                WHERE p.IsActive = 1
                ORDER BY ${hasIsFeatured ? 'p.IsFeatured DESC, ' : ''}p.DateAdded DESC
            `);
            
            const products = result.recordset.map(product => {
                // Process discount information
                const hasDiscount = !!product.DiscountID;
                const discountInfo = hasDiscount ? {
                    discountType: product.DiscountType,
                    discountValue: product.DiscountValue,
                    discountStartDate: product.discountStartDate,
                    discountEndDate: product.discountEndDate,
                    discountedPrice: product.discountedPrice,
                    discountAmount: product.discountAmount
                } : null;
                
                return {
                    id: product.ProductID,
                    name: product.Name,
                    description: product.Description,
                    price: product.Price,
                    stockQuantity: product.StockQuantity,
                    categoryName: product.Category,
                    images: product.ImageURL ? [product.ImageURL] : [],
                    specifications: product.Dimensions ? JSON.parse(product.Dimensions) : {},
                    dateAdded: product.DateAdded,
                    isActive: product.IsActive,
                    featured: product.IsFeatured,
                    model3d: product.Model3D,
                    soldQuantity: product.soldQuantity || 0,
                    hasDiscount: hasDiscount,
                    discountInfo: discountInfo
                };
            });
            res.json({ success: true, products });
        } catch (err) {
            console.error('Error fetching products for frontend:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve products.', error: err.message });
        }
    });

    // Public API endpoint to get unique categories for the frontend
    router.get('/api/public/categories', async (req, res) => {
        try {
            await pool.connect();
            
            // Get unique categories from products
            const result = await pool.request().query(`
                SELECT DISTINCT Category 
                FROM Products 
                WHERE Category IS NOT NULL 
                AND Category != '' 
                AND IsActive = 1
                ORDER BY Category
            `);
            
            const categories = result.recordset.map(row => row.Category).filter(category => category);
            res.json({ success: true, categories });
            
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch categories',
                error: error.message 
            });
        }
    });

    // Public API endpoint to get unique materials for the frontend
    router.get('/api/public/materials', async (req, res) => {
        try {
            await pool.connect();
            
            // First try to get materials from RawMaterials table if it exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'RawMaterials'
            `);
            
            let materials = [];
            
            if (tableCheck.recordset.length > 0) {
                // Get materials from RawMaterials table
                const result = await pool.request().query(`
                    SELECT DISTINCT rm.Name as name, COUNT(p.ProductID) as count
                    FROM RawMaterials rm
                    LEFT JOIN Products p ON p.Dimensions LIKE '%' + rm.Name + '%' AND p.IsActive = 1
                    WHERE rm.IsActive = 1
                    GROUP BY rm.Name
                    ORDER BY rm.Name
                `);
                
                materials = result.recordset.map(row => ({
                    name: row.name,
                    count: row.count
                }));
            }
            
            // If no materials from RawMaterials or table doesn't exist, provide common materials
            if (materials.length === 0) {
                // Get product count for each common material based on category
                const commonMaterials = [
                    'Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 
                    'Plastic', 'Steel', 'Aluminum', 'Upholstered', 'Composite'
                ];
                
                materials = commonMaterials.map(material => ({
                    name: material,
                    count: 0 // We'll set this to 0 since we can't determine from current schema
                }));
            }
            
            res.json({ 
                success: true, 
                materials: materials 
            });
            
        } catch (error) {
            console.error('Error fetching materials:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch materials',
                details: error.message 
            });
        }
    });

    // Admin: Proceed to next process
    router.post('/Employee/Admin/OrdersPending/Proceed/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Admin: Cancel order
    router.post('/Employee/Admin/OrdersPending/Cancel/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });
    // Inventory Manager: Proceed to next process
    router.post('/Employee/Inventory/InvManOrdersPending/Proceed/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Inventory Manager: Cancel order
    router.post('/Employee/Inventory/InvManOrdersPending/Cancel/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin: Proceed to Shipping from Processing
    router.post('/Employee/Admin/OrdersProcessing/Proceed/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Admin: Cancel order from Processing
    router.post('/Employee/Admin/OrdersProcessing/Cancel/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Inventory Manager: Proceed to Shipping from Processing
    router.post('/Employee/Inventory/InvManOrdersProcessing/Proceed/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Inventory Manager: Cancel order from Processing
    router.post('/Employee/Inventory/InvManOrdersProcessing/Cancel/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin: Proceed to Delivery from Shipping
    router.post('/Employee/Admin/OrdersShipping/Proceed/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Admin: Cancel order from Shipping
    router.post('/Employee/Admin/OrdersShipping/Cancel/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });
    // Inventory Manager: Proceed to Delivery from Shipping
    router.post('/Employee/Inventory/InvManOrdersShipping/Proceed/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Inventory Manager: Cancel order from Shipping
    router.post('/Employee/Inventory/InvManOrdersShipping/Cancel/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin: Proceed to Receive from Delivery
    router.post('/Employee/Admin/OrdersDelivery/Proceed/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Receive' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Admin: Cancel order from Delivery
    router.post('/Employee/Admin/OrdersDelivery/Cancel/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });
    // Inventory Manager: Proceed to Receive from Delivery
    router.post('/Employee/Inventory/InvManOrdersDelivery/Proceed/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Receive' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });
    // Inventory Manager: Cancel order from Delivery
    router.post('/Employee/Inventory/InvManOrdersDelivery/Cancel/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin: Cancel order from Receive
    router.post('/Employee/Admin/OrdersReceive/Cancel/:orderId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });
    // Inventory Manager: Cancel order from Receive
    router.post('/Employee/Inventory/InvManOrdersReceive/Cancel/:orderId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Mark order as received (customer confirms receipt)
    router.put('/api/customer/orders/:orderId/receive', isAuthenticated, async (req, res) => {
        const orderId = req.params.orderId;
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            // Only allow if the order belongs to this customer and is in 'Receive' status
            const result = await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('customerId', sql.Int, customerId)
                .query(`SELECT Status FROM Orders WHERE OrderID = @orderId AND CustomerID = @customerId`);
            if (!result.recordset.length) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }
            const status = result.recordset[0].Status;
            if (status !== 'Receive') {
                return res.status(400).json({ success: false, message: 'Order is not in a receivable state.' });
            }
            // Update status to Completed
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Completed' WHERE OrderID = @orderId`);
            return res.json({ success: true, message: 'Order marked as completed.' });
        } catch (err) {
            console.error('Error marking order as completed:', err);
            return res.status(500).json({ success: false, message: 'Failed to mark order as completed.' });
        }
    });

    // --- Header Offer Bar API Endpoints ---
    
    // GET: Fetch header offer bar settings
    router.get('/api/admin/header-offer-bar', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1 
                    OfferText, 
                    ButtonText, 
                    StartDate, 
                    EndDate, 
                    Status, 
                    BackgroundColor, 
                    TextColor,
                    CreatedAt,
                    UpdatedAt
                FROM HeaderOfferBar 
                ORDER BY ID DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                // Format dates for frontend
                settings.startDate = settings.StartDate.toISOString().split('T')[0];
                settings.endDate = settings.EndDate.toISOString().split('T')[0];
                res.json(settings);
            } else {
                // Return default settings if no record exists
                res.json({
                    offerText: 'SPECIAL OFFER Get 25% off premium office furniture collections - Limited time offer ending soon!',
                    buttonText: 'Shop Now',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                    status: 'active',
                    backgroundColor: '#ffc107',
                    textColor: '#ffffff'
                });
            }
        } catch (err) {
            console.error('Error fetching header offer bar settings:', err);
            res.status(500).json({ error: 'Failed to fetch header offer bar settings' });
        }
    });

    // POST: Save header offer bar settings
    router.post('/api/admin/header-offer-bar', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const { offerText, buttonText, startDate, endDate, status, backgroundColor, textColor } = req.body;
            
            // Validate required fields
            if (!offerText || !buttonText || !startDate || !endDate || !status) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Check if a record already exists
            const existingResult = await pool.request().query('SELECT TOP 1 ID FROM HeaderOfferBar');
            
            if (existingResult.recordset.length > 0) {
                // Update existing record
                await pool.request()
                    .input('offerText', sql.NVarChar, offerText)
                    .input('buttonText', sql.NVarChar, buttonText)
                    .input('startDate', sql.Date, new Date(startDate))
                    .input('endDate', sql.Date, new Date(endDate))
                    .input('status', sql.NVarChar, status)
                    .input('backgroundColor', sql.NVarChar, backgroundColor || '#ffc107')
                    .input('textColor', sql.NVarChar, textColor || '#ffffff')
                    .input('updatedAt', sql.DateTime2, new Date())
                    .query(`
                        UPDATE HeaderOfferBar 
                        SET OfferText = @offerText,
                            ButtonText = @buttonText,
                            StartDate = @startDate,
                            EndDate = @endDate,
                            Status = @status,
                            BackgroundColor = @backgroundColor,
                            TextColor = @textColor,
                            UpdatedAt = @updatedAt
                        WHERE ID = (SELECT TOP 1 ID FROM HeaderOfferBar ORDER BY ID DESC)
                    `);
            } else {
                // Insert new record
                await pool.request()
                    .input('offerText', sql.NVarChar, offerText)
                    .input('buttonText', sql.NVarChar, buttonText)
                    .input('startDate', sql.Date, new Date(startDate))
                    .input('endDate', sql.Date, new Date(endDate))
                    .input('status', sql.NVarChar, status)
                    .input('backgroundColor', sql.NVarChar, backgroundColor || '#ffc107')
                    .input('textColor', sql.NVarChar, textColor || '#ffffff')
                    .query(`
                        INSERT INTO HeaderOfferBar (OfferText, ButtonText, StartDate, EndDate, Status, BackgroundColor, TextColor)
                        VALUES (@offerText, @buttonText, @startDate, @endDate, @status, @backgroundColor, @textColor)
                    `);
            }
            
            res.json({ success: true, message: 'Header offer bar settings saved successfully' });
        } catch (err) {
            console.error('Error saving header offer bar settings:', err);
            res.status(500).json({ error: 'Failed to save header offer bar settings' });
        }
    });

    // --- Projects Management API Endpoints ---
    
    // GET: Fetch single project item by ID
    router.get('/api/admin/projects/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const projectId = req.params.id;
            
            const result = await pool.request()
                .input('projectId', sql.Int, projectId)
                .query(`
                    SELECT 
                        pi.id,
                        pi.title,
                        pi.category,
                        pi.tags,
                        pi.description,
                        pi.main_image_url as mainImageUrl,
                        pi.is_active as isActive,
                        pi.sort_order as sortOrder,
                        pi.created_at as createdAt,
                        pi.updated_at as updatedAt
                    FROM project_items pi
                    WHERE pi.id = @projectId
                `);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Project item not found' });
            }
            
            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error fetching gallery item:', err);
            res.status(500).json({ error: 'Failed to fetch gallery item', details: err.message });
        }
    });
    
    // GET: Fetch all project items with thumbnails
    router.get('/api/admin/projects', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            // Check if gallery tables exist, if not return empty array
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'project_items'
            `);
            
            if (tableCheck.recordset[0].count === 0) {
                return res.json([]);
            }
            
            const result = await pool.request().query(`
                SELECT 
                    pi.id,
                    pi.title,
                    pi.category,
                    pi.tags,
                    pi.description,
                    pi.main_image_url,
                    pi.created_at,
                    pi.updated_at,
                    pi.is_active,
                    pi.sort_order,
                    STRING_AGG(pt.image_url, ',') as thumbnail_urls
                FROM project_items pi
                LEFT JOIN project_thumbnails pt ON pi.id = pt.project_item_id
                WHERE pi.is_active = 1
                GROUP BY pi.id, pi.title, pi.category, pi.tags, pi.description, 
                         pi.main_image_url, pi.created_at, pi.updated_at, pi.is_active, pi.sort_order
                ORDER BY pi.sort_order ASC, pi.created_at DESC
            `);
            
            const projectItems = result.recordset.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category,
                tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
                description: item.description,
                mainImageUrl: item.main_image_url,
                thumbnailUrls: item.thumbnail_urls ? item.thumbnail_urls.split(',').map(url => url.trim()) : [],
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                isActive: item.is_active,
                sortOrder: item.sort_order
            }));
            
            res.json(projectItems);
        } catch (err) {
            console.error('Error fetching gallery items:', err);
            res.status(500).json({ error: 'Failed to fetch gallery items' });
        }
    });
    
    // POST: Add new project item
    router.post('/api/admin/projects', isAuthenticated, hasRole('Admin'), upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'thumbnails', maxCount: 8 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            
            const { title, category, tags, description } = req.body;
            const mainImage = req.files['mainImage'] ? req.files['mainImage'][0] : null;
            const thumbnailFiles = req.files['thumbnails'] || [];
            
            // Validate required fields
            if (!title || !mainImage) {
                return res.status(400).json({ error: 'Title and main image are required' });
            }
            
            // Check if gallery tables exist, if not create them
            await createProjectTablesIfNotExist(pool);
            
            // Insert main gallery item
            const insertResult = await pool.request()
                .input('title', sql.NVarChar, title)
                .input('category', sql.NVarChar, category || 'general')
                .input('tags', sql.NVarChar, tags || '')
                .input('description', sql.NVarChar, description || '')
                .input('mainImageUrl', sql.NVarChar, getPublicUrl(mainImage))
                .input('createdAt', sql.DateTime2, new Date())
                .input('updatedAt', sql.DateTime2, new Date())
                .query(`
                    INSERT INTO project_items (title, category, tags, description, main_image_url, created_at, updated_at, is_active, sort_order)
                    OUTPUT INSERTED.id
                    VALUES (@title, @category, @tags, @description, @mainImageUrl, @createdAt, @updatedAt, 1, 0)
                `);
            
            const projectItemId = insertResult.recordset[0].id;
            
            // Insert thumbnails if provided
            if (thumbnailFiles.length > 0) {
                for (let i = 0; i < thumbnailFiles.length; i++) {
                    const thumbnail = thumbnailFiles[i];
                    await pool.request()
                        .input('projectItemId', sql.Int, projectItemId)
                        .input('imageUrl', sql.NVarChar, getPublicUrl(thumbnail))
                        .input('sortOrder', sql.Int, i + 1)
                        .query(`
                            INSERT INTO project_thumbnails (project_item_id, image_url, sort_order)
                            VALUES (@projectItemId, @imageUrl, @sortOrder)
                        `);
                }
            }
            
            res.json({ 
                success: true, 
                message: 'Project item added successfully',
                id: projectItemId
            });
        } catch (err) {
            console.error('Error adding gallery item:', err);
            res.status(500).json({ error: 'Failed to add gallery item' });
        }
    });
    
    // PUT: Update project item
    router.put('/api/admin/projects/:id', isAuthenticated, hasRole('Admin'), upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'thumbnails', maxCount: 8 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            
            const { id } = req.params;
            const { title, category, tags, description } = req.body;
            const mainImage = req.files['mainImage'] ? req.files['mainImage'][0] : null;
            const thumbnailFiles = req.files['thumbnails'] || [];
            
            // Validate required fields
            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }
            
            // Update main gallery item
            let updateQuery = `
                UPDATE project_items 
                SET title = @title, 
                    category = @category, 
                    tags = @tags, 
                    description = @description,
                    updated_at = @updatedAt
            `;
            
            const inputs = {
                title: sql.NVarChar,
                category: sql.NVarChar,
                tags: sql.NVarChar,
                description: sql.NVarChar,
                updatedAt: sql.DateTime2
            };
            
            const values = {
                title: title,
                category: category || 'general',
                tags: tags || '',
                description: description || '',
                updatedAt: new Date()
            };
            
            // Add main image update if new image provided
            if (mainImage) {
                updateQuery += ', main_image_url = @mainImageUrl';
                inputs.mainImageUrl = sql.NVarChar;
                values.mainImageUrl = getPublicUrl(mainImage);
            }
            
            updateQuery += ' WHERE id = @id';
            inputs.id = sql.Int;
            values.id = parseInt(id);
            
            const request = pool.request();
            Object.keys(inputs).forEach(key => {
                request.input(key, inputs[key], values[key]);
            });
            
            await request.query(updateQuery);
            
            // Update thumbnails if new ones provided
            if (thumbnailFiles.length > 0) {
                // Delete existing thumbnails
                await pool.request()
                    .input('projectItemId', sql.Int, id)
                    .query('DELETE FROM project_thumbnails WHERE project_item_id = @projectItemId');
                
                // Insert new thumbnails
                for (let i = 0; i < thumbnailFiles.length; i++) {
                    const thumbnail = thumbnailFiles[i];
                    await pool.request()
                        .input('projectItemId', sql.Int, id)
                        .input('imageUrl', sql.NVarChar, getPublicUrl(thumbnail))
                        .input('sortOrder', sql.Int, i + 1)
                        .query(`
                            INSERT INTO project_thumbnails (project_item_id, image_url, sort_order)
                            VALUES (@projectItemId, @imageUrl, @sortOrder)
                        `);
                }
            }
            
            res.json({ success: true, message: 'Project item updated successfully' });
        } catch (err) {
            console.error('Error updating gallery item:', err);
            res.status(500).json({ error: 'Failed to update gallery item' });
        }
    });
    
    // DELETE: Delete project item
    router.delete('/api/admin/projects/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            const { id } = req.params;
            
            // Delete thumbnails first
            await pool.request()
                .input('projectItemId', sql.Int, id)
                .query('DELETE FROM project_thumbnails WHERE project_item_id = @projectItemId');
            
            // Delete main gallery item
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM project_items WHERE id = @id');
            
            res.json({ success: true, message: 'Project item deleted successfully' });
        } catch (err) {
            console.error('Error deleting gallery item:', err);
            res.status(500).json({ error: 'Failed to delete gallery item' });
        }
    });
    
    // --- Public Projects API Endpoint ---
    
    // GET: Fetch all active project items for frontend
    router.get('/api/projects', async (req, res) => {
        try {
            await pool.connect();
            
            // Check if project tables exist, if not return empty array
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'project_items'
            `);
            
            if (tableCheck.recordset[0].count === 0) {
                return res.json([]);
            }
            
            const result = await pool.request().query(`
                SELECT 
                    pi.id,
                    pi.title,
                    pi.category,
                    pi.tags,
                    pi.description,
                    pi.main_image_url,
                    pi.created_at,
                    pi.updated_at,
                    pi.is_active,
                    pi.sort_order,
                    STRING_AGG(pt.image_url, ',') as thumbnail_urls
                FROM project_items pi
                LEFT JOIN project_thumbnails pt ON pi.id = pt.project_item_id
                WHERE pi.is_active = 1
                GROUP BY pi.id, pi.title, pi.category, pi.tags, pi.description, 
                         pi.main_image_url, pi.created_at, pi.updated_at, pi.is_active, pi.sort_order
                ORDER BY pi.sort_order ASC, pi.created_at DESC
            `);
            
            const projectItems = result.recordset.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category,
                tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
                description: item.description,
                mainImageUrl: item.main_image_url,
                thumbnailUrls: item.thumbnail_urls ? item.thumbnail_urls.split(',').map(url => url.trim()) : [],
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                isActive: item.is_active,
                sortOrder: item.sort_order
            }));
            
            res.json(projectItems);
        } catch (err) {
            console.error('Error fetching gallery items:', err);
            res.status(500).json({ error: 'Failed to fetch gallery items' });
        }
    });

    // Helper function to create project tables if they don't exist
    async function createProjectTablesIfNotExist(pool) {
        try {
            // Create project_items table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='project_items' AND xtype='U')
                BEGIN
                    CREATE TABLE project_items (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        title NVARCHAR(255) NOT NULL,
                        category NVARCHAR(100) NOT NULL,
                        tags NVARCHAR(MAX),
                        description NVARCHAR(MAX),
                        main_image_url NVARCHAR(500) NOT NULL,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        updated_at DATETIME2 DEFAULT GETDATE(),
                        is_active BIT DEFAULT 1,
                        sort_order INT DEFAULT 0
                    );
                END
            `);
            
            // Create project_thumbnails table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='project_thumbnails' AND xtype='U')
                BEGIN
                    CREATE TABLE project_thumbnails (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        project_item_id INT NOT NULL,
                        image_url NVARCHAR(500) NOT NULL,
                        sort_order INT DEFAULT 0,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (project_item_id) REFERENCES project_items(id) ON DELETE CASCADE
                    );
                END
            `);
            
            // Create indexes
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_project_items_category' AND object_id = OBJECT_ID('project_items'))
                    CREATE INDEX IX_project_items_category ON project_items(category);
                
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_project_items_active' AND object_id = OBJECT_ID('project_items'))
                    CREATE INDEX IX_project_items_active ON project_items(is_active);
                
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_project_thumbnails_item' AND object_id = OBJECT_ID('project_thumbnails'))
                    CREATE INDEX IX_project_thumbnails_item ON project_thumbnails(project_item_id);
            `);
            
        } catch (err) {
            console.error('Error creating project tables:', err);
            throw err;
        }
    }

    // GET: Fetch active header offer bar for frontend (public endpoint)
    router.get('/api/header-offer-bar', async (req, res) => {
        try {
            await pool.connect();
            const currentDate = new Date().toISOString().split('T')[0];
            
            const result = await pool.request()
                .input('currentDate', sql.Date, currentDate)
                .query(`
                    SELECT TOP 1 
                        OfferText, 
                        ButtonText, 
                        BackgroundColor, 
                        TextColor
                    FROM HeaderOfferBar 
                    WHERE Status = 'active' 
                    AND StartDate <= @currentDate 
                    AND EndDate >= @currentDate
                    ORDER BY ID DESC
                `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    isActive: true,
                    offerText: settings.OfferText,
                    buttonText: settings.ButtonText,
                    backgroundColor: settings.BackgroundColor,
                    textColor: settings.TextColor
                });
            } else {
                res.json({ isActive: false });
            }
        } catch (err) {
            console.error('Error fetching active header offer bar:', err);
            res.json({ isActive: false });
        }
    });

    // --- Hero Banner API Endpoints ---

router.get('/api/admin/hero-banner', async (req, res) => {
    try {
        await pool.connect();
        
        // Ensure HeroBanner table exists with all required columns
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' and xtype='U')
            CREATE TABLE HeroBanner (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                MainHeading NVARCHAR(255) NULL,
                DescriptionLine1 NVARCHAR(MAX) NULL,
                DescriptionLine2 NVARCHAR(MAX) NULL,
                ButtonText NVARCHAR(100) NULL,
                ButtonLink NVARCHAR(200) NULL,
                Button2Text NVARCHAR(100) NULL,
                Button2Link NVARCHAR(200) NULL,
                Button2BgColor NVARCHAR(7) NULL,
                Button2TextColor NVARCHAR(7) NULL,
                TextColor NVARCHAR(7) NULL,
                ButtonBgColor NVARCHAR(7) NULL,
                ButtonTextColor NVARCHAR(7) NULL,
                HeroBannerImages NVARCHAR(MAX) NULL,
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        
        // Ensure new columns exist on older databases
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Text')
                ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Link')
                ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2BgColor')
                ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2TextColor')
                ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImages')
                ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX) NULL;
        `);
        
        const result = await pool.request().query(`
            SELECT TOP 1 
                MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
                Button2Text, Button2Link, Button2BgColor, Button2TextColor,
                TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages, CreatedAt, UpdatedAt
            FROM HeroBanner
            ORDER BY UpdatedAt DESC
        `);
        
        if (result.recordset.length > 0) {
            const settings = result.recordset[0];
            res.json({
                mainHeading: settings.MainHeading,
                descriptionLine1: settings.DescriptionLine1,
                descriptionLine2: settings.DescriptionLine2,
                buttonText: settings.ButtonText,
                buttonLink: settings.ButtonLink,
                button2Text: settings.Button2Text,
                button2Link: settings.Button2Link,
                button2BgColor: settings.Button2BgColor,
                button2TextColor: settings.Button2TextColor,
                textColor: settings.TextColor,
                buttonBgColor: settings.ButtonBgColor,
                buttonTextColor: settings.ButtonTextColor,
                heroBannerImages: settings.HeroBannerImages ? JSON.parse(settings.HeroBannerImages) : [],
                createdAt: settings.CreatedAt,
                updatedAt: settings.UpdatedAt
            });
        } else {
            // Return default values if no record exists
            res.json({
                mainHeading: 'Premium Office Furniture Solutions',
                descriptionLine1: 'Transform your workspace with our premium collection of office furniture',
                descriptionLine2: 'Discover our premium collection of office furniture designed for modern professionals',
                buttonText: 'SHOP NOW',
                buttonLink: '/products',
                button2Text: 'Custom Design',
                button2Link: '/custom-furniture',
                button2BgColor: '#6c757d',
                button2TextColor: '#ffffff',
                textColor: '#ffffff',
                buttonBgColor: '#ffc107',
                buttonTextColor: '#333333',
                heroBannerImages: [],
                createdAt: null,
                updatedAt: null
            });
        }
    } catch (err) {
        console.error('Error fetching hero banner settings:', err);
        res.status(500).json({ error: 'Failed to fetch hero banner settings' });
    }
});

// POST: Save hero banner settings (admin only)
router.post('/api/admin/hero-banner', upload.array('heroBannerImages', 3), async (req, res) => {
    try {
        await pool.connect();
        
        // Ensure HeroBanner table exists with all required columns
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' and xtype='U')
            CREATE TABLE HeroBanner (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                MainHeading NVARCHAR(255) NULL,
                DescriptionLine1 NVARCHAR(MAX) NULL,
                DescriptionLine2 NVARCHAR(MAX) NULL,
                ButtonText NVARCHAR(100) NULL,
                ButtonLink NVARCHAR(200) NULL,
                Button2Text NVARCHAR(100) NULL,
                Button2Link NVARCHAR(200) NULL,
                Button2BgColor NVARCHAR(7) NULL,
                Button2TextColor NVARCHAR(7) NULL,
                TextColor NVARCHAR(7) NULL,
                ButtonBgColor NVARCHAR(7) NULL,
                ButtonTextColor NVARCHAR(7) NULL,
                HeroBannerImages NVARCHAR(MAX) NULL,
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        
        // Ensure new columns exist on older databases
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Text')
                ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Link')
                ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2BgColor')
                ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2TextColor')
                ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImages')
                ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX) NULL;
        `);
        
        const {
            mainHeading, descriptionLine1, descriptionLine2, buttonText, buttonLink,
            button2Text, button2Link, button2BgColor, button2TextColor,
            textColor, buttonBgColor, buttonTextColor
        } = req.body;
        
        let heroBannerImages = [];
        if (req.files && req.files.length > 0) {
            heroBannerImages = req.files.map(file => getPublicUrl(file));
        } else if (req.body && req.body.heroBannerImages) {
            try {
                const parsed = typeof req.body.heroBannerImages === 'string'
                    ? JSON.parse(req.body.heroBannerImages)
                    : req.body.heroBannerImages;
                if (Array.isArray(parsed)) heroBannerImages = parsed;
            } catch (e) {
                // ignore parse errors; fallback to empty/previous
            }
        }
        
        // Check if record exists
        const existingResult = await pool.request().query('SELECT TOP 1 ID FROM HeroBanner');
        
                if (existingResult.recordset.length > 0) {
            // Update existing record
            if (heroBannerImages.length > 0) {
                await pool.request()
                    .input('mainHeading', sql.NVarChar(255), mainHeading || null)
                    .input('descriptionLine1', sql.NVarChar(sql.MAX), descriptionLine1 || null)
                    .input('descriptionLine2', sql.NVarChar(sql.MAX), descriptionLine2 || null)
                    .input('buttonText', sql.NVarChar(100), buttonText || null)
                    .input('buttonLink', sql.NVarChar(200), buttonLink || null)
                    .input('button2Text', sql.NVarChar(100), button2Text || null)
                    .input('button2Link', sql.NVarChar(200), button2Link || null)
                    .input('button2BgColor', sql.NVarChar(7), button2BgColor || null)
                    .input('button2TextColor', sql.NVarChar(7), button2TextColor || null)
                    .input('textColor', sql.NVarChar(7), textColor || null)
                    .input('buttonBgColor', sql.NVarChar(7), buttonBgColor || null)
                    .input('buttonTextColor', sql.NVarChar(7), buttonTextColor || null)
                    .input('heroBannerImages', sql.NVarChar(sql.MAX), JSON.stringify(heroBannerImages))
                    .query(`
                        UPDATE HeroBanner
                        SET MainHeading = @mainHeading, DescriptionLine1 = @descriptionLine1, 
                            DescriptionLine2 = @descriptionLine2, ButtonText = @buttonText, ButtonLink = @buttonLink,
                            Button2Text = @button2Text, Button2Link = @button2Link, Button2BgColor = @button2BgColor, Button2TextColor = @button2TextColor,
                            TextColor = @textColor, ButtonBgColor = @buttonBgColor, ButtonTextColor = @buttonTextColor,
                            HeroBannerImages = @heroBannerImages, UpdatedAt = GETDATE()
                        WHERE ID = (SELECT TOP 1 ID FROM HeroBanner)
                    `);
            } else {
                await pool.request()
                    .input('mainHeading', sql.NVarChar(255), mainHeading || null)
                    .input('descriptionLine1', sql.NVarChar(sql.MAX), descriptionLine1 || null)
                    .input('descriptionLine2', sql.NVarChar(sql.MAX), descriptionLine2 || null)
                    .input('buttonText', sql.NVarChar(100), buttonText || null)
                    .input('buttonLink', sql.NVarChar(200), buttonLink || null)
                    .input('button2Text', sql.NVarChar(100), button2Text || null)
                    .input('button2Link', sql.NVarChar(200), button2Link || null)
                    .input('button2BgColor', sql.NVarChar(7), button2BgColor || null)
                    .input('button2TextColor', sql.NVarChar(7), button2TextColor || null)
                    .input('textColor', sql.NVarChar(7), textColor || null)
                    .input('buttonBgColor', sql.NVarChar(7), buttonBgColor || null)
                    .input('buttonTextColor', sql.NVarChar(7), buttonTextColor || null)
                    .query(`
                        UPDATE HeroBanner
                        SET MainHeading = @mainHeading, DescriptionLine1 = @descriptionLine1, 
                            DescriptionLine2 = @descriptionLine2, ButtonText = @buttonText, ButtonLink = @buttonLink,
                            Button2Text = @button2Text, Button2Link = @button2Link, Button2BgColor = @button2BgColor, Button2TextColor = @button2TextColor,
                            TextColor = @textColor, ButtonBgColor = @buttonBgColor, ButtonTextColor = @buttonTextColor,
                            UpdatedAt = GETDATE()
                    WHERE ID = (SELECT TOP 1 ID FROM HeroBanner)
                `);
            }
        } else {
            // Insert new record
            await pool.request()
                .input('mainHeading', sql.NVarChar(255), mainHeading || null)
                .input('descriptionLine1', sql.NVarChar(sql.MAX), descriptionLine1 || null)
                .input('descriptionLine2', sql.NVarChar(sql.MAX), descriptionLine2 || null)
                .input('buttonText', sql.NVarChar(100), buttonText || null)
                .input('buttonLink', sql.NVarChar(200), buttonLink || null)
                .input('button2Text', sql.NVarChar(100), button2Text || null)
                .input('button2Link', sql.NVarChar(200), button2Link || null)
                .input('button2BgColor', sql.NVarChar(7), button2BgColor || null)
                .input('button2TextColor', sql.NVarChar(7), button2TextColor || null)
                .input('textColor', sql.NVarChar(7), textColor || null)
                .input('buttonBgColor', sql.NVarChar(7), buttonBgColor || null)
                .input('buttonTextColor', sql.NVarChar(7), buttonTextColor || null)
                .input('heroBannerImages', sql.NVarChar(sql.MAX), JSON.stringify(heroBannerImages))
                .query(`
                    INSERT INTO HeroBanner (
                        MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
                        Button2Text, Button2Link, Button2BgColor, Button2TextColor,
                        TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages, CreatedAt, UpdatedAt
                    ) VALUES (
                        @mainHeading, @descriptionLine1, @descriptionLine2, @buttonText, @buttonLink,
                        @button2Text, @button2Link, @button2BgColor, @button2TextColor,
                        @textColor, @buttonBgColor, @buttonTextColor, @heroBannerImages, GETDATE(), GETDATE()
                    )
                `);
        }
        
        res.json({ 
            success: true, 
            message: 'Hero banner settings saved successfully',
            heroBannerImages: heroBannerImages
        });
    } catch (err) {
        console.error('Error saving hero banner settings:', err);
        res.status(500).json({ error: 'Failed to save hero banner settings' });
    }
});

// DELETE: Remove hero banner images (admin only)
router.delete('/api/admin/hero-banner', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        await pool.request().query(`
            UPDATE HeroBanner
            SET HeroBannerImages = NULL, UpdatedAt = GETDATE()
            WHERE ID = (SELECT TOP 1 ID FROM HeroBanner)
        `);
        
        res.json({ success: true, message: 'Hero banner images removed successfully' });
    } catch (err) {
        console.error('Error removing hero banner images:', err);
        res.status(500).json({ error: 'Failed to remove hero banner images' });
    }
});

// GET: Public hero banner endpoint (for frontend)
router.get('/api/hero-banner', async (req, res) => {
    try {
        await pool.connect();
        
        // Ensure HeroBanner table exists with all required columns
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' and xtype='U')
            CREATE TABLE HeroBanner (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                MainHeading NVARCHAR(255) NULL,
                DescriptionLine1 NVARCHAR(MAX) NULL,
                DescriptionLine2 NVARCHAR(MAX) NULL,
                ButtonText NVARCHAR(100) NULL,
                ButtonLink NVARCHAR(200) NULL,
                Button2Text NVARCHAR(100) NULL,
                Button2Link NVARCHAR(200) NULL,
                Button2BgColor NVARCHAR(7) NULL,
                Button2TextColor NVARCHAR(7) NULL,
                TextColor NVARCHAR(7) NULL,
                ButtonBgColor NVARCHAR(7) NULL,
                ButtonTextColor NVARCHAR(7) NULL,
                HeroBannerImages NVARCHAR(MAX) NULL,
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        
        // Ensure new columns exist on older databases
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Text')
                ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Link')
                ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2BgColor')
                ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2TextColor')
                ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImages')
                ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX) NULL;
        `);
        
        const result = await pool.request().query(`
            SELECT TOP 1 
                MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
                Button2Text, Button2Link, Button2BgColor, Button2TextColor,
                TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages, CreatedAt, UpdatedAt
            FROM HeroBanner
            ORDER BY UpdatedAt DESC
        `);
        
        if (result.recordset.length > 0) {
            const settings = result.recordset[0];
            res.json({
                mainHeading: settings.MainHeading,
                descriptionLine1: settings.DescriptionLine1,
                descriptionLine2: settings.DescriptionLine2,
                buttonText: settings.ButtonText,
                buttonLink: settings.ButtonLink,
                button2Text: settings.Button2Text,
                button2Link: settings.Button2Link,
                button2BgColor: settings.Button2BgColor,
                button2TextColor: settings.Button2TextColor,
                textColor: settings.TextColor,
                buttonBgColor: settings.ButtonBgColor,
                buttonTextColor: settings.ButtonTextColor,
                heroBannerImages: settings.HeroBannerImages ? JSON.parse(settings.HeroBannerImages) : [],
                createdAt: settings.CreatedAt,
                updatedAt: settings.UpdatedAt
            });
        } else {
            // Return default values if no record exists
            res.json({
                mainHeading: 'Premium Office Furniture Solutions',
                descriptionLine1: 'Transform your workspace with our premium collection of office furniture',
                descriptionLine2: 'Discover our premium collection of office furniture designed for modern professionals',
                buttonText: 'SHOP NOW',
                buttonLink: '/products',
                button2Text: 'Custom Design',
                button2Link: '/custom-furniture',
                button2BgColor: '#6c757d',
                button2TextColor: '#ffffff',
                textColor: '#ffffff',
                buttonBgColor: '#ffc107',
                buttonTextColor: '#333333',
                heroBannerImages: [],
                createdAt: null,
                updatedAt: null
            });
        }
    } catch (err) {
        console.error('Error fetching hero banner settings:', err);
        res.status(500).json({ error: 'Failed to fetch hero banner settings' });
        }
    });

    // --- Header Banner API Endpoints ---
    
    // GET: Fetch header banner settings (admin only)
    router.get('/api/admin/header-banner', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Ensure table exists
            await pool.request().query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeaderBanner' and xtype='U')
                CREATE TABLE HeaderBanner (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    ContactBgColor NVARCHAR(50) NULL,
                    ContactTextColor NVARCHAR(50) NULL,
                    MainBgColor NVARCHAR(50) NULL,
                    MainTextColor NVARCHAR(50) NULL,
                    NavBgColor NVARCHAR(50) NULL,
                    NavTextColor NVARCHAR(50) NULL,
                    NavHoverColor NVARCHAR(50) NULL,
                    SearchBorderColor NVARCHAR(50) NULL,
                    SearchBtnColor NVARCHAR(50) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                );`);
            const result = await pool.request().query(`
                SELECT TOP 1 
                    ContactBgColor, 
                    ContactTextColor, 
                    MainBgColor, 
                    MainTextColor, 
                    NavBgColor, 
                    NavTextColor, 
                    NavHoverColor, 
                    SearchBorderColor, 
                    SearchBtnColor,
                    CreatedAt,
                    UpdatedAt
                FROM HeaderBanner 
                ORDER BY ID DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    contactBgColor: settings.ContactBgColor || '#f8f9fa',
                    contactTextColor: settings.ContactTextColor || '#6c757d',
                    mainBgColor: settings.MainBgColor || '#ffffff',
                    mainTextColor: settings.MainTextColor || '#333333',
                    navBgColor: settings.NavBgColor || '#343a40',
                    navTextColor: settings.NavTextColor || '#ffffff',
                    navHoverColor: settings.NavHoverColor || '#007bff',
                    searchBorderColor: settings.SearchBorderColor || '#ffc107',
                    searchBtnColor: settings.SearchBtnColor || '#ffc107'
                });
            } else {
                // Return default settings if no record exists
                res.json({
                    contactBgColor: '#f8f9fa',
                    contactTextColor: '#6c757d',
                    mainBgColor: '#ffffff',
                    mainTextColor: '#333333',
                    navBgColor: '#343a40',
                    navTextColor: '#ffffff',
                    navHoverColor: '#007bff',
                    searchBorderColor: '#ffc107',
                    searchBtnColor: '#ffc107'
                });
            }
        } catch (err) {
            console.error('Error fetching header banner settings:', err);
            res.status(500).json({ error: 'Failed to fetch header banner settings' });
        }
    });

    // POST: Save header banner settings (admin only)
    router.post('/api/admin/header-banner', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            console.log('Header banner save request received:', req.body);
            await pool.connect();
            
            // Ensure table exists
            await pool.request().query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeaderBanner' and xtype='U')
                CREATE TABLE HeaderBanner (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    ContactBgColor NVARCHAR(50) NULL,
                    ContactTextColor NVARCHAR(50) NULL,
                    MainBgColor NVARCHAR(50) NULL,
                    MainTextColor NVARCHAR(50) NULL,
                    NavBgColor NVARCHAR(50) NULL,
                    NavTextColor NVARCHAR(50) NULL,
                    NavHoverColor NVARCHAR(50) NULL,
                    SearchBorderColor NVARCHAR(50) NULL,
                    SearchBtnColor NVARCHAR(50) NULL,
                    IconColor NVARCHAR(50) NULL,
                    ContactEmail NVARCHAR(100) NULL,
                    ContactPhone NVARCHAR(50) NULL,
                    ContactAddress NVARCHAR(200) NULL,
                    SearchPlaceholder NVARCHAR(100) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                );`);
            
            // Add missing columns if they don't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactBgColor')
                    ALTER TABLE HeaderBanner ADD ContactBgColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'IconColor')
                    ALTER TABLE HeaderBanner ADD IconColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactEmail')
                    ALTER TABLE HeaderBanner ADD ContactEmail NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactPhone')
                    ALTER TABLE HeaderBanner ADD ContactPhone NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactAddress')
                    ALTER TABLE HeaderBanner ADD ContactAddress NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'SearchPlaceholder')
                    ALTER TABLE HeaderBanner ADD SearchPlaceholder NVARCHAR(100) NULL;
            `);
            
            const { 
                contactBgColor, contactTextColor, 
                mainBgColor, mainTextColor, 
                navBgColor, navTextColor, navHoverColor, 
                searchBorderColor, searchBtnColor, iconColor,
                contactEmail, contactPhone, contactAddress, searchPlaceholder
            } = req.body || {};
            
            // Validate color values (basic hex color validation)
            const isValidColor = (color) => {
                if (!color) return true; // Allow null/undefined
                return /^#[0-9A-F]{6}$/i.test(color);
            };
            
            const colors = [contactBgColor, contactTextColor, mainBgColor, mainTextColor, 
                           navBgColor, navTextColor, navHoverColor, searchBorderColor, searchBtnColor, iconColor];
            
            for (const color of colors) {
                if (color && !isValidColor(color)) {
                    return res.status(400).json({ 
                        error: 'Invalid color format', 
                        details: `Color "${color}" is not a valid hex color (e.g., #ffffff)` 
                    });
                }
            }
            
            const toDb = (v) => (v === undefined || v === '' ? null : v);
            
            // Check if a record already exists
            const existingResult = await pool.request().query('SELECT TOP 1 ID FROM HeaderBanner');
            
            if (existingResult.recordset.length > 0) {
                // Update existing record
                await pool.request()
                    .input('contactBgColor', sql.NVarChar, toDb(contactBgColor))
                    .input('contactTextColor', sql.NVarChar, toDb(contactTextColor))
                    .input('mainBgColor', sql.NVarChar, toDb(mainBgColor))
                    .input('mainTextColor', sql.NVarChar, toDb(mainTextColor))
                    .input('navBgColor', sql.NVarChar, toDb(navBgColor))
                    .input('navTextColor', sql.NVarChar, toDb(navTextColor))
                    .input('navHoverColor', sql.NVarChar, toDb(navHoverColor))
                    .input('searchBorderColor', sql.NVarChar, toDb(searchBorderColor))
                    .input('searchBtnColor', sql.NVarChar, toDb(searchBtnColor))
                    .input('iconColor', sql.NVarChar, toDb(iconColor))
                    .input('contactEmail', sql.NVarChar, toDb(contactEmail))
                    .input('contactPhone', sql.NVarChar, toDb(contactPhone))
                    .input('contactAddress', sql.NVarChar, toDb(contactAddress))
                    .input('searchPlaceholder', sql.NVarChar, toDb(searchPlaceholder))
                    .input('updatedAt', sql.DateTime2, new Date())
                    .query(`
                        UPDATE HeaderBanner 
                        SET ContactBgColor = @contactBgColor,
                            ContactTextColor = @contactTextColor,
                            MainBgColor = @mainBgColor,
                            MainTextColor = @mainTextColor,
                            NavBgColor = @navBgColor,
                            NavTextColor = @navTextColor,
                            NavHoverColor = @navHoverColor,
                            SearchBorderColor = @searchBorderColor,
                            SearchBtnColor = @searchBtnColor,
                            IconColor = @iconColor,
                            ContactEmail = @contactEmail,
                            ContactPhone = @contactPhone,
                            ContactAddress = @contactAddress,
                            SearchPlaceholder = @searchPlaceholder,
                            UpdatedAt = @updatedAt
                        WHERE ID = (SELECT TOP 1 ID FROM HeaderBanner ORDER BY ID DESC)
                    `);
            } else {
                // Insert new record
                await pool.request()
                    .input('contactBgColor', sql.NVarChar, toDb(contactBgColor))
                    .input('contactTextColor', sql.NVarChar, toDb(contactTextColor))
                    .input('mainBgColor', sql.NVarChar, toDb(mainBgColor))
                    .input('mainTextColor', sql.NVarChar, toDb(mainTextColor))
                    .input('navBgColor', sql.NVarChar, toDb(navBgColor))
                    .input('navTextColor', sql.NVarChar, toDb(navTextColor))
                    .input('navHoverColor', sql.NVarChar, toDb(navHoverColor))
                    .input('searchBorderColor', sql.NVarChar, toDb(searchBorderColor))
                    .input('searchBtnColor', sql.NVarChar, toDb(searchBtnColor))
                    .input('iconColor', sql.NVarChar, toDb(iconColor))
                    .input('contactEmail', sql.NVarChar, toDb(contactEmail))
                    .input('contactPhone', sql.NVarChar, toDb(contactPhone))
                    .input('contactAddress', sql.NVarChar, toDb(contactAddress))
                    .input('searchPlaceholder', sql.NVarChar, toDb(searchPlaceholder))
                    .query(`
                        INSERT INTO HeaderBanner (
                            ContactBgColor, ContactTextColor, MainBgColor, MainTextColor, 
                            NavBgColor, NavTextColor, NavHoverColor, SearchBorderColor, SearchBtnColor,
                            IconColor, ContactEmail, ContactPhone, ContactAddress, SearchPlaceholder
                        ) VALUES (
                            @contactBgColor, @contactTextColor, @mainBgColor, @mainTextColor, 
                            @navBgColor, @navTextColor, @navHoverColor, @searchBorderColor, @searchBtnColor,
                            @iconColor, @contactEmail, @contactPhone, @contactAddress, @searchPlaceholder
                        )
                    `);
            }
            
            console.log('Header banner settings saved successfully');
            res.json({ success: true, message: 'Header banner settings saved successfully' });
        } catch (err) {
            console.error('Error saving header banner settings:', err);
            res.status(500).json({ error: 'Failed to save header banner settings', details: err.message });
        }
    });

    // GET: Fetch header banner settings for admin (admin only)
    router.get('/api/admin/header-banner', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            // Ensure table exists
            await pool.request().query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeaderBanner' and xtype='U')
                CREATE TABLE HeaderBanner (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    ContactBgColor NVARCHAR(50) NULL,
                    ContactTextColor NVARCHAR(50) NULL,
                    MainBgColor NVARCHAR(50) NULL,
                    MainTextColor NVARCHAR(50) NULL,
                    NavBgColor NVARCHAR(50) NULL,
                    NavTextColor NVARCHAR(50) NULL,
                    NavHoverColor NVARCHAR(50) NULL,
                    SearchBorderColor NVARCHAR(50) NULL,
                    SearchBtnColor NVARCHAR(50) NULL,
                    IconColor NVARCHAR(50) NULL,
                    ContactEmail NVARCHAR(100) NULL,
                    ContactPhone NVARCHAR(50) NULL,
                    ContactAddress NVARCHAR(200) NULL,
                    SearchPlaceholder NVARCHAR(100) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                );`);
            
            // Add missing columns if they don't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactBgColor')
                    ALTER TABLE HeaderBanner ADD ContactBgColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'IconColor')
                    ALTER TABLE HeaderBanner ADD IconColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactEmail')
                    ALTER TABLE HeaderBanner ADD ContactEmail NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactPhone')
                    ALTER TABLE HeaderBanner ADD ContactPhone NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactAddress')
                    ALTER TABLE HeaderBanner ADD ContactAddress NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'SearchPlaceholder')
                    ALTER TABLE HeaderBanner ADD SearchPlaceholder NVARCHAR(100) NULL;
            `);
            const result = await pool.request().query(`
                SELECT TOP 1 
                    ContactBgColor, 
                    ContactTextColor, 
                    MainBgColor, 
                    MainTextColor, 
                    NavBgColor, 
                    NavTextColor, 
                    NavHoverColor, 
                    SearchBorderColor, 
                    SearchBtnColor,
                    IconColor,
                    ContactEmail,
                    ContactPhone,
                    ContactAddress,
                    SearchPlaceholder
                FROM HeaderBanner 
                ORDER BY ID DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    contactBgColor: settings.ContactBgColor || '#f8f9fa',
                    contactTextColor: settings.ContactTextColor || '#6c757d',
                    mainBgColor: settings.MainBgColor || '#ffffff',
                    mainTextColor: settings.MainTextColor || '#333333',
                    navBgColor: settings.NavBgColor || '#343a40',
                    navTextColor: settings.NavTextColor || '#ffffff',
                    navHoverColor: settings.NavHoverColor || '#007bff',
                    searchBorderColor: settings.SearchBorderColor || '#ffc107',
                    searchBtnColor: settings.SearchBtnColor || '#ffc107'
                });
            } else {
                // Return default settings if no record exists
                res.json({
                    contactBgColor: '#f8f9fa',
                    contactTextColor: '#6c757d',
                    mainBgColor: '#ffffff',
                    mainTextColor: '#333333',
                    navBgColor: '#343a40',
                    navTextColor: '#ffffff',
                    navHoverColor: '#007bff',
                    searchBorderColor: '#ffc107',
                    searchBtnColor: '#ffc107'
                });
            }
        } catch (err) {
            console.error('Error fetching header banner settings:', err);
            res.status(500).json({ error: 'Failed to fetch header banner settings' });
        }
    });

    // GET: Fetch header banner settings for frontend (public endpoint)
    router.get('/api/header-banner', async (req, res) => {
        try {
            await pool.connect();
            // Ensure table exists
            await pool.request().query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeaderBanner' and xtype='U')
                CREATE TABLE HeaderBanner (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    ContactBgColor NVARCHAR(50) NULL,
                    ContactTextColor NVARCHAR(50) NULL,
                    MainBgColor NVARCHAR(50) NULL,
                    MainTextColor NVARCHAR(50) NULL,
                    NavBgColor NVARCHAR(50) NULL,
                    NavTextColor NVARCHAR(50) NULL,
                    NavHoverColor NVARCHAR(50) NULL,
                    SearchBorderColor NVARCHAR(50) NULL,
                    SearchBtnColor NVARCHAR(50) NULL,
                    IconColor NVARCHAR(50) NULL,
                    ContactEmail NVARCHAR(100) NULL,
                    ContactPhone NVARCHAR(50) NULL,
                    ContactAddress NVARCHAR(200) NULL,
                    SearchPlaceholder NVARCHAR(100) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                );`);
            
            // Add missing columns if they don't exist
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactBgColor')
                    ALTER TABLE HeaderBanner ADD ContactBgColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'IconColor')
                    ALTER TABLE HeaderBanner ADD IconColor NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactEmail')
                    ALTER TABLE HeaderBanner ADD ContactEmail NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactPhone')
                    ALTER TABLE HeaderBanner ADD ContactPhone NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'ContactAddress')
                    ALTER TABLE HeaderBanner ADD ContactAddress NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HeaderBanner') AND name = 'SearchPlaceholder')
                    ALTER TABLE HeaderBanner ADD SearchPlaceholder NVARCHAR(100) NULL;
            `);
            const result = await pool.request().query(`
                SELECT TOP 1 
                    ContactBgColor, 
                    ContactTextColor, 
                    MainBgColor, 
                    MainTextColor, 
                    NavBgColor, 
                    NavTextColor, 
                    NavHoverColor, 
                    SearchBorderColor, 
                    SearchBtnColor,
                    IconColor,
                    ContactEmail,
                    ContactPhone,
                    ContactAddress,
                    SearchPlaceholder
                FROM HeaderBanner 
                ORDER BY ID DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    contactBgColor: settings.ContactBgColor || '#f8f9fa',
                    contactTextColor: settings.ContactTextColor || '#6c757d',
                    mainBgColor: settings.MainBgColor || '#ffffff',
                    mainTextColor: settings.MainTextColor || '#333333',
                    navBgColor: settings.NavBgColor || '#343a40',
                    navTextColor: settings.NavTextColor || '#ffffff',
                    navHoverColor: settings.NavHoverColor || '#007bff',
                    searchBorderColor: settings.SearchBorderColor || '#ffc107',
                    searchBtnColor: settings.SearchBtnColor || '#ffc107',
                    iconColor: settings.IconColor || '#6c757d',
                    contactEmail: settings.ContactEmail || '',
                    contactPhone: settings.ContactPhone || '',
                    contactAddress: settings.ContactAddress || '',
                    searchPlaceholder: settings.SearchPlaceholder || 'Search products...'
                });
            } else {
                // Return default settings if no record exists
                res.json({
                    contactBgColor: '#f8f9fa',
                    contactTextColor: '#6c757d',
                    mainBgColor: '#ffffff',
                    mainTextColor: '#333333',
                    navBgColor: '#343a40',
                    navTextColor: '#ffffff',
                    navHoverColor: '#007bff',
                    searchBorderColor: '#ffc107',
                    searchBtnColor: '#ffc107',
                    iconColor: '#6c757d',
                    contactEmail: '',
                    contactPhone: '',
                    contactAddress: '',
                    searchPlaceholder: 'Search products...'
                });
            }
        } catch (err) {
            console.error('Error fetching header banner settings:', err);
            // Return default settings on error
            res.json({
                contactBgColor: '#f8f9fa',
                contactTextColor: '#6c757d',
                mainBgColor: '#ffffff',
                mainTextColor: '#333333',
                navBgColor: '#343a40',
                navTextColor: '#ffffff',
                navHoverColor: '#007bff',
                searchBorderColor: '#ffc107',
                searchBtnColor: '#ffc107',
                iconColor: '#6c757d',
                contactEmail: '',
                contactPhone: '',
                contactAddress: '',
                searchPlaceholder: 'Search products...'
            });
        }
    });

    // Admin: Delivery Rates API - list active
    router.get('/api/admin/delivery-rates', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                BEGIN
                    SELECT CAST(0 AS BIT) AS success, 'DeliveryRates table missing' AS message;
                    RETURN;
                END
                SELECT RateID, ServiceType, Price, CreatedAt, CreatedByUserID, CreatedByUsername, IsActive
                FROM dbo.DeliveryRates
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC;
            `);
            const rows = result.recordset || [];
            if (rows.length && rows[0].success === false) {
                return res.json({ success: false, message: rows[0].message });
            }
            res.json({ success: true, rates: rows });
        } catch (err) {
            console.error('Error listing admin delivery rates:', err);
            res.json({ success: false, message: 'Failed to list delivery rates' });
        }
    });

    // Admin: Add Delivery Rate
    router.post('/Employee/Admin/DeliveryRates/Add', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const { serviceType, price } = req.body || {};
            const user = req.session.user || {};
            if (!serviceType || !price) {
                return res.json({ success: false, message: 'Missing fields' });
            }
            await pool.request()
                .input('ServiceType', sql.NVarChar(150), serviceType)
                .input('Price', sql.Decimal(18, 2), Number(price))
                .input('CreatedByUserID', sql.Int, user.userId || null)
                .input('CreatedByUsername', sql.NVarChar(150), user.username || null)
                .query(`
                    IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.DeliveryRates (
                            RateID INT IDENTITY(1,1) PRIMARY KEY,
                            ServiceType NVARCHAR(150) NOT NULL,
                            Price DECIMAL(18,2) NOT NULL,
                            CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_DeliveryRates_CreatedAt DEFAULT (SYSUTCDATETIME()),
                            CreatedByUserID INT NULL,
                            CreatedByUsername NVARCHAR(150) NULL,
                            IsActive BIT NOT NULL CONSTRAINT DF_DeliveryRates_IsActive DEFAULT (1)
                        );
                        CREATE UNIQUE INDEX UX_DeliveryRates_ServiceType_Active
                            ON dbo.DeliveryRates (ServiceType)
                            WHERE IsActive = 1;
                    END
                    IF EXISTS (SELECT 1 FROM dbo.DeliveryRates WHERE ServiceType = @ServiceType AND IsActive = 1)
                    BEGIN
                        SELECT CAST(0 AS BIT) AS success, 'Service type already exists' AS message;
                        RETURN;
                    END
                    INSERT INTO dbo.DeliveryRates (ServiceType, Price, CreatedByUserID, CreatedByUsername)
                    VALUES (@ServiceType, @Price, @CreatedByUserID, @CreatedByUsername);
                    SELECT CAST(1 AS BIT) AS success;
                `);
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding admin delivery rate:', err);
            res.json({ success: false, message: 'Failed to add delivery rate' });
        }
    });

    // Admin: Update Delivery Rate (price, name, active flag)
    router.post('/Employee/Admin/DeliveryRates/Update/:rateId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const rateId = parseInt(req.params.rateId);
            const { serviceType, price, isActive } = req.body || {};
            if (!rateId) return res.json({ success: false, message: 'Invalid id' });
            const request = pool.request().input('RateID', sql.Int, rateId);
            let setClauses = [];
            if (serviceType !== undefined) {
                request.input('ServiceType', sql.NVarChar(150), serviceType);
                setClauses.push('ServiceType = @ServiceType');
            }
            if (price !== undefined) {
                request.input('Price', sql.Decimal(18, 2), Number(price));
                setClauses.push('Price = @Price');
            }
            if (isActive !== undefined) {
                request.input('IsActive', sql.Bit, Boolean(isActive));
                setClauses.push('IsActive = @IsActive');
            }
            if (!setClauses.length) return res.json({ success: false, message: 'Nothing to update' });
            const setSql = setClauses.join(', ');
            await request.query(`
                IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                BEGIN
                    SELECT CAST(0 AS BIT) AS success, 'DeliveryRates table missing' AS message;
                    RETURN;
                END
                UPDATE dbo.DeliveryRates SET ${setSql} WHERE RateID = @RateID;
                SELECT CAST(1 AS BIT) AS success;
            `);
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating admin delivery rate:', err);
            res.json({ success: false, message: 'Failed to update delivery rate' });
        }
    });

    // Inventory: Delivery Rates API - list active
    router.get('/api/inventory/delivery-rates', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                BEGIN
                    SELECT CAST(0 AS BIT) AS success, 'DeliveryRates table missing' AS message;
                    RETURN;
                END
                SELECT RateID, ServiceType, Price, CreatedAt, CreatedByUserID, CreatedByUsername, IsActive
                FROM dbo.DeliveryRates
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC;
            `);
            const rows = result.recordset || [];
            if (rows.length && rows[0].success === false) {
                return res.json({ success: false, message: rows[0].message });
            }
            res.json({ success: true, rates: rows });
        } catch (err) {
            console.error('Error listing inventory delivery rates:', err);
            res.json({ success: false, message: 'Failed to list delivery rates' });
        }
    });

    // Inventory: Add Delivery Rate
    router.post('/Employee/Inventory/DeliveryRates/Add', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const { serviceType, price } = req.body || {};
            const user = req.session.user || {};
            if (!serviceType || !price) {
                return res.json({ success: false, message: 'Missing fields' });
            }
            await pool.request()
                .input('ServiceType', sql.NVarChar(150), serviceType)
                .input('Price', sql.Decimal(18, 2), Number(price))
                .input('CreatedByUserID', sql.Int, user.userId || null)
                .input('CreatedByUsername', sql.NVarChar(150), user.username || null)
                .query(`
                    IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.DeliveryRates (
                            RateID INT IDENTITY(1,1) PRIMARY KEY,
                            ServiceType NVARCHAR(150) NOT NULL,
                            Price DECIMAL(18,2) NOT NULL,
                            CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_DeliveryRates_CreatedAt DEFAULT (SYSUTCDATETIME()),
                            CreatedByUserID INT NULL,
                            CreatedByUsername NVARCHAR(150) NULL,
                            IsActive BIT NOT NULL CONSTRAINT DF_DeliveryRates_IsActive DEFAULT (1)
                        );
                        CREATE UNIQUE INDEX UX_DeliveryRates_ServiceType_Active
                            ON dbo.DeliveryRates (ServiceType)
                            WHERE IsActive = 1;
                    END
                    IF EXISTS (SELECT 1 FROM dbo.DeliveryRates WHERE ServiceType = @ServiceType AND IsActive = 1)
                    BEGIN
                        SELECT CAST(0 AS BIT) AS success, 'Service type already exists' AS message;
                        RETURN;
                    END
                    INSERT INTO dbo.DeliveryRates (ServiceType, Price, CreatedByUserID, CreatedByUsername)
                    VALUES (@ServiceType, @Price, @CreatedByUserID, @CreatedByUsername);
                    SELECT CAST(1 AS BIT) AS success;
                `);
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding inventory delivery rate:', err);
            res.json({ success: false, message: 'Failed to add delivery rate' });
        }
    });

    // Inventory: Update Delivery Rate
    router.post('/Employee/Inventory/DeliveryRates/Update/:rateId', isAuthenticated, hasRole('InventoryManager'), requireSectionAccess('transactions'), async (req, res) => {
        try {
            await pool.connect();
            const rateId = parseInt(req.params.rateId);
            const { serviceType, price, isActive } = req.body || {};
            if (!rateId) return res.json({ success: false, message: 'Invalid id' });
            const request = pool.request().input('RateID', sql.Int, rateId);
            let setClauses = [];
            if (serviceType !== undefined) {
                request.input('ServiceType', sql.NVarChar(150), serviceType);
                setClauses.push('ServiceType = @ServiceType');
            }
            if (price !== undefined) {
                request.input('Price', sql.Decimal(18, 2), Number(price));
                setClauses.push('Price = @Price');
            }
            if (isActive !== undefined) {
                request.input('IsActive', sql.Bit, Boolean(isActive));
                setClauses.push('IsActive = @IsActive');
            }
            if (!setClauses.length) return res.json({ success: false, message: 'Nothing to update' });
            const setSql = setClauses.join(', ');
            await request.query(`
                IF OBJECT_ID('dbo.DeliveryRates','U') IS NULL
                BEGIN
                    SELECT CAST(0 AS BIT) AS success, 'DeliveryRates table missing' AS message;
                    RETURN;
                END
                UPDATE dbo.DeliveryRates SET ${setSql} WHERE RateID = @RateID;
                SELECT CAST(1 AS BIT) AS success;
            `);
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating inventory delivery rate:', err);
            res.json({ success: false, message: 'Failed to update delivery rate' });
        }
    });

    // API endpoints for AdminManageUsers.js
    // GET /Employee/Admin/Users/EmployeesData - Fetch employee accounts data
    router.get('/Employee/Admin/Users/EmployeesData', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.RoleID, r.RoleName, u.IsActive, u.CreatedAt
                FROM Users u
                JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY u.CreatedAt DESC
            `);
            res.json({ success: true, employees: result.recordset });
        } catch (error) {
            console.error('Error fetching employee accounts:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch employee accounts' });
        }
    });

    // GET /Employee/Admin/Users/CustomersData - Fetch customer accounts data
    router.get('/Employee/Admin/Users/CustomersData', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT CustomerID, FullName, Email, PhoneNumber, IsActive, CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            res.json({ success: true, customers: result.recordset });
        } catch (error) {
            console.error('Error fetching customer accounts:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch customer accounts' });
        }
    });

    // POST /Employee/Admin/Customers/ToggleActive/:customerId - Toggle customer active status
    router.post('/Employee/Admin/Customers/ToggleActive/:customerId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const customerId = parseInt(req.params.customerId);
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }

            await pool.connect();
            
            // Get current status
            const currentResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }
            
            const currentStatus = currentResult.recordset[0].IsActive;
            const newStatus = !currentStatus;
            
            // Update status
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('isActive', sql.Bit, newStatus)
                .query('UPDATE Customers SET IsActive = @isActive WHERE CustomerID = @customerId');
            
            res.json({ success: true, message: `Customer ${newStatus ? 'activated' : 'deactivated'} successfully` });
        } catch (error) {
            console.error('Error toggling customer status:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer status' });
        }
    });

    // POST /Employee/Admin/ManageUsers/ToggleActive/:userId - Toggle user active status
    router.post('/Employee/Admin/ManageUsers/ToggleActive/:userId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Invalid user ID' });
            }

            await pool.connect();
            
            // Get current status
            const currentResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT IsActive FROM Users WHERE UserID = @userId');
            
            if (currentResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            const currentStatus = currentResult.recordset[0].IsActive;
            const newStatus = !currentStatus;
            
            // Update status
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query('UPDATE Users SET IsActive = @isActive WHERE UserID = @userId');
            
            res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'} successfully` });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // POST /Employee/Admin/ManageUsers/Delete/:userId - Delete user
    router.post('/Employee/Admin/ManageUsers/Delete/:userId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Invalid user ID' });
            }

            await pool.connect();
            
            // Check if user exists
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT FullName FROM Users WHERE UserID = @userId');
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            // Delete user
            await pool.request()
                .input('userId', sql.Int, userId)
                .query('DELETE FROM Users WHERE UserID = @userId');
            
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, message: 'Failed to delete user' });
        }
    });

    // POST /Employee/Admin/Customers/Delete/:customerId - Delete customer
    router.post('/Employee/Admin/Customers/Delete/:customerId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const customerId = parseInt(req.params.customerId);
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }

            await pool.connect();
            
            // Check if customer exists
            const customerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName FROM Customers WHERE CustomerID = @customerId');
            
            if (customerResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }
            
            // Delete customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            res.json({ success: true, message: 'Customer deleted successfully' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(500).json({ success: false, message: 'Failed to delete customer' });
        }
    });

    // PUT /Employee/Admin/ManageUsers/Update/:userId - Update user
    router.put('/Employee/Admin/ManageUsers/Update/:userId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Invalid user ID' });
            }

            const { username, fullName, email, roleId, isActive } = req.body;
            
            if (!username || !fullName || !email || !roleId) {
                return res.status(400).json({ success: false, message: 'Username, full name, email, and role are required' });
            }

            await pool.connect();
            
            // Check if user exists
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username FROM Users WHERE UserID = @userId');
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            // Check if username is already taken by another user
            const usernameCheckResult = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('userId', sql.Int, userId)
                .query('SELECT UserID FROM Users WHERE Username = @username AND UserID != @userId');
            
            if (usernameCheckResult.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Username is already taken by another user' });
            }
            
            // Check if email is already taken by another user
            const emailCheckResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('userId', sql.Int, userId)
                .query('SELECT UserID FROM Users WHERE Email = @email AND UserID != @userId');
            
            if (emailCheckResult.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Email is already taken by another user' });
            }
            
            // Update user
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, username)
                .input('fullName', sql.NVarChar, fullName)
                .input('email', sql.NVarChar, email)
                .input('roleId', sql.Int, parseInt(roleId))
                .input('isActive', sql.Bit, isActive)
                .query(`
                    UPDATE Users 
                    SET Username = @username, 
                        FullName = @fullName, 
                        Email = @email, 
                        RoleID = @roleId, 
                        IsActive = @isActive,
                        UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });


    // PUT /Employee/Admin/Customers/Update/:customerId - Update customer
    router.put('/Employee/Admin/Customers/Update/:customerId', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const customerId = parseInt(req.params.customerId);
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }

            const { fullName, email, phoneNumber, isActive } = req.body;
            
            if (!fullName || !email) {
                return res.status(400).json({ success: false, message: 'Full name and email are required' });
            }

            await pool.connect();
            
            // Check if customer exists
            const customerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName FROM Customers WHERE CustomerID = @customerId');
            
            if (customerResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }
            
            // Check if email is already taken by another customer
            const emailCheckResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('customerId', sql.Int, customerId)
                .query('SELECT CustomerID FROM Customers WHERE Email = @email AND CustomerID != @customerId');
            
            if (emailCheckResult.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Email is already taken by another customer' });
            }
            
            // Update customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, fullName)
                .input('email', sql.NVarChar, email)
                .input('phoneNumber', sql.NVarChar, phoneNumber || null)
                .input('isActive', sql.Bit, isActive)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, 
                        Email = @email, 
                        PhoneNumber = @phoneNumber, 
                        IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                number: error.number
            });
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update customer',
                error: error.message 
            });
        }
    });

    // --- Chat Support API Endpoints ---
    
    // Ensure ChatMessages table exists
    async function ensureChatMessagesTable() {
        try {
            await pool.connect();
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChatMessages]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE ChatMessages (
                        MessageID INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerID INT NOT NULL,
                        MessageText NVARCHAR(MAX) NOT NULL,
                        SenderType NVARCHAR(50) NOT NULL CHECK (SenderType IN ('customer', 'support')),
                        SentAt DATETIME2 DEFAULT GETDATE(),
                        IsRead BIT DEFAULT 0,
                        
                        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE
                    );
                    PRINT 'ChatMessages table created successfully';
                END
            `);
        } catch (error) {
            console.error('Error ensuring ChatMessages table:', error);
        }
    }

    // Initialize ChatMessages table
    ensureChatMessagesTable();

    // Create test auto-message if none exist
    async function createTestAutoMessage() {
        try {
            await pool.connect();
            
            // Check if any auto-messages exist
            const checkResult = await pool.request().query(`
                SELECT COUNT(*) as count FROM AutoMessages
            `);
            
            if (checkResult.recordset[0].count === 0) {
                console.log('No auto-messages found, creating test messages...');
                await pool.request().query(`
                    INSERT INTO AutoMessages (Question, Answer, Keywords, IsActive)
                    VALUES 
                    (
                        'What is your return policy?',
                        'We offer a 30-day return policy for all items in original condition. Please contact our support team for return instructions.',
                        'return, refund, exchange, policy',
                        1
                    ),
                    (
                        'How long does shipping take?',
                        'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. We also offer same-day delivery in select areas.',
                        'shipping, delivery, time, express',
                        1
                    ),
                    (
                        'Do you offer custom furniture?',
                        'Yes! We specialize in custom furniture design. Contact our design team to discuss your requirements and get a quote.',
                        'custom, furniture, design, quote',
                        1
                    ),
                    (
                        'What materials do you use?',
                        'We use high-quality materials including solid wood, metal, glass, and premium fabrics. All materials are sustainably sourced.',
                        'materials, wood, metal, quality',
                        1
                    ),
                    (
                        'How can I track my order?',
                        'You can track your order using the tracking number sent to your email. You can also log into your account to view order status.',
                        'track, order, status, tracking',
                        1
                    )
                `);
                console.log('Test auto-messages created successfully');
            }
        } catch (error) {
            console.error('Error creating test auto-messages:', error);
        }
    }

    // Initialize test auto-messages
    createTestAutoMessage();

    // GET /api/support/chat/messages/:customerId - Get messages for a customer
    router.get('/api/support/chat/messages/:customerId', isAuthenticated, async (req, res) => {
        try {
            const customerId = parseInt(req.params.customerId);
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }

            await pool.connect();
            
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT MessageID, CustomerID, MessageText, SenderType, SentAt, IsRead
                    FROM ChatMessages 
                    WHERE CustomerID = @customerId 
                    ORDER BY SentAt ASC
                `);
            
            // Mark messages as read
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    UPDATE ChatMessages 
                    SET IsRead = 1 
                    WHERE CustomerID = @customerId AND SenderType = 'customer' AND IsRead = 0
                `);

            res.json({
                success: true,
                messages: result.recordset
            });
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch messages',
                error: error.message 
            });
        }
    });

    // POST /api/support/chat/messages/:customerId - Send a message (for admin)
    router.post('/api/support/chat/messages/:customerId', isAuthenticated, async (req, res) => {
        try {
            const customerId = parseInt(req.params.customerId);
            const { message } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }
            
            if (!message || !message.trim()) {
                return res.status(400).json({ success: false, message: 'Message cannot be empty' });
            }

            await pool.connect();
            
            // Check if customer exists
            const customerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT CustomerID FROM Customers WHERE CustomerID = @customerId');
            
            if (customerResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }
            
            // Insert the message
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('messageText', sql.NVarChar, message.trim())
                .input('senderType', sql.NVarChar, 'support')
                .query(`
                    INSERT INTO ChatMessages (CustomerID, MessageText, SenderType)
                    OUTPUT INSERTED.MessageID, INSERTED.SentAt
                    VALUES (@customerId, @messageText, @senderType)
                `);

            res.json({
                success: true,
                message: 'Message sent successfully',
                messageId: result.recordset[0].MessageID,
                sentAt: result.recordset[0].SentAt
            });
        } catch (error) {
            console.error('Error sending chat message:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message',
                error: error.message 
            });
        }
    });

    // --- Customer Chat API Endpoints (for frontend) ---
    
    // GET /api/chat/messages - Get messages for current customer
    router.get('/api/chat/messages', isAuthenticated, async (req, res) => {
        try {
            // Check if user is a customer
            if (!req.session.user || req.session.user.role !== 'Customer') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access denied. Customer login required.' 
                });
            }

            const customerId = req.session.user.id;
            await pool.connect();
            
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT MessageID, CustomerID, MessageText, SenderType, SentAt, IsRead
                    FROM ChatMessages 
                    WHERE CustomerID = @customerId 
                    ORDER BY SentAt ASC
                `);

            res.json({
                success: true,
                messages: result.recordset
            });
        } catch (error) {
            console.error('Error fetching customer chat messages:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch messages',
                error: error.message 
            });
        }
    });

    // POST /api/chat/messages - Send a message from customer (authenticated)
    router.post('/api/chat/messages', isAuthenticated, async (req, res) => {
        try {
            // Check if user is a customer
            if (!req.session.user || req.session.user.role !== 'Customer') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access denied. Customer login required.' 
                });
            }

            const { message } = req.body;
            const customerId = req.session.user.id;
            
            if (!message || !message.trim()) {
                return res.status(400).json({ success: false, message: 'Message cannot be empty' });
            }

            await pool.connect();
            
            // Insert the customer message
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('messageText', sql.NVarChar, message.trim())
                .input('senderType', sql.NVarChar, 'customer')
                .query(`
                    INSERT INTO ChatMessages (CustomerID, MessageText, SenderType)
                    OUTPUT INSERTED.MessageID, INSERTED.SentAt
                    VALUES (@customerId, @messageText, @senderType)
                `);

            // Check for auto-reply
            console.log('Checking for auto-reply for message:', message.trim());
            const autoReply = await findAutoReply(message.trim());
            console.log('Auto-reply result:', autoReply);
            
            if (autoReply) {
                console.log('Inserting auto-reply:', autoReply.Answer);
                // Insert auto-reply message
                await pool.request()
                    .input('customerId', sql.Int, customerId)
                    .input('messageText', sql.NVarChar, autoReply.Answer)
                    .input('senderType', sql.NVarChar, 'support')
                    .query(`
                        INSERT INTO ChatMessages (CustomerID, MessageText, SenderType)
                        VALUES (@customerId, @messageText, @senderType)
                    `);
            }

            const response = {
                success: true,
                message: 'Message sent successfully',
                messageId: result.recordset[0].MessageID,
                sentAt: result.recordset[0].SentAt,
                autoReply: autoReply ? autoReply.Answer : null
            };
            
            console.log('Sending response:', response);
            res.json(response);
        } catch (error) {
            console.error('Error sending customer chat message:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message',
                error: error.message 
            });
        }
    });

    // POST /api/chat/messages/guest - Send a message from guest (unauthenticated)
    router.post('/api/chat/messages/guest', async (req, res) => {
        try {
            const { message } = req.body;
            
            if (!message || !message.trim()) {
                return res.status(400).json({ success: false, message: 'Message cannot be empty' });
            }

            await pool.connect();
            
            // Check for auto-reply first
            console.log('Checking for auto-reply for guest message:', message.trim());
            const autoReply = await findAutoReply(message.trim());
            console.log('Auto-reply result:', autoReply);

            const response = {
                success: true,
                message: 'Message received',
                autoReply: autoReply ? autoReply.Answer : null,
                hasAutoReply: !!autoReply
            };
            
            console.log('Sending guest response:', response);
            res.json(response);
        } catch (error) {
            console.error('Error processing guest chat message:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to process message',
                error: error.message 
            });
        }
    });

    // Function to find auto-reply based on message content
    async function findAutoReply(message) {
        try {
            console.log('findAutoReply called with message:', message);
            await pool.connect();
            
            // Get all active auto-messages
            const result = await pool.request().query(`
                SELECT ID, Question, Answer, Keywords
                FROM AutoMessages
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC
            `);
            
            const autoMessages = result.recordset;
            console.log('Found auto-messages:', autoMessages.length);
            console.log('Auto-messages:', autoMessages);
            
            const messageLower = message.toLowerCase();
            console.log('Message to match (lowercase):', messageLower);
            
            // First, try exact question match
            for (const autoMsg of autoMessages) {
                if (autoMsg.Question && messageLower.includes(autoMsg.Question.toLowerCase())) {
                    console.log('Exact question match found:', autoMsg.Question);
                    return autoMsg;
                }
            }
            
            // Then, try keyword matching
            for (const autoMsg of autoMessages) {
                if (autoMsg.Keywords) {
                    const keywords = autoMsg.Keywords.toLowerCase().split(',').map(k => k.trim());
                    console.log('Checking keywords for message:', autoMsg.Question, 'keywords:', keywords);
                    for (const keyword of keywords) {
                        if (keyword && messageLower.includes(keyword)) {
                            console.log('Keyword match found:', keyword);
                            return autoMsg;
                        }
                    }
                }
            }
            
            // Finally, try partial question matching
            for (const autoMsg of autoMessages) {
                if (autoMsg.Question) {
                    const questionWords = autoMsg.Question.toLowerCase().split(' ');
                    let matchCount = 0;
                    for (const word of questionWords) {
                        if (word.length > 3 && messageLower.includes(word)) {
                            matchCount++;
                        }
                    }
                    // If more than 50% of question words match, return this auto-reply
                    if (matchCount > questionWords.length * 0.5) {
                        console.log('Partial question match found:', autoMsg.Question, 'matches:', matchCount, 'of', questionWords.length);
                        return autoMsg;
                    }
                }
            }
            
            console.log('No auto-reply match found');
            return null;
        } catch (error) {
            console.error('Error finding auto-reply:', error);
            return null;
        }
    }

    // POST /api/admin/auto-messages/test - Test auto-reply matching
    router.post('/api/admin/auto-messages/test', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { message } = req.body;
            
            if (!message || !message.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Test message is required' 
                });
            }

            const autoReply = await findAutoReply(message.trim());
            
            res.json({
                success: true,
                testMessage: message.trim(),
                matchedAutoReply: autoReply,
                hasMatch: !!autoReply
            });
        } catch (error) {
            console.error('Error testing auto-reply:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to test auto-reply',
                error: error.message 
            });
        }
    });

    // GET /api/admin/auto-messages/stats - Get auto-messages statistics
    router.get('/api/admin/auto-messages/stats', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as TotalMessages,
                    SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveMessages,
                    SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveMessages,
                    COUNT(CASE WHEN Keywords IS NOT NULL AND Keywords != '' THEN 1 END) as MessagesWithKeywords
                FROM AutoMessages
            `);
            
            const stats = result.recordset[0];
            
            res.json({
                success: true,
                stats: {
                    total: stats.TotalMessages || 0,
                    active: stats.ActiveMessages || 0,
                    inactive: stats.InactiveMessages || 0,
                    withKeywords: stats.MessagesWithKeywords || 0
                }
            });
        } catch (error) {
            console.error('Error fetching auto-messages stats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch statistics',
                error: error.message 
            });
        }
    });

    // --- Testimonials Design API Routes ---
    // GET /api/admin/testimonials-design - Fetch testimonials design settings
    router.get('/api/admin/testimonials-design', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            // First ensure the TestimonialsDesign table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TestimonialsDesign]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE TestimonialsDesign (
                        ID INT PRIMARY KEY IDENTITY(1,1),
                        Theme NVARCHAR(50) NOT NULL DEFAULT 'default',
                        Layout NVARCHAR(50) NOT NULL DEFAULT 'grid',
                        PerRow NVARCHAR(10) NOT NULL DEFAULT '3',
                        Animation NVARCHAR(50) NOT NULL DEFAULT 'none',
                        BgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
                        TextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
                        AccentColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
                        BorderRadius NVARCHAR(10) NOT NULL DEFAULT '8',
                        ShowRating BIT NOT NULL DEFAULT 1,
                        ShowImage BIT NOT NULL DEFAULT 1,
                        ShowTitle BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE()
                    );
                    
                    -- Insert default values
                    INSERT INTO TestimonialsDesign (
                        Theme, Layout, PerRow, Animation, BgColor, TextColor, AccentColor,
                        BorderRadius, ShowRating, ShowImage, ShowTitle
                    ) VALUES (
                        'default', 'grid', '3', 'none', '#ffffff', '#333333', '#ffc107',
                        '8', 1, 1, 1
                    );
                END
            `);
            
            // Fetch the design settings
            const result = await pool.request().query(`
                SELECT TOP 1 
                    Theme as theme,
                    Layout as layout,
                    PerRow as perRow,
                    Animation as animation,
                    BgColor as bgColor,
                    TextColor as textColor,
                    AccentColor as accentColor,
                    BorderRadius as borderRadius,
                    ShowRating as showRating,
                    ShowImage as showImage,
                    ShowTitle as showTitle
                FROM TestimonialsDesign
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({
                    success: true,
                    ...result.recordset[0]
                });
            } else {
                // Return default values if no settings found
                res.json({
                    success: true,
                    theme: 'default',
                    layout: 'grid',
                    perRow: '3',
                    animation: 'none',
                    bgColor: '#ffffff',
                    textColor: '#333333',
                    accentColor: '#ffc107',
                    borderRadius: '8',
                    showRating: true,
                    showImage: true,
                    showTitle: true,
                });
            }
        } catch (error) {
            console.error('Error fetching testimonials design settings:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch testimonials design settings',
                error: error.message 
            });
        }
    });

    // POST /api/admin/testimonials-design - Save testimonials design settings
    router.post('/api/admin/testimonials-design', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const {
                theme, layout, perRow, animation, bgColor, textColor, accentColor,
                borderRadius, showRating, showImage, showTitle
            } = req.body;

            await pool.connect();
            
            // Ensure the table exists first
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TestimonialsDesign]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE TestimonialsDesign (
                        ID INT PRIMARY KEY IDENTITY(1,1),
                        Theme NVARCHAR(50) NOT NULL DEFAULT 'default',
                        Layout NVARCHAR(50) NOT NULL DEFAULT 'grid',
                        PerRow NVARCHAR(10) NOT NULL DEFAULT '3',
                        Animation NVARCHAR(50) NOT NULL DEFAULT 'none',
                        BgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
                        TextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
                        AccentColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
                        BorderRadius NVARCHAR(10) NOT NULL DEFAULT '8',
                        ShowRating BIT NOT NULL DEFAULT 1,
                        ShowImage BIT NOT NULL DEFAULT 1,
                        ShowTitle BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE()
                    );
                END
            `);

            // Check if settings already exist
            const existingResult = await pool.request().query(`
                SELECT COUNT(*) as count FROM TestimonialsDesign
            `);

            if (existingResult.recordset[0].count > 0) {
                // Update existing settings
                await pool.request()
                    .input('theme', sql.NVarChar, theme || 'default')
                    .input('layout', sql.NVarChar, layout || 'grid')
                    .input('perRow', sql.NVarChar, perRow || '3')
                    .input('animation', sql.NVarChar, animation || 'none')
                    .input('bgColor', sql.NVarChar, bgColor || '#ffffff')
                    .input('textColor', sql.NVarChar, textColor || '#333333')
                    .input('accentColor', sql.NVarChar, accentColor || '#ffc107')
                    .input('borderRadius', sql.NVarChar, borderRadius || '8')
                    .input('showRating', sql.Bit, showRating !== false)
                    .input('showImage', sql.Bit, showImage !== false)
                    .input('showTitle', sql.Bit, showTitle !== false)
                    .query(`
                        UPDATE TestimonialsDesign SET
                            Theme = @theme,
                            Layout = @layout,
                            PerRow = @perRow,
                            Animation = @animation,
                            BgColor = @bgColor,
                            TextColor = @textColor,
                            AccentColor = @accentColor,
                            BorderRadius = @borderRadius,
                            ShowRating = @showRating,
                            ShowImage = @showImage,
                            ShowTitle = @showTitle,
                            UpdatedAt = GETDATE()
                    `);
            } else {
                // Insert new settings
                await pool.request()
                    .input('theme', sql.NVarChar, theme || 'default')
                    .input('layout', sql.NVarChar, layout || 'grid')
                    .input('perRow', sql.NVarChar, perRow || '3')
                    .input('animation', sql.NVarChar, animation || 'none')
                    .input('bgColor', sql.NVarChar, bgColor || '#ffffff')
                    .input('textColor', sql.NVarChar, textColor || '#333333')
                    .input('accentColor', sql.NVarChar, accentColor || '#ffc107')
                    .input('borderRadius', sql.NVarChar, borderRadius || '8')
                    .input('showRating', sql.Bit, showRating !== false)
                    .input('showImage', sql.Bit, showImage !== false)
                    .input('showTitle', sql.Bit, showTitle !== false)
                    .query(`
                        INSERT INTO TestimonialsDesign (
                            Theme, Layout, PerRow, Animation, BgColor, TextColor, AccentColor,
                            BorderRadius, ShowRating, ShowImage, ShowTitle
                        ) VALUES (
                            @theme, @layout, @perRow, @animation, @bgColor, @textColor, @accentColor,
                            @borderRadius, @showRating, @showImage, @showTitle
                        )
                    `);
            }

            res.json({
                success: true,
                message: 'Testimonials design settings saved successfully'
            });
        } catch (error) {
            console.error('Error saving testimonials design settings:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save testimonials design settings',
                error: error.message 
            });
        }
    });

    // GET /api/testimonials-design - Public endpoint for frontend to fetch testimonials design settings
    router.get('/api/testimonials-design', async (req, res) => {
        try {
            await pool.connect();
            
            // First ensure the TestimonialsDesign table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TestimonialsDesign]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE TestimonialsDesign (
                        ID INT PRIMARY KEY IDENTITY(1,1),
                        Theme NVARCHAR(50) NOT NULL DEFAULT 'default',
                        Layout NVARCHAR(50) NOT NULL DEFAULT 'grid',
                        PerRow NVARCHAR(10) NOT NULL DEFAULT '3',
                        Animation NVARCHAR(50) NOT NULL DEFAULT 'none',
                        BgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
                        TextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
                        AccentColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
                        BorderRadius NVARCHAR(10) NOT NULL DEFAULT '8',
                        ShowRating BIT NOT NULL DEFAULT 1,
                        ShowImage BIT NOT NULL DEFAULT 1,
                        ShowTitle BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE()
                    );
                    
                    -- Insert default values
                    INSERT INTO TestimonialsDesign (
                        Theme, Layout, PerRow, Animation, BgColor, TextColor, AccentColor,
                        BorderRadius, ShowRating, ShowImage, ShowTitle
                    ) VALUES (
                        'default', 'grid', '3', 'none', '#ffffff', '#333333', '#ffc107',
                        '8', 1, 1, 1
                    );
                END
            `);
            
            // Fetch the design settings
            const result = await pool.request().query(`
                SELECT TOP 1 
                    Theme as theme,
                    Layout as layout,
                    PerRow as perRow,
                    Animation as animation,
                    BgColor as bgColor,
                    TextColor as textColor,
                    AccentColor as accentColor,
                    BorderRadius as borderRadius,
                    ShowRating as showRating,
                    ShowImage as showImage,
                    ShowTitle as showTitle
                FROM TestimonialsDesign
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({
                    success: true,
                    ...result.recordset[0]
                });
            } else {
                // Return default values if no settings found
                res.json({
                    success: true,
                    theme: 'default',
                    layout: 'grid',
                    perRow: '3',
                    animation: 'none',
                    bgColor: '#ffffff',
                    textColor: '#333333',
                    accentColor: '#ffc107',
                    borderRadius: '8',
                    showRating: true,
                    showImage: true,
                    showTitle: true,
                });
            }
        } catch (error) {
            console.error('Error fetching testimonials design settings:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch testimonials design settings',
                error: error.message 
            });
        }
    });

    // --- Testimonials CRUD API Routes ---
    // GET /api/admin/testimonials - Fetch all testimonials
    router.get('/api/admin/testimonials', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    TestimonialID as id,
                    Name as name,
                    Profession as profession,
                    Rating as rating,
                    Text as text,
                    ImageURL as imageURL,
                    IsActive as isActive,
                    DisplayOrder as displayOrder,
                    CreatedAt as createdAt,
                    UpdatedAt as updatedAt
                FROM Testimonials
                ORDER BY DisplayOrder ASC, CreatedAt DESC
            `);
            
            res.json({
                success: true,
                testimonials: result.recordset
            });
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch testimonials',
                error: error.message 
            });
        }
    });

    // POST /api/admin/testimonials - Add new testimonial
    router.post('/api/admin/testimonials', isAuthenticated, hasRole('Admin'), upload.single('image'), async (req, res) => {
        try {
            console.log('=== TESTIMONIAL ADD REQUEST ===');
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);
            console.log('Session user:', req.session.user);
            
            const { name, profession, rating, text, displayOrder } = req.body;
            const imageURL = req.file ? `/uploads/testimonials/${req.file.filename}` : null;
            const userId = req.session.user?.UserID;
            
            console.log('Parsed data:', { name, profession, rating, text, displayOrder, imageURL, userId });

            await pool.connect();
            
            // Ensure Testimonials table exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Testimonials]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE Testimonials (
                        TestimonialID INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(255) NOT NULL,
                        Profession NVARCHAR(255) NOT NULL,
                        Rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
                        Text NVARCHAR(MAX) NOT NULL,
                        ImageURL NVARCHAR(500) NULL,
                        IsActive BIT NOT NULL DEFAULT(1),
                        DisplayOrder INT NOT NULL DEFAULT 0,
                        CreatedBy INT NULL,
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE(),
                        
                        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL
                    );
                    PRINT 'Testimonials table created successfully';
                END
            `);
            
            console.log('About to insert testimonial into database...');
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('profession', sql.NVarChar, profession)
                .input('rating', sql.Decimal(2,1), parseFloat(rating) || 5.0)
                .input('text', sql.NVarChar, text)
                .input('imageURL', sql.NVarChar, imageURL)
                .input('displayOrder', sql.Int, parseInt(displayOrder) || 0)
                .input('createdBy', sql.Int, userId)
                .query(`
                    INSERT INTO Testimonials (Name, Profession, Rating, Text, ImageURL, DisplayOrder, CreatedBy)
                    OUTPUT INSERTED.TestimonialID
                    VALUES (@name, @profession, @rating, @text, @imageURL, @displayOrder, @createdBy)
                `);

            console.log('Database insert result:', result.recordset);
            console.log('Testimonial added successfully with ID:', result.recordset[0]?.TestimonialID);

            res.json({
                success: true,
                message: 'Testimonial added successfully',
                testimonialId: result.recordset[0]?.TestimonialID
            });
        } catch (error) {
            console.error('Error adding testimonial:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add testimonial',
                error: error.message 
            });
        }
    });

    // PUT /api/admin/testimonials/:id - Update testimonial
    router.put('/api/admin/testimonials/:id', isAuthenticated, hasRole('Admin'), upload.single('image'), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, profession, rating, text, displayOrder, isActive } = req.body;
            const imageURL = req.file ? `/uploads/testimonials/${req.file.filename}` : null;

            await pool.connect();
            
            // Build dynamic query based on whether image is being updated
            let query = `
                UPDATE Testimonials SET
                    Name = @name,
                    Profession = @profession,
                    Rating = @rating,
                    Text = @text,
                    DisplayOrder = @displayOrder,
                    IsActive = @isActive,
                    UpdatedAt = GETDATE()
            `;
            
            const request = pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('profession', sql.NVarChar, profession)
                .input('rating', sql.Decimal(2,1), parseFloat(rating) || 5.0)
                .input('text', sql.NVarChar, text)
                .input('displayOrder', sql.Int, parseInt(displayOrder) || 0)
                .input('isActive', sql.Bit, isActive === 'true' || isActive === true);

            if (imageURL) {
                query += `, ImageURL = @imageURL`;
                request.input('imageURL', sql.NVarChar, imageURL);
            }

            query += ` WHERE TestimonialID = @id`;

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Testimonial not found' 
                });
            }

            res.json({
                success: true,
                message: 'Testimonial updated successfully'
            });
        } catch (error) {
            console.error('Error updating testimonial:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update testimonial',
                error: error.message 
            });
        }
    });

    // DELETE /api/admin/testimonials/:id - Delete testimonial
    router.delete('/api/admin/testimonials/:id', isAuthenticated, hasRole('Admin'), async (req, res) => {
        try {
            const { id } = req.params;

            await pool.connect();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM Testimonials WHERE TestimonialID = @id
                `);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Testimonial not found' 
                });
            }

            res.json({
                success: true,
                message: 'Testimonial deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete testimonial',
                error: error.message 
            });
        }
    });

    // GET /api/testimonials - Public endpoint for frontend to fetch active testimonials
    router.get('/api/testimonials', async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    TestimonialID as id,
                    Name as name,
                    Profession as profession,
                    Rating as rating,
                    Text as text,
                    ImageURL as imageURL,
                    DisplayOrder as displayOrder
                FROM Testimonials
                WHERE IsActive = 1
                ORDER BY DisplayOrder ASC, CreatedAt DESC
            `);
            
            res.json({
                success: true,
                testimonials: result.recordset
            });
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch testimonials',
                error: error.message 
            });
        }
    });

    // Log all registered routes for debugging
    console.log('=== REGISTERED ROUTES ===');
    router.stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`${methods} ${layer.route.path}`);
        }
    });
    console.log('=== END REGISTERED ROUTES ===');

    // ===== TERMS AND CONDITIONS API ROUTES =====
    
    // GET /api/admin/terms - Fetch terms and conditions (Admin)
    router.get('/api/admin/terms', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const query = 'SELECT * FROM terms_and_conditions ORDER BY id DESC';
            const result = await pool.request().query(query);
            
            if (result.recordset.length === 0) {
                return res.json({
                    signupTermsTitle: 'Terms & Conditions',
                    signupTermsContent: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                    signupTermsCheckboxText: 'I agree to the Terms and Conditions',
                    checkoutTermsTitle: 'Terms and Conditions',
                    checkoutTermsContent: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                    checkoutTermsCheckboxText: 'I have read and agree to the Terms and Conditions',
                    termsLastUpdated: '',
                    termsVersion: '1.0',
                    requireAgreement: true
                });
            }
            
            const terms = result.recordset[0];
            res.json({
                signupTermsTitle: terms.signup_terms_title,
                signupTermsContent: terms.signup_terms_content,
                signupTermsCheckboxText: terms.signup_terms_checkbox_text,
                checkoutTermsTitle: terms.checkout_terms_title,
                checkoutTermsContent: terms.checkout_terms_content,
                checkoutTermsCheckboxText: terms.checkout_terms_checkbox_text,
                termsLastUpdated: terms.terms_last_updated,
                termsVersion: terms.terms_version,
                requireAgreement: terms.require_agreement
            });
        } catch (error) {
            console.error('Error fetching terms and conditions:', error);
            res.status(500).json({ error: 'Failed to fetch terms and conditions' });
        }
    });

    // POST /api/admin/terms - Save terms and conditions (Admin)
    router.post('/api/admin/terms', isAuthenticated, async (req, res) => {
        try {
            const {
                signupTermsTitle,
                signupTermsContent,
                signupTermsCheckboxText,
                checkoutTermsTitle,
                checkoutTermsContent,
                checkoutTermsCheckboxText,
                termsLastUpdated,
                termsVersion,
                requireAgreement
            } = req.body;
            
            await pool.connect();
            
            // Check if terms already exist
            const checkQuery = 'SELECT id FROM terms_and_conditions ORDER BY id DESC';
            const checkResult = await pool.request().query(checkQuery);
            
            if (checkResult.recordset.length > 0) {
                // Update existing terms
                const updateQuery = `
                    UPDATE terms_and_conditions SET
                        signup_terms_title = @signupTermsTitle,
                        signup_terms_content = @signupTermsContent,
                        signup_terms_checkbox_text = @signupTermsCheckboxText,
                        checkout_terms_title = @checkoutTermsTitle,
                        checkout_terms_content = @checkoutTermsContent,
                        checkout_terms_checkbox_text = @checkoutTermsCheckboxText,
                        terms_last_updated = @termsLastUpdated,
                        terms_version = @termsVersion,
                        require_agreement = @requireAgreement,
                        updated_at = GETDATE()
                    WHERE id = @id
                `;
                
                await pool.request()
                    .input('signupTermsTitle', sql.NVarChar, signupTermsTitle)
                    .input('signupTermsContent', sql.NVarChar, signupTermsContent)
                    .input('signupTermsCheckboxText', sql.NVarChar, signupTermsCheckboxText)
                    .input('checkoutTermsTitle', sql.NVarChar, checkoutTermsTitle)
                    .input('checkoutTermsContent', sql.NVarChar, checkoutTermsContent)
                    .input('checkoutTermsCheckboxText', sql.NVarChar, checkoutTermsCheckboxText)
                    .input('termsLastUpdated', sql.NVarChar, termsLastUpdated)
                    .input('termsVersion', sql.NVarChar, termsVersion)
                    .input('requireAgreement', sql.Bit, requireAgreement)
                    .input('id', sql.Int, checkResult.recordset[0].id)
                    .query(updateQuery);
            } else {
                // Insert new terms
                const insertQuery = `
                    INSERT INTO terms_and_conditions (
                        signup_terms_title,
                        signup_terms_content,
                        signup_terms_checkbox_text,
                        checkout_terms_title,
                        checkout_terms_content,
                        checkout_terms_checkbox_text,
                        terms_last_updated,
                        terms_version,
                        require_agreement,
                        created_at,
                        updated_at
                    ) VALUES (
                        @signupTermsTitle,
                        @signupTermsContent,
                        @signupTermsCheckboxText,
                        @checkoutTermsTitle,
                        @checkoutTermsContent,
                        @checkoutTermsCheckboxText,
                        @termsLastUpdated,
                        @termsVersion,
                        @requireAgreement,
                        GETDATE(),
                        GETDATE()
                    )
                `;
                
                await pool.request()
                    .input('signupTermsTitle', sql.NVarChar, signupTermsTitle)
                    .input('signupTermsContent', sql.NVarChar, signupTermsContent)
                    .input('signupTermsCheckboxText', sql.NVarChar, signupTermsCheckboxText)
                    .input('checkoutTermsTitle', sql.NVarChar, checkoutTermsTitle)
                    .input('checkoutTermsContent', sql.NVarChar, checkoutTermsContent)
                    .input('checkoutTermsCheckboxText', sql.NVarChar, checkoutTermsCheckboxText)
                    .input('termsLastUpdated', sql.NVarChar, termsLastUpdated)
                    .input('termsVersion', sql.NVarChar, termsVersion)
                    .input('requireAgreement', sql.Bit, requireAgreement)
                    .query(insertQuery);
            }
            
            res.json({ success: true, message: 'Terms and conditions saved successfully' });
        } catch (error) {
            console.error('Error saving terms and conditions:', error);
            res.status(500).json({ error: 'Failed to save terms and conditions' });
        }
    });

    // GET /api/terms/public - Public endpoint to fetch terms for frontend
    router.get('/api/terms/public', async (req, res) => {
        try {
            await pool.connect();
            const query = 'SELECT * FROM terms_and_conditions ORDER BY id DESC';
            const result = await pool.request().query(query);
            
            if (result.recordset.length === 0) {
                return res.json({
                    signupTerms: {
                        title: 'Terms & Conditions',
                        content: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                        checkboxText: 'I agree to the Terms and Conditions'
                    },
                    checkoutTerms: {
                        title: 'Terms and Conditions',
                        content: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                        checkboxText: 'I have read and agree to the Terms and Conditions'
                    },
                    requireAgreement: true
                });
            }
            
            const terms = result.recordset[0];
            res.json({
                signupTerms: {
                    title: terms.signup_terms_title,
                    content: terms.signup_terms_content,
                    checkboxText: terms.signup_terms_checkbox_text
                },
                checkoutTerms: {
                    title: terms.checkout_terms_title,
                    content: terms.checkout_terms_content,
                    checkboxText: terms.checkout_terms_checkbox_text
                },
                requireAgreement: terms.require_agreement,
                lastUpdated: terms.terms_last_updated,
                version: terms.terms_version
            });
        } catch (error) {
            console.error('Error fetching public terms:', error);
            res.status(500).json({ error: 'Failed to fetch terms and conditions' });
        }
    });

    return router; 
} 
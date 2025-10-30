// API Routes for Frontend
const express = require('express');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = function(sql, pool) {
    const router = express.Router();

    // Configure multer for review image uploads
    const reviewUploadsDir = path.join(__dirname, 'public', 'uploads', 'reviews');
    if (!fs.existsSync(reviewUploadsDir)) {
        fs.mkdirSync(reviewUploadsDir, { recursive: true });
    }

    const reviewStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, reviewUploadsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const reviewUpload = multer({
        storage: reviewStorage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
            files: 5 // Maximum 5 files per review
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for theme uploads
    const themeUploadsDir = path.join(__dirname, 'public', 'uploads', 'theme');
    if (!fs.existsSync(themeUploadsDir)) {
        fs.mkdirSync(themeUploadsDir, { recursive: true });
    }

    const themeStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, themeUploadsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'theme-bg-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({
        storage: themeStorage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit for background images
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // --- Health Check API Endpoint ---
    router.get('/api/health', (req, res) => {
        res.json({ 
            status: 'OK', 
            message: 'Backend is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // --- Order Management API Endpoints ---
    // Cash on Delivery Order Creation
    router.post('/api/orders/cash-on-delivery', async (req, res) => {
        try {
            console.log('COD Order Request received:', {
                session: req.session,
                body: req.body,
                headers: req.headers
            });
            
            // Check if user is authenticated
            if (!req.session.user || req.session.user.role !== 'Customer') {
                console.log('Authentication failed:', {
                    hasSession: !!req.session,
                    hasUser: !!req.session?.user,
                    userRole: req.session?.user?.role
                });
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - please log in to place an order' 
                });
            }
            
            const { items, email, subtotal, shippingCost, total, deliveryType, shippingAddressId } = req.body;
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No items provided for order' 
                });
            }
            
            await pool.connect();
            
            // Get customer ID from session
            const customerId = req.session.user.id;
            
            // Validate shipping address if delivery type is not pickup
            let finalShippingAddressId = null;
            if (deliveryType && deliveryType !== 'pickup') {
                if (!shippingAddressId) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Shipping address is required for delivery orders' 
                    });
                }
                
                // Verify the address belongs to the customer
                const addressResult = await pool.request()
                    .input('addressId', sql.Int, shippingAddressId)
                    .input('customerId', sql.Int, customerId)
                    .query('SELECT AddressID FROM CustomerAddresses WHERE AddressID = @addressId AND CustomerID = @customerId');
                
                if (!addressResult.recordset.length) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Invalid shipping address' 
                    });
                }
                
                finalShippingAddressId = shippingAddressId;
            }
            
            // Get Manila timezone date (same as Stripe webhook)
            const getManilaTime = () => {
                const now = new Date();
                // Get Manila time by adding 8 hours to UTC (Philippines is UTC+8)
                return new Date(now.getTime() + (8 * 60 * 60 * 1000));
            };
            
            const manilaTime = getManilaTime();
            
            // Create the order with proper schema (matching Stripe webhook structure)
            const orderResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('status', sql.NVarChar, 'Pending')
                .input('totalAmount', sql.Decimal(10, 2), total || 0)
                .input('paymentMethod', sql.NVarChar, 'Bank Transfer')
                .input('currency', sql.NVarChar, 'PHP')
                .input('orderDate', sql.DateTime, manilaTime)
                .input('paymentDate', sql.DateTime, null) // COD orders don't have payment date initially
                .input('shippingAddressId', sql.Int, finalShippingAddressId)
                .input('deliveryType', sql.NVarChar, deliveryType || 'pickup')
                .input('deliveryCost', sql.Decimal(10, 2), shippingCost || 0)
                .input('stripeSessionId', sql.NVarChar, null) // COD orders don't have Stripe session
                .input('paymentStatus', sql.NVarChar, 'Pending') // COD orders are pending payment
                .input('pickupDate', sql.DateTime, null) // Can be set later if needed
                .query(`
                    INSERT INTO Orders (CustomerID, Status, TotalAmount, PaymentMethod, Currency, OrderDate, PaymentDate, ShippingAddressID, DeliveryType, DeliveryCost, StripeSessionID, PaymentStatus, PickupDate)
                    OUTPUT INSERTED.OrderID
                    VALUES (@customerId, @status, @totalAmount, @paymentMethod, @currency, @orderDate, @paymentDate, @shippingAddressId, @deliveryType, @deliveryCost, @stripeSessionId, @paymentStatus, @pickupDate)
                `);
            
            const orderId = orderResult.recordset[0].OrderID;
            console.log('✅ COD Order created successfully with OrderID:', orderId);
            
            // Add order items and decrement stock
            console.log('📦 Processing order items:', items.length);
            for (const item of items) {
                console.log('Processing item:', item);
                
                // Handle both 'id' and 'productId' field names for compatibility
                const productId = item.productId || item.id;
                
                if (!productId) {
                    console.error('❌ Missing product ID in item:', item);
                    continue; // Skip this item if no product ID
                }
                
                console.log('Adding order item for product ID:', productId, 'Quantity:', item.quantity);
                
                await pool.request()
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, productId)
                    .input('quantity', sql.Int, item.quantity)
                    .input('price', sql.Decimal(10, 2), item.price)
                    .input('variationId', sql.Int, item.variationId || null)
                    .query(`
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity, PriceAtPurchase, VariationID)
                        VALUES (@orderId, @productId, @quantity, @price, @variationId)
                    `);

                console.log('✅ Order item added successfully');

                // Decrement stock quantities
                console.log('📉 Decrementing stock for product ID:', productId, 'Quantity:', item.quantity);
                
                // Always decrement main product stock first
                const productUpdateResult = await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('quantity', sql.Int, item.quantity)
                    .query(`UPDATE Products 
                            SET StockQuantity = CASE WHEN StockQuantity >= @quantity THEN StockQuantity - @quantity ELSE 0 END 
                            WHERE ProductID = @productId`);
                
                console.log('✅ Main product stock decremented. Rows affected:', productUpdateResult.rowsAffected);
                
                // Additionally decrement variation stock if this is a variation purchase
                if (item.variationId && item.variationId !== null && item.variationId !== undefined) {
                    console.log('📉 Decrementing variation stock for variation ID:', item.variationId);
                    const variationUpdateResult = await pool.request()
                        .input('variationId', sql.Int, item.variationId)
                        .input('quantity', sql.Int, item.quantity)
                        .query(`UPDATE ProductVariations 
                                SET Quantity = CASE WHEN Quantity >= @quantity THEN Quantity - @quantity ELSE 0 END 
                                WHERE VariationID = @variationId`);
                    
                    console.log('✅ Variation stock decremented. Rows affected:', variationUpdateResult.rowsAffected);
                }
            }
            
            console.log('✅ All order items processed successfully');
            
            
            res.json({ 
                success: true, 
                message: 'Order placed successfully',
                orderId: orderId
            });
            
        } catch (error) {
            console.error('❌ COD Order Creation Error:', error);
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Request body:', req.body);
            console.error('Session data:', req.session);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to create order';
            if (error.message.includes('Cannot insert the value NULL')) {
                errorMessage = 'Missing required order information';
            } else if (error.message.includes('Invalid column name')) {
                errorMessage = 'Database schema mismatch - please contact support';
            } else if (error.message.includes('Foreign key constraint')) {
                errorMessage = 'Invalid customer or product information';
            } else if (error.message.includes('Connection')) {
                errorMessage = 'Database connection error - please try again';
            }
            
            res.status(500).json({ 
                success: false, 
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
                code: 'COD_ORDER_ERROR'
            });
        }
    });

    // --- Product Reviews API Endpoints ---
    // Get reviews for a specific product
    router.get('/api/products/:productId/reviews', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            const sortBy = req.query.sort || 'newest';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 4;
            const offset = (page - 1) * limit;
            
            
            // Check if table has extended columns
            const columnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'ProductReviews' 
                AND COLUMN_NAME IN ('ReviewerName', 'ReviewerEmail', 'Title')
            `);
            
            let orderClause = 'ORDER BY pr.CreatedAt DESC';
            switch (sortBy) {
                case 'oldest':
                    orderClause = 'ORDER BY pr.CreatedAt ASC';
                    break;
                case 'highest':
                    orderClause = 'ORDER BY pr.Rating DESC, pr.CreatedAt DESC';
                    break;
                case 'lowest':
                    orderClause = 'ORDER BY pr.Rating ASC, pr.CreatedAt DESC';
                    break;
                default: // newest
                    orderClause = 'ORDER BY pr.CreatedAt DESC';
            }
            
            let query;
            if (columnCheck.recordset.length >= 3) {
                // Extended table with additional columns
                query = `
                    SELECT
                        pr.ReviewID as id,
                        pr.ProductID,
                        pr.CustomerID,
                        COALESCE(pr.ReviewerName, c.FullName, 'Anonymous') AS customerName,
                        COALESCE(pr.ReviewerEmail, c.Email) AS customerEmail,
                        pr.Rating as rating,
                        COALESCE(pr.Title, 'Review') AS title,
                        pr.Comment as comment,
                        pr.HelpfulCount,
                        pr.CreatedAt as createdAt,
                        pr.UpdatedAt,
                        pr.IsActive
                    FROM ProductReviews pr
                        LEFT JOIN Customers c ON pr.CustomerID = c.CustomerID
                    WHERE pr.ProductID = @productId
                        AND pr.IsActive = 1
                    ${orderClause}
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `;
            } else {
                // Basic table structure
                query = `
                    SELECT
                        pr.ReviewID as id,
                        pr.ProductID,
                        pr.CustomerID,
                        COALESCE(c.FullName, 'Anonymous') AS customerName,
                        c.Email AS customerEmail,
                        pr.Rating as rating,
                        'Review' AS title,
                        pr.Comment as comment,
                        pr.HelpfulCount,
                        pr.CreatedAt as createdAt,
                        pr.UpdatedAt,
                        pr.IsActive
                    FROM ProductReviews pr
                        LEFT JOIN Customers c ON pr.CustomerID = c.CustomerID
                    WHERE pr.ProductID = @productId
                        AND pr.IsActive = 1
                    ${orderClause}
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `;
            }
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .input('offset', sql.Int, offset)
                .input('limit', sql.Int, limit)
                .query(query);
            
            
            res.json({
                success: true,
                reviews: result.recordset
            });
        } catch (err) {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch reviews', 
                details: err.message 
            });
        }
    });

    // Helper function to check if customer has completed purchase of a product
    async function hasCompletedPurchase(customerId, productId) {
        try {
            if (!customerId || !productId) {
                return false;
            }
            
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT COUNT(*) as purchaseCount
                    FROM OrderItems oi
                    INNER JOIN Orders o ON oi.OrderID = o.OrderID
                    WHERE o.CustomerID = @customerId 
                    AND oi.ProductID = @productId 
                    AND o.Status = 'Completed'
                `);
            
            const purchaseCount = result.recordset[0].purchaseCount;
            return purchaseCount > 0;
        } catch (error) {
            console.error('Error checking purchase verification:', error);
            console.error('Error details:', error.message);
            return false;
        }
    }

    // Add a new review for a product
    router.post('/api/products/:productId/reviews', (req, res, next) => {
        reviewUpload.array('images', 5)(req, res, (err) => {
            if (err) {
                // Multer error occurred
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'File too large. Maximum size is 5MB per file.' 
                    });
                }
                
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Too many files. Maximum 5 files allowed.' 
                    });
                }
                
                if (err.message && err.message.includes('Only image files are allowed')) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Only image files are allowed.' 
                    });
                }
                
                return res.status(400).json({ 
                    success: false, 
                    error: 'File upload error: ' + err.message 
                });
            }
            next();
        });
    }, async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            // Extract data from request body (handles both FormData and JSON)
            const rawRating = req.body.rating;
            let parsedRating;
            
            // Try multiple parsing methods
            if (typeof rawRating === 'number') {
                parsedRating = Math.round(rawRating); // Ensure it's an integer
            } else if (typeof rawRating === 'string') {
                const numRating = Number(rawRating);
                parsedRating = isNaN(numRating) ? NaN : Math.round(numRating);
            } else {
                parsedRating = NaN;
            }
            
            const parsedCustomerId = req.body.customerId ? parseInt(req.body.customerId) : null;
            
            const reviewData = {
                name: req.body.name,
                email: req.body.email,
                rating: parsedRating,
                title: req.body.title,
                comment: req.body.comment,
                customerId: parsedCustomerId || null
            };
            
            const { name, email, rating, title, comment, customerId } = reviewData;
            
            
            // Check if customer has completed purchase of this product
            if (customerId) {
                const hasPurchase = await hasCompletedPurchase(customerId, productId);
                if (!hasPurchase) {
                    return res.status(403).json({
                        success: false,
                        error: 'You can only review products you have purchased and received. Please complete a purchase of this product first.',
                        code: 'PURCHASE_REQUIRED'
                    });
                }
            }
            
            // Validate input - be more specific about validation
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Rating must be between 1 and 5' 
                });
            }
            
            if (!comment || comment.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Review content is required' 
                });
            }
            
            if (!title || title.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Review title is required' 
                });
            }
            
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Name is required' 
                });
            }
            
            if (!email || email.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Email is required' 
                });
            }
            
            if (!customerId || isNaN(parseInt(customerId))) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Valid Customer ID is required' 
                });
            }
            
            // Handle uploaded images
            let imageUrls = [];
            let imageUrlString = '';
            if (req.files && req.files.length > 0) {
                imageUrls = req.files.map(file => {
                    // Return relative path from public directory
                    return '/uploads/reviews/' + file.filename;
                });
                imageUrlString = imageUrls.join(',');
                // Review images uploaded successfully
            }
            
            // Check if ProductReviews table has the required columns
            const columnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'ProductReviews' 
                AND COLUMN_NAME IN ('ReviewerName', 'ReviewerEmail', 'Title', 'ImageURL')
            `);
            
            let result;
            if (columnCheck.recordset.length >= 3) {
                // Use direct SQL query instead of stored procedure
                
                // Check if image support is available
                if (columnCheck.recordset.length >= 4) {
                    // Use the new procedure with image support
                    result = await pool.request()
                        .input('productId', sql.Int, productId)
                        .input('customerId', sql.Int, parseInt(customerId))
                        .input('rating', sql.Int, rating)
                        .input('comment', sql.NVarChar, comment.trim())
                        .input('reviewerName', sql.NVarChar, name.trim())
                        .input('reviewerEmail', sql.NVarChar, email.trim())
                        .input('title', sql.NVarChar, title.trim())
                        .input('imageUrl', sql.NVarChar, imageUrls.length > 0 ? imageUrls[0] : null)
                        .input('imageUrls', sql.NVarChar, imageUrlString)
                        .query(`
                            INSERT INTO ProductReviews (ProductID, CustomerID, ReviewerName, ReviewerEmail, Rating, Title, Comment, CreatedAt, UpdatedAt, IsActive, HelpfulCount)
                            OUTPUT INSERTED.*
                            VALUES (@productId, @customerId, @reviewerName, @reviewerEmail, @rating, @title, @comment, GETDATE(), GETDATE(), 1, 0)
                        `);
                } else {
                    // Table has extended columns but no image support yet
                    result = await pool.request()
                        .input('productId', sql.Int, productId)
                        .input('customerId', sql.Int, parseInt(customerId))
                        .input('reviewerName', sql.NVarChar, name.trim())
                        .input('reviewerEmail', sql.NVarChar, email.trim())
                        .input('rating', sql.Int, rating)
                        .input('title', sql.NVarChar, title.trim())
                        .input('comment', sql.NVarChar, comment.trim())
                        .query(`
                            INSERT INTO ProductReviews (ProductID, CustomerID, ReviewerName, ReviewerEmail, Rating, Title, Comment, CreatedAt, UpdatedAt, IsActive, HelpfulCount)
                            OUTPUT INSERTED.*
                            VALUES (@productId, @customerId, @reviewerName, @reviewerEmail, @rating, @title, @comment, GETDATE(), GETDATE(), 1, 0)
                        `);
                }
            } else {
                // Use basic columns only
                result = await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('customerId', sql.Int, parseInt(customerId))
                    .input('rating', sql.Int, rating)
                    .input('comment', sql.NVarChar, `${title.trim()}\n\n${comment.trim()}`)
                    .query(`
                        INSERT INTO ProductReviews (ProductID, CustomerID, Rating, Comment, CreatedAt, UpdatedAt, IsActive, HelpfulCount)
                        OUTPUT INSERTED.*
                        VALUES (@productId, @customerId, @rating, @comment, GETDATE(), GETDATE(), 1, 0)
                    `);
            }
            
            // Review added successfully
            
            res.json({
                success: true,
                review: result.recordset[0],
                message: 'Review submitted successfully!'
            });
        } catch (err) {
            // Error adding product review
            console.error('Main review submission error:', err);
            console.error('Error stack:', err.stack);
            
            // Handle multer errors specifically
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'File too large. Maximum size is 5MB per file.' 
                });
            }
            
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Too many files. Maximum 5 files allowed.' 
                });
            }
            
            if (err.message && err.message.includes('Only image files are allowed')) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Only image files are allowed.' 
                });
            }
            
            console.error('Review submission error:', err);
            console.error('Error stack:', err.stack);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to add review', 
                details: err.message 
            });
        }
    });

    // Check if user can review a product (has completed purchase)
    router.get('/api/products/:productId/reviews/can-review', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            const customerId = parseInt(req.query.customerId);
            
            
            if (!customerId) {
                return res.json({
                    success: true,
                    canReview: false,
                    reason: 'Customer ID is required'
                });
            }
            
            const hasPurchase = await hasCompletedPurchase(customerId, productId);
            
            res.json({
                success: true,
                canReview: hasPurchase,
                reason: hasPurchase ? 'Customer has completed purchase' : 'Customer has not completed purchase of this product'
            });
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check review eligibility',
                details: error.message
            });
        }
    });

    // Get review statistics for a product
    router.get('/api/products/:productId/reviews/stats', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            
            // Get review statistics using regular SQL query
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        AVG(CAST(Rating AS FLOAT)) as AverageRating,
                        COUNT(*) as TotalReviews,
                        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as FiveStarCount,
                        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as FourStarCount,
                        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as ThreeStarCount,
                        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as TwoStarCount,
                        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as OneStarCount
                    FROM ProductReviews 
                    WHERE ProductID = @productId AND IsActive = 1
                `);
            
            const stats = result.recordset[0];
            
            // Format the response
            const response = {
                success: true,
                stats: {
                    averageRating: stats.AverageRating ? Math.round(stats.AverageRating * 10) / 10 : 0,
                    totalReviews: stats.TotalReviews || 0,
                    ratingDistribution: {
                        5: stats.FiveStarCount || 0,
                        4: stats.FourStarCount || 0,
                        3: stats.ThreeStarCount || 0,
                        2: stats.TwoStarCount || 0,
                        1: stats.OneStarCount || 0
                    }
                }
            };
            
            res.json(response);
        } catch (err) {
            console.error('Error fetching review statistics:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch review statistics', 
                details: err.message
            });
        }
    });

    // --- Admin Review Management Endpoints ---
    // Get all reviews for admin management
    router.get('/api/admin/reviews', async (req, res) => {
        try {
            // First check if ProductReviews table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductReviews'
            `);
            
            if (tableCheck.recordset.length === 0) {
                return res.json({
                    success: true,
                    reviews: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: 10
                    }
                });
            }
            
            const filter = req.query.filter || 'all';
            const rating = req.query.rating || 'all';
            const search = req.query.search || '';
            const showRejected = req.query.showRejected === 'true';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            let whereConditions = [];
            
            // Status filter
            switch (filter) {
                case 'pending':
                    whereConditions.push('pr.IsActive = 0');
                    break;
                case 'approved':
                    whereConditions.push('pr.IsActive = 1');
                    break;
                case 'rejected':
                    whereConditions.push('pr.IsActive = 0');
                    break;
                case 'all':
                default:
                    if (!showRejected) {
                        whereConditions.push('pr.IsActive = 1');
                    }
                    break;
            }
            
            // Rating filter
            if (rating !== 'all') {
                whereConditions.push(`pr.Rating = ${parseInt(rating)}`);
            }
            
            // Search filter
            if (search) {
                whereConditions.push(`(pr.ReviewerName LIKE '%${search}%' OR p.Name LIKE '%${search}%' OR pr.Comment LIKE '%${search}%')`);
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            
            // Check if ProductReviews table has extended columns
            const columnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'ProductReviews' 
                AND COLUMN_NAME IN ('ReviewerName', 'ReviewerEmail', 'Title')
            `);
            
            // First get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ProductReviews pr
                LEFT JOIN Products p ON pr.ProductID = p.ProductID
                ${whereClause}
            `;
            
            const countResult = await pool.request().query(countQuery);
            const total = countResult.recordset[0].total;
            const totalPages = Math.ceil(total / limit);
            
            let query;
            if (columnCheck.recordset.length >= 3) {
                // Extended table with additional columns
                query = `
                    SELECT 
                        pr.ReviewID,
                        pr.ProductID,
                        pr.CustomerID,
                        pr.ReviewerName,
                        pr.ReviewerEmail,
                        pr.Rating,
                        pr.Title,
                        pr.Comment,
                        pr.CreatedAt as ReviewDate,
                        pr.IsActive,
                        0 as IsFlagged,
                        p.Name as ProductName
                    FROM ProductReviews pr
                    LEFT JOIN Products p ON pr.ProductID = p.ProductID
                    ${whereClause}
                    ORDER BY pr.CreatedAt DESC
                    OFFSET ${offset} ROWS
                    FETCH NEXT ${limit} ROWS ONLY
                `;
            } else {
                // Basic table structure
                query = `
                    SELECT 
                        pr.ReviewID,
                        pr.ProductID,
                        pr.CustomerID,
                        'Anonymous' as ReviewerName,
                        '' as ReviewerEmail,
                        pr.Rating,
                        'Review' as Title,
                        pr.Comment,
                        pr.CreatedAt as ReviewDate,
                        pr.IsActive,
                        0 as IsFlagged,
                        p.Name as ProductName
                    FROM ProductReviews pr
                    LEFT JOIN Products p ON pr.ProductID = p.ProductID
                    ${whereClause}
                    ORDER BY pr.CreatedAt DESC
                    OFFSET ${offset} ROWS
                    FETCH NEXT ${limit} ROWS ONLY
                `;
            }
            
            const result = await pool.request().query(query);
            
            res.json({
                success: true,
                reviews: result.recordset,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            console.error('Error fetching admin reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reviews',
                details: error.message
            });
        }
    });
    
    // Toggle review status (approve/reject)
    router.post('/api/admin/reviews/:reviewId/toggle', async (req, res) => {
        try {
            const reviewId = parseInt(req.params.reviewId);
            const { isActive } = req.body;
            
            await pool.request()
                .input('reviewId', sql.Int, reviewId)
                .input('isActive', sql.Bit, isActive)
                .query(`
                    UPDATE ProductReviews 
                    SET IsActive = @isActive 
                    WHERE ReviewID = @reviewId
                `);
            
            res.json({
                success: true,
                message: `Review ${isActive ? 'approved' : 'rejected'} successfully`
            });
        } catch (error) {
            console.error('Error toggling review status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update review status',
                details: error.message
            });
        }
    });
    
    // Delete review
    router.delete('/api/admin/reviews/:reviewId', async (req, res) => {
        try {
            const reviewId = parseInt(req.params.reviewId);
            
            await pool.request()
                .input('reviewId', sql.Int, reviewId)
                .query(`
                    DELETE FROM ProductReviews 
                    WHERE ReviewID = @reviewId
                `);
            
            res.json({
                success: true,
                message: 'Review deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete review',
                details: error.message
            });
        }
    });

    // --- Test endpoint to verify sold quantities ---
    router.get('/api/test/sold-quantities', async (req, res) => {
        try {
            await pool.connect();
            
            // Test query to check sold quantities calculation
            const testQuery = `
                SELECT 
                    p.ProductID,
                    p.Name,
                    p.StockQuantity,
                    COALESCE(sold.soldQuantity, 0) as soldQuantity,
                    sold.orderCount
                FROM Products p
                LEFT JOIN (
                    SELECT 
                        oi.ProductID,
                        SUM(oi.Quantity) as soldQuantity,
                        COUNT(DISTINCT oi.OrderID) as orderCount
                    FROM OrderItems oi
                    INNER JOIN Orders o ON oi.OrderID = o.OrderID
                    WHERE o.Status = 'Completed'
                    GROUP BY oi.ProductID
                ) sold ON p.ProductID = sold.ProductID
                WHERE p.IsActive = 1
                ORDER BY sold.soldQuantity DESC, p.Name
            `;
            
            const result = await pool.request().query(testQuery);
            
            // Also get completed orders count
            const completedOrdersQuery = `
                SELECT COUNT(*) as completedOrdersCount
                FROM Orders 
                WHERE Status = 'Completed'
            `;
            const completedOrdersResult = await pool.request().query(completedOrdersQuery);
            
            res.json({
                success: true,
                soldQuantities: result.recordset,
                completedOrdersCount: completedOrdersResult.recordset[0].completedOrdersCount,
                message: 'Sold quantities test data retrieved successfully'
            });
        } catch (err) {
            console.error('Error testing sold quantities:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to test sold quantities', 
                details: err.message 
            });
        }
    });

    // --- Products API for Frontend ---
    // Get all products
    router.get('/api/products', async (req, res) => {
        try {
            // First check if ProductReviews table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductReviews'
            `);
            
            // Also check if ProductDiscounts table exists
            const discountTableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductDiscounts'
            `);
            
            // Check if IsFeatured column exists
            const featuredColumnCheck = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'IsFeatured'
            `);
            
            console.log('ProductReviews table exists:', tableCheck.recordset.length > 0);
            console.log('ProductDiscounts table exists:', discountTableCheck.recordset.length > 0);
            console.log('IsFeatured column exists:', featuredColumnCheck.recordset.length > 0);
            
            let query;
            const hasIsFeatured = featuredColumnCheck.recordset.length > 0;
            
            if (tableCheck.recordset.length > 0) {
                // ProductReviews table exists, use the full query with ratings and discounts
                query = `
                    SELECT 
                        p.ProductID as id,
                        p.PublicId as publicId,
                        p.Slug as slug,
                        p.SKU as sku,
                        p.Name as name,
                        p.Description as description,
                        p.Price as price,
                        p.StockQuantity as stockQuantity,
                        p.Category as categoryName,
                        p.ImageURL as images,
                        p.ThumbnailURLs as thumbnails,
                        p.DateAdded as dateAdded,
                        p.IsActive as isActive,
                        p.Dimensions as specifications,
                        p.IsFeatured as featured,
                        p.Model3DURL as model3d,
                        p.Has3DModel as has3dModel,
                        COALESCE(AVG(CAST(pr.Rating AS FLOAT)), 0) as averageRating,
                        COUNT(pr.ReviewID) as reviewCount,
                        pd.DiscountID,
                        pd.DiscountType,
                        pd.DiscountValue,
                        pd.StartDate as discountStartDate,
                        pd.EndDate as discountEndDate,
                        COALESCE(sold.soldQuantity, 0) as soldQuantity,
                        CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price - (p.Price * pd.DiscountValue / 100)
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                            ELSE p.Price
                        END as discountedPrice,
                        CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price * pd.DiscountValue / 100
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
                            ELSE 0
                        END as discountAmount
                    FROM Products p
                    LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
                    LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                        AND pd.IsActive = 1 
                        AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
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
                    GROUP BY 
                        p.ProductID, p.PublicId, p.Slug, p.SKU, p.Name, p.Description, p.Price, p.StockQuantity, 
                        p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                        p.Model3DURL, p.Has3DModel,
                        pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate,
                        sold.soldQuantity
                    ORDER BY p.IsFeatured DESC, p.DateAdded DESC
                `;
            } else {
                // ProductReviews table doesn't exist, use basic query with discounts
                query = `
                    SELECT 
                        p.ProductID as id,
                        p.PublicId as publicId,
                        p.Slug as slug,
                        p.SKU as sku,
                        p.Name as name,
                        p.Description as description,
                        p.Price as price,
                        p.StockQuantity as stockQuantity,
                        p.Category as categoryName,
                        p.ImageURL as images,
                        p.ThumbnailURLs as thumbnails,
                        p.DateAdded as dateAdded,
                        p.IsActive as isActive,
                        p.Dimensions as specifications,
                        p.IsFeatured as featured,
                        p.Model3DURL as model3d,
                        p.Has3DModel as has3dModel,
                        0 as averageRating,
                        0 as reviewCount,
                        pd.DiscountID,
                        pd.DiscountType,
                        pd.DiscountValue,
                        pd.StartDate as discountStartDate,
                        pd.EndDate as discountEndDate,
                        COALESCE(sold.soldQuantity, 0) as soldQuantity,
                        CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price - (p.Price * pd.DiscountValue / 100)
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                            ELSE p.Price
                        END as discountedPrice,
                        CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price * pd.DiscountValue / 100
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
                            ELSE 0
                        END as discountAmount
                    FROM Products p
                    LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                        AND pd.IsActive = 1 
                        AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
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
                    ORDER BY p.IsFeatured DESC, p.DateAdded DESC
                `;
            }
            
            console.log('Executing query:', query.substring(0, 100) + '...');
            console.log('Query includes soldQuantity:', query.includes('soldQuantity'));
            console.log('Full query:', query);
            
            let result;
            try {
                result = await pool.request().query(query);
                console.log('Query executed successfully. Records returned:', result.recordset.length);
                console.log('First product sample:', result.recordset[0]);
                console.log('First product keys:', Object.keys(result.recordset[0] || {}));
            } catch (queryError) {
                console.error('Complex query failed, trying simple fallback:', queryError.message);
                
                // Fallback to simple query without discounts
                const fallbackQuery = `
                    SELECT 
                        p.ProductID as id,
                        p.PublicId as publicId,
                        p.Slug as slug,
                        p.SKU as sku,
                        p.Name as name,
                        p.Description as description,
                        p.Price as price,
                        p.StockQuantity as stockQuantity,
                        p.Category as categoryName,
                        p.ImageURL as images,
                        p.DateAdded as dateAdded,
                        p.IsActive as isActive,
                        p.Dimensions as specifications,
                        p.IsFeatured as featured,
                        p.Model3DURL as model3d,
                        p.Has3DModel as has3dModel,
                        COALESCE(sold.soldQuantity, 0) as soldQuantity,
                        0 as averageRating,
                        0 as reviewCount,
                        NULL as DiscountID,
                        NULL as DiscountType,
                        NULL as DiscountValue,
                        NULL as discountStartDate,
                        NULL as discountEndDate,
                        p.Price as discountedPrice,
                        0 as discountAmount
                    FROM Products p
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
                    ORDER BY p.IsFeatured DESC, p.DateAdded DESC
                `;
                
                console.log('Executing fallback query...');
                result = await pool.request().query(fallbackQuery);
                console.log('Fallback query executed. Records returned:', result.recordset.length);
            }
            
            // Process images - convert single image URL to array
            console.log('First product before processing:', result.recordset[0]);
            console.log('First product soldQuantity:', result.recordset[0]?.soldQuantity);
            const products = result.recordset.map(product => {
                let specifications = {};
                
                // Safely parse specifications JSON
                if (product.specifications && product.specifications.trim()) {
                    try {
                        specifications = JSON.parse(product.specifications);
                    } catch (parseError) {
                        console.warn(`Failed to parse specifications for product ${product.id}:`, parseError.message);
                        // If JSON parsing fails, try to create a basic specification object
                        specifications = {
                            dimensions: product.specifications,
                            note: 'Specifications data may be incomplete'
                        };
                    }
                }
                
                // Process discount information
                const hasDiscount = product.DiscountID && product.DiscountType && product.DiscountValue;
                const discountInfo = hasDiscount ? {
                    discountId: product.DiscountID,
                    discountType: product.DiscountType,
                    discountValue: product.DiscountValue,
                    startDate: product.discountStartDate,
                    endDate: product.discountEndDate,
                    discountedPrice: product.discountedPrice,
                    discountAmount: product.discountAmount
                } : null;

                // Process thumbnails - parse JSON string to array
                let thumbnails = [];
                if (product.thumbnails && product.thumbnails.trim()) {
                    try {
                        thumbnails = JSON.parse(product.thumbnails);
                    } catch (parseError) {
                        console.warn(`Failed to parse thumbnails for product ${product.id}:`, parseError.message);
                        thumbnails = [];
                    }
                }

                return {
                    ...product,
                    images: product.images ? [product.images] : [],
                    thumbnails: thumbnails,
                    specifications: specifications,
                    rating: Math.round(product.averageRating * 10) / 10,
                    reviews: product.reviewCount || 0,
                    soldQuantity: product.soldQuantity || 0,
                    hasDiscount: !!hasDiscount,
                    discountInfo: discountInfo
                };
            });
            
            console.log('Products processed successfully. Final count:', products.length);
            
            res.json({
                success: true,
                products: products
            });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch products', 
                details: err.message 
            });
        }
    });

    // Simple test endpoint to check basic products
    router.get('/api/products/test', async (req, res) => {
        try {
            console.log('Testing basic products query...');
            
            // Simple query to check if Products table has data
            const result = await pool.request().query(`
                SELECT TOP 5
                    ProductID as id,
                    Name as name,
                    Price as price,
                    Category as categoryName,
                    IsActive as isActive
                FROM Products
            `);
            
            console.log('Basic test query returned:', result.recordset.length, 'records');
            
            res.json({
                success: true,
                message: 'Basic products test successful',
                count: result.recordset.length,
                sample: result.recordset[0] || null
            });
        } catch (err) {
            console.error('Basic products test failed:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Basic products test failed', 
                details: err.message 
            });
        }
    });

    // Setup thumbnails endpoint - adds ThumbnailURLs column and test data
    router.post('/api/setup-thumbnails', async (req, res) => {
        try {
            await pool.connect();
            
            // Add ThumbnailURLs column if it doesn't exist
            console.log('Adding ThumbnailURLs column...');
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
                ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
            `);
            
            // Add test thumbnail data to the first product
            const testThumbnails = [
                '/uploads/test-thumbnail-1.jpg',
                '/uploads/test-thumbnail-2.jpg',
                '/uploads/test-thumbnail-3.jpg',
                '/uploads/test-thumbnail-4.jpg'
            ];
            
            console.log('Adding test thumbnail data...');
            await pool.request()
                .input('thumbnails', sql.NVarChar, JSON.stringify(testThumbnails))
                .query(`
                    UPDATE TOP (1) Products 
                    SET ThumbnailURLs = @thumbnails 
                    WHERE IsActive = 1
                `);
            
            res.json({
                success: true,
                message: 'ThumbnailURLs column added and test data inserted',
                testThumbnails: testThumbnails
            });
            
        } catch (err) {
            console.error('Error setting up thumbnails:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to setup thumbnails', 
                details: err.message 
            });
        }
    });

    // Search products
    router.get('/api/products/search', async (req, res) => {
        try {
            const { q: query, category, minPrice, maxPrice, featured } = req.query;
            
            if (!query || query.trim().length < 2) {
                return res.json({
                    success: true,
                    products: []
                });
            }
            
            await pool.connect();
            
            let sqlQuery = `
                SELECT 
                    ProductID as id,
                    Name as name,
                    Description as description,
                    Price as price,
                    StockQuantity as stockQuantity,
                    Category as categoryName,
                    ImageURL as images,
                    DateAdded as dateAdded,
                    IsActive as isActive,
                    Dimensions as specifications,
                    IsFeatured as featured
                FROM Products 
                WHERE IsActive = 1
            `;
            
            const params = [];
            let paramCount = 1;
            
            // Add search conditions
            sqlQuery += ` AND (Name LIKE @param${paramCount} OR Description LIKE @param${paramCount} OR Category LIKE @param${paramCount})`;
            params.push(`%${query.trim()}%`);
            paramCount++;
            
            // Add category filter
            if (category) {
                sqlQuery += ` AND Category = @param${paramCount}`;
                params.push(category);
                paramCount++;
            }
            
            // Add price range filter
            if (minPrice) {
                sqlQuery += ` AND Price >= @param${paramCount}`;
                params.push(parseFloat(minPrice));
                paramCount++;
            }
            
            if (maxPrice) {
                sqlQuery += ` AND Price <= @param${paramCount}`;
                params.push(parseFloat(maxPrice));
                paramCount++;
            }
            
            // Add featured filter
            if (featured === 'true') {
                sqlQuery += ` AND IsFeatured = 1`;
            }
            
            // Add ordering
            sqlQuery += ` ORDER BY 
                CASE 
                    WHEN Name LIKE @param1 THEN 1
                    WHEN Name LIKE @param1 + '%' THEN 2
                    WHEN Category = @param1 THEN 3
                    ELSE 4
                END,
                IsFeatured DESC,
                DateAdded DESC
            `;
            
            // Limit results for search suggestions
            sqlQuery += ` OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY`;
            
            const request = pool.request();
            params.forEach((param, index) => {
                request.input(`param${index + 1}`, sql.NVarChar, param);
            });
            
            const result = await request.query(sqlQuery);
            
            // Process images - convert single image URL to array
            const products = result.recordset.map(product => {
                let specifications = {};
                
                // Safely parse specifications JSON
                if (product.specifications && product.specifications.trim()) {
                    try {
                        specifications = JSON.parse(product.specifications);
                    } catch (parseError) {
                        console.warn(`Failed to parse specifications for product ${product.id}:`, parseError.message);
                        specifications = {
                            dimensions: product.specifications,
                            note: 'Specifications data may be incomplete'
                        };
                    }
                }
                
                return {
                    ...product,
                    images: product.images ? [product.images] : [],
                    specifications: specifications
                };
            });
            
            res.json({
                success: true,
                products: products,
                query: query,
                total: products.length
            });
            
        } catch (err) {
            console.error('Error searching products:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to search products', 
                details: err.message 
            });
        }
    });

    // Get product by ID (supports UUID, slug, and legacy numeric ID for backward compatibility)
    router.get('/api/products/:id', async (req, res) => {
        try {
            const identifier = req.params.id;
            
            // Determine if identifier is UUID, slug, SKU, or legacy numeric ID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
            const isNumeric = /^\d+$/.test(identifier);
            const isSKU = /^DX-[A-F0-9]{8}-[0-9]{4}$/i.test(identifier);
            
            // First check if ProductReviews table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductReviews'
            `);
            
            let query, inputParam;
            if (isUUID) {
                inputParam = sql.UniqueIdentifier;
                if (tableCheck.recordset.length > 0) {
                    // ProductReviews table exists, use the full query with ratings
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel,
                            COALESCE(AVG(CAST(pr.Rating AS FLOAT)), 0) as averageRating,
                            COUNT(pr.ReviewID) as reviewCount,
                            pd.DiscountID,
                            pd.DiscountType,
                            pd.DiscountValue,
                            pd.StartDate as discountStartDate,
                            pd.EndDate as discountEndDate,
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
                        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
                        LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID AND pd.IsActive = 1
                        WHERE p.PublicId = @identifier AND p.IsActive = 1
                        GROUP BY 
                            p.ProductID, p.PublicId, p.Slug, p.SKU, p.Name, p.Description, p.Price, p.StockQuantity, 
                            p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                            p.Model3DURL, p.Has3DModel,
                            pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate
                    `;
                } else {
                    // ProductReviews table doesn't exist, use basic query
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel
                        FROM Products p
                        WHERE p.PublicId = @identifier AND p.IsActive = 1
                    `;
                }
            } else if (isNumeric) {
                // Legacy support for numeric IDs - map to ProductID
                inputParam = sql.Int;
                if (tableCheck.recordset.length > 0) {
                    // ProductReviews table exists, use the full query with ratings
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel,
                            COALESCE(AVG(CAST(pr.Rating AS FLOAT)), 0) as averageRating,
                            COUNT(pr.ReviewID) as reviewCount,
                            pd.DiscountID,
                            pd.DiscountType,
                            pd.DiscountValue,
                            pd.StartDate as discountStartDate,
                            pd.EndDate as discountEndDate,
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
                        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
                        LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID AND pd.IsActive = 1
                        WHERE p.ProductID = @identifier AND p.IsActive = 1
                        GROUP BY 
                            p.ProductID, p.PublicId, p.Slug, p.SKU, p.Name, p.Description, p.Price, p.StockQuantity, 
                            p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                            p.Model3DURL, p.Has3DModel,
                            pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate
                    `;
                } else {
                    // ProductReviews table doesn't exist, use basic query
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel
                        FROM Products p
                        WHERE p.ProductID = @identifier AND p.IsActive = 1
                    `;
                }
            } else if (isSKU) {
                // SKU identifier
                inputParam = sql.NVarChar;
                if (tableCheck.recordset.length > 0) {
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel,
                            COALESCE(AVG(CAST(pr.Rating AS FLOAT)), 0) as averageRating,
                            COUNT(pr.ReviewID) as reviewCount,
                            pd.DiscountID,
                            pd.DiscountType,
                            pd.DiscountValue,
                            pd.StartDate as discountStartDate,
                            pd.EndDate as discountEndDate,
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
                        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
                        LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID AND pd.IsActive = 1
                        WHERE p.SKU = @identifier AND p.IsActive = 1
                        GROUP BY 
                            p.ProductID, p.PublicId, p.Slug, p.SKU, p.Name, p.Description, p.Price, p.StockQuantity, 
                            p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                            p.Model3DURL, p.Has3DModel,
                            pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate
                    `;
                } else {
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel
                        FROM Products p
                        WHERE p.SKU = @identifier AND p.IsActive = 1
                    `;
                }
            } else {
                // Assume it's a slug
                inputParam = sql.NVarChar;
                if (tableCheck.recordset.length > 0) {
                    // ProductReviews table exists, use the full query with ratings
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel,
                            COALESCE(AVG(CAST(pr.Rating AS FLOAT)), 0) as averageRating,
                            COUNT(pr.ReviewID) as reviewCount,
                            pd.DiscountID,
                            pd.DiscountType,
                            pd.DiscountValue,
                            pd.StartDate as discountStartDate,
                            pd.EndDate as discountEndDate,
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
                        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
                        LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID AND pd.IsActive = 1
                        WHERE p.Slug = @identifier AND p.IsActive = 1
                        GROUP BY 
                            p.ProductID, p.PublicId, p.Slug, p.SKU, p.Name, p.Description, p.Price, p.StockQuantity, 
                            p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                            p.Model3DURL, p.Has3DModel,
                            pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate
                    `;
                } else {
                    // ProductReviews table doesn't exist, use basic query
                    query = `
                        SELECT 
                            p.PublicId as id,
                            p.Slug as slug,
                            p.SKU as sku,
                            p.Name as name,
                            p.Description as description,
                            p.Price as price,
                            p.StockQuantity as stockQuantity,
                            p.Category as categoryName,
                            p.ImageURL as images,
                            p.ThumbnailURLs as thumbnails,
                            p.DateAdded as dateAdded,
                            p.IsActive as isActive,
                            p.Dimensions as specifications,
                            p.IsFeatured as featured,
                            p.Model3DURL as model3d,
                            p.Has3DModel as has3dModel
                        FROM Products p
                        WHERE p.Slug = @identifier AND p.IsActive = 1
                    `;
                }
            }
            
            const result = await pool.request()
                .input('identifier', inputParam, identifier)
                .query(query);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            const product = result.recordset[0];
            
            // Process images - convert single image URL to array
            product.images = product.images ? [product.images] : [];
            
            // Process thumbnails - parse JSON string to array
            let thumbnails = [];
            if (product.thumbnails && product.thumbnails.trim()) {
                try {
                    thumbnails = JSON.parse(product.thumbnails);
                } catch (parseError) {
                    console.warn(`Failed to parse thumbnails for product ${product.id}:`, parseError.message);
                    thumbnails = [];
                }
            }
            product.thumbnails = thumbnails;
            
            // Safely parse specifications JSON
            let specifications = {};
            if (product.specifications && product.specifications.trim()) {
                try {
                    specifications = JSON.parse(product.specifications);
                } catch (parseError) {
                    console.warn(`Failed to parse specifications for product ${product.id}:`, parseError.message);
                    // If JSON parsing fails, try to create a basic specification object
                    specifications = {
                        dimensions: product.specifications,
                        note: 'Specifications data may be incomplete'
                    };
                }
            }
            product.specifications = specifications;
            
            // Add rating and review data
            product.rating = Math.round(product.averageRating * 10) / 10;
            product.reviews = product.reviewCount || 0;
            
            // Add discount information
            product.hasDiscount = !!product.DiscountID;
            product.discountInfo = product.DiscountID ? {
                discountType: product.DiscountType,
                discountValue: product.DiscountValue,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                discountedPrice: product.discountedPrice,
                discountAmount: product.discountAmount
            } : null;
            
            res.json({
                success: true,
                product: product
            });
        } catch (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch product', 
                details: err.message 
            });
        }
    });

    // Get product variations by product ID
    router.get('/api/products/:productId/variations', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            
            // Check if ProductVariations table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductVariations'
            `);
            
            if (tableCheck.recordset.length === 0) {
                console.log('ProductVariations table does not exist');
                return res.json({
                    success: true,
                    variations: []
                });
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, productId)
                .query(`
                    SELECT 
                        pv.VariationID as id,
                        pv.ProductID as productId,
                        pv.VariationName as name,
                        pv.Color as color,
                        pv.Quantity as quantity,
                        pv.VariationImageURL as imageUrl,
                        pv.CreatedAt as createdAt,
                        pv.UpdatedAt as updatedAt,
                        pv.IsActive as isActive
                    FROM ProductVariations pv
                    INNER JOIN Products p ON pv.ProductID = p.ProductID
                    WHERE pv.ProductID = @productID 
                    AND pv.IsActive = 1 
                    AND p.IsActive = 1
                    ORDER BY pv.CreatedAt DESC
                `);
            
            
            // Process variations data (keep imageUrl relative so frontend/proxy can resolve)
            const variations = result.recordset.map(variation => ({
                ...variation,
                imageUrl: variation.imageUrl || null
            }));
            
            res.json({
                success: true,
                variations: variations
            });
        } catch (err) {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch variations', 
                details: err.message 
            });
        }
    });

    // --- Review Settings CMS API Endpoints ---
    
    // Get review settings
    router.get('/api/cms/review-settings', async (req, res) => {
        try {
            await pool.connect();
            
            // Check if ReviewSettings table exists, if not create it
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ReviewSettings'
            `);
            
            if (tableCheck.recordset.length === 0) {
                // Create ReviewSettings table
                await pool.request().query(`
                    CREATE TABLE ReviewSettings (
                        ID INT IDENTITY(1,1) PRIMARY KEY,
                        SectionTitle NVARCHAR(255) DEFAULT 'Customer Reviews',
                        SectionSubtitle NVARCHAR(500) DEFAULT 'See what our customers are saying about this product',
                        EmptyMessage NVARCHAR(500) DEFAULT 'No reviews yet. Be the first to review this product!',
                        FormTitle NVARCHAR(255) DEFAULT 'Add your review',
                        FormNote NVARCHAR(500) DEFAULT 'Your email address will not be published. Required fields are marked*',
                        LoginPrompt NVARCHAR(500) DEFAULT 'Please login to leave a review.',
                        ReviewsPerPage INT DEFAULT 4,
                        DefaultSort NVARCHAR(50) DEFAULT 'newest',
                        EnableImageUploads BIT DEFAULT 1,
                        RequireVerification BIT DEFAULT 0,
                        AutoApproveReviews BIT DEFAULT 1,
                        EnableReviewFlagging BIT DEFAULT 1,
                        MinReviewLength INT DEFAULT 10,
                        DateCreated DATETIME DEFAULT GETDATE(),
                        DateUpdated DATETIME DEFAULT GETDATE()
                    )
                `);
                
                // Insert default settings
                await pool.request().query(`
                    INSERT INTO ReviewSettings DEFAULT VALUES
                `);
            }
            
            // Get current settings
            const result = await pool.request().query(`
                SELECT TOP 1 * FROM ReviewSettings ORDER BY DateUpdated DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    success: true,
                    settings: {
                        sectionTitle: settings.SectionTitle,
                        sectionSubtitle: settings.SectionSubtitle,
                        emptyMessage: settings.EmptyMessage,
                        formTitle: settings.FormTitle,
                        formNote: settings.FormNote,
                        loginPrompt: settings.LoginPrompt,
                        reviewsPerPage: settings.ReviewsPerPage,
                        defaultSort: settings.DefaultSort,
                        enableImageUploads: settings.EnableImageUploads,
                        requireVerification: settings.RequireVerification,
                        autoApproveReviews: settings.AutoApproveReviews,
                        enableReviewFlagging: settings.EnableReviewFlagging,
                        minReviewLength: settings.MinReviewLength
                    }
                });
            } else {
                res.json({
                    success: true,
                    settings: {
                        sectionTitle: 'Customer Reviews',
                        sectionSubtitle: 'See what our customers are saying about this product',
                        emptyMessage: 'No reviews yet. Be the first to review this product!',
                        formTitle: 'Add your review',
                        formNote: 'Your email address will not be published. Required fields are marked*',
                        loginPrompt: 'Please login to leave a review.',
                        reviewsPerPage: 4,
                        defaultSort: 'newest',
                        enableImageUploads: true,
                        requireVerification: false,
                        autoApproveReviews: true,
                        enableReviewFlagging: true,
                        minReviewLength: 10
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching review settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch review settings',
                details: error.message
            });
        }
    });
    
    // Save review settings
    router.post('/api/cms/review-settings', async (req, res) => {
        try {
            const {
                sectionTitle,
                sectionSubtitle,
                emptyMessage,
                formTitle,
                formNote,
                loginPrompt,
                reviewsPerPage,
                defaultSort,
                enableImageUploads,
                requireVerification,
                autoApproveReviews,
                enableReviewFlagging,
                minReviewLength
            } = req.body;
            
            await pool.connect();
            
            // Check if ReviewSettings table exists, if not create it
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ReviewSettings'
            `);
            
            if (tableCheck.recordset.length === 0) {
                // Create ReviewSettings table
                await pool.request().query(`
                    CREATE TABLE ReviewSettings (
                        ID INT IDENTITY(1,1) PRIMARY KEY,
                        SectionTitle NVARCHAR(255) DEFAULT 'Customer Reviews',
                        SectionSubtitle NVARCHAR(500) DEFAULT 'See what our customers are saying about this product',
                        EmptyMessage NVARCHAR(500) DEFAULT 'No reviews yet. Be the first to review this product!',
                        FormTitle NVARCHAR(255) DEFAULT 'Add your review',
                        FormNote NVARCHAR(500) DEFAULT 'Your email address will not be published. Required fields are marked*',
                        LoginPrompt NVARCHAR(500) DEFAULT 'Please login to leave a review.',
                        ReviewsPerPage INT DEFAULT 4,
                        DefaultSort NVARCHAR(50) DEFAULT 'newest',
                        EnableImageUploads BIT DEFAULT 1,
                        RequireVerification BIT DEFAULT 0,
                        AutoApproveReviews BIT DEFAULT 1,
                        EnableReviewFlagging BIT DEFAULT 1,
                        MinReviewLength INT DEFAULT 10,
                        DateCreated DATETIME DEFAULT GETDATE(),
                        DateUpdated DATETIME DEFAULT GETDATE()
                    )
                `);
            }
            
            // Check if settings exist
            const existingSettings = await pool.request().query(`
                SELECT ID FROM ReviewSettings
            `);
            
            if (existingSettings.recordset.length > 0) {
                // Update existing settings
                await pool.request()
                    .input('sectionTitle', sql.NVarChar, sectionTitle)
                    .input('sectionSubtitle', sql.NVarChar, sectionSubtitle)
                    .input('emptyMessage', sql.NVarChar, emptyMessage)
                    .input('formTitle', sql.NVarChar, formTitle)
                    .input('formNote', sql.NVarChar, formNote)
                    .input('loginPrompt', sql.NVarChar, loginPrompt)
                    .input('reviewsPerPage', sql.Int, reviewsPerPage)
                    .input('defaultSort', sql.NVarChar, defaultSort)
                    .input('enableImageUploads', sql.Bit, enableImageUploads)
                    .input('requireVerification', sql.Bit, requireVerification)
                    .input('autoApproveReviews', sql.Bit, autoApproveReviews)
                    .input('enableReviewFlagging', sql.Bit, enableReviewFlagging)
                    .input('minReviewLength', sql.Int, minReviewLength)
                    .query(`
                        UPDATE ReviewSettings SET
                            SectionTitle = @sectionTitle,
                            SectionSubtitle = @sectionSubtitle,
                            EmptyMessage = @emptyMessage,
                            FormTitle = @formTitle,
                            FormNote = @formNote,
                            LoginPrompt = @loginPrompt,
                            ReviewsPerPage = @reviewsPerPage,
                            DefaultSort = @defaultSort,
                            EnableImageUploads = @enableImageUploads,
                            RequireVerification = @requireVerification,
                            AutoApproveReviews = @autoApproveReviews,
                            EnableReviewFlagging = @enableReviewFlagging,
                            MinReviewLength = @minReviewLength,
                            DateUpdated = GETDATE()
                    `);
            } else {
                // Insert new settings
                await pool.request()
                    .input('sectionTitle', sql.NVarChar, sectionTitle)
                    .input('sectionSubtitle', sql.NVarChar, sectionSubtitle)
                    .input('emptyMessage', sql.NVarChar, emptyMessage)
                    .input('formTitle', sql.NVarChar, formTitle)
                    .input('formNote', sql.NVarChar, formNote)
                    .input('loginPrompt', sql.NVarChar, loginPrompt)
                    .input('reviewsPerPage', sql.Int, reviewsPerPage)
                    .input('defaultSort', sql.NVarChar, defaultSort)
                    .input('enableImageUploads', sql.Bit, enableImageUploads)
                    .input('requireVerification', sql.Bit, requireVerification)
                    .input('autoApproveReviews', sql.Bit, autoApproveReviews)
                    .input('enableReviewFlagging', sql.Bit, enableReviewFlagging)
                    .input('minReviewLength', sql.Int, minReviewLength)
                    .query(`
                        INSERT INTO ReviewSettings (
                            SectionTitle, SectionSubtitle, EmptyMessage, FormTitle, FormNote,
                            LoginPrompt, ReviewsPerPage, DefaultSort, EnableImageUploads,
                            RequireVerification, AutoApproveReviews, EnableReviewFlagging, MinReviewLength
                        ) VALUES (
                            @sectionTitle, @sectionSubtitle, @emptyMessage, @formTitle, @formNote,
                            @loginPrompt, @reviewsPerPage, @defaultSort, @enableImageUploads,
                            @requireVerification, @autoApproveReviews, @enableReviewFlagging, @minReviewLength
                        )
                    `);
            }
            
            res.json({
                success: true,
                message: 'Review settings saved successfully'
            });
            
        } catch (error) {
            console.error('Error saving review settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save review settings',
                details: error.message
            });
        }
    });

    // --- Filter Data API Endpoints ---
    
    // Get all distinct categories for filtering (public endpoint)
    router.get('/api/public/categories', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT DISTINCT Category as name, COUNT(*) as count
                FROM Products 
                WHERE Category IS NOT NULL AND Category <> '' AND IsActive = 1
                GROUP BY Category
                ORDER BY Category
            `);
            
            const categories = result.recordset.map(row => ({
                name: row.name,
                count: row.count
            }));
            
            res.json({ 
                success: true, 
                categories: categories 
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch categories',
                details: err.message 
            });
        }
    });

    // Get all distinct materials for filtering (public endpoint)
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
        } catch (err) {
            console.error('Error fetching materials:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch materials',
                details: err.message 
            });
        }
    });

    // Get price range data for filtering (public endpoint)
    router.get('/api/public/price-range', async (req, res) => {
        try {
            await pool.connect();
            
            // Check if ProductDiscounts table exists
            const discountTableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductDiscounts'
            `);
            
            let query;
            if (discountTableCheck.recordset.length > 0) {
                // Include discounted prices in calculation
                query = `
                    SELECT 
                        MIN(CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price - (p.Price * pd.DiscountValue / 100)
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                            ELSE p.Price
                        END) as minPrice,
                        MAX(CASE 
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'percentage' THEN 
                                p.Price - (p.Price * pd.DiscountValue / 100)
                            WHEN pd.DiscountID IS NOT NULL AND pd.DiscountType = 'fixed' THEN 
                                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                            ELSE p.Price
                        END) as maxPrice
                    FROM Products p
                    LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
                        AND pd.IsActive = 1 
                        AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
                    WHERE p.IsActive = 1
                `;
            } else {
                // Simple price range without discounts
                query = `
                    SELECT 
                        MIN(Price) as minPrice,
                        MAX(Price) as maxPrice
                    FROM Products 
                    WHERE IsActive = 1
                `;
            }
            
            const result = await pool.request().query(query);
            const priceData = result.recordset[0];
            
            // Round to nearest 100 for better UX
            const minPrice = Math.floor((priceData.minPrice || 0) / 100) * 100;
            const maxPrice = Math.ceil((priceData.maxPrice || 1000) / 100) * 100;
            
            res.json({ 
                success: true, 
                priceRange: {
                    min: minPrice,
                    max: maxPrice,
                    currency: 'PHP'
                }
            });
        } catch (err) {
            console.error('Error fetching price range:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch price range',
                details: err.message 
            });
        }
    });

    // Get stock status data for filtering (public endpoint)
    router.get('/api/public/stock-status', async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    SUM(CASE WHEN StockQuantity > 0 THEN 1 ELSE 0 END) as inStockCount,
                    SUM(CASE WHEN StockQuantity = 0 THEN 1 ELSE 0 END) as outOfStockCount,
                    COUNT(*) as totalProducts
                FROM Products 
                WHERE IsActive = 1
            `);
            
            const stockData = result.recordset[0];
            
            res.json({ 
                success: true, 
                stockStatus: {
                    inStock: stockData.inStockCount || 0,
                    outOfStock: stockData.outOfStockCount || 0,
                    total: stockData.totalProducts || 0
                }
            });
        } catch (err) {
            console.error('Error fetching stock status:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch stock status',
                details: err.message 
            });
        }
    });

    // --- Simple test endpoint for sold quantities ---
    router.get('/api/test/sold-simple', async (req, res) => {
        try {
            await pool.connect();
            
            const query = `
                SELECT 
                    p.ProductID as id,
                    p.Name as name,
                    COALESCE(sold.soldQuantity, 0) as soldQuantity
                FROM Products p
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
                ORDER BY p.ProductID
            `;
            
            const result = await pool.request().query(query);
            
            res.json({
                success: true,
                products: result.recordset,
                message: 'Simple sold quantities test'
            });
        } catch (err) {
            console.error('Error testing sold quantities:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to test sold quantities', 
                details: err.message 
            });
        }
    });

    // --- Contact Messages Management Endpoints ---
    // GET /api/admin/contact-messages - Fetch all contact messages
    router.get('/api/admin/contact-messages', async (req, res) => {
        try {
            const filter = req.query.filter || 'all';
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            let whereClause = '';
            // Since there's no Status column, we'll return all messages for now
            // TODO: Add Status column to ContactSubmissions table if needed
            whereClause = '';
            
            // First get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ContactSubmissions
                ${whereClause}
            `;
            
            const countResult = await pool.request().query(countQuery);
            const total = countResult.recordset[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Get messages with pagination
            const query = `
                SELECT 
                    Id as id,
                    Name as name,
                    Email as email,
                    Message as message,
                    SubmittedAt as submissionDate,
                    'New' as status,
                    SubmittedAt as createdAt,
                    SubmittedAt as updatedAt
                FROM ContactSubmissions
                ${whereClause}
                ORDER BY SubmittedAt DESC
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;
            
            const result = await pool.request().query(query);
            
            res.json({
                success: true,
                messages: result.recordset,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            console.error('Error fetching contact messages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch contact messages',
                details: error.message
            });
        }
    });
    
    // PUT /api/admin/contact-messages/:id/status - Update message status
    router.put('/api/admin/contact-messages/:id/status', async (req, res) => {
        try {
            const messageId = parseInt(req.params.id);
            const { status } = req.body;
            
            // Since there's no Status column, we'll just return success for now
            // TODO: Add Status column to ContactSubmissions table if needed
            
            res.json({
                success: true,
                message: `Message status would be updated to ${status} (Status column not available)`
            });
        } catch (error) {
            console.error('Error updating message status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update message status',
                details: error.message
            });
        }
    });
    
    // DELETE /api/admin/contact-messages/:id - Delete message
    router.delete('/api/admin/contact-messages/:id', async (req, res) => {
        try {
            const messageId = parseInt(req.params.id);
            
            await pool.request()
                .input('messageId', sql.Int, messageId)
                .query(`
                    DELETE FROM ContactSubmissions 
                    WHERE Id = @messageId
                `);
            
            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete message',
                details: error.message
            });
        }
    });

    // --- Contact Form Submission Endpoint ---
    // POST /api/contact/submit - Handle contact form submissions
    router.post('/api/contact/submit', async (req, res) => {
        try {
            const { name, email, message } = req.body;
            
            // Validate required fields
            if (!name || !email || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }
            
            // Check if ContactSubmissions table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ContactSubmissions'
            `);
            
            if (tableCheck.recordset.length === 0) {
                // Create the table if it doesn't exist
                await pool.request().query(`
                    CREATE TABLE ContactSubmissions (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(100) NOT NULL,
                        Email NVARCHAR(255) NOT NULL,
                        Message NVARCHAR(MAX) NOT NULL,
                        SubmittedAt DATETIME NOT NULL DEFAULT GETDATE()
                    );
                `);
            }
            
            // Insert the contact submission
            const result = await pool.request()
                .input('name', sql.NVarChar, name.trim())
                .input('email', sql.NVarChar, email.trim())
                .input('message', sql.NVarChar, message.trim())
                .query(`
                    INSERT INTO ContactSubmissions (Name, Email, Message)
                    OUTPUT INSERTED.Id
                    VALUES (@name, @email, @message)
                `);
            
            const submissionId = result.recordset[0].Id;
            
            console.log(`New contact submission received: ID ${submissionId} from ${name} (${email})`);
            
            res.json({
                success: true,
                message: 'Thank you for your message! We will get back to you soon.',
                submissionId: submissionId
            });
            
        } catch (error) {
            console.error('Error processing contact submission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit your message. Please try again later.'
            });
        }
    });

    // --- Theme Management Endpoints ---
    // GET /api/theme/active - Get current active theme
    router.get('/api/theme/active', async (req, res) => {
        try {
            // Check if ThemeSettings table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ThemeSettings'
            `);
            
            if (tableCheck.recordset.length === 0) {
                // Create the table if it doesn't exist
                await pool.request().query(`
                    CREATE TABLE ThemeSettings (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        ActiveTheme NVARCHAR(50) NOT NULL DEFAULT 'default',
                        BackgroundImage NVARCHAR(500) NULL,
                        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
                    );
                `);
                
                // Insert default theme settings
                await pool.request().query(`
                    INSERT INTO ThemeSettings (ActiveTheme) VALUES ('default')
                `);
            }
            
            // Get current theme settings
            const result = await pool.request().query(`
                SELECT TOP 1 ActiveTheme, BackgroundImage 
                FROM ThemeSettings
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({
                    success: true,
                    activeTheme: settings.ActiveTheme || 'default',
                    backgroundImage: settings.BackgroundImage || null
                });
            } else {
                res.json({
                    success: true,
                    activeTheme: 'default',
                    backgroundImage: null
                });
            }
            
        } catch (error) {
            console.error('Error fetching theme settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch theme settings'
            });
        }
    });

    // POST /api/theme/active - Update active theme
    router.post('/api/theme/active', async (req, res) => {
        try {
            const { activeTheme, backgroundImage } = req.body;
            
            // Validate theme value
            const validThemes = ['default', 'dark', 'christmas'];
            if (activeTheme && !validThemes.includes(activeTheme)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid theme value'
                });
            }
            
            // Check if ThemeSettings table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ThemeSettings'
            `);
            
            if (tableCheck.recordset.length === 0) {
                // Create the table if it doesn't exist
                await pool.request().query(`
                    CREATE TABLE ThemeSettings (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        ActiveTheme NVARCHAR(50) NOT NULL DEFAULT 'default',
                        BackgroundImage NVARCHAR(500) NULL,
                        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
                    );
                `);
            }
            
            // Update or insert theme settings
            if (activeTheme !== undefined) {
                await pool.request()
                    .input('activeTheme', sql.NVarChar, activeTheme)
                    .input('backgroundImage', sql.NVarChar, backgroundImage || null)
                    .query(`
                        IF EXISTS (SELECT 1 FROM ThemeSettings)
                            UPDATE ThemeSettings 
                            SET ActiveTheme = @activeTheme, 
                                BackgroundImage = @backgroundImage
                        ELSE
                            INSERT INTO ThemeSettings (ActiveTheme, BackgroundImage) 
                            VALUES (@activeTheme, @backgroundImage)
                    `);
            }
            
            console.log(`Theme settings updated: ${activeTheme || 'unchanged'}, background: ${backgroundImage ? 'updated' : 'unchanged'}`);
            
            res.json({
                success: true,
                message: 'Theme settings updated successfully'
            });
            
        } catch (error) {
            console.error('Error updating theme settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update theme settings'
            });
        }
    });

    // POST /api/theme/background-image - Upload background image
    router.post('/api/theme/background-image', upload.single('backgroundImage'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No background image file provided'
                });
            }
            
            const backgroundImagePath = `/uploads/theme/${req.file.filename}`;
            
            // Update theme settings with new background image
            await pool.request()
                .input('backgroundImage', sql.NVarChar, backgroundImagePath)
                .query(`
                    IF EXISTS (SELECT 1 FROM ThemeSettings)
                        UPDATE ThemeSettings 
                        SET BackgroundImage = @backgroundImage
                    ELSE
                        INSERT INTO ThemeSettings (ActiveTheme, BackgroundImage) 
                        VALUES ('default', @backgroundImage)
                `);
            
            console.log(`Background image uploaded: ${backgroundImagePath}`);
            
            res.json({
                success: true,
                message: 'Background image uploaded successfully',
                backgroundImage: backgroundImagePath
            });
            
        } catch (error) {
            console.error('Error uploading background image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload background image'
            });
        }
    });

    // --- Admin Alerts API Endpoints ---
    
    // Get system alerts
    router.get('/api/admin/alerts/system', async (req, res) => {
        try {
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // Mock system alerts data for now
            const systemAlerts = [
                {
                    id: 1,
                    title: 'Database Connection Pool Low',
                    message: 'Database connection pool is running low on available connections.',
                    severity: 'warning',
                    source: 'Database Monitor',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'High Memory Usage',
                    message: 'Server memory usage has exceeded 80% of available capacity.',
                    severity: 'critical',
                    source: 'System Monitor',
                    timestamp: new Date(Date.now() - 300000).toISOString()
                },
                {
                    id: 3,
                    title: 'Backup Completed Successfully',
                    message: 'Daily database backup completed successfully.',
                    severity: 'info',
                    source: 'Backup Service',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ];
            
            res.json({
                success: true,
                alerts: systemAlerts
            });
        } catch (error) {
            console.error('Error fetching system alerts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch system alerts',
                details: error.message
            });
        }
    });
    
    // Get security alerts
    router.get('/api/admin/alerts/security', async (req, res) => {
        try {
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // Mock security alerts data for now
            const securityAlerts = [
                {
                    id: 1,
                    title: 'Multiple Failed Login Attempts',
                    message: 'Multiple failed login attempts detected from IP address.',
                    severity: 'high',
                    ipAddress: '192.168.1.100',
                    userName: 'Unknown',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Suspicious Activity Detected',
                    message: 'Unusual access pattern detected from user account.',
                    severity: 'medium',
                    ipAddress: '10.0.0.50',
                    userName: 'john.doe@example.com',
                    timestamp: new Date(Date.now() - 600000).toISOString()
                },
                {
                    id: 3,
                    title: 'Password Reset Request',
                    message: 'Password reset requested for user account.',
                    severity: 'info',
                    ipAddress: '203.0.113.45',
                    userName: 'jane.smith@example.com',
                    timestamp: new Date(Date.now() - 1200000).toISOString()
                }
            ];
            
            res.json({
                success: true,
                alerts: securityAlerts
            });
        } catch (error) {
            console.error('Error fetching security alerts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch security alerts',
                details: error.message
            });
        }
    });
    
    // Get performance alerts
    router.get('/api/admin/alerts/performance', async (req, res) => {
        try {
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // Mock performance alerts data for now
            const performanceAlerts = [
                {
                    id: 1,
                    title: 'High CPU Usage',
                    message: 'CPU usage has exceeded 85% for the past 5 minutes.',
                    severity: 'warning',
                    metric: 'CPU Usage',
                    value: '87%',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Slow Database Queries',
                    message: 'Several database queries are taking longer than expected.',
                    severity: 'medium',
                    metric: 'Query Time',
                    value: '2.5s avg',
                    timestamp: new Date(Date.now() - 300000).toISOString()
                },
                {
                    id: 3,
                    title: 'Disk Space Warning',
                    message: 'Available disk space is running low.',
                    severity: 'high',
                    metric: 'Disk Space',
                    value: '15% free',
                    timestamp: new Date(Date.now() - 600000).toISOString()
                }
            ];
            
            res.json({
                success: true,
                alerts: performanceAlerts
            });
        } catch (error) {
            console.error('Error fetching performance alerts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch performance alerts',
                details: error.message
            });
        }
    });
    
    // Get user activity alerts
    router.get('/api/admin/alerts/user-activity', async (req, res) => {
        try {
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // Mock user activity alerts data for now
            const userActivityAlerts = [
                {
                    id: 1,
                    title: 'Unusual Login Time',
                    message: 'User logged in at an unusual time (3:00 AM).',
                    severity: 'medium',
                    userName: 'alice.johnson@example.com',
                    userId: 123,
                    activity: 'Login',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Multiple Account Access',
                    message: 'User accessed account from multiple locations simultaneously.',
                    severity: 'high',
                    userName: 'bob.wilson@example.com',
                    userId: 456,
                    activity: 'Concurrent Sessions',
                    timestamp: new Date(Date.now() - 900000).toISOString()
                },
                {
                    id: 3,
                    title: 'Large Order Placed',
                    message: 'User placed an unusually large order.',
                    severity: 'info',
                    userName: 'charlie.brown@example.com',
                    userId: 789,
                    activity: 'Order Placement',
                    timestamp: new Date(Date.now() - 1800000).toISOString()
                }
            ];
            
            res.json({
                success: true,
                alerts: userActivityAlerts
            });
        } catch (error) {
            console.error('Error fetching user activity alerts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user activity alerts',
                details: error.message
            });
        }
    });
    
    // Dismiss alert
    router.post('/api/admin/alerts/:alertId/dismiss', async (req, res) => {
        try {
            const alertId = parseInt(req.params.alertId);
            
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // For now, just return success (in a real implementation, you'd update the database)
            console.log(`Alert ${alertId} dismissed by admin ${req.session.user.id}`);
            
            res.json({
                success: true,
                message: 'Alert dismissed successfully'
            });
        } catch (error) {
            console.error('Error dismissing alert:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to dismiss alert',
                details: error.message
            });
        }
    });
    
    // Acknowledge alert
    router.post('/api/admin/alerts/:alertId/acknowledge', async (req, res) => {
        try {
            const alertId = parseInt(req.params.alertId);
            
            // Check if user is authenticated and has admin permissions
            if (!req.session.user || req.session.user.role !== 'Admin') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized - Admin access required' 
                });
            }
            
            // For now, just return success (in a real implementation, you'd update the database)
            console.log(`Alert ${alertId} acknowledged by admin ${req.session.user.id}`);
            
            res.json({
                success: true,
                message: 'Alert acknowledged successfully'
            });
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to acknowledge alert',
                details: error.message
            });
        }
    });

    return router;
};
// API Routes for Frontend
const express = require('express');
const sql = require('mssql');

module.exports = function(sql, pool) {
    const router = express.Router();

    // --- Order Management API Endpoints ---
    // Cash on Delivery Order Creation
    router.post('/api/orders/cash-on-delivery', async (req, res) => {
        try {
            console.log('Received cash-on-delivery order request:', req.body);
            
            // Check if user is authenticated
            if (!req.session.user || req.session.user.role !== 'Customer') {
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
            
            // Create the order with proper schema
            const orderResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('orderDate', sql.DateTime, new Date())
                .input('status', sql.NVarChar, 'Pending')
                .input('paymentMethod', sql.NVarChar, 'Cash on Delivery')
                .input('totalAmount', sql.Decimal(10, 2), total || 0)
                .input('deliveryType', sql.NVarChar, deliveryType || 'pickup')
                .input('deliveryCost', sql.Decimal(10, 2), shippingCost || 0)
                .input('shippingAddressId', sql.Int, finalShippingAddressId)
                .query(`
                    INSERT INTO Orders (CustomerID, OrderDate, Status, PaymentMethod, TotalAmount, DeliveryType, DeliveryCost, ShippingAddressID)
                    OUTPUT INSERTED.OrderID
                    VALUES (@customerId, @orderDate, @status, @paymentMethod, @totalAmount, @deliveryType, @deliveryCost, @shippingAddressId)
                `);
            
            const orderId = orderResult.recordset[0].OrderID;
            
            // Add order items
            for (const item of items) {
                await pool.request()
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .input('price', sql.Decimal(10, 2), item.price)
                    .query(`
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity, PriceAtPurchase)
                        VALUES (@orderId, @productId, @quantity, @price)
                    `);
            }
            
            console.log('Cash on delivery order created successfully:', orderId);
            
            res.json({ 
                success: true, 
                message: 'Order placed successfully',
                orderId: orderId
            });
            
        } catch (error) {
            console.error('Error creating cash-on-delivery order:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to create order',
                error: error.message 
            });
        }
    });

    // --- Product Reviews API Endpoints ---
    // Get reviews for a specific product
    router.get('/api/products/:productId/reviews', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            console.log('Backend: Fetching reviews for product ID:', productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .execute('GetProductReviews');
            
            console.log('Backend: Reviews query result:', result.recordset);
            
            res.json({
                success: true,
                reviews: result.recordset
            });
        } catch (err) {
            console.error('Backend: Error fetching product reviews:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch reviews', 
                details: err.message 
            });
        }
    });

    // Add a new review for a product
    router.post('/api/products/:productId/reviews', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            const { rating, comment, customerId } = req.body;
            
            console.log('Backend: Adding review for product ID:', productId, 'Data:', { rating, comment, customerId });
            
            // Validate input
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Rating must be between 1 and 5' 
                });
            }
            
            if (!comment || comment.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Comment is required' 
                });
            }
            
            if (!customerId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Customer ID is required' 
                });
            }
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .input('customerId', sql.Int, customerId)
                .input('rating', sql.Int, rating)
                .input('comment', sql.NVarChar, comment.trim())
                .execute('AddProductReview');
            
            console.log('Backend: Review added successfully:', result.recordset[0]);
            
            res.json({
                success: true,
                review: result.recordset[0]
            });
        } catch (err) {
            console.error('Backend: Error adding product review:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to add review', 
                details: err.message 
            });
        }
    });

    // Get review statistics for a product
    router.get('/api/products/:productId/reviews/stats', async (req, res) => {
        try {
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .execute('GetProductReviewStats');
            
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
                        p.ProductID, p.Name, p.Description, p.Price, p.StockQuantity, 
                        p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                        pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate,
                        sold.soldQuantity
                    ORDER BY p.IsFeatured DESC, p.DateAdded DESC
                `;
            } else {
                // ProductReviews table doesn't exist, use basic query with discounts
                query = `
                    SELECT 
                        p.ProductID as id,
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
                        p.Model3D as model3d,
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
                        p.Model3D as model3d,
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

    // Get product by ID
    router.get('/api/products/:id', async (req, res) => {
        try {
            const productId = parseInt(req.params.id);
            
            // First check if ProductReviews table exists
            const tableCheck = await pool.request().query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'ProductReviews'
            `);
            
            let query;
            if (tableCheck.recordset.length > 0) {
                // ProductReviews table exists, use the full query with ratings
                query = `
                    SELECT 
                        p.ProductID as id,
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
                        p.Model3D as model3d,
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
                    WHERE p.ProductID = @productId AND p.IsActive = 1
                    GROUP BY 
                        p.ProductID, p.Name, p.Description, p.Price, p.StockQuantity, 
                        p.Category, p.ImageURL, p.ThumbnailURLs, p.DateAdded, p.IsActive, p.Dimensions, p.IsFeatured,
                        p.Model3D, p.Has3DModel,
                        pd.DiscountID, pd.DiscountType, pd.DiscountValue, pd.StartDate, pd.EndDate
                `;
            } else {
                // ProductReviews table doesn't exist, use basic query
                query = `
                    SELECT 
                        p.ProductID as id,
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
                        p.Model3D as model3d,
                        p.Has3DModel as has3dModel,
                        0 as averageRating,
                        0 as reviewCount,
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
                    LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID AND pd.IsActive = 1
                    WHERE p.ProductID = @productId AND p.IsActive = 1
                `;
            }
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
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
            console.log('Backend: Fetching variations for product ID:', productId);
            
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
            
            console.log('Backend: Variations query result:', result.recordset.length, 'variations found');
            
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
            console.error('Backend: Error fetching product variations:', err);
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

    return router;
};
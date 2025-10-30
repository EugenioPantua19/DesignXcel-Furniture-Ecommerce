const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sql = require('mssql');
// All encryption removed - using plain text storage

module.exports = function(sql, pool) {
    const router = express.Router();

    // =============================================================================
    // HELPER FUNCTIONS
    // =============================================================================
    
    // Helper function to safely delete old image files
    async function deleteOldImageFile(imageUrl) {
        if (!imageUrl) return;
        
        try {
            // Convert URL path to file system path
            const filePath = path.join(__dirname, 'public', imageUrl);
            
            // Check if file exists and delete it
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old image file: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error deleting old image file ${imageUrl}:`, error);
            // Don't throw error - file deletion failure shouldn't break the update
        }
    }
    
    // Helper function to delete old thumbnail files
    async function deleteOldThumbnailFiles(thumbnailUrls) {
        if (!thumbnailUrls) return;
        
        try {
            const thumbnails = JSON.parse(thumbnailUrls);
            for (const thumbnailUrl of thumbnails) {
                await deleteOldImageFile(thumbnailUrl);
            }
        } catch (error) {
            console.error(`Error deleting old thumbnail files ${thumbnailUrls}:`, error);
        }
    }

    // =============================================================================
    // FILE UPLOAD CONFIGURATION
    // =============================================================================
    
    // Configure multer for file uploads
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'uploads');
            const heroBannersDir = path.join(uploadDir, 'hero-banners');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            if (!fs.existsSync(heroBannersDir)) {
                fs.mkdirSync(heroBannersDir, { recursive: true });
            }
            
            cb(null, heroBannersDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    
    const upload = multer({ 
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for testimonials uploads
    const testimonialsStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'uploads');
            const testimonialsDir = path.join(uploadDir, 'testimonials');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            if (!fs.existsSync(testimonialsDir)) {
                fs.mkdirSync(testimonialsDir, { recursive: true });
            }
            
            cb(null, testimonialsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'testimonial-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    
    const testimonialsUpload = multer({ 
        storage: testimonialsStorage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for theme background uploads
    const themeStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'uploads');
            const themeBackgroundsDir = path.join(uploadDir, 'theme-backgrounds');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            if (!fs.existsSync(themeBackgroundsDir)) {
                fs.mkdirSync(themeBackgroundsDir, { recursive: true });
            }
            
            cb(null, themeBackgroundsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'theme-bg-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    
    const themeUpload = multer({ 
        storage: themeStorage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for product uploads
    const productUpload = multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                let dest;
                if (file.fieldname === 'image') {
                    dest = path.join(__dirname, 'public', 'uploads', 'products', 'images');
                } else if (file.fieldname.startsWith('thumbnail')) {
                    dest = path.join(__dirname, 'public', 'uploads', 'products', 'thumbnails');
                } else if (file.fieldname === 'model3d') {
                    dest = path.join(__dirname, 'public', 'uploads', 'products', 'models');
                } else {
                    dest = path.join(__dirname, 'public', 'uploads', 'products');
                }
                
                // Ensure directory exists
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                cb(null, dest);
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + '-' + file.originalname);
            }
        }),
        limits: {
            fileSize: function (req, file) {
                // 30MB limit for 3D models, 10MB for other files
                if (file.fieldname === 'model3d') {
                    return 30 * 1024 * 1024; // 30MB for 3D models
                }
                return 10 * 1024 * 1024; // 10MB for images and other files
            }
        },
        fileFilter: function (req, file, cb) {
            if (file.fieldname === 'model3d') {
                // Allow GLB and GLTF files for 3D models
                if (file.mimetype === 'model/gltf-binary' || file.mimetype === 'model/gltf+json' || 
                    file.originalname.toLowerCase().endsWith('.glb') || file.originalname.toLowerCase().endsWith('.gltf')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only GLB and GLTF files are allowed for 3D models!'), false);
                }
            } else if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for variation uploads
    const variationStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'uploads');
            const variationsDir = path.join(uploadDir, 'variations');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            if (!fs.existsSync(variationsDir)) {
                fs.mkdirSync(variationsDir, { recursive: true });
            }
            
            cb(null, variationsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'variation-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const variationUpload = multer({
        storage: variationStorage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // =============================================================================
    // ACTIVITY LOGGING FUNCTION
    // =============================================================================
    
    /**
     * Helper function to capture changes for UPDATE operations
     */
    function captureChanges(oldData, newData, fieldsToTrack = []) {
        if (!oldData || !newData) return null;
        
        const changes = [];
        const fields = fieldsToTrack.length > 0 ? fieldsToTrack : Object.keys(newData);
        
        for (const field of fields) {
            if (oldData[field] !== newData[field]) {
                changes.push(`${field}: "${oldData[field]}" → "${newData[field]}"`);
            }
        }
        
        return changes.length > 0 ? changes.join(', ') : null;
    }

    /**
     * Log user activity to ActivityLogs table
     */
    async function logActivity(userId, action, tableAffected, recordId, description, changes = null) {
        try {
            await pool.connect();
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('action', sql.NVarChar, action)
                .input('tableAffected', sql.NVarChar, tableAffected)
                .input('recordId', sql.NVarChar, recordId || null)
                .input('description', sql.NVarChar, description)
                .input('changes', sql.NVarChar, changes || null)
                .query(`
                    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description, Changes, Timestamp)
                    VALUES (@userId, @action, @tableAffected, @recordId, @description, @changes, GETDATE())
                `);
        } catch (err) {
            console.error('Error logging activity:', err);
            // Don't throw error - logging failure shouldn't break the main operation
        }
    }

    // =============================================================================
    // AUTHENTICATION & AUTHORIZATION MIDDLEWARE
    // =============================================================================

    const bcrypt = require('bcrypt');
    const crypto = require('crypto');
    const jwtUtils = require('./utils/jwtUtils');
    const { jwtAuth, optionalJwtAuth, requireRole, requireUserType } = require('./middleware/jwtAuth');
    const { checkPermission, checkAnyPermission } = require('./middleware/permissionCheck');
    

    /**
     * Enhanced middleware to check if user is logged in (supports both session and JWT)
     */
    function isAuthenticated(req, res, next) {
        console.log('=== AUTHENTICATION CHECK ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session exists:', !!req.session);
        console.log('User in session:', req.session?.user);
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);
        console.log('============================');
        
        // Check session-based authentication first
        if (req.session && req.session.user) {
            console.log('Authentication: PASSED (Session)');
            return next();
        }

        // Check JWT authentication for API requests
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwtUtils.verifyToken(token);
                // Set user data from JWT
                req.session = req.session || {};
                req.session.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    type: decoded.type,
                    fullName: decoded.fullName
                };
                console.log('Authentication: PASSED (JWT)');
                return next();
            } catch (error) {
                console.log('JWT Authentication failed:', error.message);
                // Fall through to check legacy tokens
            }
        }

        // Legacy token validation removed - using JWT only
        
        // Check if this is an AJAX/API request
        const isAjaxRequest = req.xhr || 
                            (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                            (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
                            req.path.startsWith('/api/');
        
        if (isAjaxRequest) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.',
                requiresLogin: true,
                code: 'AUTHENTICATION_REQUIRED'
            });
        }
        
        req.flash('error', 'Please log in to access this page.');
        res.redirect('/login');
    }

    // Legacy token validation removed - using JWT validation only


    /**
     * EMPLOYEE ACCESS SYSTEM: All employee roles have access
     */
    function hasEmployeeAccess(req, res, next) {
        if (!req.session || !req.session.user) {
            return redirectToLogin(req, res, 'Authentication required.');
        }

        const userRole = req.session.user.role;
        
        // Define allowed employee roles
        const allowedRoles = [
            'Admin',
            'TransactionManager', 
            'InventoryManager',
            'UserManager',
            'OrderSupport',
            'Employee'
        ];
        
        // Check if user has an allowed role
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        // Non-employee users are denied access
        return handleAccessDenied(req, res, userRole);
    }

    /**
     * Simple access denied handler for non-admin users
     */

    /**
     * Handle access denied scenarios for non-admin users
     */
    function handleAccessDenied(req, res, userRole) {
        const isAjaxRequest = req.xhr || 
                            (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                            req.path.startsWith('/api/');
        
        if (isAjaxRequest) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Employee access required.',
                code: 'EMPLOYEE_ACCESS_REQUIRED'
            });
        }
        
        // Redirect non-employee users to login with error message
        req.flash('error', 'Employee access required. Please log in with an employee account.');
        res.redirect('/login');
    }

    /**
     * Helper function to redirect to login
     */
    function redirectToLogin(req, res, message) {
        const isAjaxRequest = req.xhr || 
                            (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                            req.path.startsWith('/api/');
        
        if (isAjaxRequest) {
            return res.status(401).json({
                success: false,
                message: message,
                requiresLogin: true,
                code: 'AUTHENTICATION_REQUIRED'
            });
        }
        
        req.flash('error', message);
        res.redirect('/login');
    }

    /**
     * Generic employee route handler
     */
    async function handleEmployeeRoute(req, res, section, template) {
        try {
            console.log(`${section} access attempt - UserID: ${req.session.user.id}, Role: ${req.session.user.role}`);
            res.render(template, { user: req.session.user });
        } catch (error) {
            console.error(`Error in ${section} route:`, error);
            res.status(500).render('error', { 
                message: `Failed to load ${section} page.`,
                error: error.message 
            });
        }
    }

    // =============================================================================
    // OTP AUTHENTICATION API ENDPOINTS
    // =============================================================================
    
    // Send OTP for user registration
    router.post('/api/auth/send-otp', async (req, res) => {
        try {
            const { email } = req.body;
            
            console.log('📧 OTP Request received for email:', email);
            
            if (!email) {
                return res.json({ success: false, message: 'Email is required' });
            }
            
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Check if email already has an account
            await pool.connect();
            const existingUser = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT CustomerID FROM Customers WHERE Email = @email');
            
            if (existingUser.recordset.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An account with this email already exists. Please use a different email or try logging in instead.',
                    code: 'EMAIL_ALREADY_EXISTS'
                });
            }
            
            // Store OTP in database with expiration (5 minutes)
            await pool.request()
                .input('email', sql.NVarChar, email)
                .input('otp', sql.NVarChar, otp)
                .query(`
                    MERGE OTPVerification AS target
                    USING (SELECT @email as email) AS source
                    ON target.Email = source.email
                    WHEN MATCHED THEN
                        UPDATE SET 
                            OTP = @otp,
                            ExpiresAt = DATEADD(MINUTE, 5, GETDATE()),
                            CreatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (Email, OTP, ExpiresAt, CreatedAt)
                        VALUES (@email, @otp, DATEADD(MINUTE, 5, GETDATE()), GETDATE());
                `);
            
            // Send OTP via email using SendGrid (works on Railway)
            const { sendOtpEmail } = require('./utils/sendgridHelper');
            
            console.log('📧 Email config check:');
            console.log('  - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
            console.log('  - OTP_EMAIL_USER:', process.env.OTP_EMAIL_USER ? 'Set' : 'Not set');
            console.log('  - NODE_ENV:', process.env.NODE_ENV);
            
            // Send OTP via SendGrid
            const emailResult = await sendOtpEmail(email, otp);
            
            if (!emailResult.success) {
                return res.json({ 
                    success: false, 
                    message: emailResult.message || 'Failed to send OTP email'
                });
            }
            
            console.log(`✅ OTP sent to ${email}`);
            
            res.json({ 
                success: true, 
                message: 'OTP sent successfully',
                // In development, include OTP in response for testing
                otp: process.env.NODE_ENV === 'development' ? otp : undefined
            });
        } catch (err) {
            console.error('Error sending OTP:', err);
            console.error('Error details:', err.message);
            console.error('Error code:', err.code);
            res.json({ success: false, message: 'Failed to send OTP: ' + err.message });
        }
    });
    
    // Test OTP email functionality
    router.post('/api/auth/test-otp', async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.json({ success: false, message: 'Email is required' });
            }
            
            console.log('🧪 Testing OTP email for:', email);
            
            // Send test email via SendGrid
            const { sendTestOtpEmail } = require('./utils/sendgridHelper');
            const result = await sendTestOtpEmail(email);
            
            if (result.success) {
                console.log('✅ Test OTP email sent successfully to:', email);
            } else {
                console.error('❌ Error sending test OTP:', result.message);
            }
            
            res.json(result);
            
        } catch (err) {
            console.error('❌ Error sending test OTP:', err);
            res.json({ success: false, message: 'Failed to send test OTP: ' + err.message });
        }
    });
    
    // Verify OTP for user registration
    router.post('/api/auth/verify-otp', async (req, res) => {
        try {
            const { email, otp } = req.body;
            
            if (!email || !otp) {
                return res.json({ success: false, message: 'Email and OTP are required' });
            }
            
            await pool.connect();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('otp', sql.NVarChar, otp)
                .query(`
                    SELECT OTP, ExpiresAt 
                    FROM OTPVerification 
                    WHERE Email = @email AND OTP = @otp AND ExpiresAt > GETDATE()
                `);
            
            if (result.recordset.length > 0) {
                // OTP is valid, clean up the record
                await pool.request()
                    .input('email', sql.NVarChar, email)
                    .query('DELETE FROM OTPVerification WHERE Email = @email');
                
                res.json({ success: true, message: 'OTP verified successfully' });
            } else {
                res.json({ success: false, message: 'Invalid or expired OTP' });
            }
        } catch (err) {
            console.error('Error verifying OTP:', err);
            res.json({ success: false, message: 'Failed to verify OTP' });
        }
    });

    // =============================================================================
    // DEBUG ENDPOINTS
    // =============================================================================
    
    // Debug endpoint to check environment variables
    router.get('/api/debug/env-check', async (req, res) => {
        try {
            const envCheck = {
                nodeEnv: process.env.NODE_ENV,
                otpEmailUser: process.env.OTP_EMAIL_USER ? 'Set' : 'Not set',
                otpEmailPass: process.env.OTP_EMAIL_PASS ? 'Set' : 'Not set',
                dbServer: process.env.DB_SERVER ? 'Set' : 'Not set',
                sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Not set',
                corsOrigin: process.env.CORS_ORIGIN ? 'Set' : 'Not set',
                timestamp: new Date().toISOString()
            };
            
            console.log('🔍 Environment check requested:', envCheck);
            
            res.json({
                success: true,
                message: 'Environment variables check',
                environment: envCheck
            });
        } catch (error) {
            console.error('❌ Environment check error:', error);
            res.status(500).json({
                success: false,
                message: 'Environment check failed',
                error: error.message
            });
        }
    });
    
    // Health check endpoint
    router.get('/api/health', async (req, res) => {
        try {
            res.json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Health check failed',
                error: error.message
            });
        }
    });

    // =============================================================================
    // MAIN EMPLOYEE ROUTES (All roles have access by default)
    // =============================================================================

    // Admin Manager
    router.get('/Employee/AdminManager', isAuthenticated, (req, res) => {
        console.log('=== ADMIN MANAGER ROUTE ACCESSED ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session exists:', !!req.session);
        console.log('User in session:', req.session?.user);
        console.log('User role:', req.session?.user?.role);
        console.log('================================');
        res.render('Employee/Admin/AdminManager', { user: req.session.user });
    });

    // =============================================================================
    // INVENTORY MANAGER ROUTES
    // =============================================================================
    
    // Inventory Manager Dashboard
    router.get('/Employee/InventoryManager', isAuthenticated, (req, res) => {
        console.log('=== INVENTORY MANAGER ROUTE ACCESSED ===');
        console.log('Session ID:', req.sessionID);
        console.log('User in session:', req.session?.user);
        console.log('User role:', req.session?.user?.role);
        console.log('================================');
        res.render('Employee/InventoryManager/InventoryManager', { user: req.session.user });
    });

    // Inventory Manager - Products
    router.get('/Employee/InventoryManager/InventoryProducts', isAuthenticated, checkPermission('inventory_products'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);

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
                            CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
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
            res.render('Employee/InventoryManager/InventoryProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.render('Employee/InventoryManager/InventoryProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    // Inventory Manager - Add Product
    router.post('/Employee/InventoryManager/InventoryProducts/Add', isAuthenticated, checkPermission('inventory_products'), productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Insert product
                const productResult = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('stockquantity', sql.Int, stockquantity)
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .query(`
                        INSERT INTO Products (Name, Description, Price, StockQuantity, Category, DateAdded, IsActive)
                        VALUES (@name, @description, @price, @stockquantity, @category, GETDATE(), 1)
                        SELECT SCOPE_IDENTITY() as ProductID
                    `);
                
                const productId = productResult.recordset[0].ProductID;
                
                // Handle file uploads if any
                if (req.files) {
                    // Handle main image
                    if (req.files.image) {
                        const imageFile = req.files.image[0];
                        const imageUrl = `/uploads/products/images/${imageFile.filename}`;
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('imageUrl', sql.NVarChar, imageUrl)
                            .query('UPDATE Products SET ImageURL = @imageUrl WHERE ProductID = @productId');
                    }
                    
                    // Handle thumbnails
                    const thumbnails = [];
                    for (let i = 1; i <= 4; i++) {
                        if (req.files[`thumbnail${i}`]) {
                            const thumbnailFile = req.files[`thumbnail${i}`][0];
                            thumbnails.push(`/uploads/products/thumbnails/${thumbnailFile.filename}`);
                        }
                    }
                    
                    if (thumbnails.length > 0) {
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('thumbnails', sql.NVarChar, JSON.stringify(thumbnails))
                            .query('UPDATE Products SET ThumbnailURLs = @thumbnails WHERE ProductID = @productId');
                    }
                }
                
                // Handle required materials
                if (requiredMaterials) {
                    const materials = JSON.parse(requiredMaterials);
                    for (const material of materials) {
                        if (material.materialId && material.quantityRequired > 0) {
                            await transaction.request()
                                .input('productId', sql.Int, productId)
                                .input('materialId', sql.Int, material.materialId)
                                .input('quantityRequired', sql.Int, material.quantityRequired)
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                                    VALUES (@productId, @materialId, @quantityRequired)
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'INSERT',
                    'Products',
                    productId.toString(),
                    `InventoryManager created new product: "${name}" (ID: ${productId})`
                );
                
                res.json({ 
                    success: true, 
                    message: 'Product created successfully!',
                    productId: productId
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error creating product:', err);
            res.json({ 
                success: false, 
                message: 'Failed to create product: ' + err.message 
            });
        }
    });

    // Inventory Manager - Edit Product
    router.post('/Employee/InventoryManager/InventoryProducts/Edit', isAuthenticated, checkPermission('inventory_products'), productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { productid, name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Get old product data for change tracking
                const oldProductResult = await transaction.request()
                    .input('productId', sql.Int, productid)
                    .query(`
                        SELECT Name, Description, Price, StockQuantity, Category 
                        FROM Products 
                        WHERE ProductID = @productId
                    `);
                
                const oldProduct = oldProductResult.recordset[0];
                
                // Update product
                await transaction.request()
                    .input('productId', sql.Int, productid)
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('stockquantity', sql.Int, stockquantity)
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .query(`
                        UPDATE Products 
                        SET Name = @name, Description = @description, Price = @price, 
                            StockQuantity = @stockquantity, Category = @category, Dimensions = @dimensions, UpdatedAt = GETDATE()
                        WHERE ProductID = @productId
                    `);
                
                // Handle file uploads if any
                if (req.files) {
                    // Get current image URLs before updating
                    const currentProduct = await transaction.request()
                        .input('productId', sql.Int, productid)
                        .query('SELECT ImageURL, ThumbnailURLs FROM Products WHERE ProductID = @productId');
                    
                    const currentImageUrl = currentProduct.recordset[0]?.ImageURL;
                    const currentThumbnailUrls = currentProduct.recordset[0]?.ThumbnailURLs;
                    
                    // Handle main image
                    if (req.files.image) {
                        // Delete old main image
                        await deleteOldImageFile(currentImageUrl);
                        
                        const imageFile = req.files.image[0];
                        const imageUrl = `/uploads/products/images/${imageFile.filename}`;
                        await transaction.request()
                            .input('productId', sql.Int, productid)
                            .input('imageUrl', sql.NVarChar, imageUrl)
                            .query('UPDATE Products SET ImageURL = @imageUrl WHERE ProductID = @productId');
                    }
                    
                    // Handle thumbnails
                    const thumbnails = [];
                    for (let i = 1; i <= 4; i++) {
                        if (req.files[`thumbnail${i}`]) {
                            const thumbnailFile = req.files[`thumbnail${i}`][0];
                            thumbnails.push(`/uploads/products/thumbnails/${thumbnailFile.filename}`);
                        }
                    }
                    
                    if (thumbnails.length > 0) {
                        // Delete old thumbnails
                        await deleteOldThumbnailFiles(currentThumbnailUrls);
                        
                        await transaction.request()
                            .input('productId', sql.Int, productid)
                            .input('thumbnails', sql.NVarChar, JSON.stringify(thumbnails))
                            .query('UPDATE Products SET ThumbnailURLs = @thumbnails WHERE ProductID = @productId');
                    }
                }
                
                // Handle required materials
                if (requiredMaterials) {
                    const materials = JSON.parse(requiredMaterials);
                    
                    // Delete existing materials
                    await transaction.request()
                        .input('productId', sql.Int, productid)
                        .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                    
                    // Insert new materials
                    for (const material of materials) {
                        if (material.materialId && material.quantityRequired > 0) {
                            await transaction.request()
                                .input('productId', sql.Int, productid)
                                .input('materialId', sql.Int, material.materialId)
                                .input('quantityRequired', sql.Int, material.quantityRequired)
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                                    VALUES (@productId, @materialId, @quantityRequired)
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Capture changes for logging
                const newProductData = { Name: name, Description: description, Price: price, StockQuantity: stockquantity, Category: category };
                const changes = captureChanges(oldProduct, newProductData, ['Name', 'Description', 'Price', 'StockQuantity', 'Category']);
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'UPDATE',
                    'Products',
                    productid.toString(),
                    `InventoryManager updated product: "${name}" (ID: ${productid})`,
                    changes
                );
                
                res.json({ 
                    success: true, 
                    message: 'Product updated successfully!'
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            res.json({ 
                success: false, 
                message: 'Failed to update product: ' + err.message 
            });
        }
    });

    // Inventory Manager - Delete Product
    router.post('/Employee/InventoryManager/InventoryProducts/Delete/:id', isAuthenticated, checkPermission('inventory_products'), async (req, res) => {
        try {
            await pool.connect();
            
            const productId = req.params.id;
            
            // First check if product exists
            const checkResult = await pool.request()
                .input('id', sql.Int, productId)
                .query('SELECT ProductID, Name FROM Products WHERE ProductID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Product not found.');
                return res.redirect('/Employee/InventoryManager/InventoryProducts');
            }
            
            const productName = checkResult.recordset[0].Name;
            
            // Archive the product (soft delete by setting IsActive = 0)
            await pool.request()
                .input('id', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0 WHERE ProductID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `InventoryManager archived product "${productName}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            req.flash('success', `Product "${productName}" has been archived. You can restore it from the Archived page.`);
            res.redirect('/Employee/InventoryManager/InventoryProducts');
        } catch (err) {
            console.error('Error archiving product:', err);
            req.flash('error', 'Failed to archive product. Please try again.');
            res.redirect('/Employee/InventoryManager/InventoryProducts');
        }
    });

    // Inventory Manager - Product Discount Management API
    router.post('/api/inventory/products/:id/discount', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { discountType, discountValue, startDate, endDate } = req.body;
            
            // Validate input
            if (!discountType || !discountValue || !startDate || !endDate) {
                return res.json({ success: false, error: 'All discount fields are required.' });
            }
            
            if (discountValue <= 0) {
                return res.json({ success: false, error: 'Discount value must be greater than 0.' });
            }
            
            if (discountType === 'percentage' && discountValue > 100) {
                return res.json({ success: false, error: 'Percentage discount cannot exceed 100%.' });
            }
            
            // Check if product exists
            const productCheck = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT ProductID, Name, Price FROM Products WHERE ProductID = @productId AND IsActive = 1');
            
            if (productCheck.recordset.length === 0) {
                return res.json({ success: false, error: 'Product not found.' });
            }
            
            const product = productCheck.recordset[0];
            
            // Validate fixed discount doesn't exceed product price
            if (discountType === 'fixed' && discountValue > product.Price) {
                return res.json({ success: false, error: 'Fixed discount cannot exceed product price.' });
            }
            
            // Check if discount already exists for this product
            const existingDiscount = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT DiscountID FROM ProductDiscounts WHERE ProductID = @productId AND IsActive = 1');
            
            if (existingDiscount.recordset.length > 0) {
                return res.json({ success: false, error: 'Product already has an active discount. Please remove it first.' });
            }
            
            // Insert new discount
            await pool.request()
                .input('productId', sql.Int, id)
                .input('discountType', sql.NVarChar, discountType)
                .input('discountValue', sql.Decimal(10, 2), discountValue)
                .input('startDate', sql.DateTime2, new Date(startDate))
                .input('endDate', sql.DateTime2, new Date(endDate))
                .query(`
                    INSERT INTO ProductDiscounts (ProductID, DiscountType, DiscountValue, StartDate, EndDate, IsActive)
                    VALUES (@productId, @discountType, @discountValue, @startDate, @endDate, 1)
                `);
            
            res.json({ success: true, message: 'Discount added successfully!' });
        } catch (err) {
            console.error('Error adding product discount:', err);
            res.json({ success: false, error: 'Failed to add discount: ' + err.message });
        }
    });

    router.delete('/api/inventory/products/:id/discount', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            // Check if discount exists
            const discountCheck = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT DiscountID FROM ProductDiscounts WHERE ProductID = @productId AND IsActive = 1');
            
            if (discountCheck.recordset.length === 0) {
                return res.json({ success: false, error: 'No active discount found for this product.' });
            }
            
            // Deactivate the discount
            await pool.request()
                .input('productId', sql.Int, id)
                .query('UPDATE ProductDiscounts SET IsActive = 0 WHERE ProductID = @productId AND IsActive = 1');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductDiscounts',
                id,
                `InventoryManager removed discount for product ID: ${id}`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Discount removed successfully!' });
        } catch (err) {
            console.error('Error removing product discount:', err);
            res.json({ success: false, error: 'Failed to remove discount: ' + err.message });
        }
    });

    // Inventory Manager - Materials
    router.get('/Employee/InventoryManager/InventoryMaterials', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 1');
            const materials = result.recordset;
            res.render('Employee/InventoryManager/InventoryMaterials', { user: req.session.user, materials: materials });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            res.render('Employee/InventoryManager/InventoryMaterials', { user: req.session.user, materials: [] });
        }
    });

    // Inventory Manager - Add Raw Material
    router.post('/Employee/InventoryManager/InventoryMaterials/Add', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const { name, quantity, unit } = req.body;
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    INSERT INTO RawMaterials (Name, QuantityAvailable, Unit, LastUpdated, IsActive)
                    OUTPUT INSERTED.MaterialID
                    VALUES (@name, @quantity, @unit, GETDATE(), 1)
                `);
            
            const materialId = result.recordset[0].MaterialID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'RawMaterials',
                materialId,
                `Created new material: "${name}" (ID: ${materialId})`
            );
            
            req.flash('success', 'Raw material added successfully!');
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        } catch (err) {
            console.error('Error adding raw material:', err);
            req.flash('error', 'Failed to add raw material: ' + err.message);
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        }
    });

    // Inventory Manager - Edit Raw Material
    router.post('/Employee/InventoryManager/InventoryMaterials/Edit', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const { materialid, name, quantity, unit } = req.body;
            
            // Get old data for change tracking
            const oldDataResult = await pool.request()
                .input('materialId', sql.Int, materialid)
                .query(`SELECT Name, QuantityAvailable, Unit FROM RawMaterials WHERE MaterialID = @materialId`);
            
            const oldData = oldDataResult.recordset[0];
            
            await pool.request()
                .input('materialId', sql.Int, materialid)
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    UPDATE RawMaterials 
                    SET Name = @name, QuantityAvailable = @quantity, Unit = @unit, LastUpdated = GETDATE()
                    WHERE MaterialID = @materialId
                `);
            
            // Capture changes for logging
            const newData = { Name: name, QuantityAvailable: quantity, Unit: unit };
            const changes = JSON.stringify({ oldData, newData });
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialid,
                `Updated material: "${name}" (ID: ${materialid})`,
                changes
            );
            
            req.flash('success', 'Raw material updated successfully!');
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        } catch (err) {
            console.error('Error updating raw material:', err);
            req.flash('error', 'Failed to update raw material: ' + err.message);
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        }
    });

    // Inventory Manager - Delete Raw Material
    router.post('/Employee/InventoryManager/InventoryMaterials/Delete/:id', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            
            const materialId = req.params.id;
            
            // First check if material exists
            const checkResult = await pool.request()
                .input('id', sql.Int, materialId)
                .query('SELECT MaterialID, Name FROM RawMaterials WHERE MaterialID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Raw material not found.');
                return res.redirect('/Employee/InventoryManager/InventoryMaterials');
            }
            
            const materialName = checkResult.recordset[0].Name;
            
            // Archive the raw material (soft delete by setting IsActive = 0)
            await pool.request()
                .input('id', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0 WHERE MaterialID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'RawMaterials',
                materialId,
                `Deleted material: "${materialName}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            req.flash('success', `Raw material "${materialName}" has been archived. You can restore it from the Archived page.`);
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        } catch (err) {
            console.error('Error archiving inventory manager raw material:', err);
            req.flash('error', 'Failed to archive raw material. Please try again.');
            res.redirect('/Employee/InventoryManager/InventoryMaterials');
        }
    });

    // Inventory Manager - Variations
    router.get('/Employee/InventoryManager/InventoryVariations', isAuthenticated, checkPermission('inventory_variations'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryVariations', { user: req.session.user });
    });

    // Inventory Manager: Add Product Variation
    router.post('/Employee/InventoryManager/InventoryVariations/Add', isAuthenticated, checkPermission('inventory_variations'), variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/variations/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, parseInt(productID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, IsActive)
                    OUTPUT INSERTED.VariationID
                    VALUES (@productID, @variationName, @color, @quantity, @imageUrl, @isActive)
                `);
            
            const variationID = result.recordset[0].VariationID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'ProductVariations',
                variationID,
                `Added new product variation: "${variationName}" (Color: ${color || 'N/A'}, Quantity: ${quantity}) for Product ID: ${productID}`
            );
            
            res.json({
                success: true,
                message: 'Variation added successfully.'
            });
        } catch (err) {
            console.error('Error adding inventory manager variation:', err);
            res.json({
                success: false,
                message: 'Failed to add variation.'
            });
        }
    });

    // Inventory Manager: Edit Product Variation
    router.post('/Employee/InventoryManager/InventoryVariations/Edit', isAuthenticated, checkPermission('inventory_variations'), variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationID, variationName, color, quantity, isActive } = req.body;
            
            // Get current variation data before updating
            const oldVariationResult = await pool.request()
                .input('variationID', sql.Int, parseInt(variationID))
                .query('SELECT VariationName, Color, Quantity, IsActive FROM ProductVariations WHERE VariationID = @variationID');
            
            if (oldVariationResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Variation not found' });
            }
            
            const oldVariation = oldVariationResult.recordset[0];
            
            // Handle image upload - only update if new image provided
            let updateQuery = `
                UPDATE ProductVariations 
                SET VariationName = @variationName,
                    Color = @color,
                    Quantity = @quantity,
                    IsActive = @isActive
            `;
            
            const request = pool.request()
                .input('variationID', sql.Int, parseInt(variationID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0);
            
            if (req.file) {
                // Get current variation image URL before updating
                const currentVariation = await pool.request()
                    .input('variationID', sql.Int, parseInt(variationID))
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                const currentImageUrl = currentVariation.recordset[0]?.VariationImageURL;
                
                // Delete old variation image
                await deleteOldImageFile(currentImageUrl);
                
                const imageUrl = `/uploads/variations/${req.file.filename}`;
                updateQuery += `, VariationImageURL = @imageUrl`;
                request.input('imageUrl', sql.NVarChar, imageUrl);
            }
            
            updateQuery += ` WHERE VariationID = @variationID`;
            
            await request.query(updateQuery);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductVariations',
                variationID.toString(),
                `InventoryManager updated product variation ID ${variationID}: "${variationName}" (Color: ${color || 'N/A'}, Quantity: ${quantity})`,
                JSON.stringify({ 
                    VariationName: { old: oldVariation.VariationName, new: variationName },
                    Color: { old: oldVariation.Color || 'N/A', new: color || 'N/A' },
                    Quantity: { old: oldVariation.Quantity, new: parseInt(quantity) },
                    IsActive: { old: oldVariation.IsActive, new: isActive === '1' ? 1 : 0 }
                })
            );
            
            res.json({
                success: true,
                message: 'Variation updated successfully.'
            });
        } catch (err) {
            console.error('Error updating inventory manager variation:', err);
            res.json({
                success: false,
                message: 'Failed to update variation.'
            });
        }
    });

    // Inventory Manager: Delete Product Variation
    router.post('/Employee/InventoryManager/InventoryVariations/Delete/:id', isAuthenticated, checkPermission('inventory_variations'), async (req, res) => {
        try {
            await pool.connect();
            const variationID = parseInt(req.params.id);
            
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .query(`
                    UPDATE ProductVariations 
                    SET IsActive = 0 
                    WHERE VariationID = @variationID
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'ProductVariations',
                variationID.toString(),
                `InventoryManager deleted product variation ID ${variationID}`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({
                success: true,
                message: 'Variation deleted successfully.'
            });
        } catch (err) {
            console.error('Error deleting inventory manager variation:', err);
            res.json({
                success: false,
                message: 'Failed to delete variation.'
            });
        }
    });

    // Inventory Manager - Archived
    router.get('/Employee/InventoryManager/InventoryArchived', isAuthenticated, checkPermission('inventory_archived'), async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    DateAdded,
                    IsActive
                FROM Products
                WHERE IsActive = 0
                ORDER BY DateAdded DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID,
                    Name,
                    QuantityAvailable,
                    Unit,
                    LastUpdated,
                    IsActive
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Categories are stored as a column in Products table, not a separate table
            const categoriesResult = { recordset: [] };
            
            res.render('Employee/InventoryManager/InventoryArchived', { 
                user: req.session.user, 
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset,
                archivedCategories: categoriesResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/InventoryManager/InventoryArchived', { 
                user: req.session.user, 
                archivedProducts: [],
                archivedMaterials: [],
                archivedCategories: [],
                error: err.message
            });
        }
    });

    // Inventory Manager - Alerts
    router.get('/Employee/InventoryManager/InventoryAlerts', isAuthenticated, checkPermission('inventory_alerts'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryAlerts', { user: req.session.user });
    });

    // Inventory Manager - Logs
    router.get('/Employee/InventoryManager/InventoryLogs', isAuthenticated, checkPermission('content_logs'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryLogs', { user: req.session.user });
    });

    // Inventory Manager - CMS
    router.get('/Employee/InventoryManager/InventoryCMS', isAuthenticated, checkPermission('content_cms'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryCMS', { user: req.session.user });
    });

    // Inventory Manager - Reviews
    router.get('/Employee/InventoryManager/InventoryReviews', isAuthenticated, checkPermission('reviews_reviews'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryReviews', { user: req.session.user });
    });

    // Inventory Manager - Delivery Rates
    router.get('/Employee/InventoryManager/InventoryRates', isAuthenticated, checkPermission('transactions_delivery_rates'), (req, res) => {
        res.render('Employee/InventoryManager/InventoryRates', { user: req.session.user });
    });

    // Inventory Manager: Add Delivery Rate
    router.post('/Employee/InventoryManager/InventoryRates/Add', isAuthenticated, checkPermission('transactions_delivery_rates'), async (req, res) => {
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
                .input('CreatedByUserID', sql.Int, user.id || null)
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
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'DeliveryRates',
                null,
                `InventoryManager added new delivery rate: "${serviceType}" - ₱${price}`
            );
            
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding inventory manager delivery rate:', err);
            res.json({ success: false, message: 'Failed to add delivery rate' });
        }
    });

    // Inventory Manager: Update Delivery Rate
    router.post('/Employee/InventoryManager/InventoryRates/Update/:rateId', isAuthenticated, checkPermission('transactions_delivery_rates'), async (req, res) => {
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
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'DeliveryRates',
                rateId.toString(),
                `InventoryManager updated delivery rate ID ${rateId}: ${serviceType ? `"${serviceType}"` : ''} ${price ? `₱${price}` : ''} ${isActive !== undefined ? (isActive ? 'activated' : 'deactivated') : ''}`
            );
            
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating inventory manager delivery rate:', err);
            res.json({ success: false, message: 'Failed to update delivery rate' });
        }
    });

    // Inventory Manager - Walk-In Orders
    router.get('/Employee/InventoryManager/InventoryWalkIn', isAuthenticated, checkPermission('transactions_walk_in'), async (req, res) => {
        try {
            await pool.connect();
            
            // Ensure WalkInOrders table exists
            await pool.request().query(`
                IF OBJECT_ID('dbo.WalkInOrders','U') IS NULL
                BEGIN
                    CREATE TABLE dbo.WalkInOrders (
                        BulkOrderID INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerName NVARCHAR(255) NOT NULL,
                        Address NVARCHAR(500),
                        ContactNumber NVARCHAR(50),
                        ContactEmail NVARCHAR(255),
                        OrderedProducts NVARCHAR(MAX),
                        Discount DECIMAL(18,2) DEFAULT 0,
                        TotalAmount DECIMAL(18,2) NOT NULL,
                        ExpectedArrival DATETIME2,
                        DeliveryType NVARCHAR(100),
                        Status NVARCHAR(50) DEFAULT 'Pending',
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE()
                    );
                END
            `);
            
            // Query bulk orders
            const result = await pool.request().query('SELECT * FROM WalkInOrders ORDER BY CreatedAt DESC');
            const bulkOrders = result.recordset;
            
            res.render('Employee/InventoryManager/InventoryWalkIn', { user: req.session.user, bulkOrders });
        } catch (err) {
            console.error('Error fetching walk-in orders:', err);
            res.render('Employee/InventoryManager/InventoryWalkIn', { user: req.session.user, bulkOrders: [], error: 'Failed to load walk-in orders.' });
        }
    });

    // Inventory Manager - Manage Users
    router.get('/Employee/InventoryManager/InventoryManageUsers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            
            // Query users with roles - using LEFT JOIN to include users even if they don't have a valid role
            const result = await pool.request().query(`
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.RoleID, r.RoleName, u.IsActive, u.CreatedAt
                FROM Users u
                LEFT JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY u.CreatedAt DESC
            `);
            
            // Decrypt user data before sending to frontend using transparent encryption service
            const decryptedUsers = result.recordset;
            
            res.render('Employee/InventoryManager/InventoryManageUsers', { user: req.session.user, users: decryptedUsers });
        } catch (err) {
            console.error('Error fetching inventory manager users:', err);
            res.render('Employee/InventoryManager/InventoryManageUsers', { user: req.session.user, users: [], error: 'Failed to load users.' });
        }
    });

    // Inventory Manager - Chat Support
    router.get('/Employee/InventoryManager/InventoryChatSupport', isAuthenticated, checkPermission('chat_chat_support'), async (req, res) => {
        console.log('=== InventoryManager ChatSupport Route Called ===');
        let threads = [];
        let selectedThread = null;
        let messages = [];
        
        try {
            await pool.connect();
            
            // Get thread parameter from query string
            const threadId = req.query.thread;
            
            console.log('InventoryManager ChatSupport Route Debug:');
            console.log('- threadId from query:', threadId);
            console.log('- req.query:', req.query);
            
            // Fetch all chat threads
            const threadsResult = await pool.request().query(`
                SELECT c.CustomerID, c.FullName, c.Email,
                    MAX(m.SentAt) AS LastMessageAt,
                    (SELECT TOP 1 MessageText FROM ChatMessages WHERE CustomerID = c.CustomerID ORDER BY SentAt DESC) AS LastMessageText,
                    SUM(CASE WHEN m.SenderType = 'customer' AND m.IsRead = 0 THEN 1 ELSE 0 END) AS UnreadCount
                FROM Customers c
                LEFT JOIN ChatMessages m ON c.CustomerID = m.CustomerID
                GROUP BY c.CustomerID, c.FullName, c.Email
                ORDER BY LastMessageAt DESC
            `);
            threads = threadsResult.recordset;
            
            // If a thread is selected, fetch its details and messages
            if (threadId) {
                const customerId = parseInt(threadId);
                console.log('Processing thread selection for customerId:', customerId);
                
                // Get customer details
                const customerResult = await pool.request()
                    .input('customerId', sql.Int, customerId)
                    .query('SELECT CustomerID, FullName, Email FROM Customers WHERE CustomerID = @customerId');
                
                console.log('Customer query result:', customerResult.recordset);
                
                if (customerResult.recordset.length > 0) {
                    selectedThread = customerResult.recordset[0];
                    console.log('Selected thread found:', selectedThread);
                    
                    // Get messages for this customer
                    const messagesResult = await pool.request()
                        .input('customerId', sql.Int, customerId)
                        .query(`
                            SELECT MessageID, CustomerID, MessageText, SenderType, SentAt, IsRead
                            FROM ChatMessages 
                            WHERE CustomerID = @customerId 
                            ORDER BY SentAt ASC
                        `);
                    messages = messagesResult.recordset;
                    
                    // Mark messages as read
                    await pool.request()
                        .input('customerId', sql.Int, customerId)
                        .query(`
                            UPDATE ChatMessages 
                            SET IsRead = 1 
                            WHERE CustomerID = @customerId AND SenderType = 'customer' AND IsRead = 0
                        `);
                }
            }
            
            console.log('Rendering template with:');
            console.log('- selectedThread:', selectedThread);
            console.log('- selectedThread type:', typeof selectedThread);
            console.log('- selectedThread.CustomerID:', selectedThread ? selectedThread.CustomerID : 'null');
            console.log('- messages count:', messages.length);
            
        } catch (err) {
            console.error('Error fetching inventory manager chat threads:', err);
            // Ensure variables are always defined
            threads = threads || [];
            selectedThread = selectedThread || null;
            messages = messages || [];
        } finally {
            // Always render the template with defined variables
            console.log('=== Rendering InventoryManager Template ===');
            console.log('- threads type:', typeof threads);
            console.log('- threads length:', threads ? threads.length : 'undefined');
            console.log('- selectedThread:', selectedThread);
            console.log('- messages length:', messages ? messages.length : 'undefined');
            
            res.render('Employee/InventoryManager/InventoryChatSupport', { 
                user: req.session.user, 
                threads, 
                selectedThread, 
                messages,
                error: threads.length === 0 ? 'No chat threads found.' : null
            });
        }
    });

    // Inventory Manager - Orders
    const invManagerOrderRoutes = [
        { route: 'InventoryOrdersPending', status: 'Pending' },
        { route: 'InventoryOrdersProcessing', status: 'Processing' },
        { route: 'InventoryOrdersShipping', status: 'Shipping' },
        { route: 'InventoryOrdersDelivery', status: 'Delivery' },
        { route: 'InventoryOrdersReceive', status: 'Receive' },
        { route: 'InventoryCancelledOrders', status: 'Cancelled' },
        { route: 'InventoryCompletedOrders', status: 'Completed' }
    ];

    invManagerOrderRoutes.forEach(({ route, status }) => {
        // Map route to permission
        let permission = 'orders_orders_pending'; // default
        if (route.includes('Processing')) permission = 'orders_orders_processing';
        else if (route.includes('Shipping')) permission = 'orders_orders_shipping';
        else if (route.includes('Delivery')) permission = 'orders_orders_delivery';
        else if (route.includes('Receive')) permission = 'orders_orders_receive';
        else if (route.includes('Cancelled')) permission = 'orders_orders_cancelled';
        else if (route.includes('Completed')) permission = 'orders_orders_completed';
        
        router.get(`/Employee/InventoryManager/${route}`, isAuthenticated, checkPermission(permission), async (req, res) => {
            try {
                await pool.connect();
                const ordersResult = await pool.request()
                    .input('status', sql.NVarChar, status)
                    .query(`
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
                        WHERE o.Status = @status
                        ORDER BY o.OrderDate ASC
                    `);
                
                const orders = ordersResult.recordset;
                
                // Decrypt customer and address data for each order
                for (let order of orders) {
                    // Decrypt customer data
                    // Customer data is already plain text
                    
                    // Decrypt address data
                    // Return address data as plain text
                    const addressData = {
                        Label: order.AddressLabel,
                        HouseNumber: order.HouseNumber,
                        Street: order.Street,
                        Barangay: order.Barangay,
                        City: order.City,
                        Province: order.Province,
                        Region: order.Region,
                        PostalCode: order.PostalCode,
                        Country: order.Country
                    };
                    order.AddressLabel = addressData.Label;
                    order.HouseNumber = addressData.HouseNumber;
                    order.Street = addressData.Street;
                    order.Barangay = addressData.Barangay;
                    order.City = addressData.City;
                    order.Province = addressData.Province;
                    order.Region = addressData.Region;
                    order.PostalCode = addressData.PostalCode;
                    order.Country = addressData.Country;
                    
                    // Fetch items for each order
                    const itemsResult = await pool.request()
                        .input('orderId', sql.Int, order.OrderID)
                        .query(`
                            SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, oi.VariationID,
                                   p.Name, p.ImageURL,
                                   pv.VariationName, pv.Color, pv.VariationImageURL
                            FROM OrderItems oi
                            JOIN Products p ON oi.ProductID = p.ProductID
                            LEFT JOIN ProductVariations pv ON oi.VariationID = pv.VariationID
                            WHERE oi.OrderID = @orderId
                        `);
                    order.items = itemsResult.recordset;
                }
                
                res.render(`Employee/InventoryManager/${route}`, { 
                    user: req.session.user, 
                    orders: orders 
                });
            } catch (err) {
                console.error(`Error fetching ${status.toLowerCase()} orders:`, err);
                res.render(`Employee/InventoryManager/${route}`, { 
                    user: req.session.user, 
                    orders: [], 
                    error: `Failed to load ${status.toLowerCase()} orders.` 
                });
            }
        });
    });

    // =============================================================================
    // INVENTORY MANAGER ARCHIVED ITEMS REACTIVATION ROUTES
    // =============================================================================

    // POST route for reactivating archived products (used by InventoryArchived.ejs form)
    router.post('/Employee/InventoryManager/InventoryArchived/ReactivateProduct/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const productId = req.params.id;
            
            // First check if product exists and is archived
            const checkResult = await pool.request()
                .input('id', sql.Int, productId)
                .query('SELECT ProductID, Name, IsActive FROM Products WHERE ProductID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Product not found.');
                return res.redirect('/Employee/InventoryManager/InventoryArchived');
            }
            
            const product = checkResult.recordset[0];
            if (product.IsActive === 1) {
                req.flash('error', 'Product is already active.');
                return res.redirect('/Employee/InventoryManager/InventoryArchived');
            }
            
            // Reactivate the product (set IsActive = 1)
            await pool.request()
                .input('id', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 1 WHERE ProductID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `InventoryManager reactivated product: "${product.Name}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            req.flash('success', `Product "${product.Name}" has been reactivated and is now available on the Products page.`);
            res.redirect('/Employee/InventoryManager/InventoryArchived');
        } catch (err) {
            console.error('Error reactivating inventory manager product:', err);
            req.flash('error', 'Failed to reactivate product. Please try again.');
            res.redirect('/Employee/InventoryManager/InventoryArchived');
        }
    });

    // POST route for reactivating archived raw materials (used by InventoryArchived.ejs form)
    router.post('/Employee/InventoryManager/InventoryArchived/ReactivateMaterial/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const materialId = req.params.id;
            
            // First check if material exists and is archived
            const checkResult = await pool.request()
                .input('id', sql.Int, materialId)
                .query('SELECT MaterialID, Name, IsActive FROM RawMaterials WHERE MaterialID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Raw material not found.');
                return res.redirect('/Employee/InventoryManager/InventoryArchived');
            }
            
            const material = checkResult.recordset[0];
            if (material.IsActive === 1) {
                req.flash('error', 'Raw material is already active.');
                return res.redirect('/Employee/InventoryManager/InventoryArchived');
            }
            
            // Reactivate the raw material (set IsActive = 1)
            await pool.request()
                .input('id', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 1 WHERE MaterialID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialId.toString(),
                `InventoryManager reactivated raw material: "${material.Name}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            req.flash('success', `Raw material "${material.Name}" has been reactivated and is now available on the Raw Materials page.`);
            res.redirect('/Employee/InventoryManager/InventoryArchived');
        } catch (err) {
            console.error('Error reactivating inventory manager raw material:', err);
            req.flash('error', 'Failed to reactivate raw material. Please try again.');
            res.redirect('/Employee/InventoryManager/InventoryArchived');
        }
    });

    // =============================================================================
    // INVENTORY MANAGER API ROUTES
    // =============================================================================

    // InventoryManager Alerts Data API endpoint
    router.get('/Employee/InventoryManager/Alerts/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch products with low stock (≤ 20)
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity
                FROM Products 
                WHERE IsActive = 1 AND StockQuantity <= 20
                ORDER BY StockQuantity ASC
            `);
            
            // Fetch raw materials with low stock (≤ 20)
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit
                FROM RawMaterials 
                WHERE IsActive = 1 AND QuantityAvailable <= 20
                ORDER BY QuantityAvailable ASC
            `);
            
            res.json({
                success: true,
                products: productsResult.recordset,
                rawMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching InventoryManager alerts data:', err);
            res.json({
                success: false,
                products: [],
                rawMaterials: []
            });
        }
    });

    // InventoryManager Logs Data API endpoint with filtering support
    router.get('/Employee/InventoryManager/Logs/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const currentUserRole = req.session.user.role;
            
            // Get query parameters for filtering
            const {
                action,
                tableAffected,
                userRole,
                dateFrom,
                dateTo,
                search,
                limit = 1000,
                offset = 0
            } = req.query;
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Changes,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            // Add filters
            if (action) {
                query += ` AND al.Action = @action`;
                request.input('action', sql.NVarChar, action);
            }
            
            if (tableAffected) {
                query += ` AND al.TableAffected = @tableAffected`;
                request.input('tableAffected', sql.NVarChar, tableAffected);
            }
            
            if (userRole) {
                query += ` AND r.RoleName = @userRole`;
                request.input('userRole', sql.NVarChar, userRole);
            }
            
            if (dateFrom) {
                query += ` AND al.Timestamp >= @dateFrom`;
                request.input('dateFrom', sql.DateTime, new Date(dateFrom));
            }
            
            if (dateTo) {
                query += ` AND al.Timestamp <= @dateTo`;
                request.input('dateTo', sql.DateTime, new Date(dateTo));
            }
            
            if (search) {
                query += ` AND (al.Description LIKE @search OR u.FullName LIKE @search OR r.RoleName LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            // Add ordering and pagination
            query += ` ORDER BY al.Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            request.input('offset', sql.Int, parseInt(offset));
            request.input('limit', sql.Int, parseInt(limit));
            
            const result = await request.query(query);
            
            // Decrypt user FullName before sending to frontend using transparent encryption service
            const decryptedLogs = result.recordset.map(log => {
                return {
                    ...log,
                    FullName: log.FullName
                };
            });
            
            res.json({ success: true, logs: decryptedLogs });
        } catch (err) {
            console.error('Error fetching InventoryManager activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // Manager Index Routes - All roles can access by default
    router.get('/Employee/Transaction/TransactionManager', isAuthenticated, 
        (req, res) => handleEmployeeRoute(req, res, 'transactions', 'Employee/Transaction/TransactionManager'));

    router.get('/Employee/Inventory/InventoryManager', isAuthenticated, 
        (req, res) => handleEmployeeRoute(req, res, 'inventory', 'Employee/Inventory/InventoryManager'));

    router.get('/Employee/UserManager/UserManager', isAuthenticated, 
        (req, res) => handleEmployeeRoute(req, res, 'user_management', 'Employee/UserManager/UserManager'));

    router.get('/Employee/Support/SupportManager', isAuthenticated, 
        (req, res) => handleEmployeeRoute(req, res, 'support', 'Employee/Support/SupportManager'));

    // =============================================================================
    // TRANSACTION MANAGER ROUTES
    // =============================================================================
    
    // Transaction Manager Dashboard
    router.get('/Employee/TransactionManager', isAuthenticated, (req, res) => {
        console.log('=== TRANSACTION MANAGER ROUTE ACCESSED ===');
        console.log('Session ID:', req.sessionID);
        console.log('User in session:', req.session?.user);
        console.log('User role:', req.session?.user?.role);
        console.log('================================');
        res.render('Employee/TransactionManager/TransactionManager', { user: req.session.user });
    });

    // Transaction Manager - Products
    router.get('/Employee/TransactionManager/TransactionProducts', isAuthenticated, checkPermission('inventory_products'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);

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
                            CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
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
            res.render('Employee/TransactionManager/TransactionProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.render('Employee/TransactionManager/TransactionProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    // Transaction Manager - Materials
    router.get('/Employee/TransactionManager/TransactionMaterials', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM RawMaterials 
                WHERE IsActive = 1 
                ORDER BY Name ASC
            `);
            res.render('Employee/TransactionManager/TransactionMaterials', { 
                user: req.session.user, 
                materials: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            res.render('Employee/TransactionManager/TransactionMaterials', { 
                user: req.session.user, 
                materials: [], 
                error: 'Failed to load raw materials.' 
            });
        }
    });

    // Transaction Manager - Variations
    router.get('/Employee/TransactionManager/TransactionVariations', isAuthenticated, checkPermission('inventory_variations'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionVariations', { user: req.session.user });
    });

    // Transaction Manager - Archived
    router.get('/Employee/TransactionManager/TransactionArchived', isAuthenticated, checkPermission('inventory_archived'), async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    DateAdded,
                    IsActive
                FROM Products
                WHERE IsActive = 0
                ORDER BY DateAdded DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID,
                    Name,
                    QuantityAvailable,
                    Unit,
                    LastUpdated,
                    IsActive
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Categories are stored as a column in Products table, not a separate table
            const categoriesResult = { recordset: [] };
            
            res.render('Employee/TransactionManager/TransactionArchived', { 
                user: req.session.user, 
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset,
                archivedCategories: categoriesResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/TransactionManager/TransactionArchived', { 
                user: req.session.user, 
                archivedProducts: [],
                archivedMaterials: [],
                archivedCategories: [],
                error: 'Failed to load archived items.' 
            });
        }
    });

    // Transaction Manager - Alerts
    router.get('/Employee/TransactionManager/TransactionAlerts', isAuthenticated, checkPermission('inventory_alerts'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionAlerts', { user: req.session.user });
    });

    // Transaction Manager - Logs
    router.get('/Employee/TransactionManager/TransactionLogs', isAuthenticated, checkPermission('content_logs'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionLogs', { user: req.session.user });
    });

    // Transaction Manager - CMS
    router.get('/Employee/TransactionManager/TransactionCMS', isAuthenticated, checkPermission('content_cms'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionCMS', { user: req.session.user });
    });

    // Transaction Manager - Reviews
    router.get('/Employee/TransactionManager/TransactionReviews', isAuthenticated, checkPermission('reviews_reviews'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionReviews', { user: req.session.user });
    });

    // Transaction Manager - Delivery Rates
    router.get('/Employee/TransactionManager/TransactionRates', isAuthenticated, checkPermission('transactions_delivery_rates'), (req, res) => {
        res.render('Employee/TransactionManager/TransactionRates', { user: req.session.user });
    });

    // Transaction Manager - Walk In
    router.get('/Employee/TransactionManager/TransactionWalkIn', isAuthenticated, checkPermission('transactions_walk_in'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM WalkInOrders 
                ORDER BY CreatedAt DESC
            `);
            res.render('Employee/TransactionManager/TransactionWalkIn', { 
                user: req.session.user, 
                bulkOrders: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching walk-in orders:', err);
            res.render('Employee/TransactionManager/TransactionWalkIn', { 
                user: req.session.user, 
                bulkOrders: [], 
                error: 'Failed to load walk-in orders.' 
            });
        }
    });

    // Transaction Manager - Manage Users
    router.get('/Employee/TransactionManager/TransactionManageUsers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.*, r.RoleName 
                FROM Users u 
                LEFT JOIN Roles r ON u.RoleID = r.RoleID 
                ORDER BY u.CreatedAt DESC
            `);
            
            // Decrypt user data before sending to frontend using transparent encryption service
            const decryptedUsers = result.recordset;
            
            res.render('Employee/TransactionManager/TransactionManageUsers', { 
                user: req.session.user, 
                users: decryptedUsers 
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.render('Employee/TransactionManager/TransactionManageUsers', { 
                user: req.session.user, 
                users: [], 
                error: 'Failed to load users.' 
            });
        }
    });

    // Transaction Manager - Chat Support
    router.get('/Employee/TransactionManager/TransactionChatSupport', isAuthenticated, checkPermission('chat_chat_support'), async (req, res) => {
        let threads = [];
        let selectedThread = null;
        let messages = [];
        
        try {
            await pool.connect();
            
            // Fetch all chat threads
            const threadsResult = await pool.request().query(`
                SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber,
                       MAX(ct.CreatedAt) as LastMessageAt,
                       COUNT(ct.MessageID) as MessageCount
                FROM ChatThreads ct
                LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                GROUP BY ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                ORDER BY LastMessageAt DESC
            `);
            threads = threadsResult.recordset;
            
            // If a specific thread is selected, fetch its messages
            // Accept both ?thread= and ?threadId= for compatibility with the view
            const selectedThreadParam = req.query.thread || req.query.threadId;
            if (selectedThreadParam) {
                const threadId = selectedThreadParam;
                
                // Get thread info
                const threadResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                    `);
                
                if (threadResult.recordset.length > 0) {
                    selectedThread = threadResult.recordset[0];
                }
                
                // Get messages for this thread
                const messagesResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT ct.*, c.FullName as CustomerName
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                        ORDER BY ct.CreatedAt ASC
                    `);
                messages = messagesResult.recordset;
                
                console.log(`Found ${messages.length} messages for thread ${threadId}`);
            }
            
            console.log('Rendering template with:');
            console.log('- selectedThread:', selectedThread);
            console.log('- selectedThread type:', typeof selectedThread);
            console.log('- selectedThread.CustomerID:', selectedThread ? selectedThread.CustomerID : 'null');
            console.log('- messages count:', messages.length);
            
        } catch (err) {
            console.error('Error fetching transaction manager chat threads:', err);
            threads = threads || [];
            selectedThread = selectedThread || null;
            messages = messages || [];
        } finally {
            console.log('=== Rendering TransactionManager Template ===');
            console.log('- threads type:', typeof threads);
            console.log('- threads length:', threads ? threads.length : 'undefined');
            console.log('- selectedThread:', selectedThread);
            console.log('- messages length:', messages ? messages.length : 'undefined');
            
            res.render('Employee/TransactionManager/TransactionChatSupport', { 
                user: req.session.user, 
                threads, 
                selectedThread, 
                messages,
                error: threads.length === 0 ? 'No chat threads found.' : null
            });
        }
    });

    // Transaction Manager - Orders
    const transManagerOrderRoutes = [
        { route: 'TransactionOrdersPending', status: 'Pending' },
        { route: 'TransactionOrdersProcessing', status: 'Processing' },
        { route: 'TransactionOrdersShipping', status: 'Shipping' },
        { route: 'TransactionOrdersDelivery', status: 'Delivery' },
        { route: 'TransactionOrdersReceive', status: 'Received' },
        { route: 'TransactionCancelledOrders', status: 'Cancelled' },
        { route: 'TransactionCompletedOrders', status: 'Completed' }
    ];

    transManagerOrderRoutes.forEach(({ route, status }) => {
        // Map route to permission
        let permission = 'orders_orders_pending'; // default
        if (route.includes('Processing')) permission = 'orders_orders_processing';
        else if (route.includes('Shipping')) permission = 'orders_orders_shipping';
        else if (route.includes('Delivery')) permission = 'orders_orders_delivery';
        else if (route.includes('Receive')) permission = 'orders_orders_receive';
        else if (route.includes('Cancelled')) permission = 'orders_orders_cancelled';
        else if (route.includes('Completed')) permission = 'orders_orders_completed';
        
        router.get(`/Employee/TransactionManager/${route}`, isAuthenticated, checkPermission(permission), async (req, res) => {
            try {
                await pool.connect();
                const result = await pool.request()
                    .input('status', sql.NVarChar, status)
                    .query(`
                        SELECT o.*, c.FullName as CustomerName, c.Email as CustomerEmail
                        FROM Orders o
                        LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
                        WHERE o.Status = @status
                        ORDER BY o.OrderDate DESC
                    `);
                res.render(`Employee/TransactionManager/${route}`, { 
                    user: req.session.user, 
                    orders: result.recordset 
                });
            } catch (err) {
                console.error(`Error fetching ${status.toLowerCase()} orders:`, err);
                res.render(`Employee/TransactionManager/${route}`, { 
                    user: req.session.user, 
                    orders: [], 
                    error: `Failed to load ${status.toLowerCase()} orders.` 
                });
            }
        });
    });

    // Transaction Manager - Alerts Data API
    router.get('/Employee/TransactionManager/Alerts/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Get products with low stock
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity 
                FROM Products 
                WHERE IsActive = 1 AND StockQuantity <= 10
                ORDER BY StockQuantity ASC
            `);
            
            // Get raw materials with low stock
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit 
                FROM RawMaterials 
                WHERE IsActive = 1 AND QuantityAvailable <= 10
                ORDER BY QuantityAvailable ASC
            `);
            
            res.json({
                success: true,
                products: productsResult.recordset,
                rawMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching alerts data:', err);
            res.json({
                success: false,
                error: err.message
            });
        }
    });

    // Transaction Manager - Logs Data API endpoint with filtering support
    router.get('/Employee/TransactionManager/Logs/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const currentUserRole = req.session.user.role;
            
            // Get query parameters for filtering
            const {
                action,
                tableAffected,
                userRole,
                dateFrom,
                dateTo,
                search,
                limit = 1000,
                offset = 0
            } = req.query;
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Changes,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            // Add filters
            if (action) {
                query += ` AND al.Action = @action`;
                request.input('action', sql.NVarChar, action);
            }
            
            if (tableAffected) {
                query += ` AND al.TableAffected = @tableAffected`;
                request.input('tableAffected', sql.NVarChar, tableAffected);
            }
            
            if (userRole) {
                query += ` AND r.RoleName = @userRole`;
                request.input('userRole', sql.NVarChar, userRole);
            }
            
            if (dateFrom) {
                query += ` AND al.Timestamp >= @dateFrom`;
                request.input('dateFrom', sql.DateTime, new Date(dateFrom));
            }
            
            if (dateTo) {
                query += ` AND al.Timestamp <= @dateTo`;
                request.input('dateTo', sql.DateTime, new Date(dateTo));
            }
            
            if (search) {
                query += ` AND (al.Description LIKE @search OR u.FullName LIKE @search OR r.RoleName LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            // Add ordering and pagination
            query += ` ORDER BY al.Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            request.input('offset', sql.Int, parseInt(offset));
            request.input('limit', sql.Int, parseInt(limit));
            
            const result = await request.query(query);
            
            // Decrypt user FullName before sending to frontend using transparent encryption service
            const decryptedLogs = result.recordset.map(log => {
                return {
                    ...log,
                    FullName: log.FullName
                };
            });
            
            res.json({ success: true, logs: decryptedLogs });
        } catch (err) {
            console.error('Error fetching TransactionManager activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // =============================================================================
    // TRANSACTION MANAGER CRUD ROUTES
    // =============================================================================

    // Transaction Manager - Products CRUD
    router.post('/Employee/TransactionManager/TransactionProducts/Add', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Insert product
                const productResult = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), parseFloat(price))
                    .input('stockquantity', sql.Int, parseInt(stockquantity))
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .input('image', sql.NVarChar, req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : null)
                    .input('thumbnails', sql.NVarChar, req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : null)
                    .input('model3d', sql.NVarChar, req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : null)
                    .query(`
                        INSERT INTO Products (Name, Description, Price, StockQuantity, Category, ImageURL, Thumbnails, Model3DURL, CreatedAt, IsArchived)
                        OUTPUT INSERTED.ProductID
                        VALUES (@name, @description, @price, @stockquantity, @category, @image, @thumbnails, @model3d, GETDATE(), 0)
                    `);
                
                const productId = productResult.recordset[0].ProductID;
                
                // Handle required materials if provided
                if (requiredMaterials && requiredMaterials.length > 0) {
                    for (const materialId of requiredMaterials) {
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('materialId', sql.Int, parseInt(materialId))
                            .query(`
                                INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                VALUES (@productId, @materialId, GETDATE())
                            `);
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'INSERT',
                    'Products',
                    productId,
                    `Created new product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product added successfully', productId });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error adding product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add product',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionProducts/Edit', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { productId, name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Get current product data for logging
                const currentProduct = await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('SELECT * FROM Products WHERE ProductID = @productId');
                
                if (currentProduct.recordset.length === 0) {
                    throw new Error('Product not found');
                }
                
                const oldProduct = currentProduct.recordset[0];
                
                // Prepare update data
                const updateData = {
                    name: name || oldProduct.Name,
                    description: description || oldProduct.Description,
                    price: price ? parseFloat(price) : oldProduct.Price,
                    stockquantity: stockquantity ? parseInt(stockquantity) : oldProduct.StockQuantity,
                    category: category || oldProduct.Category,
                    image: req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : oldProduct.ImageURL,
                    thumbnails: req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : oldProduct.Thumbnails,
                    model3d: req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : oldProduct.Model3DURL
                };
                
                // Update product
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .input('name', sql.NVarChar, updateData.name)
                    .input('description', sql.NVarChar, updateData.description)
                    .input('price', sql.Decimal(10, 2), updateData.price)
                    .input('stockquantity', sql.Int, updateData.stockquantity)
                    .input('category', sql.NVarChar, updateData.category)
                    .input('image', sql.NVarChar, updateData.image)
                    .input('thumbnails', sql.NVarChar, updateData.thumbnails)
                    .input('model3d', sql.NVarChar, updateData.model3d)
                    .query(`
                        UPDATE Products 
                        SET Name = @name, Description = @description, Price = @price, 
                            StockQuantity = @stockquantity, Category = @category, 
                            ImageURL = @image, Thumbnails = @thumbnails, Model3DURL = @model3d,
                            UpdatedAt = GETDATE()
                        WHERE ProductID = @productId
                    `);
                
                // Update required materials if provided
                if (requiredMaterials !== undefined) {
                    // Remove existing materials
                    await transaction.request()
                        .input('productId', sql.Int, productId)
                        .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                    
                    // Add new materials
                    if (requiredMaterials && requiredMaterials.length > 0) {
                        for (const materialId of requiredMaterials) {
                            await transaction.request()
                                .input('productId', sql.Int, productId)
                                .input('materialId', sql.Int, parseInt(materialId))
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                    VALUES (@productId, @materialId, GETDATE())
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'UPDATE',
                    'Products',
                    productId,
                    `Updated product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product updated successfully' });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update product',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionProducts/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = req.params.id;
            
            // Get product info for logging
            const productResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT Name FROM Products WHERE ProductID = @productId');
            
            if (productResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            
            const productName = productResult.recordset[0].Name;
            
            // Archive the product instead of deleting
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0, UpdatedAt = GETDATE() WHERE ProductID = @productId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Products',
                productId,
                `Deleted product: "${productName}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Product archived successfully' });
        } catch (err) {
            console.error('Error archiving product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive product',
                error: err.message
            });
        }
    });

    // Transaction Manager - Materials CRUD
    router.post('/Employee/TransactionManager/TransactionMaterials/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { name, quantity, unit } = req.body;
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    INSERT INTO RawMaterials (Name, QuantityAvailable, Unit, LastUpdated, IsActive)
                    OUTPUT INSERTED.MaterialID
                    VALUES (@name, @quantity, @unit, GETDATE(), 1)
                `);
            
            const materialId = result.recordset[0].MaterialID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'RawMaterials',
                materialId,
                `Created new material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material added successfully', materialId });
        } catch (err) {
            console.error('Error adding material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add material',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionMaterials/Edit', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { materialId, name, quantity, unit } = req.body;
            
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    UPDATE RawMaterials 
                    SET Name = @name, QuantityAvailable = @quantity, Unit = @unit, LastUpdated = GETDATE()
                    WHERE MaterialID = @materialId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialId,
                `Updated material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material updated successfully' });
        } catch (err) {
            console.error('Error updating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update material',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionMaterials/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const materialId = req.params.id;
            
            // Get material info for logging
            const materialResult = await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            
            if (materialResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Material not found' });
            }
            
            const materialName = materialResult.recordset[0].Name;
            
            // Deactivate the material instead of deleting
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0, LastUpdated = GETDATE() WHERE MaterialID = @materialId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'RawMaterials',
                materialId,
                `Deleted material: "${materialName}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Material deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate material',
                error: err.message
            });
        }
    });

    // Transaction Manager - Variations CRUD
    router.post('/Employee/TransactionManager/TransactionVariations/Add', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/variations/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, parseInt(productID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, IsActive)
                    OUTPUT INSERTED.VariationID
                    VALUES (@productID, @variationName, @color, @quantity, @imageUrl, @isActive)
                `);
            
            const variationID = result.recordset[0].VariationID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" created`
            );
            
            res.json({ success: true, message: 'Variation added successfully', variationID });
        } catch (err) {
            console.error('Error adding variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionVariations/Edit', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationID, variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                // Get current variation image URL before updating
                const currentVariation = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                const currentImageUrl = currentVariation.recordset[0]?.VariationImageURL;
                
                // Delete old variation image
                await deleteOldImageFile(currentImageUrl);
                
                imageUrl = `/uploads/variations/${req.file.filename}`;
            } else {
                // If no new image uploaded, keep existing image
                const existingResult = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                if (existingResult.recordset.length > 0) {
                    imageUrl = existingResult.recordset[0].VariationImageURL;
                }
            }
            
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE ProductVariations 
                    SET VariationName = @variationName, Color = @color, Quantity = @quantity, 
                        VariationImageURL = @imageUrl, IsActive = @isActive
                    WHERE VariationID = @variationID
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" updated`
            );
            
            res.json({ success: true, message: 'Variation updated successfully' });
        } catch (err) {
            console.error('Error updating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionVariations/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const variationID = req.params.id;
            
            // Get variation info for logging
            const variationResult = await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('SELECT VariationName FROM ProductVariations WHERE VariationID = @variationID');
            
            if (variationResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Variation not found' });
            }
            
            const variationName = variationResult.recordset[0].VariationName;
            
            // Deactivate the variation instead of deleting
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('UPDATE ProductVariations SET IsActive = 0 WHERE VariationID = @variationID');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" deactivated`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Variation deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate variation',
                error: err.message
            });
        }
    });

    // Transaction Manager - Delivery Rates CRUD
    router.post('/Employee/TransactionManager/TransactionRates/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { serviceType, basePrice, isActive } = req.body;
            
            const result = await pool.request()
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .input('createdByUserID', sql.Int, req.session.user?.id || null)
                .input('createdByUsername', sql.NVarChar, req.session.user?.username || 'System')
                .query(`
                    INSERT INTO DeliveryRates (ServiceType, Price, IsActive, CreatedAt, CreatedByUserID, CreatedByUsername)
                    OUTPUT INSERTED.RateID
                    VALUES (@serviceType, @basePrice, @isActive, GETDATE(), @createdByUserID, @createdByUsername)
                `);
            
            const rateId = result.recordset[0].RateID;
            
            res.json({ success: true, message: 'Delivery rate added successfully', rateId });
        } catch (err) {
            console.error('Error adding delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add delivery rate',
                error: err.message
            });
        }
    });

    router.post('/Employee/TransactionManager/TransactionRates/Update/:rateId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { rateId } = req.params;
            const { serviceType, basePrice, isActive } = req.body;
            
            await pool.request()
                .input('rateId', sql.Int, rateId)
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE DeliveryRates 
                    SET ServiceType = @serviceType, Price = @basePrice, IsActive = @isActive
                    WHERE RateID = @rateId
                `);
            
            res.json({ success: true, message: 'Delivery rate updated successfully' });
        } catch (err) {
            console.error('Error updating delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update delivery rate',
                error: err.message
            });
        }
    });

    // Transaction Manager - Stock Update
    router.post('/Employee/TransactionManager/TransactionProducts/UpdateStock', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { productId, newStock } = req.body;
            
            // Get current stock quantity before updating
            const currentStockResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @productId');
            
            if (currentStockResult.recordset.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'Product not found.' 
                });
            }
            
            const oldStock = currentStockResult.recordset[0].StockQuantity;
            
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('newStock', sql.Int, newStock)
                .query(`
                    UPDATE Products 
                    SET StockQuantity = @newStock, UpdatedAt = GETDATE()
                    WHERE ProductID = @productId
                `);
            
            // Log the activity with actual changes
            const changes = JSON.stringify({
                StockQuantity: {
                    old: oldStock,
                    new: newStock
                }
            });
            
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId,
                `TransactionManager updated stock quantity from ${oldStock} to ${newStock} for product ID: ${productId}`,
                changes
            );
            
            res.json({ success: true, message: 'Stock updated successfully' });
        } catch (err) {
            console.error('Error updating stock:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update stock',
                error: err.message
            });
        }
    });

    // =============================================================================
    // USER MANAGER ROUTES
    // =============================================================================
    
    // User Manager Dashboard
    router.get('/Employee/UserManager', isAuthenticated, (req, res) => {
        console.log('=== USER MANAGER ROUTE ACCESSED ===');
        console.log('Session ID:', req.sessionID);
        console.log('User in session:', req.session?.user);
        console.log('User role:', req.session?.user?.role);
        console.log('================================');
        res.render('Employee/UserManager/UserManager', { user: req.session.user });
    });

    // User Manager - Products
    router.get('/Employee/UserManager/UserProducts', isAuthenticated, checkPermission('inventory_products'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);

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
                            CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
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
            res.render('Employee/UserManager/UserProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.render('Employee/UserManager/UserProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    // User Manager - Materials
    router.get('/Employee/UserManager/UserMaterials', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM RawMaterials 
                WHERE IsActive = 1 
                ORDER BY Name ASC
            `);
            res.render('Employee/UserManager/UserMaterials', { 
                user: req.session.user, 
                materials: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            res.render('Employee/UserManager/UserMaterials', { 
                user: req.session.user, 
                materials: [], 
                error: 'Failed to load raw materials.' 
            });
        }
    });

    // User Manager - Variations
    router.get('/Employee/UserManager/UserVariations', isAuthenticated, checkPermission('inventory_variations'), (req, res) => {
        res.render('Employee/UserManager/UserVariations', { user: req.session.user });
    });

    // User Manager - Archived
    router.get('/Employee/UserManager/UserArchived', isAuthenticated, checkPermission('inventory_archived'), async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    DateAdded,
                    IsActive
                FROM Products
                WHERE IsActive = 0
                ORDER BY DateAdded DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID,
                    Name,
                    QuantityAvailable,
                    Unit,
                    LastUpdated,
                    IsActive
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Categories are stored as a column in Products table, not a separate table
            const categoriesResult = { recordset: [] };
            
            res.render('Employee/UserManager/UserArchived', { 
                user: req.session.user, 
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset,
                archivedCategories: categoriesResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/UserManager/UserArchived', { 
                user: req.session.user, 
                archivedProducts: [],
                archivedMaterials: [],
                archivedCategories: [],
                error: 'Failed to load archived items.' 
            });
        }
    });

    // User Manager - Alerts
    router.get('/Employee/UserManager/UserAlerts', isAuthenticated, checkPermission('inventory_alerts'), (req, res) => {
        res.render('Employee/UserManager/UserAlerts', { user: req.session.user });
    });

    // User Manager - Logs
    router.get('/Employee/UserManager/UserLogs', isAuthenticated, checkPermission('content_logs'), (req, res) => {
        res.render('Employee/UserManager/UserLogs', { user: req.session.user });
    });

    // User Manager - CMS
    router.get('/Employee/UserManager/UserCMS', isAuthenticated, checkPermission('content_cms'), (req, res) => {
        res.render('Employee/UserManager/UserCMS', { user: req.session.user });
    });

    // User Manager - Reviews
    router.get('/Employee/UserManager/UserReviews', isAuthenticated, checkPermission('reviews_reviews'), (req, res) => {
        res.render('Employee/UserManager/UserReviews', { user: req.session.user });
    });

    // User Manager - Delivery Rates
    router.get('/Employee/UserManager/UserRates', isAuthenticated, checkPermission('transactions_delivery_rates'), (req, res) => {
        res.render('Employee/UserManager/UserRates', { user: req.session.user });
    });

    // User Manager - Walk In
    router.get('/Employee/UserManager/UserWalkIn', isAuthenticated, checkPermission('transactions_walk_in'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM WalkInOrders 
                ORDER BY CreatedAt DESC
            `);
            res.render('Employee/UserManager/UserWalkIn', { 
                user: req.session.user, 
                bulkOrders: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching walk-in orders:', err);
            res.render('Employee/UserManager/UserWalkIn', { 
                user: req.session.user, 
                bulkOrders: [], 
                error: 'Failed to load walk-in orders.' 
            });
        }
    });

    // User Manager - Manage Users
    router.get('/Employee/UserManager/UserManageUsers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.*, r.RoleName 
                FROM Users u 
                LEFT JOIN Roles r ON u.RoleID = r.RoleID 
                ORDER BY u.CreatedAt DESC
            `);
            
            // Decrypt user data before sending to frontend using transparent encryption service
            const decryptedUsers = result.recordset;
            
            res.render('Employee/UserManager/UserManageUsers', { 
                user: req.session.user, 
                users: decryptedUsers 
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.render('Employee/UserManager/UserManageUsers', { 
                user: req.session.user, 
                users: [], 
                error: 'Failed to load users.' 
            });
        }
    });

    // User Manager - Chat Support
    router.get('/Employee/UserManager/UserChatSupport', isAuthenticated, checkPermission('chat_chat_support'), async (req, res) => {
        let threads = [];
        let selectedThread = null;
        let messages = [];
        
        try {
            await pool.connect();
            
            // Fetch all chat threads
            const threadsResult = await pool.request().query(`
                SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber,
                       MAX(ct.CreatedAt) as LastMessageAt,
                       COUNT(ct.MessageID) as MessageCount
                FROM ChatThreads ct
                LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                GROUP BY ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                ORDER BY LastMessageAt DESC
            `);
            threads = threadsResult.recordset;
            
            // If a specific thread is selected, fetch its messages
            if (req.query.threadId) {
                const threadId = req.query.threadId;
                
                // Get thread info
                const threadResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                    `);
                
                if (threadResult.recordset.length > 0) {
                    selectedThread = threadResult.recordset[0];
                }
                
                // Get messages for this thread
                const messagesResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT ct.*, c.FullName as CustomerName
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                        ORDER BY ct.CreatedAt ASC
                    `);
                messages = messagesResult.recordset;
                
                console.log(`Found ${messages.length} messages for thread ${threadId}`);
            }
            
            console.log('Rendering template with:');
            console.log('- selectedThread:', selectedThread);
            console.log('- selectedThread type:', typeof selectedThread);
            console.log('- selectedThread.CustomerID:', selectedThread ? selectedThread.CustomerID : 'null');
            console.log('- messages count:', messages.length);
            
        } catch (err) {
            console.error('Error fetching user manager chat threads:', err);
            threads = threads || [];
            selectedThread = selectedThread || null;
            messages = messages || [];
        } finally {
            console.log('=== Rendering UserManager Template ===');
            console.log('- threads type:', typeof threads);
            console.log('- threads length:', threads ? threads.length : 'undefined');
            console.log('- selectedThread:', selectedThread);
            console.log('- messages length:', messages ? messages.length : 'undefined');
            
            res.render('Employee/UserManager/UserChatSupport', { 
                user: req.session.user, 
                threads, 
                selectedThread, 
                messages,
                error: threads.length === 0 ? 'No chat threads found.' : null
            });
        }
    });

    // User Manager - Orders
    const userManagerOrderRoutes = [
        { route: 'UserOrdersPending', status: 'Pending' },
        { route: 'UserOrdersProcessing', status: 'Processing' },
        { route: 'UserOrdersShipping', status: 'Shipping' },
        { route: 'UserOrdersDelivery', status: 'Delivery' },
        { route: 'UserOrdersReceive', status: 'Received' },
        { route: 'UserCancelledOrders', status: 'Cancelled' },
        { route: 'UserCompletedOrders', status: 'Completed' }
    ];

    userManagerOrderRoutes.forEach(({ route, status }) => {
        // Map route to permission
        let permission = 'orders_orders_pending'; // default
        if (route.includes('Processing')) permission = 'orders_orders_processing';
        else if (route.includes('Shipping')) permission = 'orders_orders_shipping';
        else if (route.includes('Delivery')) permission = 'orders_orders_delivery';
        else if (route.includes('Receive')) permission = 'orders_orders_receive';
        else if (route.includes('Cancelled')) permission = 'orders_orders_cancelled';
        else if (route.includes('Completed')) permission = 'orders_orders_completed';
        
        router.get(`/Employee/UserManager/${route}`, isAuthenticated, checkPermission(permission), async (req, res) => {
            try {
                await pool.connect();
                const result = await pool.request()
                    .input('status', sql.NVarChar, status)
                    .query(`
                        SELECT o.*, c.FullName as CustomerName, c.Email as CustomerEmail
                        FROM Orders o
                        LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
                        WHERE o.Status = @status
                        ORDER BY o.OrderDate DESC
                    `);
                res.render(`Employee/UserManager/${route}`, { 
                    user: req.session.user, 
                    orders: result.recordset 
                });
            } catch (err) {
                console.error(`Error fetching ${status.toLowerCase()} orders:`, err);
                res.render(`Employee/UserManager/${route}`, { 
                    user: req.session.user, 
                    orders: [], 
                    error: `Failed to load ${status.toLowerCase()} orders.` 
                });
            }
        });
    });

    // User Manager - Alerts Data API
    router.get('/Employee/UserManager/Alerts/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Get products with low stock
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity 
                FROM Products 
                WHERE IsActive = 1 AND StockQuantity <= 10
                ORDER BY StockQuantity ASC
            `);
            
            // Get raw materials with low stock
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit 
                FROM RawMaterials 
                WHERE IsActive = 1 AND QuantityAvailable <= 10
                ORDER BY QuantityAvailable ASC
            `);
            
            res.json({
                success: true,
                products: productsResult.recordset,
                rawMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching alerts data:', err);
            res.json({
                success: false,
                error: err.message
            });
        }
    });

    // User Manager - Logs Data API endpoint with filtering support
    router.get('/Employee/UserManager/Logs/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const currentUserRole = req.session.user.role;
            
            // Get query parameters for filtering
            const {
                action,
                tableAffected,
                userRole,
                dateFrom,
                dateTo,
                search,
                limit = 1000,
                offset = 0
            } = req.query;
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Changes,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            // Add filters
            if (action) {
                query += ` AND al.Action = @action`;
                request.input('action', sql.NVarChar, action);
            }
            
            if (tableAffected) {
                query += ` AND al.TableAffected = @tableAffected`;
                request.input('tableAffected', sql.NVarChar, tableAffected);
            }
            
            if (userRole) {
                query += ` AND r.RoleName = @userRole`;
                request.input('userRole', sql.NVarChar, userRole);
            }
            
            if (dateFrom) {
                query += ` AND al.Timestamp >= @dateFrom`;
                request.input('dateFrom', sql.DateTime, new Date(dateFrom));
            }
            
            if (dateTo) {
                query += ` AND al.Timestamp <= @dateTo`;
                request.input('dateTo', sql.DateTime, new Date(dateTo));
            }
            
            if (search) {
                query += ` AND (al.Description LIKE @search OR u.FullName LIKE @search OR r.RoleName LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            // Add ordering and pagination
            query += ` ORDER BY al.Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            request.input('offset', sql.Int, parseInt(offset));
            request.input('limit', sql.Int, parseInt(limit));
            
            const result = await request.query(query);
            
            // Decrypt user FullName before sending to frontend using transparent encryption service
            const decryptedLogs = result.recordset.map(log => {
                return {
                    ...log,
                    FullName: log.FullName
                };
            });
            
            res.json({ success: true, logs: decryptedLogs });
        } catch (err) {
            console.error('Error fetching UserManager activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // =============================================================================
    // TRANSACTION MANAGER ORDER PROCESSING ROUTES
    // =============================================================================

    // Transaction Manager OrdersPending: Proceed to Processing
    router.post('/Employee/TransactionManager/TransactionOrdersPending/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Processing by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Transaction Manager OrdersPending: Cancel order
    router.post('/Employee/TransactionManager/TransactionOrdersPending/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Transaction Manager OrdersProcessing: Proceed to Shipping
    router.post('/Employee/TransactionManager/TransactionOrdersProcessing/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Shipping by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Transaction Manager OrdersProcessing: Cancel order
    router.post('/Employee/TransactionManager/TransactionOrdersProcessing/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Transaction Manager OrdersShipping: Proceed to Delivery
    router.post('/Employee/TransactionManager/TransactionOrdersShipping/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Delivery by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Transaction Manager OrdersShipping: Cancel order
    router.post('/Employee/TransactionManager/TransactionOrdersShipping/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Transaction Manager OrdersDelivery: Proceed to Received
    router.post('/Employee/TransactionManager/TransactionOrdersDelivery/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Received' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Received by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Transaction Manager OrdersDelivery: Cancel order
    router.post('/Employee/TransactionManager/TransactionOrdersDelivery/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Transaction Manager OrdersReceive: Proceed to Completed
    router.post('/Employee/TransactionManager/TransactionOrdersReceive/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Completed' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} completed by Transaction Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // =============================================================================
    // USER MANAGER CRUD ROUTES
    // =============================================================================

    // User Manager - Products CRUD
    router.post('/Employee/UserManager/UserProducts/Add', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Insert product
                const productResult = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), parseFloat(price))
                    .input('stockquantity', sql.Int, parseInt(stockquantity))
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .input('image', sql.NVarChar, req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : null)
                    .input('thumbnails', sql.NVarChar, req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : null)
                    .input('model3d', sql.NVarChar, req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : null)
                    .query(`
                        INSERT INTO Products (Name, Description, Price, StockQuantity, Category, ImageURL, Thumbnails, Model3DURL, CreatedAt, IsArchived)
                        OUTPUT INSERTED.ProductID
                        VALUES (@name, @description, @price, @stockquantity, @category, @image, @thumbnails, @model3d, GETDATE(), 0)
                    `);
                
                const productId = productResult.recordset[0].ProductID;
                
                // Handle required materials if provided
                if (requiredMaterials && requiredMaterials.length > 0) {
                    for (const materialId of requiredMaterials) {
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('materialId', sql.Int, parseInt(materialId))
                            .query(`
                                INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                VALUES (@productId, @materialId, GETDATE())
                            `);
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'INSERT',
                    'Products',
                    productId,
                    `Created new product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product added successfully', productId });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error adding product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add product',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserProducts/Edit', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { productId, name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Get current product data for logging
                const currentProduct = await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('SELECT * FROM Products WHERE ProductID = @productId');
                
                if (currentProduct.recordset.length === 0) {
                    throw new Error('Product not found');
                }
                
                const oldProduct = currentProduct.recordset[0];
                
                // Prepare update data
                const updateData = {
                    name: name || oldProduct.Name,
                    description: description || oldProduct.Description,
                    price: price ? parseFloat(price) : oldProduct.Price,
                    stockquantity: stockquantity ? parseInt(stockquantity) : oldProduct.StockQuantity,
                    category: category || oldProduct.Category,
                    image: req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : oldProduct.ImageURL,
                    thumbnails: req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : oldProduct.Thumbnails,
                    model3d: req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : oldProduct.Model3DURL
                };
                
                // Update product
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .input('name', sql.NVarChar, updateData.name)
                    .input('description', sql.NVarChar, updateData.description)
                    .input('price', sql.Decimal(10, 2), updateData.price)
                    .input('stockquantity', sql.Int, updateData.stockquantity)
                    .input('category', sql.NVarChar, updateData.category)
                    .input('image', sql.NVarChar, updateData.image)
                    .input('thumbnails', sql.NVarChar, updateData.thumbnails)
                    .input('model3d', sql.NVarChar, updateData.model3d)
                    .query(`
                        UPDATE Products 
                        SET Name = @name, Description = @description, Price = @price, 
                            StockQuantity = @stockquantity, Category = @category, 
                            ImageURL = @image, Thumbnails = @thumbnails, Model3DURL = @model3d,
                            UpdatedAt = GETDATE()
                        WHERE ProductID = @productId
                    `);
                
                // Update required materials if provided
                if (requiredMaterials !== undefined) {
                    // Remove existing materials
                    await transaction.request()
                        .input('productId', sql.Int, productId)
                        .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                    
                    // Add new materials
                    if (requiredMaterials && requiredMaterials.length > 0) {
                        for (const materialId of requiredMaterials) {
                            await transaction.request()
                                .input('productId', sql.Int, productId)
                                .input('materialId', sql.Int, parseInt(materialId))
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                    VALUES (@productId, @materialId, GETDATE())
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'UPDATE',
                    'Products',
                    productId,
                    `Updated product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product updated successfully' });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update product',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserProducts/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = req.params.id;
            
            // Get product info for logging
            const productResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT Name FROM Products WHERE ProductID = @productId');
            
            if (productResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            
            const productName = productResult.recordset[0].Name;
            
            // Archive the product instead of deleting
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0, UpdatedAt = GETDATE() WHERE ProductID = @productId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Products',
                productId,
                `Deleted product: "${productName}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Product archived successfully' });
        } catch (err) {
            console.error('Error archiving product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive product',
                error: err.message
            });
        }
    });

    // User Manager - Materials CRUD
    router.post('/Employee/UserManager/UserMaterials/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { name, quantity, unit } = req.body;
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    INSERT INTO RawMaterials (Name, QuantityAvailable, Unit, LastUpdated, IsActive)
                    OUTPUT INSERTED.MaterialID
                    VALUES (@name, @quantity, @unit, GETDATE(), 1)
                `);
            
            const materialId = result.recordset[0].MaterialID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'RawMaterials',
                materialId,
                `Created new material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material added successfully', materialId });
        } catch (err) {
            console.error('Error adding material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add material',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserMaterials/Edit', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { materialId, name, quantity, unit } = req.body;
            
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    UPDATE RawMaterials 
                    SET Name = @name, QuantityAvailable = @quantity, Unit = @unit, LastUpdated = GETDATE()
                    WHERE MaterialID = @materialId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialId,
                `Updated material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material updated successfully' });
        } catch (err) {
            console.error('Error updating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update material',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserMaterials/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const materialId = req.params.id;
            
            // Get material info for logging
            const materialResult = await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            
            if (materialResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Material not found' });
            }
            
            const materialName = materialResult.recordset[0].Name;
            
            // Deactivate the material instead of deleting
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0, LastUpdated = GETDATE() WHERE MaterialID = @materialId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'RawMaterials',
                materialId,
                `Deleted material: "${materialName}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Material deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate material',
                error: err.message
            });
        }
    });

    // User Manager - Variations CRUD
    router.post('/Employee/UserManager/UserVariations/Add', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/variations/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, parseInt(productID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, IsActive)
                    OUTPUT INSERTED.VariationID
                    VALUES (@productID, @variationName, @color, @quantity, @imageUrl, @isActive)
                `);
            
            const variationID = result.recordset[0].VariationID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" created`
            );
            
            res.json({ success: true, message: 'Variation added successfully', variationID });
        } catch (err) {
            console.error('Error adding variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserVariations/Edit', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationID, variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                // Get current variation image URL before updating
                const currentVariation = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                const currentImageUrl = currentVariation.recordset[0]?.VariationImageURL;
                
                // Delete old variation image
                await deleteOldImageFile(currentImageUrl);
                
                imageUrl = `/uploads/variations/${req.file.filename}`;
            } else {
                // If no new image uploaded, keep existing image
                const existingResult = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                if (existingResult.recordset.length > 0) {
                    imageUrl = existingResult.recordset[0].VariationImageURL;
                }
            }
            
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE ProductVariations 
                    SET VariationName = @variationName, Color = @color, Quantity = @quantity, 
                        VariationImageURL = @imageUrl, IsActive = @isActive
                    WHERE VariationID = @variationID
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" updated`
            );
            
            res.json({ success: true, message: 'Variation updated successfully' });
        } catch (err) {
            console.error('Error updating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserVariations/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const variationID = req.params.id;
            
            // Get variation info for logging
            const variationResult = await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('SELECT VariationName FROM ProductVariations WHERE VariationID = @variationID');
            
            if (variationResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Variation not found' });
            }
            
            const variationName = variationResult.recordset[0].VariationName;
            
            // Deactivate the variation instead of deleting
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('UPDATE ProductVariations SET IsActive = 0 WHERE VariationID = @variationID');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" deactivated`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Variation deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate variation',
                error: err.message
            });
        }
    });

    // User Manager - Delivery Rates CRUD
    router.post('/Employee/UserManager/UserRates/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { serviceType, basePrice, isActive } = req.body;
            
            const result = await pool.request()
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .input('createdByUserID', sql.Int, req.session.user?.id || null)
                .input('createdByUsername', sql.NVarChar, req.session.user?.username || 'System')
                .query(`
                    INSERT INTO DeliveryRates (ServiceType, Price, IsActive, CreatedAt, CreatedByUserID, CreatedByUsername)
                    OUTPUT INSERTED.RateID
                    VALUES (@serviceType, @basePrice, @isActive, GETDATE(), @createdByUserID, @createdByUsername)
                `);
            
            const rateId = result.recordset[0].RateID;
            
            res.json({ success: true, message: 'Delivery rate added successfully', rateId });
        } catch (err) {
            console.error('Error adding delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add delivery rate',
                error: err.message
            });
        }
    });

    router.post('/Employee/UserManager/UserRates/Update/:rateId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { rateId } = req.params;
            const { serviceType, basePrice, isActive } = req.body;
            
            await pool.request()
                .input('rateId', sql.Int, rateId)
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE DeliveryRates 
                    SET ServiceType = @serviceType, Price = @basePrice, IsActive = @isActive
                    WHERE RateID = @rateId
                `);
            
            res.json({ success: true, message: 'Delivery rate updated successfully' });
        } catch (err) {
            console.error('Error updating delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update delivery rate',
                error: err.message
            });
        }
    });

    // User Manager - Stock Update
    router.post('/Employee/UserManager/UserProducts/UpdateStock', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { productId, newStock } = req.body;
            
            // Get current stock quantity before updating
            const currentStockResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @productId');
            
            if (currentStockResult.recordset.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'Product not found.' 
                });
            }
            
            const oldStock = currentStockResult.recordset[0].StockQuantity;
            
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('newStock', sql.Int, newStock)
                .query(`
                    UPDATE Products 
                    SET StockQuantity = @newStock, UpdatedAt = GETDATE()
                    WHERE ProductID = @productId
                `);
            
            // Log the activity with actual changes
            const changes = JSON.stringify({
                StockQuantity: {
                    old: oldStock,
                    new: newStock
                }
            });
            
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId,
                `UserManager updated stock quantity from ${oldStock} to ${newStock} for product ID: ${productId}`,
                changes
            );
            
            res.json({ success: true, message: 'Stock updated successfully' });
        } catch (err) {
            console.error('Error updating stock:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update stock',
                error: err.message
            });
        }
    });

    // =============================================================================
    // USER MANAGER ORDER PROCESSING ROUTES
    // =============================================================================

    // User Manager OrdersPending: Proceed to Processing
    router.post('/Employee/UserManager/UserOrdersPending/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Processing by User Manager`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // User Manager OrdersPending: Cancel order
    router.post('/Employee/UserManager/UserOrdersPending/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                orderId,
                `Order #${orderId} cancelled by User Manager - stock restored`,
                { 
                    oldStatus: 'Pending', 
                    newStatus: 'Cancelled',
                    itemsRestored: orderItemsResult.recordset.length
                },
                'UserManager'
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // User Manager OrdersProcessing: Proceed to Shipping
    router.post('/Employee/UserManager/UserOrdersProcessing/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                orderId,
                `Order #${orderId} status changed to Shipping by User Manager`,
                { oldStatus: 'Processing', newStatus: 'Shipping' },
                'UserManager'
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // User Manager OrdersProcessing: Cancel order
    router.post('/Employee/UserManager/UserOrdersProcessing/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // User Manager OrdersShipping: Proceed to Delivery
    router.post('/Employee/UserManager/UserOrdersShipping/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                orderId,
                `Order #${orderId} status changed to Delivery by User Manager`,
                { oldStatus: 'Shipping', newStatus: 'Delivery' },
                'UserManager'
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // User Manager OrdersShipping: Cancel order
    router.post('/Employee/UserManager/UserOrdersShipping/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // User Manager OrdersDelivery: Proceed to Received
    router.post('/Employee/UserManager/UserOrdersDelivery/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Received' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                orderId,
                `Order #${orderId} status changed to Received by User Manager`,
                { oldStatus: 'Delivery', newStatus: 'Received' },
                'UserManager'
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // User Manager OrdersDelivery: Cancel order
    router.post('/Employee/UserManager/UserOrdersDelivery/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // User Manager OrdersReceive: Proceed to Completed
    router.post('/Employee/UserManager/UserOrdersReceive/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Completed' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'COMPLETE',
                orderId,
                `Order #${orderId} completed by User Manager`,
                { oldStatus: 'Received', newStatus: 'Completed' },
                'UserManager'
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // =============================================================================
    // ORDER SUPPORT ROUTES
    // =============================================================================
    
    // Order Support Dashboard
    router.get('/Employee/OrderSupport', isAuthenticated, (req, res) => {
        console.log('=== ORDER SUPPORT ROUTE ACCESSED ===');
        console.log('Session ID:', req.sessionID);
        console.log('User in session:', req.session?.user);
        console.log('User role:', req.session?.user?.role);
        console.log('================================');
        res.render('Employee/OrderSupport/OrderManager', { user: req.session.user });
    });

    // Order Support - Products
    router.get('/Employee/OrderSupport/OrderProducts', isAuthenticated, checkPermission('inventory_products'), async (req, res) => {
        try {
            await pool.connect();
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
            const total = countResult.recordset[0].count;
            const totalPages = Math.ceil(total / limit);

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
                            CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
                        ELSE p.Price
                    END as DiscountedPrice,
                    CASE 
                        WHEN pd.DiscountType = 'percentage' THEN 
                            p.Price * pd.DiscountValue / 100
                        WHEN pd.DiscountType = 'fixed' THEN 
                            CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
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
            res.render('Employee/OrderSupport/OrderProducts', { user: req.session.user, products, page, totalPages });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.render('Employee/OrderSupport/OrderProducts', { user: req.session.user, products: [], page: 1, totalPages: 1 });
        }
    });

    // Order Support - Materials
    router.get('/Employee/OrderSupport/OrderMaterials', isAuthenticated, checkPermission('inventory_materials'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM RawMaterials 
                WHERE IsActive = 1 
                ORDER BY Name ASC
            `);
            res.render('Employee/OrderSupport/OrderMaterials', { 
                user: req.session.user, 
                materials: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            res.render('Employee/OrderSupport/OrderMaterials', { 
                user: req.session.user, 
                materials: [], 
                error: 'Failed to load raw materials.' 
            });
        }
    });

    // Order Support - Variations
    router.get('/Employee/OrderSupport/OrderVariations', isAuthenticated, checkPermission('inventory_variations'), (req, res) => {
        res.render('Employee/OrderSupport/OrderVariations', { user: req.session.user });
    });

    // Order Support - Archived
    router.get('/Employee/OrderSupport/OrderArchived', isAuthenticated, checkPermission('inventory_archived'), async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    DateAdded,
                    IsActive
                FROM Products
                WHERE IsActive = 0
                ORDER BY DateAdded DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID,
                    Name,
                    QuantityAvailable,
                    Unit,
                    LastUpdated,
                    IsActive
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Categories are stored as a column in Products table, not a separate table
            const categoriesResult = { recordset: [] };
            
            res.render('Employee/OrderSupport/OrderArchived', { 
                user: req.session.user, 
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset,
                archivedCategories: categoriesResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.render('Employee/OrderSupport/OrderArchived', { 
                user: req.session.user, 
                archivedProducts: [],
                archivedMaterials: [],
                archivedCategories: [],
                error: 'Failed to load archived items.' 
            });
        }
    });

    // Order Support - Alerts
    router.get('/Employee/OrderSupport/OrderAlerts', isAuthenticated, checkPermission('inventory_alerts'), (req, res) => {
        res.render('Employee/OrderSupport/OrderAlerts', { user: req.session.user });
    });

    // Order Support - Logs
    router.get('/Employee/OrderSupport/OrderLogs', isAuthenticated, checkPermission('content_logs'), (req, res) => {
        res.render('Employee/OrderSupport/OrderLogs', { user: req.session.user });
    });

    // Order Support - CMS
    router.get('/Employee/OrderSupport/OrderCMS', isAuthenticated, checkPermission('content_cms'), (req, res) => {
        res.render('Employee/OrderSupport/OrderCMS', { user: req.session.user });
    });

    // Order Support - Reviews
    router.get('/Employee/OrderSupport/OrderReviews', isAuthenticated, checkPermission('reviews_reviews'), (req, res) => {
        res.render('Employee/OrderSupport/OrderReviews', { user: req.session.user });
    });

    // Order Support - Delivery Rates
    router.get('/Employee/OrderSupport/OrderRates', isAuthenticated, checkPermission('transactions_delivery_rates'), (req, res) => {
        res.render('Employee/OrderSupport/OrderRates', { user: req.session.user });
    });

    // Order Support - Walk In
    router.get('/Employee/OrderSupport/OrderWalkIn', isAuthenticated, checkPermission('transactions_walk_in'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT * FROM WalkInOrders 
                ORDER BY CreatedAt DESC
            `);
            res.render('Employee/OrderSupport/OrderWalkIn', { 
                user: req.session.user, 
                bulkOrders: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching walk-in orders:', err);
            res.render('Employee/OrderSupport/OrderWalkIn', { 
                user: req.session.user, 
                bulkOrders: [], 
                error: 'Failed to load walk-in orders.' 
            });
        }
    });

    // Order Support - Manage Users
    router.get('/Employee/OrderSupport/OrderManageUsers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT u.*, r.RoleName 
                FROM Users u 
                LEFT JOIN Roles r ON u.RoleID = r.RoleID 
                ORDER BY u.CreatedAt DESC
            `);
            
            // Decrypt user data before sending to frontend using transparent encryption service
            const decryptedUsers = result.recordset;
            
            res.render('Employee/OrderSupport/OrderManageUsers', { 
                user: req.session.user, 
                users: decryptedUsers 
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.render('Employee/OrderSupport/OrderManageUsers', { 
                user: req.session.user, 
                users: [], 
                error: 'Failed to load users.' 
            });
        }
    });

    // Order Support - Chat Support
    router.get('/Employee/OrderSupport/OrderChatSupport', isAuthenticated, checkPermission('chat_chat_support'), async (req, res) => {
        let threads = [];
        let selectedThread = null;
        let messages = [];
        
        try {
            await pool.connect();
            
            // Fetch all chat threads
            const threadsResult = await pool.request().query(`
                SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber,
                       MAX(ct.CreatedAt) as LastMessageAt,
                       COUNT(ct.MessageID) as MessageCount
                FROM ChatThreads ct
                LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                GROUP BY ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                ORDER BY LastMessageAt DESC
            `);
            threads = threadsResult.recordset;
            
            // If a specific thread is selected, fetch its messages
            if (req.query.threadId) {
                const threadId = req.query.threadId;
                
                // Get thread info
                const threadResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT DISTINCT ct.CustomerID, c.FullName, c.Email, c.PhoneNumber
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                    `);
                
                if (threadResult.recordset.length > 0) {
                    selectedThread = threadResult.recordset[0];
                }
                
                // Get messages for this thread
                const messagesResult = await pool.request()
                    .input('customerId', sql.Int, threadId)
                    .query(`
                        SELECT ct.*, c.FullName as CustomerName
                        FROM ChatThreads ct
                        LEFT JOIN Customers c ON ct.CustomerID = c.CustomerID
                        WHERE ct.CustomerID = @customerId
                        ORDER BY ct.CreatedAt ASC
                    `);
                messages = messagesResult.recordset;
                
                console.log(`Found ${messages.length} messages for thread ${threadId}`);
            }
            
            console.log('Rendering template with:');
            console.log('- selectedThread:', selectedThread);
            console.log('- selectedThread type:', typeof selectedThread);
            console.log('- selectedThread.CustomerID:', selectedThread ? selectedThread.CustomerID : 'null');
            console.log('- messages count:', messages.length);
            
        } catch (err) {
            console.error('Error fetching order support chat threads:', err);
            threads = threads || [];
            selectedThread = selectedThread || null;
            messages = messages || [];
        } finally {
            console.log('=== Rendering OrderSupport Template ===');
            console.log('- threads type:', typeof threads);
            console.log('- threads length:', threads ? threads.length : 'undefined');
            console.log('- selectedThread:', selectedThread);
            console.log('- messages length:', messages ? messages.length : 'undefined');
            
            res.render('Employee/OrderSupport/OrderChatSupport', { 
                user: req.session.user, 
                threads, 
                selectedThread, 
                messages,
                error: threads.length === 0 ? 'No chat threads found.' : null
            });
        }
    });

    // Order Support - Orders
    const orderSupportOrderRoutes = [
        { route: 'OrderOrdersPending', status: 'Pending' },
        { route: 'OrderOrdersProcessing', status: 'Processing' },
        { route: 'OrderOrdersShipping', status: 'Shipping' },
        { route: 'OrderOrdersDelivery', status: 'Delivery' },
        { route: 'OrderOrdersReceive', status: 'Received' },
        { route: 'OrderCancelledOrders', status: 'Cancelled' },
        { route: 'OrderCompletedOrders', status: 'Completed' }
    ];

    orderSupportOrderRoutes.forEach(({ route, status }) => {
        // Map route to permission
        let permission = 'orders_orders_pending'; // default
        if (route.includes('Processing')) permission = 'orders_orders_processing';
        else if (route.includes('Shipping')) permission = 'orders_orders_shipping';
        else if (route.includes('Delivery')) permission = 'orders_orders_delivery';
        else if (route.includes('Receive')) permission = 'orders_orders_receive';
        else if (route.includes('Cancelled')) permission = 'orders_orders_cancelled';
        else if (route.includes('Completed')) permission = 'orders_orders_completed';
        
        router.get(`/Employee/OrderSupport/${route}`, isAuthenticated, checkPermission(permission), async (req, res) => {
            try {
                await pool.connect();
                const result = await pool.request()
                    .input('status', sql.NVarChar, status)
                    .query(`
                        SELECT o.*, c.FullName as CustomerName, c.Email as CustomerEmail
                        FROM Orders o
                        LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
                        WHERE o.Status = @status
                        ORDER BY o.OrderDate DESC
                    `);
                res.render(`Employee/OrderSupport/${route}`, { 
                    user: req.session.user, 
                    orders: result.recordset 
                });
            } catch (err) {
                console.error(`Error fetching ${status.toLowerCase()} orders:`, err);
                res.render(`Employee/OrderSupport/${route}`, { 
                    user: req.session.user, 
                    orders: [], 
                    error: `Failed to load ${status.toLowerCase()} orders.` 
                });
            }
        });
    });

    // Order Support - Alerts Data API
    router.get('/Employee/OrderSupport/Alerts/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Get products with low stock
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity 
                FROM Products 
                WHERE IsActive = 1 AND StockQuantity <= 10
                ORDER BY StockQuantity ASC
            `);
            
            // Get raw materials with low stock
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit 
                FROM RawMaterials 
                WHERE IsActive = 1 AND QuantityAvailable <= 10
                ORDER BY QuantityAvailable ASC
            `);
            
            res.json({
                success: true,
                products: productsResult.recordset,
                rawMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching alerts data:', err);
            res.json({
                success: false,
                error: err.message
            });
        }
    });

    // Order Support - Logs Data API endpoint with filtering support
    router.get('/Employee/OrderSupport/Logs/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const currentUserRole = req.session.user.role;
            
            // Get query parameters for filtering
            const {
                action,
                tableAffected,
                userRole,
                dateFrom,
                dateTo,
                search,
                limit = 1000,
                offset = 0
            } = req.query;
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Changes,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            // Add filters
            if (action) {
                query += ` AND al.Action = @action`;
                request.input('action', sql.NVarChar, action);
            }
            
            if (tableAffected) {
                query += ` AND al.TableAffected = @tableAffected`;
                request.input('tableAffected', sql.NVarChar, tableAffected);
            }
            
            if (userRole) {
                query += ` AND r.RoleName = @userRole`;
                request.input('userRole', sql.NVarChar, userRole);
            }
            
            if (dateFrom) {
                query += ` AND al.Timestamp >= @dateFrom`;
                request.input('dateFrom', sql.DateTime, new Date(dateFrom));
            }
            
            if (dateTo) {
                query += ` AND al.Timestamp <= @dateTo`;
                request.input('dateTo', sql.DateTime, new Date(dateTo));
            }
            
            if (search) {
                query += ` AND (al.Description LIKE @search OR u.FullName LIKE @search OR r.RoleName LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            // Add ordering and pagination
            query += ` ORDER BY al.Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            request.input('offset', sql.Int, parseInt(offset));
            request.input('limit', sql.Int, parseInt(limit));
            
            const result = await request.query(query);
            
            // Decrypt user FullName before sending to frontend using transparent encryption service
            const decryptedLogs = result.recordset.map(log => {
                return {
                    ...log,
                    FullName: log.FullName
                };
            });
            
            res.json({ success: true, logs: decryptedLogs });
        } catch (err) {
            console.error('Error fetching OrderSupport activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // =============================================================================
    // ORDER SUPPORT CRUD ROUTES
    // =============================================================================

    // Order Support - Products CRUD
    router.post('/Employee/OrderSupport/OrderProducts/Add', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Insert product
                const productResult = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), parseFloat(price))
                    .input('stockquantity', sql.Int, parseInt(stockquantity))
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .input('image', sql.NVarChar, req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : null)
                    .input('thumbnails', sql.NVarChar, req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : null)
                    .input('model3d', sql.NVarChar, req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : null)
                    .query(`
                        INSERT INTO Products (Name, Description, Price, StockQuantity, Category, ImageURL, Thumbnails, Model3DURL, CreatedAt, IsArchived)
                        OUTPUT INSERTED.ProductID
                        VALUES (@name, @description, @price, @stockquantity, @category, @image, @thumbnails, @model3d, GETDATE(), 0)
                    `);
                
                const productId = productResult.recordset[0].ProductID;
                
                // Handle required materials if provided
                if (requiredMaterials && requiredMaterials.length > 0) {
                    for (const materialId of requiredMaterials) {
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('materialId', sql.Int, parseInt(materialId))
                            .query(`
                                INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                VALUES (@productId, @materialId, GETDATE())
                            `);
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'INSERT',
                    'Products',
                    productId,
                    `Created new product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product added successfully', productId });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error adding product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add product',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderProducts/Edit', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { productId, name, description, price, stockquantity, category, requiredMaterials } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Get current product data for logging
                const currentProduct = await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('SELECT * FROM Products WHERE ProductID = @productId');
                
                if (currentProduct.recordset.length === 0) {
                    throw new Error('Product not found');
                }
                
                const oldProduct = currentProduct.recordset[0];
                
                // Prepare update data
                const updateData = {
                    name: name || oldProduct.Name,
                    description: description || oldProduct.Description,
                    price: price ? parseFloat(price) : oldProduct.Price,
                    stockquantity: stockquantity ? parseInt(stockquantity) : oldProduct.StockQuantity,
                    category: category || oldProduct.Category,
                    image: req.files?.image ? `/uploads/products/${req.files.image[0].filename}` : oldProduct.ImageURL,
                    thumbnails: req.files ? JSON.stringify([
                        req.files.thumbnail1?.[0]?.filename ? `/uploads/products/${req.files.thumbnail1[0].filename}` : null,
                        req.files.thumbnail2?.[0]?.filename ? `/uploads/products/${req.files.thumbnail2[0].filename}` : null,
                        req.files.thumbnail3?.[0]?.filename ? `/uploads/products/${req.files.thumbnail3[0].filename}` : null,
                        req.files.thumbnail4?.[0]?.filename ? `/uploads/products/${req.files.thumbnail4[0].filename}` : null
                    ].filter(Boolean)) : oldProduct.Thumbnails,
                    model3d: req.files?.model3d ? `/uploads/products/models/${req.files.model3d[0].filename}` : oldProduct.Model3DURL
                };
                
                // Update product
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .input('name', sql.NVarChar, updateData.name)
                    .input('description', sql.NVarChar, updateData.description)
                    .input('price', sql.Decimal(10, 2), updateData.price)
                    .input('stockquantity', sql.Int, updateData.stockquantity)
                    .input('category', sql.NVarChar, updateData.category)
                    .input('image', sql.NVarChar, updateData.image)
                    .input('thumbnails', sql.NVarChar, updateData.thumbnails)
                    .input('model3d', sql.NVarChar, updateData.model3d)
                    .query(`
                        UPDATE Products 
                        SET Name = @name, Description = @description, Price = @price, 
                            StockQuantity = @stockquantity, Category = @category, 
                            ImageURL = @image, Thumbnails = @thumbnails, Model3DURL = @model3d,
                            UpdatedAt = GETDATE()
                        WHERE ProductID = @productId
                    `);
                
                // Update required materials if provided
                if (requiredMaterials !== undefined) {
                    // Remove existing materials
                    await transaction.request()
                        .input('productId', sql.Int, productId)
                        .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                    
                    // Add new materials
                    if (requiredMaterials && requiredMaterials.length > 0) {
                        for (const materialId of requiredMaterials) {
                            await transaction.request()
                                .input('productId', sql.Int, productId)
                                .input('materialId', sql.Int, parseInt(materialId))
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, CreatedAt)
                                    VALUES (@productId, @materialId, GETDATE())
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'UPDATE',
                    'Products',
                    productId,
                    `Updated product: "${name}" (ID: ${productId})`
                );
                
                res.json({ success: true, message: 'Product updated successfully' });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update product',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderProducts/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = req.params.id;
            
            // Get product info for logging
            const productResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT Name FROM Products WHERE ProductID = @productId');
            
            if (productResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            
            const productName = productResult.recordset[0].Name;
            
            // Archive the product instead of deleting
            await pool.request()
                .input('productId', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0, UpdatedAt = GETDATE() WHERE ProductID = @productId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Products',
                productId,
                `Deleted product: "${productName}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Product archived successfully' });
        } catch (err) {
            console.error('Error archiving product:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive product',
                error: err.message
            });
        }
    });

    // Order Support - Materials CRUD
    router.post('/Employee/OrderSupport/OrderMaterials/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { name, quantity, unit } = req.body;
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    INSERT INTO RawMaterials (Name, QuantityAvailable, Unit, LastUpdated, IsActive)
                    OUTPUT INSERTED.MaterialID
                    VALUES (@name, @quantity, @unit, GETDATE(), 1)
                `);
            
            const materialId = result.recordset[0].MaterialID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'RawMaterials',
                materialId,
                `Created new material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material added successfully', materialId });
        } catch (err) {
            console.error('Error adding material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add material',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderMaterials/Edit', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { materialId, name, quantity, unit } = req.body;
            
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .input('name', sql.NVarChar, name)
                .input('quantity', sql.Int, quantity)
                .input('unit', sql.NVarChar, unit)
                .query(`
                    UPDATE RawMaterials 
                    SET Name = @name, QuantityAvailable = @quantity, Unit = @unit, LastUpdated = GETDATE()
                    WHERE MaterialID = @materialId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialId,
                `Updated material: "${name}" (ID: ${materialId})`
            );
            
            res.json({ success: true, message: 'Material updated successfully' });
        } catch (err) {
            console.error('Error updating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update material',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderMaterials/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const materialId = req.params.id;
            
            // Get material info for logging
            const materialResult = await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('SELECT Name FROM RawMaterials WHERE MaterialID = @materialId');
            
            if (materialResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Material not found' });
            }
            
            const materialName = materialResult.recordset[0].Name;
            
            // Deactivate the material instead of deleting
            await pool.request()
                .input('materialId', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0, LastUpdated = GETDATE() WHERE MaterialID = @materialId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'RawMaterials',
                materialId,
                `Deleted material: "${materialName}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Material deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating material:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate material',
                error: err.message
            });
        }
    });

    // Order Support - Variations CRUD
    router.post('/Employee/OrderSupport/OrderVariations/Add', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/variations/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, parseInt(productID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, IsActive)
                    OUTPUT INSERTED.VariationID
                    VALUES (@productID, @variationName, @color, @quantity, @imageUrl, @isActive)
                `);
            
            const variationID = result.recordset[0].VariationID;
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" created`
            );
            
            res.json({ success: true, message: 'Variation added successfully', variationID });
        } catch (err) {
            console.error('Error adding variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderVariations/Edit', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationID, variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                // Get current variation image URL before updating
                const currentVariation = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                const currentImageUrl = currentVariation.recordset[0]?.VariationImageURL;
                
                // Delete old variation image
                await deleteOldImageFile(currentImageUrl);
                
                imageUrl = `/uploads/variations/${req.file.filename}`;
            } else {
                // If no new image uploaded, keep existing image
                const existingResult = await pool.request()
                    .input('variationID', sql.Int, variationID)
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                if (existingResult.recordset.length > 0) {
                    imageUrl = existingResult.recordset[0].VariationImageURL;
                }
            }
            
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE ProductVariations 
                    SET VariationName = @variationName, Color = @color, Quantity = @quantity, 
                        VariationImageURL = @imageUrl, IsActive = @isActive
                    WHERE VariationID = @variationID
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" updated`
            );
            
            res.json({ success: true, message: 'Variation updated successfully' });
        } catch (err) {
            console.error('Error updating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update variation',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderVariations/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const variationID = req.params.id;
            
            // Get variation info for logging
            const variationResult = await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('SELECT VariationName FROM ProductVariations WHERE VariationID = @variationID');
            
            if (variationResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Variation not found' });
            }
            
            const variationName = variationResult.recordset[0].VariationName;
            
            // Deactivate the variation instead of deleting
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .query('UPDATE ProductVariations SET IsActive = 0 WHERE VariationID = @variationID');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'ProductVariations',
                variationID,
                `Variation "${variationName}" deactivated`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Variation deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating variation:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to deactivate variation',
                error: err.message
            });
        }
    });

    // Order Support - Delivery Rates CRUD
    router.post('/Employee/OrderSupport/OrderRates/Add', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { serviceType, basePrice, isActive } = req.body;
            
            const result = await pool.request()
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .input('createdByUserID', sql.Int, req.session.user?.id || null)
                .input('createdByUsername', sql.NVarChar, req.session.user?.username || 'System')
                .query(`
                    INSERT INTO DeliveryRates (ServiceType, Price, IsActive, CreatedAt, CreatedByUserID, CreatedByUsername)
                    OUTPUT INSERTED.RateID
                    VALUES (@serviceType, @basePrice, @isActive, GETDATE(), @createdByUserID, @createdByUsername)
                `);
            
            const rateId = result.recordset[0].RateID;
            
            res.json({ success: true, message: 'Delivery rate added successfully', rateId });
        } catch (err) {
            console.error('Error adding delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to add delivery rate',
                error: err.message
            });
        }
    });

    router.post('/Employee/OrderSupport/OrderRates/Update/:rateId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { rateId } = req.params;
            const { serviceType, basePrice, isActive } = req.body;
            
            await pool.request()
                .input('rateId', sql.Int, rateId)
                .input('serviceType', sql.NVarChar, serviceType)
                .input('basePrice', sql.Decimal(10, 2), parseFloat(basePrice))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE DeliveryRates 
                    SET ServiceType = @serviceType, Price = @basePrice, IsActive = @isActive
                    WHERE RateID = @rateId
                `);
            
            res.json({ success: true, message: 'Delivery rate updated successfully' });
        } catch (err) {
            console.error('Error updating delivery rate:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update delivery rate',
                error: err.message
            });
        }
    });

    // Order Support - Stock Update
    router.post('/Employee/OrderSupport/OrderProducts/UpdateStock', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { productId, newStock } = req.body;
            
            // Get current stock quantity before updating
            const currentStockResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @productId');
            
            if (currentStockResult.recordset.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'Product not found.' 
                });
            }
            
            const oldStock = currentStockResult.recordset[0].StockQuantity;
            
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('newStock', sql.Int, newStock)
                .query(`
                    UPDATE Products 
                    SET StockQuantity = @newStock, UpdatedAt = GETDATE()
                    WHERE ProductID = @productId
                `);
            
            // Log the activity with actual changes
            const changes = JSON.stringify({
                StockQuantity: {
                    old: oldStock,
                    new: newStock
                }
            });
            
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId,
                `OrderSupport updated stock quantity from ${oldStock} to ${newStock} for product ID: ${productId}`,
                changes
            );
            
            res.json({ success: true, message: 'Stock updated successfully' });
        } catch (err) {
            console.error('Error updating stock:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update stock',
                error: err.message
            });
        }
    });

    // =============================================================================
    // ORDER SUPPORT ORDER PROCESSING ROUTES
    // =============================================================================

    // Order Support OrdersPending: Proceed to Processing
    router.post('/Employee/OrderSupport/OrderOrdersPending/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId.toString(),
                `Order #${orderId} status changed to Processing by Order Support`,
                JSON.stringify({ oldStatus: 'Pending', newStatus: 'Processing' })
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Order Support OrdersPending: Cancel order
    router.post('/Employee/OrderSupport/OrderOrdersPending/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Order Support OrdersProcessing: Proceed to Shipping
    router.post('/Employee/OrderSupport/OrderOrdersProcessing/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId.toString(),
                `Order #${orderId} status changed to Shipping by Order Support`,
                JSON.stringify({ oldStatus: 'Processing', newStatus: 'Shipping' })
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Order Support OrdersProcessing: Cancel order
    router.post('/Employee/OrderSupport/OrderOrdersProcessing/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Order Support OrdersShipping: Proceed to Delivery
    router.post('/Employee/OrderSupport/OrderOrdersShipping/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId.toString(),
                `Order #${orderId} status changed to Delivery by Order Support`,
                JSON.stringify({ oldStatus: 'Shipping', newStatus: 'Delivery' })
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Order Support OrdersShipping: Cancel order
    router.post('/Employee/OrderSupport/OrderOrdersShipping/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Order Support OrdersDelivery: Proceed to Received
    router.post('/Employee/OrderSupport/OrderOrdersDelivery/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Received' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId.toString(),
                `Order #${orderId} status changed to Received by Order Support`,
                JSON.stringify({ oldStatus: 'Delivery', newStatus: 'Received' })
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Order Support OrdersDelivery: Cancel order
    router.post('/Employee/OrderSupport/OrderOrdersDelivery/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations SET StockQuantity = StockQuantity + @quantity WHERE VariationID = @variationID`);
                } else {
                    await pool.request()
                        .input('productId', sql.Int, item.ProductID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @productId`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Order Support OrdersReceive: Proceed to Completed
    router.post('/Employee/OrderSupport/OrderOrdersReceive/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Completed' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'COMPLETE',
                'Orders',
                orderId.toString(),
                `Order #${orderId} completed by Order Support`,
                JSON.stringify({ oldStatus: 'Received', newStatus: 'Completed' })
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // =============================================================================
    // ADMIN ROUTES (All roles can access by default)
    // =============================================================================

    const adminRoutes = [
        'Products', 'Materials', 'Orders', 'Users', 'Logs', 'Alerts', 'CMS', 'Reviews', 'Rates', 'Variations', 'Archived',
        'OrdersPending', 'OrdersProcessing', 'OrdersShipping', 'OrdersDelivery', 'OrdersReceive', 'CancelledOrders', 'CompletedOrders'
    ];

    // Admin Delivery Rates route
    router.get('/Employee/Admin/DeliveryRates', isAuthenticated, (req, res) => {
        res.render('Employee/Admin/AdminRates', { user: req.session.user });
    });

    // Admin: Delivery Rates API - list all rates (active and inactive)
    router.get('/api/admin/delivery-rates', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // First, ensure the DeliveryRates table exists with consistent schema
            await pool.request().query(`
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
                        
                    -- Insert default delivery rates if table is empty
                    IF NOT EXISTS (SELECT 1 FROM dbo.DeliveryRates)
                    BEGIN
                        INSERT INTO dbo.DeliveryRates (ServiceType, Price, CreatedByUsername)
                        VALUES 
                            ('Standard Delivery', 50.00, 'System'),
                            ('Express Delivery', 100.00, 'System'),
                            ('Same Day Delivery', 150.00, 'System'),
                            ('Pickup', 0.00, 'System');
                    END
                END
            `);
            
            // Now fetch all delivery rates (both active and inactive for admin view)
            const result = await pool.request().query(`
                SELECT 
                    RateID, 
                    ServiceType, 
                    Price,
                    CreatedAt, 
                    CreatedByUserID,
                    CreatedByUsername,
                    IsActive
                FROM DeliveryRates 
                ORDER BY IsActive DESC, CreatedAt DESC
            `);
            
            res.json({ success: true, rates: result.recordset });
        } catch (err) {
            console.error('Error listing admin delivery rates:', err);
            res.json({ success: false, message: 'Failed to list delivery rates', error: err.message });
        }
    });

    // Admin: Add Delivery Rate
    router.post('/Employee/Admin/DeliveryRates/Add', isAuthenticated, async (req, res) => {
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
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'DeliveryRates',
                null,
                `Admin added new delivery rate: "${serviceType}" - ₱${price}`
            );
            
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding admin delivery rate:', err);
            res.json({ success: false, message: 'Failed to add delivery rate' });
        }
    });

    // Admin: Update Delivery Rate (price, name, active flag)
    router.post('/Employee/Admin/DeliveryRates/Update/:rateId', isAuthenticated, async (req, res) => {
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
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'DeliveryRates',
                rateId.toString(),
                `Admin updated delivery rate ID ${rateId}: ${serviceType ? `"${serviceType}"` : ''} ${price ? `₱${price}` : ''} ${isActive !== undefined ? (isActive ? 'activated' : 'deactivated') : ''}`
            );
            
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating admin delivery rate:', err);
            res.json({ success: false, message: 'Failed to update delivery rate' });
        }
    });

    // Shared API: Products for Walk In Orders (Admin + InventoryManager + OrderSupport + TransactionManager + UserManager + Employee)
    router.get('/api/walkin/products', isAuthenticated, async (req, res) => {
        try {
            const role = req.session?.user?.role || req.session?.user?.roleName || req.session?.user?.RoleName;
            
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

    // Helper function to ensure WalkInOrders table exists
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

    // Admin WalkIn: Add new walk-in order
    router.post('/Employee/Admin/WalkIn/Add', isAuthenticated, async (req, res) => {
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
                const variationID = item.variationID || item.variationID;
                
                if (pid && qty > 0) {
                    // Check if this is a variation purchase
                    if (variationID) {
                        // Decrement variation stock
                        console.log('WalkIn order: Decrementing variation stock for variation ID:', variationID);
                        await pool.request()
                            .input('variationID', sql.Int, variationID)
                            .input('quantity', sql.Int, qty)
                            .query(`UPDATE ProductVariations 
                                    SET Quantity = CASE WHEN Quantity >= @quantity THEN Quantity - @quantity ELSE 0 END 
                                    WHERE VariationID = @variationID`);
                        console.log('WalkIn order: Variation stock decremented successfully');
                    } else {
                        // Decrement main product stock
                        console.log('WalkIn order: Decrementing main product stock for product ID:', pid);
                        await pool.request()
                            .input('productId', sql.Int, pid)
                            .input('quantity', sql.Int, qty)
                            .query(`UPDATE Products 
                                    SET StockQuantity = CASE WHEN StockQuantity >= @quantity THEN StockQuantity - @quantity ELSE 0 END 
                                    WHERE ProductID = @productId`);
                        console.log('WalkIn order: Main product stock decremented successfully');
                    }
                }
            }
            res.redirect('/Employee/Admin/WalkIn');
        } catch (err) {
            console.error('Error adding admin walk in order:', err);
            res.status(500).send('Failed to add walk in order');
        }
    });

    // Admin WalkIn: Proceed to On delivery
    router.post('/Employee/Admin/WalkIn/ProceedToDelivery/:id', isAuthenticated, async (req, res) => {
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

    // Admin WalkIn: Complete
    router.post('/Employee/Admin/WalkIn/Complete/:id', isAuthenticated, async (req, res) => {
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

    // Admin WalkIn route
    router.get('/Employee/Admin/WalkIn', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Ensure WalkInOrders table exists
            await pool.request().query(`
                IF OBJECT_ID('dbo.WalkInOrders','U') IS NULL
                BEGIN
                    CREATE TABLE dbo.WalkInOrders (
                        BulkOrderID INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerName NVARCHAR(255) NOT NULL,
                        Address NVARCHAR(500),
                        ContactNumber NVARCHAR(50),
                        ContactEmail NVARCHAR(255),
                        OrderedProducts NVARCHAR(MAX),
                        Discount DECIMAL(18,2) DEFAULT 0,
                        TotalAmount DECIMAL(18,2) NOT NULL,
                        ExpectedArrival DATETIME2,
                        DeliveryType NVARCHAR(100),
                        Status NVARCHAR(50) DEFAULT 'Pending',
                        CreatedAt DATETIME2 DEFAULT GETDATE(),
                        UpdatedAt DATETIME2 DEFAULT GETDATE()
                    );
                END
            `);
            
            // Query bulk orders
            const result = await pool.request().query('SELECT * FROM WalkInOrders ORDER BY CreatedAt DESC');
            const bulkOrders = result.recordset;
            
            res.render('Employee/Admin/AdminWalkIn', { user: req.session.user, bulkOrders });
        } catch (err) {
            console.error('Error fetching walk-in orders:', err);
            res.render('Employee/Admin/AdminWalkIn', { user: req.session.user, bulkOrders: [], error: 'Failed to load walk-in orders.' });
        }
    });

    // Get Customer Accounts API - MUST come before the main ManageUsers route
    router.get('/Employee/Admin/ManageUsers/Customers', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Check if Customers table exists
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as tableExists
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Customers'
            `);
            
            if (tableCheck.recordset[0].tableExists === 0) {
                // Customers table doesn't exist, return empty array
                res.json({ 
                    success: true, 
                    customers: [],
                    message: 'Customer accounts feature not yet implemented'
                });
                return;
            }
            
            // Query customers from the database
            const result = await pool.request().query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    PhoneNumber,
                    IsActive,
                    CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            
            // Return customer data as plain text
            const customers = result.recordset;
            
            res.json({ 
                success: true, 
                customers: customers 
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch customer accounts' 
            });
        }
    });

    // Admin ManageUsers route
    router.get('/Employee/Admin/ManageUsers', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Query users with roles - using LEFT JOIN to include users even if they don't have a valid role
            const result = await pool.request().query(`
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.RoleID, r.RoleName, u.IsActive, u.CreatedAt
                FROM Users u
                LEFT JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY u.CreatedAt DESC
            `);
            
            // Decrypt user data before sending to frontend using transparent encryption service
            const decryptedUsers = result.recordset;
            
            res.render('Employee/Admin/AdminManageUsers', { user: req.session.user, users: decryptedUsers });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.render('Employee/Admin/AdminManageUsers', { user: req.session.user, users: [], error: 'Failed to load users.' });
        }
    });

    // Edit User route
    router.post('/Employee/Admin/Users/Edit', isAuthenticated, async (req, res) => {
        try {
            const { userId, username, fullName, email, roleId, isActive, password } = req.body;
            
            await pool.connect();
            
            // Get current user data before updating
            const currentUserResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username, FullName, Email, RoleID, IsActive, PasswordHash FROM Users WHERE UserID = @userId');
            
            if (currentUserResult.recordset.length === 0) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            const currentUser = currentUserResult.recordset[0];
            const changes = {};
            
            // Decrypt current user data for comparison using transparent encryption service
            const decryptedCurrentUser = currentUser;
            const currentUsername = decryptedCurrentUser.Username;
            const currentFullName = decryptedCurrentUser.FullName;
            const currentEmail = decryptedCurrentUser.Email;
            
            // Check for changes and build changes object
            if (currentUsername !== username) {
                changes.Username = { old: currentUsername, new: username };
            }
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentUser.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentUser.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            if (roleId && currentUser.RoleID !== parseInt(roleId)) {
                changes.RoleID = { old: currentUser.RoleID, new: parseInt(roleId) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store user data as plain text
            const userData = {
                Username: username,
                FullName: fullName,
                Email: email
            };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`
                        UPDATE Users 
                        SET PasswordHash = @password
                        WHERE UserID = @userId
                    `);
                changes.Password = { old: '[HIDDEN]', new: '[UPDATED]' };
            }
            
            // Update user information with encrypted data
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, userData.Username)
                .input('fullName', sql.NVarChar, userData.FullName)
                .input('email', sql.NVarChar, userData.Email)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Users 
                    SET Username = @username, FullName = @fullName, Email = @email, IsActive = @isActive
                    WHERE UserID = @userId
                `);
            
            // Update user role if roleId is provided
            if (roleId) {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('roleId', sql.Int, roleId)
                    .query(`
                        UPDATE Users 
                        SET RoleID = @roleId 
                        WHERE UserID = @userId
                    `);
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId.toString(),
                `Admin updated user information for ${username} (ID: ${userId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });


    // Edit Customer route
    router.post('/Employee/Admin/Customers/Edit', isAuthenticated, async (req, res) => {
        try {
            const { customerId, fullName, email, phone, isActive } = req.body;
            
            await pool.connect();
            
            // Get current customer data before updating
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, PhoneNumber, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            const changes = {};
            
            // Decrypt current customer data for comparison using transparent encryption service
            const decryptedCurrentCustomer = currentCustomer;
            const currentFullName = decryptedCurrentCustomer.FullName;
            const currentEmail = decryptedCurrentCustomer.Email;
            const currentPhoneNumber = decryptedCurrentCustomer.PhoneNumber;
            
            // Check for changes and build changes object
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentPhoneNumber !== phone) {
                changes.PhoneNumber = { old: currentPhoneNumber, new: phone };
            }
            if (currentCustomer.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentCustomer.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store customer data as plain text
            const customerData = {
                FullName: fullName,
                Email: email,
                PhoneNumber: phone
            };
            
            // Update customer information with encrypted data
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, customerData.FullName)
                .input('email', sql.NVarChar, customerData.Email)
                .input('phone', sql.NVarChar, customerData.PhoneNumber)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, Email = @email, PhoneNumber = @phone, IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `Admin updated customer information for ${fullName} (ID: ${customerId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer' });
        }
    });

    // Archive Customer route (Soft Delete)
    router.post('/Employee/Admin/Customers/Archive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before archiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer is already archived
            if (currentCustomer.IsActive === 0) {
                return res.json({ success: false, message: 'Customer is already archived' });
            }
            
            // Archive the customer (soft delete by setting IsActive = 0)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 0 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Admin archived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Customer archived successfully' });
        } catch (error) {
            console.error('Error archiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive customer',
                error: error.message
            });
        }
    });

    // Dearchive Customer route (Restore Archived Customer)
    router.post('/Employee/Admin/Customers/Dearchive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before dearchiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Customer data is already plain text
            const fullName = currentCustomer.FullName;
            const email = currentCustomer.Email;
            
            // Check if customer is already active
            if (currentCustomer.IsActive === 1) {
                return res.json({ success: false, message: 'Customer is already active' });
            }
            
            // Dearchive the customer (restore by setting IsActive = 1)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 1 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `Admin dearchived customer ${fullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            res.json({ success: true, message: 'Customer restored successfully' });
        } catch (error) {
            console.error('Error dearchiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to restore customer',
                error: error.message
            });
        }
    });

    // Permanently Delete Customer route (Hard Delete)
    router.delete('/Employee/Admin/Customers/Delete/:customerId', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.params;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before deleting
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer has any orders before permanent deletion
            const ordersCheck = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE CustomerID = @customerId');
            
            if (ordersCheck.recordset[0].orderCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot permanently delete customer with existing orders. Please archive instead.' 
                });
            }
            
            // Permanently delete the customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Admin permanently deleted customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ action: 'permanent_delete' })
            );
            
            res.json({ success: true, message: 'Customer permanently deleted successfully' });
        } catch (error) {
            console.error('Error permanently deleting customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to permanently delete customer',
                error: error.message
            });
        }
    });


    // Toggle User Active Status API
    router.post('/Employee/Admin/ManageUsers/ToggleActive/:userId/:newStatus', isAuthenticated, async (req, res) => {
        try {
            const userId = req.params.userId;
            const newStatus = parseInt(req.params.newStatus);
            
            // Only Admin can toggle user status
            if (req.session.user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            await pool.connect();
            
            // Get user details for logging
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT FullName FROM Users WHERE UserID = @userId`);
            
            const userName = userResult.recordset[0]?.FullName || `User ${userId}`;
            
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query(`
                    UPDATE Users 
                    SET IsActive = @isActive, UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);

            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId,
                `User "${userName}" status toggled to ${newStatus ? 'Active' : 'Inactive'}`
            );

            res.json({ success: true, message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // =============================================================================
    // ORDER SUPPORT - MANAGE USERS API ROUTES
    // =============================================================================

    // Get Customer Accounts API for Order Support
    router.get('/Employee/OrderSupport/OrderManageUsers/Customers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            
            // Check if Customers table exists
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as tableExists
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Customers'
            `);
            
            if (tableCheck.recordset[0].tableExists === 0) {
                res.json({ 
                    success: true, 
                    customers: [],
                    message: 'Customer accounts feature not yet implemented'
                });
                return;
            }
            
            const result = await pool.request().query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    PhoneNumber,
                    IsActive,
                    CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            
            // Return customer data as plain text
            const customers = result.recordset;
            
            res.json({ 
                success: true, 
                customers: customers 
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch customer accounts' 
            });
        }
    });

    // Edit User route for Order Support
    router.post('/Employee/OrderSupport/OrderManageUsers/Users/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { userId, username, fullName, email, roleId, isActive, password } = req.body;
            
            await pool.connect();
            
            // Get current user data before updating
            const currentUserResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username, FullName, Email, RoleID, IsActive, PasswordHash FROM Users WHERE UserID = @userId');
            
            if (currentUserResult.recordset.length === 0) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            const currentUser = currentUserResult.recordset[0];
            const changes = {};
            
            // Decrypt current user data for comparison using transparent encryption service
            const decryptedCurrentUser = currentUser;
            const currentUsername = decryptedCurrentUser.Username;
            const currentFullName = decryptedCurrentUser.FullName;
            const currentEmail = decryptedCurrentUser.Email;
            
            // Check for changes and build changes object
            if (currentUsername !== username) {
                changes.Username = { old: currentUsername, new: username };
            }
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentUser.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentUser.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            if (roleId && currentUser.RoleID !== parseInt(roleId)) {
                changes.RoleID = { old: currentUser.RoleID, new: parseInt(roleId) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store user data as plain text
            const userData = {
                Username: username,
                FullName: fullName,
                Email: email
            };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`
                        UPDATE Users 
                        SET PasswordHash = @password
                        WHERE UserID = @userId
                    `);
                changes.Password = { old: '[HIDDEN]', new: '[UPDATED]' };
            }
            
            // Update user information with encrypted data
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, userData.Username)
                .input('fullName', sql.NVarChar, userData.FullName)
                .input('email', sql.NVarChar, userData.Email)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Users 
                    SET Username = @username, FullName = @fullName, Email = @email, IsActive = @isActive
                    WHERE UserID = @userId
                `);
            
            // Update user role if roleId is provided
            if (roleId) {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('roleId', sql.Int, roleId)
                    .query(`
                        UPDATE Users 
                        SET RoleID = @roleId 
                        WHERE UserID = @userId
                    `);
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId.toString(),
                `OrderSupport updated user information for ${username} (ID: ${userId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });

    // Edit Customer route for Order Support
    router.post('/Employee/OrderSupport/OrderManageUsers/Customers/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId, fullName, email, phone, isActive } = req.body;
            
            await pool.connect();
            
            // Get current customer data before updating
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, PhoneNumber, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            const changes = {};
            
            // Decrypt current customer data for comparison using transparent encryption service
            const decryptedCurrentCustomer = currentCustomer;
            const currentFullName = decryptedCurrentCustomer.FullName;
            const currentEmail = decryptedCurrentCustomer.Email;
            const currentPhoneNumber = decryptedCurrentCustomer.PhoneNumber;
            
            // Check for changes and build changes object
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentPhoneNumber !== phone) {
                changes.PhoneNumber = { old: currentPhoneNumber, new: phone };
            }
            if (currentCustomer.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentCustomer.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store customer data as plain text
            const customerData = {
                FullName: fullName,
                Email: email,
                PhoneNumber: phone
            };
            
            // Update customer information with encrypted data
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, customerData.FullName)
                .input('email', sql.NVarChar, customerData.Email)
                .input('phone', sql.NVarChar, customerData.PhoneNumber)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, Email = @email, PhoneNumber = @phone, IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `OrderSupport updated customer information for ${fullName} (ID: ${customerId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer' });
        }
    });

    // Order Support - Archive Customer route (Soft Delete)
    router.post('/Employee/OrderSupport/OrderManageUsers/Customers/Archive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before archiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer is already archived
            if (currentCustomer.IsActive === 0) {
                return res.json({ success: false, message: 'Customer is already archived' });
            }
            
            // Archive the customer (soft delete by setting IsActive = 0)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 0 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Order Support archived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Customer archived successfully' });
        } catch (error) {
            console.error('Error archiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive customer',
                error: error.message
            });
        }
    });

    // Order Support - Dearchive Customer route (Restore Archived Customer)
    router.post('/Employee/OrderSupport/OrderManageUsers/Customers/Dearchive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before dearchiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Customer data is already plain text
            const fullName = currentCustomer.FullName;
            const email = currentCustomer.Email;
            
            // Check if customer is already active
            if (currentCustomer.IsActive === 1) {
                return res.json({ success: false, message: 'Customer is already active' });
            }
            
            // Dearchive the customer (restore by setting IsActive = 1)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 1 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `Order Support dearchived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            res.json({ success: true, message: 'Customer restored successfully' });
        } catch (error) {
            console.error('Error dearchiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to restore customer',
                error: error.message
            });
        }
    });

    // Order Support - Permanently Delete Customer route (Hard Delete)
    router.delete('/Employee/OrderSupport/OrderManageUsers/Customers/Delete/:customerId', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.params;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before deleting
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer has any orders before permanent deletion
            const ordersCheck = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE CustomerID = @customerId');
            
            if (ordersCheck.recordset[0].orderCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot permanently delete customer with existing orders. Please archive instead.' 
                });
            }
            
            // Permanently delete the customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Order Support permanently deleted customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ action: 'permanent_delete' })
            );
            
            res.json({ success: true, message: 'Customer permanently deleted successfully' });
        } catch (error) {
            console.error('Error permanently deleting customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to permanently delete customer',
                error: error.message
            });
        }
    });

    // Toggle User Active Status API for Order Support
    router.post('/Employee/OrderSupport/OrderManageUsers/ToggleActive/:userId/:newStatus', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const userId = req.params.userId;
            const newStatus = parseInt(req.params.newStatus);

            await pool.connect();
            
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query(`
                    UPDATE Users 
                    SET IsActive = @isActive, UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);

            res.json({ success: true, message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // =============================================================================
    // TRANSACTION MANAGER - MANAGE USERS API ROUTES
    // =============================================================================

    // Get Customer Accounts API for Transaction Manager
    router.get('/Employee/TransactionManager/TransactionManageUsers/Customers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as tableExists
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Customers'
            `);
            
            if (tableCheck.recordset[0].tableExists === 0) {
                res.json({ 
                    success: true, 
                    customers: [],
                    message: 'Customer accounts feature not yet implemented'
                });
                return;
            }
            
            const result = await pool.request().query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    PhoneNumber,
                    IsActive,
                    CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            
            // Return customer data as plain text
            const customers = result.recordset;
            
            res.json({ 
                success: true, 
                customers: customers 
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch customer accounts' 
            });
        }
    });

    // Edit User route for Transaction Manager
    router.post('/Employee/TransactionManager/TransactionManageUsers/Users/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { userId, username, fullName, email, roleId, isActive, password } = req.body;
            
            await pool.connect();
            
            // Get current user data before updating
            const currentUserResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username, FullName, Email, RoleID, IsActive, PasswordHash FROM Users WHERE UserID = @userId');
            
            if (currentUserResult.recordset.length === 0) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            const currentUser = currentUserResult.recordset[0];
            const changes = {};
            
            // Decrypt current user data for comparison using transparent encryption service
            const decryptedCurrentUser = currentUser;
            const currentUsername = decryptedCurrentUser.Username;
            const currentFullName = decryptedCurrentUser.FullName;
            const currentEmail = decryptedCurrentUser.Email;
            
            // Check for changes and build changes object
            if (currentUsername !== username) {
                changes.Username = { old: currentUsername, new: username };
            }
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentUser.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentUser.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            if (roleId && currentUser.RoleID !== parseInt(roleId)) {
                changes.RoleID = { old: currentUser.RoleID, new: parseInt(roleId) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store user data as plain text
            const userData = {
                Username: username,
                FullName: fullName,
                Email: email
            };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`
                        UPDATE Users 
                        SET PasswordHash = @password
                        WHERE UserID = @userId
                    `);
                changes.Password = { old: '[HIDDEN]', new: '[UPDATED]' };
            }
            
            // Update user information with encrypted data
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, userData.Username)
                .input('fullName', sql.NVarChar, userData.FullName)
                .input('email', sql.NVarChar, userData.Email)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Users 
                    SET Username = @username, FullName = @fullName, Email = @email, IsActive = @isActive
                    WHERE UserID = @userId
                `);
            
            // Update user role if roleId is provided
            if (roleId) {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('roleId', sql.Int, roleId)
                    .query(`
                        UPDATE Users 
                        SET RoleID = @roleId 
                        WHERE UserID = @userId
                    `);
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId.toString(),
                `TransactionManager updated user information for ${username} (ID: ${userId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });

    // Edit Customer route for Transaction Manager
    router.post('/Employee/TransactionManager/TransactionManageUsers/Customers/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId, fullName, email, phone, isActive } = req.body;
            
            await pool.connect();
            
            // Get current customer data before updating
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, PhoneNumber, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            const changes = {};
            
            // Decrypt current customer data for comparison using transparent encryption service
            const decryptedCurrentCustomer = currentCustomer;
            const currentFullName = decryptedCurrentCustomer.FullName;
            const currentEmail = decryptedCurrentCustomer.Email;
            const currentPhoneNumber = decryptedCurrentCustomer.PhoneNumber;
            
            // Check for changes and build changes object
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentPhoneNumber !== phone) {
                changes.PhoneNumber = { old: currentPhoneNumber, new: phone };
            }
            if (currentCustomer.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentCustomer.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store customer data as plain text
            const customerData = {
                FullName: fullName,
                Email: email,
                PhoneNumber: phone
            };
            
            // Update customer information with encrypted data
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, customerData.FullName)
                .input('email', sql.NVarChar, customerData.Email)
                .input('phone', sql.NVarChar, customerData.PhoneNumber)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, Email = @email, PhoneNumber = @phone, IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `TransactionManager updated customer information for ${fullName} (ID: ${customerId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer' });
        }
    });

    // Transaction Manager - Archive Customer route (Soft Delete)
    router.post('/Employee/TransactionManager/TransactionManageUsers/Customers/Archive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before archiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer is already archived
            if (currentCustomer.IsActive === 0) {
                return res.json({ success: false, message: 'Customer is already archived' });
            }
            
            // Archive the customer (soft delete by setting IsActive = 0)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 0 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Transaction Manager archived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Customer archived successfully' });
        } catch (error) {
            console.error('Error archiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive customer',
                error: error.message
            });
        }
    });

    // Transaction Manager - Dearchive Customer route (Restore Archived Customer)
    router.post('/Employee/TransactionManager/TransactionManageUsers/Customers/Dearchive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before dearchiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Customer data is already plain text
            const fullName = currentCustomer.FullName;
            const email = currentCustomer.Email;
            
            // Check if customer is already active
            if (currentCustomer.IsActive === 1) {
                return res.json({ success: false, message: 'Customer is already active' });
            }
            
            // Dearchive the customer (restore by setting IsActive = 1)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 1 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `Transaction Manager dearchived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            res.json({ success: true, message: 'Customer restored successfully' });
        } catch (error) {
            console.error('Error dearchiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to restore customer',
                error: error.message
            });
        }
    });

    // Transaction Manager - Permanently Delete Customer route (Hard Delete)
    router.delete('/Employee/TransactionManager/TransactionManageUsers/Customers/Delete/:customerId', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.params;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before deleting
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer has any orders before permanent deletion
            const ordersCheck = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE CustomerID = @customerId');
            
            if (ordersCheck.recordset[0].orderCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot permanently delete customer with existing orders. Please archive instead.' 
                });
            }
            
            // Permanently delete the customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Transaction Manager permanently deleted customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ action: 'permanent_delete' })
            );
            
            res.json({ success: true, message: 'Customer permanently deleted successfully' });
        } catch (error) {
            console.error('Error permanently deleting customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to permanently delete customer',
                error: error.message
            });
        }
    });

    // Toggle User Active Status API for Transaction Manager
    router.post('/Employee/TransactionManager/TransactionManageUsers/ToggleActive/:userId/:newStatus', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const userId = req.params.userId;
            const newStatus = parseInt(req.params.newStatus);

            await pool.connect();
            
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query(`
                    UPDATE Users 
                    SET IsActive = @isActive, UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);

            res.json({ success: true, message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // =============================================================================
    // USER MANAGER - MANAGE USERS API ROUTES
    // =============================================================================

    // Get Customer Accounts API for User Manager
    router.get('/Employee/UserManager/UserManageUsers/Customers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as tableExists
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Customers'
            `);
            
            if (tableCheck.recordset[0].tableExists === 0) {
                res.json({ 
                    success: true, 
                    customers: [],
                    message: 'Customer accounts feature not yet implemented'
                });
                return;
            }
            
            const result = await pool.request().query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    PhoneNumber,
                    IsActive,
                    CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            
            res.json({ 
                success: true, 
                customers: result.recordset 
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch customer accounts' 
            });
        }
    });

    // Edit User route for User Manager
    router.post('/Employee/UserManager/UserManageUsers/Users/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { userId, username, fullName, email, roleId, isActive, password } = req.body;
            
            await pool.connect();
            
            // Get current user data before updating
            const currentUserResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username, FullName, Email, RoleID, IsActive, PasswordHash FROM Users WHERE UserID = @userId');
            
            if (currentUserResult.recordset.length === 0) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            const currentUser = currentUserResult.recordset[0];
            const changes = {};
            
            // Decrypt current user data for comparison using transparent encryption service
            const decryptedCurrentUser = currentUser;
            const currentUsername = decryptedCurrentUser.Username;
            const currentFullName = decryptedCurrentUser.FullName;
            const currentEmail = decryptedCurrentUser.Email;
            
            // Check for changes and build changes object
            if (currentUsername !== username) {
                changes.Username = { old: currentUsername, new: username };
            }
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentUser.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentUser.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            if (roleId && currentUser.RoleID !== parseInt(roleId)) {
                changes.RoleID = { old: currentUser.RoleID, new: parseInt(roleId) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store user data as plain text
            const userData = {
                Username: username,
                FullName: fullName,
                Email: email
            };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`
                        UPDATE Users 
                        SET PasswordHash = @password
                        WHERE UserID = @userId
                    `);
                changes.Password = { old: '[HIDDEN]', new: '[UPDATED]' };
            }
            
            // Update user information with encrypted data
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, userData.Username)
                .input('fullName', sql.NVarChar, userData.FullName)
                .input('email', sql.NVarChar, userData.Email)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Users 
                    SET Username = @username, FullName = @fullName, Email = @email, IsActive = @isActive
                    WHERE UserID = @userId
                `);
            
            // Update user role if roleId is provided
            if (roleId) {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('roleId', sql.Int, roleId)
                    .query(`
                        UPDATE Users 
                        SET RoleID = @roleId 
                        WHERE UserID = @userId
                    `);
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId.toString(),
                `UserManager updated user information for ${username} (ID: ${userId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });

    // Edit Customer route for User Manager
    router.post('/Employee/UserManager/UserManageUsers/Customers/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId, fullName, email, phone, isActive } = req.body;
            
            await pool.connect();
            
            // Get current customer data before updating
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, PhoneNumber, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            const changes = {};
            
            // Decrypt current customer data for comparison using transparent encryption service
            const decryptedCurrentCustomer = currentCustomer;
            const currentFullName = decryptedCurrentCustomer.FullName;
            const currentEmail = decryptedCurrentCustomer.Email;
            const currentPhoneNumber = decryptedCurrentCustomer.PhoneNumber;
            
            // Check for changes and build changes object
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentPhoneNumber !== phone) {
                changes.PhoneNumber = { old: currentPhoneNumber, new: phone };
            }
            if (currentCustomer.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentCustomer.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store customer data as plain text
            const customerData = {
                FullName: fullName,
                Email: email,
                PhoneNumber: phone
            };
            
            // Update customer information with encrypted data
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, customerData.FullName)
                .input('email', sql.NVarChar, customerData.Email)
                .input('phone', sql.NVarChar, customerData.PhoneNumber)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, Email = @email, PhoneNumber = @phone, IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `UserManager updated customer information for ${fullName} (ID: ${customerId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer' });
        }
    });

    // User Manager - Archive Customer route (Soft Delete)
    router.post('/Employee/UserManager/UserManageUsers/Customers/Archive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before archiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer is already archived
            if (currentCustomer.IsActive === 0) {
                return res.json({ success: false, message: 'Customer is already archived' });
            }
            
            // Archive the customer (soft delete by setting IsActive = 0)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 0 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `User Manager archived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Customer archived successfully' });
        } catch (error) {
            console.error('Error archiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive customer',
                error: error.message
            });
        }
    });

    // User Manager - Dearchive Customer route (Restore Archived Customer)
    router.post('/Employee/UserManager/UserManageUsers/Customers/Dearchive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before dearchiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Customer data is already plain text
            const fullName = currentCustomer.FullName;
            const email = currentCustomer.Email;
            
            // Check if customer is already active
            if (currentCustomer.IsActive === 1) {
                return res.json({ success: false, message: 'Customer is already active' });
            }
            
            // Dearchive the customer (restore by setting IsActive = 1)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 1 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `User Manager dearchived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            res.json({ success: true, message: 'Customer restored successfully' });
        } catch (error) {
            console.error('Error dearchiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to restore customer',
                error: error.message
            });
        }
    });

    // User Manager - Permanently Delete Customer route (Hard Delete)
    router.delete('/Employee/UserManager/UserManageUsers/Customers/Delete/:customerId', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.params;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before deleting
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer has any orders before permanent deletion
            const ordersCheck = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE CustomerID = @customerId');
            
            if (ordersCheck.recordset[0].orderCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot permanently delete customer with existing orders. Please archive instead.' 
                });
            }
            
            // Permanently delete the customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `User Manager permanently deleted customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ action: 'permanent_delete' })
            );
            
            res.json({ success: true, message: 'Customer permanently deleted successfully' });
        } catch (error) {
            console.error('Error permanently deleting customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to permanently delete customer',
                error: error.message
            });
        }
    });

    // Toggle User Active Status API for User Manager
    router.post('/Employee/UserManager/UserManageUsers/ToggleActive/:userId/:newStatus', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const userId = req.params.userId;
            const newStatus = parseInt(req.params.newStatus);

            await pool.connect();
            
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query(`
                    UPDATE Users 
                    SET IsActive = @isActive, UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);

            res.json({ success: true, message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // =============================================================================
    // INVENTORY MANAGER - MANAGE USERS API ROUTES
    // =============================================================================

    // Get Customer Accounts API for Inventory Manager
    router.get('/Employee/InventoryManager/InventoryManageUsers/Customers', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            await pool.connect();
            
            const tableCheck = await pool.request().query(`
                SELECT COUNT(*) as tableExists
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Customers'
            `);
            
            if (tableCheck.recordset[0].tableExists === 0) {
                res.json({ 
                    success: true, 
                    customers: [],
                    message: 'Customer accounts feature not yet implemented'
                });
                return;
            }
            
            const result = await pool.request().query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    PhoneNumber,
                    IsActive,
                    CreatedAt
                FROM Customers
                ORDER BY CreatedAt DESC
            `);
            
            // Return customer data as plain text
            const customers = result.recordset;
            
            res.json({ 
                success: true, 
                customers: customers 
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch customer accounts' 
            });
        }
    });

    // Edit User route for Inventory Manager
    router.post('/Employee/InventoryManager/InventoryManageUsers/Users/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { userId, username, fullName, email, roleId, isActive, password } = req.body;
            
            await pool.connect();
            
            // Get current user data before updating
            const currentUserResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Username, FullName, Email, RoleID, IsActive, PasswordHash FROM Users WHERE UserID = @userId');
            
            if (currentUserResult.recordset.length === 0) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            const currentUser = currentUserResult.recordset[0];
            const changes = {};
            
            // Decrypt current user data for comparison using transparent encryption service
            const decryptedCurrentUser = currentUser;
            const currentUsername = decryptedCurrentUser.Username;
            const currentFullName = decryptedCurrentUser.FullName;
            const currentEmail = decryptedCurrentUser.Email;
            
            // Check for changes and build changes object
            if (currentUsername !== username) {
                changes.Username = { old: currentUsername, new: username };
            }
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentUser.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentUser.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            if (roleId && currentUser.RoleID !== parseInt(roleId)) {
                changes.RoleID = { old: currentUser.RoleID, new: parseInt(roleId) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store user data as plain text
            const userData = {
                Username: username,
                FullName: fullName,
                Email: email
            };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`
                        UPDATE Users 
                        SET PasswordHash = @password
                        WHERE UserID = @userId
                    `);
                changes.Password = { old: '[HIDDEN]', new: '[UPDATED]' };
            }
            
            // Update user information with encrypted data
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('username', sql.NVarChar, userData.Username)
                .input('fullName', sql.NVarChar, userData.FullName)
                .input('email', sql.NVarChar, userData.Email)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Users 
                    SET Username = @username, FullName = @fullName, Email = @email, IsActive = @isActive
                    WHERE UserID = @userId
                `);
            
            // Update user role if roleId is provided
            if (roleId) {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('roleId', sql.Int, roleId)
                    .query(`
                        UPDATE Users 
                        SET RoleID = @roleId 
                        WHERE UserID = @userId
                    `);
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Users',
                userId.toString(),
                `InventoryManager updated user information for ${username} (ID: ${userId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    });

    // Edit Customer route for Inventory Manager
    router.post('/Employee/InventoryManager/InventoryManageUsers/Customers/Edit', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId, fullName, email, phone, isActive } = req.body;
            
            await pool.connect();
            
            // Get current customer data before updating
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, PhoneNumber, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            const changes = {};
            
            // Decrypt current customer data for comparison using transparent encryption service
            const decryptedCurrentCustomer = currentCustomer;
            const currentFullName = decryptedCurrentCustomer.FullName;
            const currentEmail = decryptedCurrentCustomer.Email;
            const currentPhoneNumber = decryptedCurrentCustomer.PhoneNumber;
            
            // Check for changes and build changes object
            if (currentFullName !== fullName) {
                changes.FullName = { old: currentFullName, new: fullName };
            }
            if (currentEmail !== email) {
                changes.Email = { old: currentEmail, new: email };
            }
            if (currentPhoneNumber !== phone) {
                changes.PhoneNumber = { old: currentPhoneNumber, new: phone };
            }
            if (currentCustomer.IsActive !== (isActive === '1' ? 1 : 0)) {
                changes.IsActive = { old: currentCustomer.IsActive, new: (isActive === '1' ? 1 : 0) };
            }
            
            // Encrypt the new data using transparent encryption service
            // Store customer data as plain text
            const customerData = {
                FullName: fullName,
                Email: email,
                PhoneNumber: phone
            };
            
            // Update customer information with encrypted data
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('fullName', sql.NVarChar, customerData.FullName)
                .input('email', sql.NVarChar, customerData.Email)
                .input('phone', sql.NVarChar, customerData.PhoneNumber)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    UPDATE Customers 
                    SET FullName = @fullName, Email = @email, PhoneNumber = @phone, IsActive = @isActive
                    WHERE CustomerID = @customerId
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `InventoryManager updated customer information for ${fullName} (ID: ${customerId})`,
                Object.keys(changes).length > 0 ? JSON.stringify(changes) : null
            );
            
            res.json({ success: true, message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ success: false, message: 'Failed to update customer' });
        }
    });

    // Inventory Manager - Archive Customer route (Soft Delete)
    router.post('/Employee/InventoryManager/InventoryManageUsers/Customers/Archive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before archiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer is already archived
            if (currentCustomer.IsActive === 0) {
                return res.json({ success: false, message: 'Customer is already archived' });
            }
            
            // Archive the customer (soft delete by setting IsActive = 0)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 0 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Inventory Manager archived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            res.json({ success: true, message: 'Customer archived successfully' });
        } catch (error) {
            console.error('Error archiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to archive customer',
                error: error.message
            });
        }
    });

    // Inventory Manager - Dearchive Customer route (Restore Archived Customer)
    router.post('/Employee/InventoryManager/InventoryManageUsers/Customers/Dearchive', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.body;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before dearchiving
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email, IsActive FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Customer data is already plain text
            const fullName = currentCustomer.FullName;
            const email = currentCustomer.Email;
            
            // Check if customer is already active
            if (currentCustomer.IsActive === 1) {
                return res.json({ success: false, message: 'Customer is already active' });
            }
            
            // Dearchive the customer (restore by setting IsActive = 1)
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE Customers SET IsActive = 1 WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Customers',
                customerId.toString(),
                `Inventory Manager dearchived customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            res.json({ success: true, message: 'Customer restored successfully' });
        } catch (error) {
            console.error('Error dearchiving customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to restore customer',
                error: error.message
            });
        }
    });

    // Inventory Manager - Permanently Delete Customer route (Hard Delete)
    router.delete('/Employee/InventoryManager/InventoryManageUsers/Customers/Delete/:customerId', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const { customerId } = req.params;
            
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'Customer ID is required' });
            }
            
            await pool.connect();
            
            // Get current customer data before deleting
            const currentCustomerResult = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT FullName, Email FROM Customers WHERE CustomerID = @customerId');
            
            if (currentCustomerResult.recordset.length === 0) {
                return res.json({ success: false, message: 'Customer not found' });
            }
            
            const currentCustomer = currentCustomerResult.recordset[0];
            
            // Check if customer has any orders before permanent deletion
            const ordersCheck = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE CustomerID = @customerId');
            
            if (ordersCheck.recordset[0].orderCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot permanently delete customer with existing orders. Please archive instead.' 
                });
            }
            
            // Permanently delete the customer
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM Customers WHERE CustomerID = @customerId');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'Customers',
                customerId.toString(),
                `Inventory Manager permanently deleted customer ${currentCustomer.FullName} (ID: ${customerId})`,
                JSON.stringify({ action: 'permanent_delete' })
            );
            
            res.json({ success: true, message: 'Customer permanently deleted successfully' });
        } catch (error) {
            console.error('Error permanently deleting customer:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to permanently delete customer',
                error: error.message
            });
        }
    });

    // Toggle User Active Status API for Inventory Manager
    router.post('/Employee/InventoryManager/InventoryManageUsers/ToggleActive/:userId/:newStatus', isAuthenticated, checkPermission('users_manage_users'), async (req, res) => {
        try {
            const userId = req.params.userId;
            const newStatus = parseInt(req.params.newStatus);

            await pool.connect();
            
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('isActive', sql.Bit, newStatus)
                .query(`
                    UPDATE Users 
                    SET IsActive = @isActive, UpdatedAt = GETDATE()
                    WHERE UserID = @userId
                `);

            res.json({ success: true, message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    });

    // Get User Permissions API
    router.get('/Employee/Admin/ManageUsers/Permissions/:userId', isAuthenticated, async (req, res) => {
        try {
            const userId = req.params.userId;
            
            console.log('=== Permission Request Debug ===');
            console.log('User ID requested:', userId);
            console.log('Session user:', req.session.user);
            console.log('User role:', req.session.user?.role);
            
            // Only Admin can view user permissions
            if (req.session.user.role !== 'Admin') {
                console.log('Access denied: User is not Admin');
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            console.log('Admin access confirmed, connecting to database...');
            await pool.connect();
            
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT PermissionName, CanAccess, Section
                    FROM UserPermissions
                    WHERE UserID = @userId
                    ORDER BY Section, PermissionName
                `);
            
            console.log('Permissions found:', result.recordset.length);
            console.log('Permissions data:', result.recordset);
            
            res.json({ 
                success: true, 
                permissions: result.recordset 
            });
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch user permissions',
                error: error.message 
            });
        }
    });

    // Update User Permissions API
    router.post('/Employee/Admin/ManageUsers/Permissions/:userId/Update', isAuthenticated, async (req, res) => {
        try {
            const userId = req.params.userId;
            const { permissions } = req.body;
            
            // Debug logging (can be removed in production)
            console.log('=== Permission Update Request ===');
            console.log('User ID:', userId);
            console.log('Permissions received:', permissions);
            
            // Only Admin can update user permissions
            if (req.session.user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            if (!permissions || !Array.isArray(permissions)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid permissions data' 
                });
            }

            await pool.connect();
            
            // Get user details for logging
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT FullName FROM Users WHERE UserID = @userId`);
            
            const userName = userResult.recordset[0]?.FullName || `User ${userId}`;
            
            // Update each permission
            for (const permission of permissions) {
                const { permission_name, has_access } = permission;
                
                // Determine section from permission name
                let section = 'other';
                if (permission_name.startsWith('inventory_')) section = 'inventory';
                else if (permission_name.startsWith('transactions_')) section = 'transactions';
                else if (permission_name.startsWith('orders_')) section = 'orders';
                else if (permission_name.startsWith('users_')) section = 'users';
                else if (permission_name.startsWith('reviews_')) section = 'reviews';
                else if (permission_name.startsWith('chat_')) section = 'chat';
                else if (permission_name.startsWith('content_')) section = 'content';
                
                // Check if permission exists
                const existingResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('permissionName', sql.NVarChar, permission_name)
                    .query(`
                        SELECT PermissionID FROM UserPermissions 
                        WHERE UserID = @userId AND PermissionName = @permissionName
                    `);
                
                if (existingResult.recordset.length > 0) {
                    // Update existing permission
                    // console.log(`Updating permission: ${permission_name} = ${has_access} for user ${userId}`);
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('permissionName', sql.NVarChar, permission_name)
                        .input('canAccess', sql.Bit, has_access)
                        .query(`
                            UPDATE UserPermissions 
                            SET CanAccess = @canAccess, UpdatedAt = GETDATE()
                            WHERE UserID = @userId AND PermissionName = @permissionName
                        `);
                } else {
                    // Insert new permission
                    // console.log(`Inserting new permission: ${permission_name} = ${has_access} for user ${userId}`);
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('section', sql.NVarChar, section)
                        .input('permissionName', sql.NVarChar, permission_name)
                        .input('canAccess', sql.Bit, has_access)
                        .query(`
                            INSERT INTO UserPermissions (UserID, Section, PermissionName, CanAccess)
                            VALUES (@userId, @section, @permissionName, @canAccess)
                        `);
                }
            }
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'UserPermissions',
                userId,
                `Permissions updated for user "${userName}"`
            );
            
            res.json({ 
                success: true, 
                message: 'User permissions updated successfully' 
            });
        } catch (error) {
            console.error('Error updating user permissions:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update user permissions' 
            });
        }
    });

    // Get Current User Permissions API
    router.get('/api/user-permissions', isAuthenticated, async (req, res) => {
        try {
            const userId = req.session.user.id;
            
            await pool.connect();
            
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT PermissionName, CanAccess
                    FROM UserPermissions
                    WHERE UserID = @userId
                `);
            
            // Convert to object for easier access
            const permissions = {};
            result.recordset.forEach(perm => {
                permissions[perm.PermissionName] = { CanAccess: perm.CanAccess };
            });
            
            res.json({ 
                success: true, 
                permissions: permissions 
            });
        } catch (error) {
            console.error('Error fetching current user permissions:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch user permissions' 
            });
        }
    });

    // Forbidden Access Route
    router.get('/Employee/Forbidden', isAuthenticated, (req, res) => {
        res.render('Employee/Forbidden', { user: req.session.user });
    });

 
    // Admin ChatSupport route
    router.get('/Employee/Admin/ChatSupport', isAuthenticated, async (req, res) => {
        console.log('=== ChatSupport Route Called ===');
        let threads = [];
        let selectedThread = null;
        let messages = [];
        
        try {
            await pool.connect();
            
            // Get thread parameter from query string
            const threadId = req.query.thread;
            
            console.log('ChatSupport Route Debug:');
            console.log('- threadId from query:', threadId);
            console.log('- req.query:', req.query);
            
            // Fetch all chat threads
            const threadsResult = await pool.request().query(`
                SELECT c.CustomerID, c.FullName, c.Email,
                    MAX(m.SentAt) AS LastMessageAt,
                    (SELECT TOP 1 MessageText FROM ChatMessages WHERE CustomerID = c.CustomerID ORDER BY SentAt DESC) AS LastMessageText,
                    SUM(CASE WHEN m.SenderType = 'customer' AND m.IsRead = 0 THEN 1 ELSE 0 END) AS UnreadCount
                FROM Customers c
                LEFT JOIN ChatMessages m ON c.CustomerID = m.CustomerID
                GROUP BY c.CustomerID, c.FullName, c.Email
                ORDER BY LastMessageAt DESC
            `);
            threads = threadsResult.recordset;
            
            // If a thread is selected, fetch its details and messages
            if (threadId) {
                const customerId = parseInt(threadId);
                console.log('Processing thread selection for customerId:', customerId);
                
                // Get customer details
                const customerResult = await pool.request()
                    .input('customerId', sql.Int, customerId)
                    .query('SELECT CustomerID, FullName, Email FROM Customers WHERE CustomerID = @customerId');
                
                console.log('Customer query result:', customerResult.recordset);
                
                if (customerResult.recordset.length > 0) {
                    selectedThread = customerResult.recordset[0];
                    console.log('Selected thread found:', selectedThread);
                    
                    // Get messages for this customer
                    const messagesResult = await pool.request()
                        .input('customerId', sql.Int, customerId)
                        .query(`
                            SELECT MessageID, CustomerID, MessageText, SenderType, SentAt, IsRead
                            FROM ChatMessages 
                            WHERE CustomerID = @customerId 
                            ORDER BY SentAt ASC
                        `);
                    messages = messagesResult.recordset;
                    
                    // Mark messages as read
                    await pool.request()
                        .input('customerId', sql.Int, customerId)
                        .query(`
                            UPDATE ChatMessages 
                            SET IsRead = 1 
                            WHERE CustomerID = @customerId AND SenderType = 'customer' AND IsRead = 0
                        `);
                }
            }
            
            console.log('Rendering template with:');
            console.log('- selectedThread:', selectedThread);
            console.log('- selectedThread type:', typeof selectedThread);
            console.log('- selectedThread.CustomerID:', selectedThread ? selectedThread.CustomerID : 'null');
            console.log('- messages count:', messages.length);
            
        } catch (err) {
            console.error('Error fetching chat threads:', err);
            // Ensure variables are always defined
            threads = threads || [];
            selectedThread = selectedThread || null;
            messages = messages || [];
        } finally {
            // Always render the template with defined variables
            console.log('=== Rendering Template ===');
            console.log('- threads type:', typeof threads);
            console.log('- threads length:', threads ? threads.length : 'undefined');
            console.log('- selectedThread:', selectedThread);
            console.log('- messages length:', messages ? messages.length : 'undefined');
            
            res.render('Employee/Admin/AdminChatSupport', { 
                user: req.session.user, 
                threads, 
                selectedThread, 
                messages,
                error: threads.length === 0 ? 'No chat threads found.' : null
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

    // Admin Chat Support API Endpoints
    
    // GET /api/support/chat/messages/:customerId - Get messages for a specific customer (Admin)
    router.get('/api/support/chat/messages/:customerId', isAuthenticated, async (req, res) => {
        try {
            console.log('🔍 Fetching messages for customer ID:', req.params.customerId);
            await pool.connect();
            const { customerId } = req.params;
            
            console.log('📊 Executing query for customer:', customerId);
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT 
                        cm.MessageID,
                        cm.CustomerID,
                        cm.MessageText as Message,
                        CASE WHEN cm.SenderType = 'customer' THEN 1 ELSE 0 END as IsFromCustomer,
                        cm.SentAt as CreatedAt,
                        c.FullName as CustomerName
                    FROM ChatMessages cm
                    LEFT JOIN Customers c ON cm.CustomerID = c.CustomerID
                    WHERE cm.CustomerID = @customerId
                    ORDER BY cm.SentAt ASC
                `);
            
            console.log('✅ Query successful, found', result.recordset.length, 'messages');
            console.log('📝 Messages:', result.recordset);
            
            res.json({ 
                success: true, 
                messages: result.recordset 
            });
        } catch (err) {
            console.error('❌ Error fetching chat messages:', err);
            console.error('❌ Error details:', err.message);
            console.error('❌ Error code:', err.code);
            res.json({ success: false, message: 'Failed to fetch messages: ' + err.message });
        }
    });

    // POST /api/support/chat/messages/:customerId - Send a message to customer (Admin)
    router.post('/api/support/chat/messages/:customerId', isAuthenticated, async (req, res) => {
        try {
            console.log('📤 Sending message to customer ID:', req.params.customerId);
            console.log('📤 Request body:', req.body);
            
            await pool.connect();
            const { customerId } = req.params;
            const { message } = req.body;
            
            console.log('📤 Customer ID:', customerId, 'Message:', message);
            
            if (!message || !message.trim()) {
                console.log('❌ Message is empty or invalid');
                return res.json({ success: false, message: 'Message is required' });
            }
            
            console.log('📤 Inserting message into database...');
            // Insert admin message (SenderType = 'support')
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('message', sql.NVarChar, message.trim())
                .query(`
                    INSERT INTO ChatMessages (CustomerID, MessageText, SenderType, SentAt)
                    VALUES (@customerId, @message, 'support', GETDATE())
                `);
            
            console.log('✅ Message inserted successfully:', result);
            
            res.json({ 
                success: true, 
                message: 'Message sent successfully' 
            });
        } catch (err) {
            console.error('❌ Error sending message:', err);
            console.error('❌ Error details:', err.message);
            console.error('❌ Error code:', err.code);
            res.json({ success: false, message: 'Failed to send message: ' + err.message });
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

    // Admin CMS route
    router.get('/Employee/Admin/CMS', isAuthenticated, async (req, res) => {
        try {
            console.log('=== AdminCMS Route Called ===');
            
            res.render('Employee/Admin/AdminCMS', { 
                user: req.session.user,
                pageTitle: 'Content Management System'
            });
        } catch (err) {
            console.error('Error loading AdminCMS:', err);
            res.render('Employee/Admin/AdminCMS', { 
                user: req.session.user,
                pageTitle: 'Content Management System',
                error: 'Failed to load CMS interface.'
            });
        }
    });

    // --- Hero Banner API Endpoints ---
    
    // GET: Fetch hero banner settings (admin only)
    router.get('/api/admin/hero-banner', isAuthenticated, async (req, res) => {
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
                const heroBanner = result.recordset[0];
                res.json({
                    success: true,
                    heroBanner: {
                        mainHeading: heroBanner.MainHeading || '',
                        descriptionLine1: heroBanner.DescriptionLine1 || '',
                        descriptionLine2: heroBanner.DescriptionLine2 || '',
                        buttonText: heroBanner.ButtonText || '',
                        buttonLink: heroBanner.ButtonLink || '',
                        button2Text: heroBanner.Button2Text || '',
                        button2Link: heroBanner.Button2Link || '',
                        button2BgColor: heroBanner.Button2BgColor || '#007bff',
                        button2TextColor: heroBanner.Button2TextColor || '#ffffff',
                        textColor: heroBanner.TextColor || '#ffffff',
                        buttonBgColor: heroBanner.ButtonBgColor || '#007bff',
                        buttonTextColor: heroBanner.ButtonTextColor || '#ffffff',
                        heroBannerImages: heroBanner.HeroBannerImages ? JSON.parse(heroBanner.HeroBannerImages) : [],
                        createdAt: heroBanner.CreatedAt,
                        updatedAt: heroBanner.UpdatedAt
                    }
                });
            } else {
                res.json({
                    success: true,
                    heroBanner: {
                        mainHeading: '',
                        descriptionLine1: '',
                        descriptionLine2: '',
                        buttonText: '',
                        buttonLink: '',
                        button2Text: '',
                        button2Link: '',
                        button2BgColor: '#007bff',
                        button2TextColor: '#ffffff',
                        textColor: '#ffffff',
                        buttonBgColor: '#007bff',
                        buttonTextColor: '#ffffff',
                        heroBannerImages: [],
                        createdAt: null,
                        updatedAt: null
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching hero banner settings:', err);
            res.status(500).json({ error: 'Failed to fetch hero banner settings' });
        }
    });

    // POST: Save hero banner settings (admin only)
    router.post('/api/admin/hero-banner', isAuthenticated, upload.array('heroBannerImages', 3), async (req, res) => {
        try {
            await pool.connect();
            
            const {
                mainHeading,
                descriptionLine1,
                descriptionLine2,
                buttonText,
                buttonLink,
                button2Text,
                button2Link,
                button2BgColor,
                button2TextColor,
                textColor,
                buttonBgColor,
                buttonTextColor
            } = req.body;
            
            // Handle uploaded images
            let heroBannerImages = [];
            if (req.files && req.files.length > 0) {
                heroBannerImages = req.files.map(file => ({
                    filename: file.filename,
                    originalname: file.originalname,
                    path: file.path,
                    size: file.size
                }));
            }
            
            // Get existing images if no new ones uploaded
            if (heroBannerImages.length === 0) {
                const existingResult = await pool.request().query(`
                    SELECT TOP 1 HeroBannerImages FROM HeroBanner ORDER BY UpdatedAt DESC
                `);
                if (existingResult.recordset.length > 0 && existingResult.recordset[0].HeroBannerImages) {
                    heroBannerImages = JSON.parse(existingResult.recordset[0].HeroBannerImages);
                }
            }
            
            // Insert or update hero banner settings
            await pool.request()
                .input('mainHeading', sql.NVarChar, mainHeading)
                .input('descriptionLine1', sql.NVarChar, descriptionLine1)
                .input('descriptionLine2', sql.NVarChar, descriptionLine2)
                .input('buttonText', sql.NVarChar, buttonText)
                .input('buttonLink', sql.NVarChar, buttonLink)
                .input('button2Text', sql.NVarChar, button2Text)
                .input('button2Link', sql.NVarChar, button2Link)
                .input('button2BgColor', sql.NVarChar, button2BgColor)
                .input('button2TextColor', sql.NVarChar, button2TextColor)
                .input('textColor', sql.NVarChar, textColor)
                .input('buttonBgColor', sql.NVarChar, buttonBgColor)
                .input('buttonTextColor', sql.NVarChar, buttonTextColor)
                .input('heroBannerImages', sql.NVarChar, JSON.stringify(heroBannerImages))
                .query(`
                    MERGE HeroBanner AS target
                    USING (SELECT 1 AS dummy) AS source
                    ON (1=1)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            MainHeading = @mainHeading,
                            DescriptionLine1 = @descriptionLine1,
                            DescriptionLine2 = @descriptionLine2,
                            ButtonText = @buttonText,
                            ButtonLink = @buttonLink,
                            Button2Text = @button2Text,
                            Button2Link = @button2Link,
                            Button2BgColor = @button2BgColor,
                            Button2TextColor = @button2TextColor,
                            TextColor = @textColor,
                            ButtonBgColor = @buttonBgColor,
                            ButtonTextColor = @buttonTextColor,
                            HeroBannerImages = @heroBannerImages,
                            UpdatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink, 
                                Button2Text, Button2Link, Button2BgColor, Button2TextColor, 
                                TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages)
                        VALUES (@mainHeading, @descriptionLine1, @descriptionLine2, @buttonText, @buttonLink,
                                @button2Text, @button2Link, @button2BgColor, @button2TextColor,
                                @textColor, @buttonBgColor, @buttonTextColor, @heroBannerImages);
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'HeroBanner',
                null,
                `Updated hero banner settings: "${mainHeading}" with ${heroBannerImages.length} images`
            );
            
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
    router.delete('/api/admin/hero-banner', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                UPDATE HeroBanner
                SET HeroBannerImages = NULL, UpdatedAt = GETDATE()
                WHERE ID = (SELECT TOP 1 ID FROM HeroBanner ORDER BY UpdatedAt DESC)
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
            
            const result = await pool.request().query(`
                SELECT TOP 1 
                    MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
                    Button2Text, Button2Link, Button2BgColor, Button2TextColor,
                    TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages, CreatedAt, UpdatedAt
                FROM HeroBanner
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                const heroBanner = result.recordset[0];
                res.json({
                    success: true,
                    heroBanner: {
                        mainHeading: heroBanner.MainHeading || '',
                        descriptionLine1: heroBanner.DescriptionLine1 || '',
                        descriptionLine2: heroBanner.DescriptionLine2 || '',
                        buttonText: heroBanner.ButtonText || '',
                        buttonLink: heroBanner.ButtonLink || '',
                        button2Text: heroBanner.Button2Text || '',
                        button2Link: heroBanner.Button2Link || '',
                        button2BgColor: heroBanner.Button2BgColor || '#007bff',
                        button2TextColor: heroBanner.Button2TextColor || '#ffffff',
                        textColor: heroBanner.TextColor || '#ffffff',
                        buttonBgColor: heroBanner.ButtonBgColor || '#007bff',
                        buttonTextColor: heroBanner.ButtonTextColor || '#ffffff',
                        heroBannerImages: heroBanner.HeroBannerImages ? JSON.parse(heroBanner.HeroBannerImages) : [],
                        createdAt: heroBanner.CreatedAt,
                        updatedAt: heroBanner.UpdatedAt
                    }
                });
            } else {
                res.json({
                    success: true,
                    heroBanner: {
                        mainHeading: 'Welcome to Design Excellence',
                        descriptionLine1: 'Creating beautiful, functional spaces',
                        descriptionLine2: 'Your dream home starts here',
                        buttonText: 'Explore Products',
                        buttonLink: '/products',
                        button2Text: 'Get Quote',
                        button2Link: '/contact',
                        button2BgColor: '#28a745',
                        button2TextColor: '#ffffff',
                        textColor: '#ffffff',
                        buttonBgColor: '#007bff',
                        buttonTextColor: '#ffffff',
                        heroBannerImages: [],
                        createdAt: null,
                        updatedAt: null
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching hero banner settings:', err);
            res.status(500).json({ error: 'Failed to fetch hero banner settings' });
        }
    });

    // Admin Logs route
    router.get('/Employee/Admin/Logs', isAuthenticated, async (req, res) => {
        try {
            res.render('Employee/Admin/AdminLogs', { user: req.session.user });
        } catch (err) {
            console.error('Error rendering admin logs page:', err);
            res.status(500).send('Error loading admin logs page');
        }
    });

    // Admin Logs Data API endpoint with filtering support
    router.get('/Employee/Admin/Logs/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const currentUserRole = req.session.user.role;
            
            // Get query parameters for filtering
            const {
                action,
                tableAffected,
                userRole,
                dateFrom,
                dateTo,
                search,
                limit = 1000,
                offset = 0
            } = req.query;
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    al.LogID,
                    al.UserID,
                    u.FullName,
                    r.RoleName,
                    al.Action,
                    al.TableAffected,
                    al.RecordID,
                    al.Description,
                    al.Changes,
                    al.Timestamp
                FROM ActivityLogs al
                JOIN Users u ON al.UserID = u.UserID
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            // Add filters
            if (action) {
                query += ` AND al.Action = @action`;
                request.input('action', sql.NVarChar, action);
            }
            
            if (tableAffected) {
                query += ` AND al.TableAffected = @tableAffected`;
                request.input('tableAffected', sql.NVarChar, tableAffected);
            }
            
            if (userRole) {
                query += ` AND r.RoleName = @userRole`;
                request.input('userRole', sql.NVarChar, userRole);
            }
            
            if (dateFrom) {
                query += ` AND al.Timestamp >= @dateFrom`;
                request.input('dateFrom', sql.DateTime, new Date(dateFrom));
            }
            
            if (dateTo) {
                query += ` AND al.Timestamp <= @dateTo`;
                request.input('dateTo', sql.DateTime, new Date(dateTo));
            }
            
            if (search) {
                query += ` AND (al.Description LIKE @search OR u.FullName LIKE @search OR r.RoleName LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            // Add ordering and pagination
            query += ` ORDER BY al.Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            request.input('offset', sql.Int, parseInt(offset));
            request.input('limit', sql.Int, parseInt(limit));
            
            const result = await request.query(query);
            
            // Decrypt user FullName before sending to frontend using transparent encryption service
            const decryptedLogs = result.recordset.map(log => {
                return {
                    ...log,
                    FullName: log.FullName
                };
            });
            
            res.json({ success: true, logs: decryptedLogs });
        } catch (err) {
            console.error('Error fetching activity logs data:', err);
            res.status(500).json({ success: false, message: 'Failed to retrieve activity logs data.', error: err.message });
        }
    });

    // =============================================================================
    // CMS API ENDPOINTS
    // =============================================================================

    // CMS Content Types API
    router.get('/api/cms/content-types', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    'page' as id,
                    'Pages' as name,
                    'Website pages and content' as description,
                    COUNT(*) as count
                FROM Pages
                UNION ALL
                SELECT 
                    'post' as id,
                    'Posts' as name,
                    'Blog posts and articles' as description,
                    COUNT(*) as count
                FROM Posts
                UNION ALL
                SELECT 
                    'product' as id,
                    'Products' as name,
                    'Product listings' as description,
                    COUNT(*) as count
                FROM Products
            `);
            res.json({ success: true, contentTypes: result.recordset });
        } catch (err) {
            console.error('Error fetching content types:', err);
            res.json({ success: false, message: 'Failed to retrieve content types.' });
        }
    });

    // CMS Recent Content API
    router.get('/api/cms/recent-content', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 10
                    'page' as type,
                    PageID as id,
                    Title as title,
                    'published' as status,
                    'Admin' as author,
                    UpdatedAt as updatedAt
                FROM Pages
                ORDER BY UpdatedAt DESC
            `);
            res.json({ success: true, content: result.recordset });
        } catch (err) {
            console.error('Error fetching recent content:', err);
            res.json({ success: false, message: 'Failed to retrieve recent content.' });
        }
    });

    // CMS Media API
    router.get('/api/cms/media', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();

            // Detect available timestamp column to avoid errors on older schemas
            const uploadedAtCheck = await pool.request().query(`
                SELECT 1 AS existsFlag
                FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.MediaFiles') AND name = 'UploadedAt'
            `);
            const createdAtCheck = await pool.request().query(`
                SELECT 1 AS existsFlag
                FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.MediaFiles') AND name = 'CreatedAt'
            `);

            const hasUploadedAt = uploadedAtCheck.recordset.length > 0;
            const hasCreatedAt = createdAtCheck.recordset.length > 0;

            const uploadedAtSelect = hasUploadedAt
                ? 'UploadedAt'
                : (hasCreatedAt ? 'CreatedAt' : 'NULL');
            const orderByExpr = hasUploadedAt
                ? 'UploadedAt DESC'
                : (hasCreatedAt ? 'CreatedAt DESC' : 'MediaID DESC');

            const query = `
                SELECT 
                    MediaID as id,
                    FileName as name,
                    (CASE WHEN LEFT(FilePath, 1) = '/' 
                          THEN CONCAT(ISNULL(@publicBase,''), FilePath)
                          ELSE FilePath END) as url,
                    FileSize as size,
                    'image' as type,
                    ${uploadedAtSelect} as uploadedAt
                FROM MediaFiles
                ORDER BY ${orderByExpr}
            `;

            const publicBase = process.env.PUBLIC_BACKEND_URL || '';
            const result = await pool.request()
                .input('publicBase', sql.NVarChar, publicBase)
                .query(query);
            res.json({ success: true, media: result.recordset });
        } catch (err) {
            console.error('Error fetching media:', err);
            res.json({ success: false, message: 'Failed to retrieve media files.' });
        }
    });

    // CMS Pages API
    router.get('/api/cms/pages', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    PageID as id,
                    Title as title,
                    Slug as slug,
                    'published' as status,
                    'default' as template,
                    UpdatedAt as updatedAt
                FROM Pages
                ORDER BY UpdatedAt DESC
            `);
            res.json({ success: true, pages: result.recordset });
        } catch (err) {
            console.error('Error fetching pages:', err);
            res.json({ success: false, message: 'Failed to retrieve pages.' });
        }
    });

    // CMS Templates API
    router.get('/api/cms/templates', isAuthenticated, async (req, res) => {
        try {
            const templates = [
                {
                    id: 'default',
                    name: 'Default Template',
                    description: 'Clean and simple layout',
                    preview: '/images/templates/default.jpg'
                },
                {
                    id: 'modern',
                    name: 'Modern Template',
                    description: 'Contemporary design with animations',
                    preview: '/images/templates/modern.jpg'
                },
                {
                    id: 'classic',
                    name: 'Classic Template',
                    description: 'Traditional business layout',
                    preview: '/images/templates/classic.jpg'
                }
            ];
            res.json({ success: true, templates: templates });
        } catch (err) {
            console.error('Error fetching templates:', err);
            res.json({ success: false, message: 'Failed to retrieve templates.' });
        }
    });

    // Theme Active API
    router.get('/api/theme/active', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    ActiveTheme as activeTheme,
                    BackgroundImage as backgroundImage
                FROM ThemeSettings
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ 
                    success: true, 
                    activeTheme: result.recordset[0].activeTheme || 'default',
                    backgroundImage: result.recordset[0].backgroundImage || null
                });
            } else {
                // Default settings
                res.json({ 
                    success: true, 
                    activeTheme: 'default',
                    backgroundImage: null
                });
            }
        } catch (err) {
            console.error('Error fetching theme settings:', err);
            res.json({ success: false, message: 'Failed to retrieve theme settings.' });
        }
    });

    // Public Theme API (for frontend)
    router.get('/api/theme/public', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    ActiveTheme as activeTheme,
                    BackgroundImage as backgroundImage
                FROM ThemeSettings
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ 
                    success: true, 
                    activeTheme: result.recordset[0].activeTheme || 'default',
                    backgroundImage: result.recordset[0].backgroundImage || null
                });
            } else {
                // Default settings
                res.json({ 
                    success: true, 
                    activeTheme: 'default',
                    backgroundImage: null
                });
            }
        } catch (err) {
            console.error('Error fetching public theme settings:', err);
            res.json({ success: false, message: 'Failed to retrieve theme settings.' });
        }
    });

    // Public Theme Update API (for frontend theme switcher)
    router.post('/api/theme/public', async (req, res) => {
        try {
            await pool.connect();
            const { activeTheme } = req.body;
            
            // Validate theme value
            const validThemes = ['default', 'dark', 'christmas'];
            if (activeTheme && !validThemes.includes(activeTheme)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid theme value'
                });
            }
            
            // Update theme settings
            await pool.request()
                .input('activeTheme', sql.NVarChar, activeTheme || 'default')
                .query(`
                    MERGE ThemeSettings AS target
                    USING (SELECT 1 AS dummy) AS source
                    ON (1=1)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            ActiveTheme = @activeTheme,
                            UpdatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (ActiveTheme, UpdatedAt)
                        VALUES (@activeTheme, GETDATE());
                `);
            
            res.json({ success: true, message: 'Theme updated successfully' });
        } catch (err) {
            console.error('Error updating public theme settings:', err);
            res.json({ success: false, message: 'Failed to update theme settings' });
        }
    });

    // Public Projects API (for frontend)
    router.get('/api/projects', async (req, res) => {
        console.log('=== FETCHING PUBLIC PROJECTS ===');
        try {
            await pool.connect();
            console.log('Database connected for public projects fetch');
            
            // First try the view, if it doesn't exist, fall back to direct table query
            let result;
            try {
                result = await pool.request().query(`
                SELECT 
                        id,
                        title,
                        description,
                        main_image_url as imageUrl,
                        is_active as active,
                        created_at as createdAt,
                        thumbnail_urls
                FROM vw_project_items_with_thumbnails
                WHERE is_active = 1
                ORDER BY created_at DESC
                `);
                console.log('Used view query, found', result.recordset.length, 'items');
            } catch (viewError) {
                console.log('View not found, using direct table query');
                // Fallback to direct table query
                result = await pool.request().query(`
                SELECT 
                    pi.id,
                    pi.title,
                    pi.description,
                    pi.main_image_url as imageUrl,
                    pi.is_active as active,
                    pi.created_at as createdAt,
                    STUFF((
                        SELECT ',' + pt.image_url
                        FROM project_thumbnails pt
                        WHERE pt.project_item_id = pi.id
                        ORDER BY pt.sort_order
                        FOR XML PATH('')
                    ), 1, 1, '') as thumbnail_urls
                FROM project_items pi
                WHERE pi.is_active = 1
                ORDER BY pi.created_at DESC
                `);
                console.log('Used direct query, found', result.recordset.length, 'items');
            }
            
            // Transform the data to match frontend expectations
            const projects = result.recordset.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                mainImageUrl: item.imageUrl,
                thumbnailUrls: item.thumbnail_urls ? item.thumbnail_urls.split(',') : [],
                active: item.active,
                createdAt: item.createdAt
            }));
            
            console.log('Projects:', projects);
            res.json(projects);
        } catch (err) {
            console.error('Error fetching public projects:', err);
            res.json([]);
        }
    });

    // Theme Save API
    router.post('/api/theme/active', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { activeTheme, backgroundImage } = req.body;
            
            // Create or update theme settings
            await pool.request()
                .input('activeTheme', sql.NVarChar, activeTheme || 'default')
                .input('backgroundImage', sql.NVarChar, backgroundImage || null)
                .query(`
                    MERGE ThemeSettings AS target
                    USING (SELECT 1 AS dummy) AS source
                    ON (1=1)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            ActiveTheme = @activeTheme,
                            BackgroundImage = @backgroundImage,
                            UpdatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (ActiveTheme, BackgroundImage, UpdatedAt)
                        VALUES (@activeTheme, @backgroundImage, GETDATE());
                `);
            
            res.json({ success: true, message: 'Theme settings saved successfully' });
        } catch (err) {
            console.error('Error saving theme settings:', err);
            res.json({ success: false, message: 'Failed to save theme settings' });
        }
    });

    // Theme Background Image Upload API
    router.post('/api/theme/background-image', isAuthenticated, (req, res) => {
        themeUpload.single('backgroundImage')(req, res, async (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.json({ success: false, message: 'File upload error: ' + err.message });
            }
            
            try {
                await pool.connect();
                
                if (!req.file) {
                    return res.json({ success: false, message: 'No image file provided' });
                }
                
                console.log('Theme background upload:', {
                    originalname: req.file.originalname,
                    filename: req.file.filename,
                    path: req.file.path,
                    size: req.file.size
                });
                
                const backgroundImagePath = `/uploads/theme-backgrounds/${req.file.filename}`;
                
                // Update theme settings with new background image
                await pool.request()
                    .input('backgroundImage', sql.NVarChar, backgroundImagePath)
                    .query(`
                        MERGE ThemeSettings AS target
                        USING (SELECT 1 AS dummy) AS source
                        ON (1=1)
                        WHEN MATCHED THEN
                            UPDATE SET 
                                BackgroundImage = @backgroundImage,
                                UpdatedAt = GETDATE()
                        WHEN NOT MATCHED THEN
                            INSERT (ActiveTheme, BackgroundImage, UpdatedAt)
                            VALUES ('default', @backgroundImage, GETDATE());
                    `);
                
                console.log('Theme background saved to database:', backgroundImagePath);
                
                res.json({ 
                    success: true, 
                    message: 'Background image uploaded successfully',
                    backgroundImage: backgroundImagePath
                });
            } catch (err) {
                console.error('Error uploading background image:', err);
                res.json({ success: false, message: 'Failed to upload background image: ' + err.message });
            }
        });
    });

    // Admin Products API
    router.get('/api/admin/products', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    ImageURL,
                    Category,
                    IsFeatured,
                    IsActive,
                    Model3DURL,
                    ThumbnailURLs,
                    StockQuantity
                FROM Products
                WHERE IsActive = 1
                ORDER BY ProductID DESC
            `);
            res.json({ success: true, products: result.recordset });
        } catch (err) {
            console.error('Error fetching products:', err);
            res.json({ success: false, message: 'Failed to retrieve products.' });
        }
    });

    // Admin Terms API
    router.get('/api/admin/terms', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    SignupTermsTitle as signupTermsTitle,
                    SignupTermsContent as signupTermsContent,
                    SignupTermsCheckboxText as signupTermsCheckboxText,
                    PrivacyPolicyTitle as privacyPolicyTitle,
                    PrivacyPolicyContent as privacyPolicyContent,
                    PrivacyPolicyCheckboxText as privacyPolicyCheckboxText,
                    TermsOfServiceTitle as termsOfServiceTitle,
                    TermsOfServiceContent as termsOfServiceContent,
                    TermsOfServiceCheckboxText as termsOfServiceCheckboxText,
                    CheckoutTermsTitle as checkoutTermsTitle,
                    CheckoutTermsContent as checkoutTermsContent,
                    CheckoutTermsCheckboxText as checkoutTermsCheckboxText,
                    TermsLastUpdated as termsLastUpdated,
                    TermsVersion as termsVersion,
                    RequireAgreement as requireAgreement,
                    UpdatedAt as updatedAt
                FROM TermsAndConditions
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, terms: result.recordset[0] });
            } else {
                res.json({ success: true, terms: null });
            }
        } catch (err) {
            console.error('Error fetching terms:', err);
            res.json({ success: false, message: 'Failed to retrieve terms and conditions.' });
        }
    });

    // Admin Header Banner API
    router.get('/api/admin/header-banner', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const publicBase = process.env.PUBLIC_BACKEND_URL || '';
            const result = await pool.request()
                .input('publicBase', sql.NVarChar, publicBase)
                .query(`
                SELECT TOP 1
                    ContactBgColor as contactBgColor,
                    ContactTextColor as contactTextColor,
                    ContactIconColor as contactIconColor,
                    MainBgColor as mainBgColor,
                    NavBgColor as navBgColor,
                    NavTextColor as navTextColor,
                    NavHoverColor as navHoverColor,
                    SearchBorderColor as searchBorderColor,
                    IconColor as iconColor,
                    ContactEmail as contactEmail,
                    ContactPhone as contactPhone,
                    ContactAddress as contactAddress,
                    SearchPlaceholder as searchPlaceholder,
                    ContactFontSize as contactFontSize,
                    ContactSpacing as contactSpacing,
                    ContactShowIcons as contactShowIcons,
                    (CASE WHEN LEFT(LogoURL, 1) = '/'
                          THEN CONCAT(ISNULL(@publicBase,''), LogoURL)
                          ELSE LogoURL END) as logoUrl,
                    UpdatedAt as updatedAt
                FROM HeaderBanner
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, banner: result.recordset[0] });
            } else {
                res.json({ success: true, banner: null });
            }
        } catch (err) {
            console.error('Error fetching header banner:', err);
            res.json({ success: false, message: 'Failed to retrieve header banner settings.' });
        }
    });

    // Admin Header Banner Save API
    router.post('/api/admin/header-banner', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const {
                contactBgColor,
                contactTextColor,
                contactIconColor,
                mainBgColor,
                navBgColor,
                navTextColor,
                navHoverColor,
                searchBorderColor,
                iconColor,
                contactEmail,
                contactPhone,
                contactAddress,
                searchPlaceholder,
                contactFontSize,
                contactSpacing,
                contactShowIcons,
                logoUrl
            } = req.body;
            
            console.log('Header Banner Save API - Received data:', req.body);
            
            // Create or update header banner settings
            await pool.request()
                .input('contactBgColor', sql.NVarChar, contactBgColor || '#f8f9fa')
                .input('contactTextColor', sql.NVarChar, contactTextColor || '#6c757d')
                .input('contactIconColor', sql.NVarChar, contactIconColor || '#F0B21B')
                .input('mainBgColor', sql.NVarChar, mainBgColor || '#ffffff')
                .input('navBgColor', sql.NVarChar, navBgColor || '#F0B21B')
                .input('navTextColor', sql.NVarChar, navTextColor || '#333333')
                .input('navHoverColor', sql.NVarChar, navHoverColor || '#d69e16')
                .input('searchBorderColor', sql.NVarChar, searchBorderColor || '#ffc107')
                .input('iconColor', sql.NVarChar, iconColor || '#F0B21B')
                .input('contactEmail', sql.NVarChar, contactEmail || 'designexcellence1@gmail.com')
                .input('contactPhone', sql.NVarChar, contactPhone || '(02) 413-6682')
                .input('contactAddress', sql.NVarChar, contactAddress || '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City')
                .input('searchPlaceholder', sql.NVarChar, searchPlaceholder || 'Search')
                .input('contactFontSize', sql.NVarChar, contactFontSize || '0.6rem')
                .input('contactSpacing', sql.NVarChar, contactSpacing || '0.8rem')
                .input('contactShowIcons', sql.Bit, contactShowIcons || true)
                .input('logoUrl', sql.NVarChar, logoUrl || null)
                .query(`
                    MERGE HeaderBanner AS target
                    USING (SELECT 1 AS dummy) AS source
                    ON (1=1)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            ContactBgColor = @contactBgColor,
                            ContactTextColor = @contactTextColor,
                            ContactIconColor = @contactIconColor,
                            MainBgColor = @mainBgColor,
                            NavBgColor = @navBgColor,
                            NavTextColor = @navTextColor,
                            NavHoverColor = @navHoverColor,
                            SearchBorderColor = @searchBorderColor,
                            IconColor = @iconColor,
                            ContactEmail = @contactEmail,
                            ContactPhone = @contactPhone,
                            ContactAddress = @contactAddress,
                            SearchPlaceholder = @searchPlaceholder,
                            ContactFontSize = @contactFontSize,
                            ContactSpacing = @contactSpacing,
                            ContactShowIcons = @contactShowIcons,
                            LogoURL = @logoUrl,
                            UpdatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (ContactBgColor, ContactTextColor, ContactIconColor, MainBgColor,
                                NavBgColor, NavTextColor, NavHoverColor, SearchBorderColor,
                                IconColor, ContactEmail, ContactPhone, ContactAddress, SearchPlaceholder,
                                ContactFontSize, ContactSpacing, ContactShowIcons, LogoURL, UpdatedAt)
                        VALUES (@contactBgColor, @contactTextColor, @contactIconColor, @mainBgColor,
                                @navBgColor, @navTextColor, @navHoverColor, @searchBorderColor,
                                @iconColor, @contactEmail, @contactPhone, @contactAddress, @searchPlaceholder,
                                @contactFontSize, @contactSpacing, @contactShowIcons, @logoUrl, GETDATE());
                `);
            
            res.json({ success: true, message: 'Header banner settings saved successfully' });
        } catch (err) {
            console.error('Error saving header banner settings:', err);
            res.json({ success: false, message: 'Failed to save header banner settings' });
        }
    });

    // Admin Terms Save API
    router.post('/api/admin/terms', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const {
                signupTermsTitle,
                signupTermsContent,
                signupTermsCheckboxText,
                privacyPolicyTitle,
                privacyPolicyContent,
                privacyPolicyCheckboxText,
                termsOfServiceTitle,
                termsOfServiceContent,
                termsOfServiceCheckboxText,
                checkoutTermsTitle,
                checkoutTermsContent,
                checkoutTermsCheckboxText,
                termsLastUpdated,
                termsVersion,
                requireAgreement
            } = req.body;
            
            // Create or update terms and conditions
            await pool.request()
                .input('signupTermsTitle', sql.NVarChar, signupTermsTitle || '')
                .input('signupTermsContent', sql.NVarChar, signupTermsContent || '')
                .input('signupTermsCheckboxText', sql.NVarChar, signupTermsCheckboxText || '')
                .input('privacyPolicyTitle', sql.NVarChar, privacyPolicyTitle || '')
                .input('privacyPolicyContent', sql.NVarChar, privacyPolicyContent || '')
                .input('privacyPolicyCheckboxText', sql.NVarChar, privacyPolicyCheckboxText || '')
                .input('termsOfServiceTitle', sql.NVarChar, termsOfServiceTitle || '')
                .input('termsOfServiceContent', sql.NVarChar, termsOfServiceContent || '')
                .input('termsOfServiceCheckboxText', sql.NVarChar, termsOfServiceCheckboxText || '')
                .input('checkoutTermsTitle', sql.NVarChar, checkoutTermsTitle || '')
                .input('checkoutTermsContent', sql.NVarChar, checkoutTermsContent || '')
                .input('checkoutTermsCheckboxText', sql.NVarChar, checkoutTermsCheckboxText || '')
                .input('termsLastUpdated', sql.NVarChar, termsLastUpdated || '')
                .input('termsVersion', sql.NVarChar, termsVersion || '1.0')
                .input('requireAgreement', sql.Bit, requireAgreement || false)
                .query(`
                    MERGE TermsAndConditions AS target
                    USING (SELECT 1 AS dummy) AS source
                    ON (1=1)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            SignupTermsTitle = @signupTermsTitle,
                            SignupTermsContent = @signupTermsContent,
                            SignupTermsCheckboxText = @signupTermsCheckboxText,
                            PrivacyPolicyTitle = @privacyPolicyTitle,
                            PrivacyPolicyContent = @privacyPolicyContent,
                            PrivacyPolicyCheckboxText = @privacyPolicyCheckboxText,
                            TermsOfServiceTitle = @termsOfServiceTitle,
                            TermsOfServiceContent = @termsOfServiceContent,
                            TermsOfServiceCheckboxText = @termsOfServiceCheckboxText,
                            CheckoutTermsTitle = @checkoutTermsTitle,
                            CheckoutTermsContent = @checkoutTermsContent,
                            CheckoutTermsCheckboxText = @checkoutTermsCheckboxText,
                            TermsLastUpdated = @termsLastUpdated,
                            TermsVersion = @termsVersion,
                            RequireAgreement = @requireAgreement,
                            UpdatedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (SignupTermsTitle, SignupTermsContent, SignupTermsCheckboxText,
                                PrivacyPolicyTitle, PrivacyPolicyContent, PrivacyPolicyCheckboxText,
                                TermsOfServiceTitle, TermsOfServiceContent, TermsOfServiceCheckboxText,
                                CheckoutTermsTitle, CheckoutTermsContent, CheckoutTermsCheckboxText,
                                TermsLastUpdated, TermsVersion, RequireAgreement, UpdatedAt)
                        VALUES (@signupTermsTitle, @signupTermsContent, @signupTermsCheckboxText,
                                @privacyPolicyTitle, @privacyPolicyContent, @privacyPolicyCheckboxText,
                                @termsOfServiceTitle, @termsOfServiceContent, @termsOfServiceCheckboxText,
                                @checkoutTermsTitle, @checkoutTermsContent, @checkoutTermsCheckboxText,
                                @termsLastUpdated, @termsVersion, @requireAgreement, GETDATE());
                `);
            
            res.json({ success: true, message: 'Terms and conditions saved successfully' });
        } catch (err) {
            console.error('Error saving terms and conditions:', err);
            res.json({ success: false, message: 'Failed to save terms and conditions' });
        }
    });

    // Test Contact Messages Statistics API (no auth for testing)
    router.get('/api/test/contact-messages/stats', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'New' THEN 1 ELSE 0 END) as new,
                    SUM(CASE WHEN Status = 'Read' THEN 1 ELSE 0 END) as [read],
                    SUM(CASE WHEN Status = 'Replied' THEN 1 ELSE 0 END) as replied
                FROM ContactSubmissions
            `);
            res.json({ success: true, stats: result.recordset[0] });
        } catch (err) {
            console.error('Error fetching contact message statistics:', err);
            res.json({ success: false, message: 'Failed to retrieve contact message statistics.', error: err.message });
        }
    });

    // Test Contact Messages API (no auth for testing)
    router.get('/api/test/contact-messages', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    Id as id,
                    Name as name,
                    Email as email,
                    Message as message,
                    Status as status,
                    SubmittedAt as createdAt,
                    SubmittedAt as submissionDate
                FROM ContactSubmissions
                ORDER BY SubmittedAt DESC
            `);
            res.json({ success: true, messages: result.recordset });
        } catch (err) {
            console.error('Error fetching contact messages:', err);
            res.json({ success: false, message: 'Failed to retrieve contact messages.', error: err.message });
        }
    });

    // Admin Contact Messages Statistics API
    router.get('/api/admin/contact-messages/stats', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'New' THEN 1 ELSE 0 END) as new,
                    SUM(CASE WHEN Status = 'Read' THEN 1 ELSE 0 END) as [read],
                    SUM(CASE WHEN Status = 'Replied' THEN 1 ELSE 0 END) as replied
                FROM ContactSubmissions
            `);
            res.json({ success: true, stats: result.recordset[0] });
        } catch (err) {
            console.error('Error fetching contact message statistics:', err);
            res.json({ success: false, message: 'Failed to retrieve contact message statistics.' });
        }
    });

    // Admin Contact Messages API
    router.get('/api/admin/contact-messages', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    Id as id,
                    Name as name,
                    Email as email,
                    Message as message,
                    Status as status,
                    SubmittedAt as createdAt,
                    SubmittedAt as submissionDate
                FROM ContactSubmissions
                ORDER BY SubmittedAt DESC
            `);
            res.json({ success: true, messages: result.recordset });
        } catch (err) {
            console.error('Error fetching contact messages:', err);
            res.json({ success: false, message: 'Failed to retrieve contact messages.' });
        }
    });

    // Public Auto Messages API (for frontend)
    router.get('/api/auto-messages', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    ID as id,
                    Question as question,
                    Answer as answer,
                    Keywords as keywords
                FROM AutoMessages
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC
            `);
            res.json({ success: true, items: result.recordset });
        } catch (err) {
            console.error('Error fetching auto messages:', err);
            res.json({ success: false, message: 'Failed to retrieve auto messages.' });
        }
    });

    // CMS Auto Messages API
    router.get('/api/cms/auto-messages', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    ID as id,
                    Question as question,
                    Answer as answer,
                    Keywords as keywords,
                    IsActive as isActive,
                    CreatedAt as createdAt
                FROM AutoMessages
                ORDER BY CreatedAt DESC
            `);
            res.json({ success: true, messages: result.recordset });
        } catch (err) {
            console.error('Error fetching auto messages:', err);
            res.json({ success: false, message: 'Failed to retrieve auto messages.' });
        }
    });

    // CMS Auto Messages POST API
    router.post('/api/cms/auto-messages', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { question, answer, keywords, isActive } = req.body;
            
            await pool.request()
                .input('question', sql.NVarChar, question)
                .input('answer', sql.NVarChar, answer)
                .input('keywords', sql.NVarChar, keywords || '')
                .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
                .query(`
                    INSERT INTO AutoMessages (Question, Answer, Keywords, IsActive, CreatedAt)
                    VALUES (@question, @answer, @keywords, @isActive, GETDATE())
                `);
            
            res.json({ success: true, message: 'FAQ created successfully.' });
        } catch (err) {
            console.error('Error creating FAQ:', err);
            res.json({ success: false, message: 'Failed to create FAQ.' });
        }
    });

    // CMS Auto Messages GET Single FAQ API
    router.get('/api/cms/auto-messages/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        ID as id,
                        Question as question,
                        Answer as answer,
                        Keywords as keywords,
                        IsActive as isActive,
                        CreatedAt as createdAt
                    FROM AutoMessages
                    WHERE ID = @id
                `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, faq: result.recordset[0] });
            } else {
                res.json({ success: false, message: 'FAQ not found.' });
            }
        } catch (err) {
            console.error('Error fetching FAQ:', err);
            res.json({ success: false, message: 'Failed to retrieve FAQ.' });
        }
    });

    // CMS Auto Messages PUT API (Update)
    router.put('/api/cms/auto-messages/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { question, answer, keywords, isActive } = req.body;
            
            await pool.request()
                .input('id', sql.Int, id)
                .input('question', sql.NVarChar, question)
                .input('answer', sql.NVarChar, answer)
                .input('keywords', sql.NVarChar, keywords || '')
                .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
                .query(`
                    UPDATE AutoMessages 
                    SET 
                        Question = @question,
                        Answer = @answer,
                        Keywords = @keywords,
                        IsActive = @isActive
                    WHERE ID = @id
                `);
            
            res.json({ success: true, message: 'FAQ updated successfully.' });
        } catch (err) {
            console.error('Error updating FAQ:', err);
            res.json({ success: false, message: 'Failed to update FAQ.' });
        }
    });

    // CMS Auto Messages DELETE API
    router.delete('/api/cms/auto-messages/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM AutoMessages WHERE ID = @id
                `);
            
            res.json({ success: true, message: 'FAQ deleted successfully.' });
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            res.json({ success: false, message: 'Failed to delete FAQ.' });
        }
    });

    // CMS Header Offer API
    router.get('/api/cms/header-offer', isAuthenticated, async (req, res) => {
        try {
            // Ensure pool is connected
            if (!pool.connected) {
            await pool.connect();
            }
            const result = await pool.request().query(`
                SELECT TOP 1
                    OfferText as offerText,
                    ButtonText as buttonText,
                    StartDate as startDate,
                    EndDate as endDate,
                    Status as status,
                    BackgroundColor as backgroundColor,
                    TextColor as textColor,
                    UpdatedAt as updatedAt
                FROM HeaderOfferBar
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                // Convert status to isActive boolean for frontend
                settings.isActive = settings.status === 'active';
                res.json({ success: true, settings: settings });
            } else {
                res.json({ success: true, settings: null });
            }
        } catch (err) {
            console.error('Error fetching header offer settings:', err);
            res.json({ success: false, message: 'Failed to retrieve header offer settings.' });
        }
    });

    // Public Header Offer Bar API (for frontend)
    router.get('/api/header-offer-bar', async (req, res) => {
        try {
            // Ensure pool is connected
            if (!pool.connected) {
                await pool.connect();
            }
            const result = await pool.request().query(`
                SELECT TOP 1
                    OfferText as offerText,
                    ButtonText as buttonText,
                    StartDate as startDate,
                    EndDate as endDate,
                    Status as status,
                    BackgroundColor as backgroundColor,
                    TextColor as textColor,
                    UpdatedAt as updatedAt
                FROM HeaderOfferBar
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                
                if (settings.status === 'active') {
                    // Check if offer is still valid (within date range)
                    const now = new Date();
                    const startDate = new Date(settings.startDate);
                    const endDate = new Date(settings.endDate);
                    
                    if (now >= startDate && now <= endDate) {
                        res.json({
                            isActive: true,
                            offerText: settings.offerText,
                            buttonText: settings.buttonText,
                            backgroundColor: settings.backgroundColor,
                            textColor: settings.textColor,
                            offerLink: '/products' // Default link, can be made configurable
                        });
                    } else {
                        // Active but expired - show empty bar
                        res.json({
                            isActive: false,
                            showInactive: true,
                            backgroundColor: settings.backgroundColor,
                            textColor: settings.textColor
                        });
                    }
                } else {
                    // Inactive - show empty bar with background
                    res.json({
                        isActive: false,
                        showInactive: true,
                        backgroundColor: settings.backgroundColor,
                        textColor: settings.textColor
                    });
                }
            } else {
                res.json({ isActive: false });
            }
        } catch (err) {
            console.error('Error fetching public header offer settings:', err);
            res.json({ isActive: false });
        }
    });

    // CMS Header Offer POST API
    router.post('/api/cms/header-offer', isAuthenticated, async (req, res) => {
        console.log('=== HEADER OFFER POST REQUEST ===');
        console.log('Request body:', req.body);
        try {
            // Ensure pool is connected
            if (!pool.connected) {
            await pool.connect();
            }
            const { offerText, offerLink, backgroundColor, textColor, isActive } = req.body;
            
            console.log('Parsed data:', { offerText, offerLink, backgroundColor, textColor, isActive });
            
            // Convert isActive to status
            const status = (isActive === 'on' || isActive === true) ? 'active' : 'inactive';
            const buttonText = 'View Offer'; // Default button text
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
            
            console.log('Processed data:', { status, buttonText, startDate, endDate });
            
            // Check if settings exist
            console.log('Checking if HeaderOfferBar table has existing records...');
            const existingResult = await pool.request().query('SELECT COUNT(*) as count FROM HeaderOfferBar');
            console.log('Existing records count:', existingResult.recordset[0].count);
            
            if (existingResult.recordset[0].count > 0) {
                console.log('Updating existing HeaderOfferBar record...');
                // Update existing settings
                const updateResult = await pool.request()
                    .input('offerText', sql.NVarChar, offerText)
                    .input('buttonText', sql.NVarChar, buttonText)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .input('status', sql.NVarChar, status)
                    .input('backgroundColor', sql.NVarChar, backgroundColor)
                    .input('textColor', sql.NVarChar, textColor)
                    .query(`
                        UPDATE HeaderOfferBar 
                        SET OfferText = @offerText,
                            ButtonText = @buttonText,
                            StartDate = @startDate,
                            EndDate = @endDate,
                            Status = @status,
                            BackgroundColor = @backgroundColor,
                            TextColor = @textColor,
                            UpdatedAt = GETDATE()
                    `);
                console.log('Update result:', updateResult);
            } else {
                console.log('Creating new HeaderOfferBar record...');
                // Create new settings
                const insertResult = await pool.request()
                    .input('offerText', sql.NVarChar, offerText)
                    .input('buttonText', sql.NVarChar, buttonText)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .input('status', sql.NVarChar, status)
                    .input('backgroundColor', sql.NVarChar, backgroundColor)
                    .input('textColor', sql.NVarChar, textColor)
                    .query(`
                        INSERT INTO HeaderOfferBar (OfferText, ButtonText, StartDate, EndDate, Status, BackgroundColor, TextColor, CreatedAt, UpdatedAt)
                        VALUES (@offerText, @buttonText, @startDate, @endDate, @status, @backgroundColor, @textColor, GETDATE(), GETDATE())
                    `);
                console.log('Insert result:', insertResult);
            }
            
            console.log('✅ Header offer settings saved successfully');
            res.json({ success: true, message: 'Header offer settings saved successfully.' });
        } catch (err) {
            console.error('❌ Error saving header offer settings:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                number: err.number,
                state: err.state,
                procedure: err.procedure,
                lineNumber: err.lineNumber
            });
            res.json({ success: false, message: `Failed to save header offer settings: ${err.message}` });
        }
    });

    router.put('/api/admin/products/:id/featured', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { featured } = req.body;
            
            await pool.request()
                .input('productId', sql.Int, id)
                .input('featured', sql.Bit, featured)
                .query('UPDATE Products SET IsFeatured = @featured WHERE ProductID = @productId');
            
            res.json({ success: true, message: 'Product featured status updated.' });
        } catch (err) {
            console.error('Error updating product featured status:', err);
            res.json({ success: false, message: 'Failed to update product featured status.' });
        }
    });

    router.delete('/api/admin/products/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('productId', sql.Int, id)
                .query('UPDATE Products SET IsActive = 0 WHERE ProductID = @productId');
            
            res.json({ success: true, message: 'Product deleted successfully.' });
        } catch (err) {
            console.error('Error deleting product:', err);
            res.json({ success: false, message: 'Failed to delete product.' });
        }
    });

    // Product Discount Management API
    router.post('/api/admin/products/:id/discount', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { discountType, discountValue, startDate, endDate } = req.body;
            
            // Validate input
            if (!discountType || !discountValue || !startDate || !endDate) {
                return res.json({ success: false, error: 'All discount fields are required.' });
            }
            
            if (discountValue <= 0) {
                return res.json({ success: false, error: 'Discount value must be greater than 0.' });
            }
            
            if (discountType === 'percentage' && discountValue > 100) {
                return res.json({ success: false, error: 'Percentage discount cannot exceed 100%.' });
            }
            
            // Check if product exists
            const productCheck = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT ProductID, Name, Price FROM Products WHERE ProductID = @productId AND IsActive = 1');
            
            if (productCheck.recordset.length === 0) {
                return res.json({ success: false, error: 'Product not found.' });
            }
            
            const product = productCheck.recordset[0];
            
            // Validate fixed discount doesn't exceed product price
            if (discountType === 'fixed' && discountValue > product.Price) {
                return res.json({ success: false, error: 'Fixed discount cannot exceed product price.' });
            }
            
            // Check if discount already exists for this product
            const existingDiscount = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT DiscountID FROM ProductDiscounts WHERE ProductID = @productId AND IsActive = 1');
            
            if (existingDiscount.recordset.length > 0) {
                return res.json({ success: false, error: 'Product already has an active discount. Please remove it first.' });
            }
            
            // Insert new discount
            await pool.request()
                .input('productId', sql.Int, id)
                .input('discountType', sql.NVarChar, discountType)
                .input('discountValue', sql.Decimal(10, 2), discountValue)
                .input('startDate', sql.DateTime2, new Date(startDate))
                .input('endDate', sql.DateTime2, new Date(endDate))
                .query(`
                    INSERT INTO ProductDiscounts (ProductID, DiscountType, DiscountValue, StartDate, EndDate, IsActive)
                    VALUES (@productId, @discountType, @discountValue, @startDate, @endDate, 1)
                `);
            
            res.json({ success: true, message: 'Discount added successfully!' });
        } catch (err) {
            console.error('Error adding product discount:', err);
            res.json({ success: false, error: 'Failed to add discount: ' + err.message });
        }
    });

    router.delete('/api/admin/products/:id/discount', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            // Check if discount exists
            const discountCheck = await pool.request()
                .input('productId', sql.Int, id)
                .query('SELECT DiscountID FROM ProductDiscounts WHERE ProductID = @productId AND IsActive = 1');
            
            if (discountCheck.recordset.length === 0) {
                return res.json({ success: false, error: 'No active discount found for this product.' });
            }
            
            // Deactivate the discount
            await pool.request()
                .input('productId', sql.Int, id)
                .query('UPDATE ProductDiscounts SET IsActive = 0 WHERE ProductID = @productId AND IsActive = 1');
            
            res.json({ success: true, message: 'Discount removed successfully!' });
        } catch (err) {
            console.error('Error removing product discount:', err);
            res.json({ success: false, error: 'Failed to remove discount: ' + err.message });
        }
    });

    // Testimonials Management API
    router.get('/api/cms/testimonials', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    TestimonialID as id,
                    Name as name,
                    Profession as profession,
                    Text as content,
                    Rating as rating,
                    DisplayOrder as displayOrder,
                    ImageURL as imageUrl,
                    IsActive as active,
                    CreatedAt as createdAt
                FROM Testimonials
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC
            `);
            res.json({ success: true, testimonials: result.recordset });
        } catch (err) {
            console.error('Error fetching testimonials:', err);
            res.json({ success: false, message: 'Failed to retrieve testimonials.' });
        }
    });

    router.get('/api/cms/testimonials/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            const result = await pool.request()
                .input('testimonialId', sql.Int, id)
                .query(`
                    SELECT 
                        TestimonialID as id,
                        Name as name,
                        Profession as profession,
                        Text as content,
                        Rating as rating,
                        DisplayOrder as displayOrder,
                        ImageURL as imageUrl,
                        IsActive as active,
                        CreatedAt as createdAt
                    FROM Testimonials
                    WHERE TestimonialID = @testimonialId AND IsActive = 1
                `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, testimonial: result.recordset[0] });
            } else {
                res.json({ success: false, message: 'Testimonial not found.' });
            }
        } catch (err) {
            console.error('Error fetching testimonial:', err);
            res.json({ success: false, message: 'Failed to retrieve testimonial.' });
        }
    });

    router.post('/api/cms/testimonials', isAuthenticated, testimonialsUpload.single('image'), async (req, res) => {
        try {
            await pool.connect();
            const { name, profession, text, rating, displayOrder } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/testimonials/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('profession', sql.NVarChar, profession)
                .input('text', sql.NVarChar, text)
                .input('rating', sql.Decimal(2,1), parseFloat(rating))
                .input('displayOrder', sql.Int, parseInt(displayOrder) || 0)
                .input('imageUrl', sql.NVarChar, imageUrl)
                .query(`
                    INSERT INTO Testimonials (Name, Profession, Text, Rating, DisplayOrder, ImageURL, IsActive, CreatedAt, UpdatedAt)
                    VALUES (@name, @profession, @text, @rating, @displayOrder, @imageUrl, 1, GETDATE(), GETDATE())
                `);
            
            res.json({ success: true, message: 'Testimonial added successfully.' });
        } catch (err) {
            console.error('Error adding testimonial:', err);
            res.json({ success: false, message: 'Failed to add testimonial.' });
        }
    });

    router.put('/api/cms/testimonials/:id', isAuthenticated, testimonialsUpload.single('image'), async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { name, profession, text, rating, displayOrder } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/testimonials/${req.file.filename}`;
            }
            
            let updateQuery = `
                UPDATE Testimonials 
                SET Name = @name,
                    Profession = @profession,
                    Text = @text,
                    Rating = @rating,
                    DisplayOrder = @displayOrder,
                    UpdatedAt = GETDATE()
            `;
            
            if (imageUrl) {
                updateQuery += `, ImageURL = @imageUrl`;
            }
            
            updateQuery += ` WHERE TestimonialID = @testimonialId`;
            
            const request = pool.request()
                .input('name', sql.NVarChar, name)
                .input('profession', sql.NVarChar, profession)
                .input('text', sql.NVarChar, text)
                .input('rating', sql.Decimal(2,1), parseFloat(rating))
                .input('displayOrder', sql.Int, parseInt(displayOrder) || 0)
                .input('testimonialId', sql.Int, id);
            
            if (imageUrl) {
                request.input('imageUrl', sql.NVarChar, imageUrl);
            }
            
            await request.query(updateQuery);
            
            res.json({ success: true, message: 'Testimonial updated successfully.' });
        } catch (err) {
            console.error('Error updating testimonial:', err);
            res.json({ success: false, message: 'Failed to update testimonial.' });
        }
    });

    router.delete('/api/cms/testimonials/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('testimonialId', sql.Int, id)
                .query('UPDATE Testimonials SET IsActive = 0 WHERE TestimonialID = @testimonialId');
            
            res.json({ success: true, message: 'Testimonial deleted successfully.' });
        } catch (err) {
            console.error('Error deleting testimonial:', err);
            res.json({ success: false, message: 'Failed to delete testimonial.' });
        }
    });

    // Testimonials Design Settings API
    router.get('/api/cms/testimonials-design', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    BgColor as bgColor,
                    AccentColor as accentColor,
                    ShowRating as showRating,
                    ShowImage as showImage,
                    ShowTitle as showTitle,
                    Theme as theme,
                    Layout as layout,
                    PerRow as perRow,
                    Animation as animation,
                    TextColor as textColor,
                    BorderRadius as borderRadius,
                    UpdatedAt as updatedAt
                FROM TestimonialsDesign
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, settings: result.recordset[0] });
            } else {
                res.json({ success: true, settings: null });
            }
        } catch (err) {
            console.error('Error fetching testimonials design settings:', err);
            res.json({ success: false, message: 'Failed to retrieve testimonials design settings.' });
        }
    });

    router.post('/api/cms/testimonials-design', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { bgColor, accentColor, showRating, showImage, showTitle, showQuoteIcon } = req.body;
            
            // Check if settings exist
            const existingResult = await pool.request().query('SELECT COUNT(*) as count FROM TestimonialsDesign');
            
            if (existingResult.recordset[0].count > 0) {
                // Update existing settings
                await pool.request()
                    .input('bgColor', sql.NVarChar, bgColor)
                    .input('accentColor', sql.NVarChar, accentColor)
                    .input('showRating', sql.Bit, showRating === 'on' || showRating === true)
                    .input('showImage', sql.Bit, showImage === 'on' || showImage === true)
                    .input('showTitle', sql.Bit, showTitle === 'on' || showTitle === true)
                    .query(`
                        UPDATE TestimonialsDesign 
                        SET BgColor = @bgColor,
                            AccentColor = @accentColor,
                            ShowRating = @showRating,
                            ShowImage = @showImage,
                            ShowTitle = @showTitle,
                            UpdatedAt = GETDATE()
                    `);
            } else {
                // Create new settings with default values for missing fields
                await pool.request()
                    .input('bgColor', sql.NVarChar, bgColor)
                    .input('accentColor', sql.NVarChar, accentColor)
                    .input('showRating', sql.Bit, showRating === 'on' || showRating === true)
                    .input('showImage', sql.Bit, showImage === 'on' || showImage === true)
                    .input('showTitle', sql.Bit, showTitle === 'on' || showTitle === true)
                    .query(`
                        INSERT INTO TestimonialsDesign (Theme, Layout, PerRow, Animation, BgColor, TextColor, AccentColor, BorderRadius, ShowRating, ShowImage, ShowTitle, CreatedAt, UpdatedAt)
                        VALUES ('modern', 'grid', '3', 'fade', @bgColor, '#333333', @accentColor, '8px', @showRating, @showImage, @showTitle, GETDATE(), GETDATE())
                    `);
            }
            
            res.json({ success: true, message: 'Testimonials design settings saved successfully.' });
        } catch (err) {
            console.error('Error saving testimonials design settings:', err);
            res.json({ success: false, message: 'Failed to save testimonials design settings.' });
        }
    });

    // Public API endpoints for frontend (no authentication required)
    
    // Public Header Banner endpoint for frontend
    router.get('/api/header-banner', async (req, res) => {
        try {
            await pool.connect();
            const publicBase = process.env.PUBLIC_BACKEND_URL || '';
            const result = await pool.request()
                .input('publicBase', sql.NVarChar, publicBase)
                .query(`
                SELECT TOP 1
                    ContactBgColor as contactBgColor,
                    ContactTextColor as contactTextColor,
                    ContactIconColor as contactIconColor,
                    MainBgColor as mainBgColor,
                    NavBgColor as navBgColor,
                    NavTextColor as navTextColor,
                    NavHoverColor as navHoverColor,
                    SearchBorderColor as searchBorderColor,
                    IconColor as iconColor,
                    ContactEmail as contactEmail,
                    ContactPhone as contactPhone,
                    ContactAddress as contactAddress,
                    SearchPlaceholder as searchPlaceholder,
                    ContactFontSize as contactFontSize,
                    ContactSpacing as contactSpacing,
                    ContactShowIcons as contactShowIcons,
                    (CASE WHEN LEFT(LogoURL, 1) = '/'
                          THEN CONCAT(ISNULL(@publicBase,''), LogoURL)
                          ELSE LogoURL END) as logoUrl,
                    UpdatedAt as updatedAt
                FROM HeaderBanner
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, banner: result.recordset[0] });
            } else {
                res.json({ 
                    success: true, 
                    banner: {
                        contactBgColor: '#f8f9fa',
                        contactTextColor: '#6c757d',
                        contactIconColor: '#F0B21B',
                        mainBgColor: '#ffffff',
                        navBgColor: '#F0B21B',
                        navTextColor: '#333333',
                        navHoverColor: '#d69e16',
                        searchBorderColor: '#ffc107',
                        iconColor: '#F0B21B',
                        contactEmail: 'designexcellence1@gmail.com',
                        contactPhone: '(02) 413-6682',
                        contactAddress: '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City',
                        searchPlaceholder: 'Search',
                        contactFontSize: '0.6rem',
                        contactSpacing: '0.8rem',
                        contactShowIcons: true,
                        logoUrl: null
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching header banner:', err);
            res.json({ success: false, message: 'Failed to retrieve header banner settings.' });
        }
    });
    
    // Public Terms and Conditions endpoint for frontend
    router.get('/api/terms', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    SignupTermsTitle as signupTermsTitle,
                    SignupTermsContent as signupTermsContent,
                    SignupTermsCheckboxText as signupTermsCheckboxText,
                    PrivacyPolicyTitle as privacyPolicyTitle,
                    PrivacyPolicyContent as privacyPolicyContent,
                    PrivacyPolicyCheckboxText as privacyPolicyCheckboxText,
                    TermsOfServiceTitle as termsOfServiceTitle,
                    TermsOfServiceContent as termsOfServiceContent,
                    TermsOfServiceCheckboxText as termsOfServiceCheckboxText,
                    CheckoutTermsTitle as checkoutTermsTitle,
                    CheckoutTermsContent as checkoutTermsContent,
                    CheckoutTermsCheckboxText as checkoutTermsCheckboxText,
                    TermsLastUpdated as termsLastUpdated,
                    TermsVersion as termsVersion,
                    RequireAgreement as requireAgreement,
                    UpdatedAt as updatedAt
                FROM TermsAndConditions
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                const terms = result.recordset[0];
                res.json({ 
                    success: true, 
                    terms: terms,
                    // Also provide structured data for different contexts
                    signupTerms: {
                        title: terms.signupTermsTitle,
                        content: terms.signupTermsContent,
                        checkboxText: terms.signupTermsCheckboxText
                    },
                    privacyPolicy: {
                        title: terms.privacyPolicyTitle,
                        content: terms.privacyPolicyContent,
                        checkboxText: terms.privacyPolicyCheckboxText
                    },
                    termsOfService: {
                        title: terms.termsOfServiceTitle,
                        content: terms.termsOfServiceContent,
                        checkboxText: terms.termsOfServiceCheckboxText
                    },
                    checkoutTerms: {
                        title: terms.checkoutTermsTitle,
                        content: terms.checkoutTermsContent,
                        checkboxText: terms.checkoutTermsCheckboxText
                    }
                });
            } else {
                res.json({ 
                    success: true, 
                    terms: null,
                    signupTerms: null,
                    privacyPolicy: null,
                    termsOfService: null,
                    checkoutTerms: null
                });
            }
        } catch (err) {
            console.error('Error fetching public terms:', err);
            res.json({ success: false, message: 'Failed to retrieve terms and conditions.' });
        }
    });
    
    // Public testimonials endpoint for frontend
    router.get('/api/testimonials', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    TestimonialID as id,
                    Name as name,
                    Profession as profession,
                    Text as text,
                    Rating as rating,
                    DisplayOrder as displayOrder,
                    ImageURL as imageUrl,
                    IsActive as active,
                    CreatedAt as createdAt
                FROM Testimonials
                WHERE IsActive = 1
                ORDER BY DisplayOrder ASC, CreatedAt DESC
            `);
            res.json({ success: true, testimonials: result.recordset });
        } catch (err) {
            console.error('Error fetching public testimonials:', err);
            res.json({ success: false, message: 'Failed to retrieve testimonials.' });
        }
    });

    // Public testimonials design settings endpoint for frontend
    router.get('/api/testimonials-design', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
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
                    ShowTitle as showTitle,
                    CreatedAt as createdAt,
                    UpdatedAt as updatedAt
                FROM TestimonialsDesign
            `);
            
            if (result.recordset.length > 0) {
                const settings = result.recordset[0];
                res.json({ 
                    success: true, 
                    ...settings,
                    showRating: settings.showRating ? 'on' : 'off',
                    showImage: settings.showImage ? 'on' : 'off',
                    showTitle: settings.showTitle ? 'on' : 'off',
                    showQuoteIcon: 'on' // Default value since column doesn't exist
                });
            } else {
                // Return default settings if none exist
                res.json({ 
                    success: true,
                    theme: 'modern',
                    layout: 'grid',
                    perRow: '3',
                    animation: 'fade',
                    bgColor: '#ffffff',
                    textColor: '#333333',
                    accentColor: '#F0B21B',
                    borderRadius: '8px',
                    showRating: 'on',
                    showImage: 'on',
                    showTitle: 'on',
                    showQuoteIcon: 'on'
                });
            }
        } catch (err) {
            console.error('Error fetching public testimonials design settings:', err);
            // Return default settings on error
            res.json({ 
                success: true,
                theme: 'modern',
                layout: 'grid',
                perRow: '3',
                animation: 'fade',
                bgColor: '#ffffff',
                textColor: '#333333',
                accentColor: '#F0B21B',
                borderRadius: '8px',
                showRating: 'on',
                showImage: 'on',
                showTitle: 'on',
                showQuoteIcon: 'on'
            });
        }
    });

    // Projects Management API
    router.get('/api/cms/projects', isAuthenticated, async (req, res) => {
        console.log('=== FETCHING PROJECTS ===');
        try {
            await pool.connect();
            console.log('Database connected for projects fetch');
            
            // First try the view, if it doesn't exist, fall back to direct table query
            let result;
            try {
                result = await pool.request().query(`
                SELECT 
                        id,
                        title,
                        description,
                        main_image_url as imageUrl,
                        is_active as active,
                        created_at as createdAt,
                        thumbnail_urls
                    FROM vw_project_items_with_thumbnails
                    WHERE is_active = 1
                    ORDER BY created_at DESC
                `);
                console.log('Used view query, found', result.recordset.length, 'items');
            } catch (viewError) {
                console.log('View not found, using direct table query');
                result = await pool.request().query(`
                    SELECT 
                        id,
                        title,
                        description,
                        main_image_url as imageUrl,
                        is_active as active,
                        created_at as createdAt,
                        '' as thumbnail_urls
                    FROM project_items
                    WHERE is_active = 1
                    ORDER BY created_at DESC
                `);
                console.log('Used direct table query, found', result.recordset.length, 'items');
            }
            
            console.log('Projects:', result.recordset);
            res.json({ success: true, projects: result.recordset });
        } catch (err) {
            console.error('Error fetching projects:', err);
            res.json({ success: false, message: 'Failed to retrieve projects: ' + err.message });
        }
    });

    // Create separate multer configurations for main images and thumbnails
    const mainImageStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const dest = path.join(__dirname, 'public', 'uploads', 'projects', 'main');
            // Ensure directory exists
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const thumbnailStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const dest = path.join(__dirname, 'public', 'uploads', 'projects', 'thumbnails');
            // Ensure directory exists
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const projectsUpload = multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                let dest;
                if (file.fieldname === 'mainImage') {
                    dest = path.join(__dirname, 'public', 'uploads', 'projects', 'main');
                } else if (file.fieldname === 'thumbnails') {
                    dest = path.join(__dirname, 'public', 'uploads', 'projects', 'thumbnails');
                } else {
                    dest = path.join(__dirname, 'public', 'uploads', 'projects');
                }
                
                // Ensure directory exists
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                cb(null, dest);
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit for project images
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Configure multer for logo uploads
    const logoStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'uploads');
            const logosDir = path.join(uploadDir, 'logos');
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(logosDir)) {
                fs.mkdirSync(logosDir, { recursive: true });
            }
            
            cb(null, logosDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    
    const logoUpload = multer({ 
        storage: logoStorage,
        limits: {
            fileSize: 2 * 1024 * 1024 // 2MB limit for logos
        },
        fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for logos!'), false);
            }
        }
    });


    // Admin Logo Upload API
    router.post('/api/admin/logo-upload', isAuthenticated, logoUpload.single('logoUpload'), async (req, res) => {
        try {
            if (!req.file) {
                return res.json({ success: false, message: 'No file uploaded' });
            }

            const logoUrl = `/uploads/logos/${req.file.filename}`;
            
            res.json({ 
                success: true, 
                message: 'Logo uploaded successfully',
                logoUrl: logoUrl,
                filename: req.file.filename
            });
        } catch (err) {
            console.error('Error uploading logo:', err);
            res.json({ success: false, message: 'Failed to upload logo' });
        }
    });

    router.post('/api/cms/projects', isAuthenticated, projectsUpload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'thumbnails', maxCount: 8 }
    ]), async (req, res) => {
        console.log('=== PROJECTS API ENDPOINT CALLED ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Session user:', req.session?.user);
        
        try {
            await pool.connect();
            console.log('Database connected successfully');
            const { title, description } = req.body;
            
            if (!title || !description) {
                return res.json({ success: false, message: 'Title and description are required.' });
            }

            if (!req.files || !req.files.mainImage || req.files.mainImage.length === 0) {
                return res.json({ success: false, message: 'Main image is required.' });
            }

            const mainImage = req.files.mainImage[0];
            const thumbnails = req.files.thumbnails || [];

            // Validate main image
            if (!mainImage.mimetype.startsWith('image/')) {
                return res.json({ success: false, message: 'Main file must be an image.' });
            }

            // Validate thumbnails
            for (const thumbnail of thumbnails) {
                if (!thumbnail.mimetype.startsWith('image/')) {
                    return res.json({ success: false, message: 'All thumbnail files must be images.' });
                }
            }

            // Files are already saved by multer, just get the filenames
            const mainImageFilename = mainImage.filename;
            const thumbnailFilenames = thumbnails.map(thumb => thumb.filename);

            // Save to database with correct paths
            const mainImageUrl = `/uploads/projects/main/${mainImageFilename}`;
            
            // First, insert the main project item
            console.log('Inserting project item with data:', { title, description, mainImageUrl });
            const projectResult = await pool.request()
                .input('title', sql.NVarChar, title)
                .input('category', sql.NVarChar, 'General')
                .input('description', sql.NVarChar, description)
                .input('mainImageUrl', sql.NVarChar, mainImageUrl)
                .input('isActive', sql.Bit, 1)
                .input('createdAt', sql.DateTime, new Date())
                .query(`
                    INSERT INTO project_items (title, category, description, main_image_url, is_active, created_at)
                    VALUES (@title, @category, @description, @mainImageUrl, @isActive, @createdAt);
                    SELECT SCOPE_IDENTITY() as projectId;
                `);

            console.log('Project insert result:', projectResult);
            const projectId = projectResult.recordset[0].projectId;
            console.log('Project ID:', projectId);

            // Then insert thumbnails
            for (let i = 0; i < thumbnailFilenames.length; i++) {
                const thumbnailUrl = `/uploads/projects/thumbnails/${thumbnailFilenames[i]}`;
                await pool.request()
                    .input('projectId', sql.Int, projectId)
                    .input('thumbnailUrl', sql.NVarChar, thumbnailUrl)
                    .input('sortOrder', sql.Int, i)
                    .input('createdAt', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO project_thumbnails (project_item_id, image_url, sort_order, created_at)
                        VALUES (@projectId, @thumbnailUrl, @sortOrder, @createdAt)
                    `);
            }

            const responseData = { 
                success: true, 
                message: 'Project created successfully!',
                project: {
                    title,
                    description,
                    mainImageUrl,
                    thumbnailUrls: thumbnailFilenames.map(filename => `/uploads/projects/thumbnails/${filename}`)
                }
            };
            
            console.log('Sending response:', responseData);
            res.setHeader('Content-Type', 'application/json');
            res.json(responseData);

        } catch (err) {
            console.error('Error creating project:', err);
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
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, message: 'Failed to create project: ' + err.message });
        }
    });

    router.put('/api/cms/projects/:id', isAuthenticated, projectsUpload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'thumbnails', maxCount: 8 }
    ]), async (req, res) => {
        console.log('=== UPDATING PROJECT ===');
        console.log('Project ID:', req.params.id);
        console.log('Update data:', req.body);
        console.log('Update files:', req.files);
        
        try {
            await pool.connect();
            const { id } = req.params;
            const { title, description } = req.body;
            
            if (!title || !description) {
                return res.json({ success: false, message: 'Title and description are required.' });
            }
            
            // Start building the update query
            let updateQuery = 'UPDATE project_items SET title = @title, description = @description, updated_at = @updatedAt';
            let queryParams = {
                projectId: sql.Int,
                title: sql.NVarChar,
                description: sql.NVarChar,
                updatedAt: sql.DateTime
            };
            
            // Handle main image update if provided
            if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
                const mainImage = req.files.mainImage[0];
                if (mainImage.mimetype.startsWith('image/')) {
                    const mainImageUrl = `/uploads/projects/main/${mainImage.filename}`;
                    updateQuery += ', main_image_url = @mainImageUrl';
                    queryParams.mainImageUrl = sql.NVarChar;
                }
            }
            
            // Add WHERE clause
            updateQuery += ' WHERE id = @projectId AND is_active = 1';
            
            // Build the request
            const request = pool.request();
            request.input('projectId', sql.Int, id);
            request.input('title', sql.NVarChar, title);
            request.input('description', sql.NVarChar, description);
            request.input('updatedAt', sql.DateTime, new Date());
            
            // Add main image URL if provided
            if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
                const mainImage = req.files.mainImage[0];
                if (mainImage.mimetype.startsWith('image/')) {
                    const mainImageUrl = `/uploads/projects/main/${mainImage.filename}`;
                    request.input('mainImageUrl', sql.NVarChar, mainImageUrl);
                }
            }
            
            await request.query(updateQuery);
            
            // Handle thumbnail updates if provided
            if (req.files && req.files.thumbnails && req.files.thumbnails.length > 0) {
                const thumbnails = req.files.thumbnails;
                
                // Validate all thumbnails are images
                for (const thumbnail of thumbnails) {
                    if (!thumbnail.mimetype.startsWith('image/')) {
                        return res.json({ success: false, message: 'All thumbnail files must be images.' });
                    }
                }
                
                // Delete existing thumbnails for this project
            await pool.request()
                .input('projectId', sql.Int, id)
                    .query('DELETE FROM project_thumbnails WHERE project_item_id = @projectId');
                
                // Insert new thumbnails
                for (let i = 0; i < thumbnails.length; i++) {
                    const thumbnailUrl = `/uploads/projects/thumbnails/${thumbnails[i].filename}`;
                    await pool.request()
                        .input('projectId', sql.Int, id)
                        .input('thumbnailUrl', sql.NVarChar, thumbnailUrl)
                        .input('sortOrder', sql.Int, i)
                        .input('createdAt', sql.DateTime, new Date())
                        .query(`
                            INSERT INTO project_thumbnails (project_item_id, image_url, sort_order, created_at)
                            VALUES (@projectId, @thumbnailUrl, @sortOrder, @createdAt)
                        `);
                }
            }
            
            console.log('Project updated successfully');
            res.json({ success: true, message: 'Project updated successfully.' });
        } catch (err) {
            console.error('Error updating project:', err);
            res.json({ success: false, message: 'Failed to update project: ' + err.message });
        }
    });

    router.delete('/api/cms/projects/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('projectId', sql.Int, id)
                .query('UPDATE project_items SET is_active = 0 WHERE id = @projectId');
            
            res.json({ success: true, message: 'Project deleted successfully.' });
        } catch (err) {
            console.error('Error deleting project:', err);
            res.json({ success: false, message: 'Failed to delete project.' });
        }
    });

    // Public About Us Content API (for frontend)
    router.get('/api/about', async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    Layout as layout,
                    StoryTitle as ourStoryTitle,
                    StoryDescription as ourStoryContent,
                    MissionTitle as missionTitle,
                    MissionDescription as missionContent,
                    ValuesTitle as visionTitle,
                    Value1Description as visionContent,
                    StorySubtitle as storySubtitle,
                    ProjectsCount as projectsCount,
                    ClientsCount as clientsCount,
                    StoryImageUrl as storyImageUrl,
                    Feature1 as feature1,
                    Feature2 as feature2,
                    Feature3 as feature3,
                    MissionImageUrl as missionImageUrl,
                    Value1Title as value1Title,
                    Value1Description as value1Description,
                    Value2Title as value2Title,
                    Value2Description as value2Description,
                    Value3Title as value3Title,
                    Value3Description as value3Description,
                    Value4Title as value4Title,
                    Value4Description as value4Description,
                    PhilosophyTitle as philosophyTitle,
                    PhilosophySubtitle as philosophySubtitle,
                    PhilosophyDescription as philosophyDescription,
                    Typo1Title as typo1Title,
                    Typo1Description as typo1Description,
                    Typo2Title as typo2Title,
                    Typo2Description as typo2Description,
                    Typo3Title as typo3Title,
                    Typo3Description as typo3Description,
                    UpdatedAt as updatedAt
                FROM AboutUsContent
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, content: result.recordset[0] });
            } else {
                res.json({ success: true, content: null });
            }
        } catch (err) {
            console.error('Error fetching about content:', err);
            res.json({ success: false, message: 'Failed to retrieve about content.' });
        }
    });

    // About Us Content API (for CMS - requires authentication)
    router.get('/api/cms/about', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT TOP 1
                    Layout as layout,
                    StoryTitle as ourStoryTitle,
                    StoryDescription as ourStoryContent,
                    MissionTitle as missionTitle,
                    MissionDescription as missionContent,
                    ValuesTitle as visionTitle,
                    Value1Description as visionContent,
                    StorySubtitle as storySubtitle,
                    ProjectsCount as projectsCount,
                    ClientsCount as clientsCount,
                    StoryImageUrl as storyImageUrl,
                    Feature1 as feature1,
                    Feature2 as feature2,
                    Feature3 as feature3,
                    MissionImageUrl as missionImageUrl,
                    Value1Title as value1Title,
                    Value1Description as value1Description,
                    Value2Title as value2Title,
                    Value2Description as value2Description,
                    Value3Title as value3Title,
                    Value3Description as value3Description,
                    Value4Title as value4Title,
                    Value4Description as value4Description,
                    PhilosophyTitle as philosophyTitle,
                    PhilosophySubtitle as philosophySubtitle,
                    PhilosophyDescription as philosophyDescription,
                    Typo1Title as typo1Title,
                    Typo1Description as typo1Description,
                    Typo2Title as typo2Title,
                    Typo2Description as typo2Description,
                    Typo3Title as typo3Title,
                    Typo3Description as typo3Description,
                    UpdatedAt as updatedAt
                FROM AboutUsContent
                ORDER BY UpdatedAt DESC
            `);
            
            if (result.recordset.length > 0) {
                res.json({ success: true, content: result.recordset[0] });
            } else {
                res.json({ success: true, content: null });
            }
        } catch (err) {
            console.error('Error fetching about content:', err);
            res.json({ success: false, message: 'Failed to retrieve about content.' });
        }
    });

    // Save About Us Content API
    router.post('/api/cms/about', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const {
                layout, ourStoryTitle, ourStoryContent, storySubtitle, projectsCount, clientsCount,
                missionTitle, missionContent, feature1, feature2, feature3,
                visionTitle, visionContent, value1Title, value1Description, value2Title, value2Description,
                value3Title, value3Description, value4Title, value4Description,
                philosophyTitle, philosophySubtitle, philosophyDescription,
                typo1Title, typo1Description, typo2Title, typo2Description, typo3Title, typo3Description
            } = req.body;

            // Check if content exists
            const existingResult = await pool.request().query('SELECT ID FROM AboutUsContent');
            
            if (existingResult.recordset.length > 0) {
                // Update existing content
                await pool.request()
                    .input('layout', sql.NVarChar, layout)
                    .input('storyTitle', sql.NVarChar, ourStoryTitle)
                    .input('storyDescription', sql.NVarChar, ourStoryContent)
                    .input('storySubtitle', sql.NVarChar, storySubtitle)
                    .input('projectsCount', sql.NVarChar, projectsCount)
                    .input('clientsCount', sql.NVarChar, clientsCount)
                    .input('missionTitle', sql.NVarChar, missionTitle)
                    .input('missionDescription', sql.NVarChar, missionContent)
                    .input('feature1', sql.NVarChar, feature1)
                    .input('feature2', sql.NVarChar, feature2)
                    .input('feature3', sql.NVarChar, feature3)
                    .input('valuesTitle', sql.NVarChar, visionTitle)
                    .input('value1Title', sql.NVarChar, value1Title)
                    .input('value1Description', sql.NVarChar, value1Description)
                    .input('value2Title', sql.NVarChar, value2Title)
                    .input('value2Description', sql.NVarChar, value2Description)
                    .input('value3Title', sql.NVarChar, value3Title)
                    .input('value3Description', sql.NVarChar, value3Description)
                    .input('value4Title', sql.NVarChar, value4Title)
                    .input('value4Description', sql.NVarChar, value4Description)
                    .input('philosophyTitle', sql.NVarChar, philosophyTitle)
                    .input('philosophySubtitle', sql.NVarChar, philosophySubtitle)
                    .input('philosophyDescription', sql.NVarChar, philosophyDescription)
                    .input('typo1Title', sql.NVarChar, typo1Title)
                    .input('typo1Description', sql.NVarChar, typo1Description)
                    .input('typo2Title', sql.NVarChar, typo2Title)
                    .input('typo2Description', sql.NVarChar, typo2Description)
                    .input('typo3Title', sql.NVarChar, typo3Title)
                    .input('typo3Description', sql.NVarChar, typo3Description)
                    .query(`
                        UPDATE AboutUsContent SET
                            Layout = @layout,
                            StoryTitle = @storyTitle,
                            StoryDescription = @storyDescription,
                            StorySubtitle = @storySubtitle,
                            ProjectsCount = @projectsCount,
                            ClientsCount = @clientsCount,
                            MissionTitle = @missionTitle,
                            MissionDescription = @missionDescription,
                            Feature1 = @feature1,
                            Feature2 = @feature2,
                            Feature3 = @feature3,
                            ValuesTitle = @valuesTitle,
                            Value1Title = @value1Title,
                            Value1Description = @value1Description,
                            Value2Title = @value2Title,
                            Value2Description = @value2Description,
                            Value3Title = @value3Title,
                            Value3Description = @value3Description,
                            Value4Title = @value4Title,
                            Value4Description = @value4Description,
                            PhilosophyTitle = @philosophyTitle,
                            PhilosophySubtitle = @philosophySubtitle,
                            PhilosophyDescription = @philosophyDescription,
                            Typo1Title = @typo1Title,
                            Typo1Description = @typo1Description,
                            Typo2Title = @typo2Title,
                            Typo2Description = @typo2Description,
                            Typo3Title = @typo3Title,
                            Typo3Description = @typo3Description,
                            UpdatedAt = GETDATE()
                    `);
            } else {
                // Insert new content
                await pool.request()
                    .input('layout', sql.NVarChar, layout)
                    .input('storyTitle', sql.NVarChar, ourStoryTitle)
                    .input('storyDescription', sql.NVarChar, ourStoryContent)
                    .input('storySubtitle', sql.NVarChar, storySubtitle)
                    .input('projectsCount', sql.NVarChar, projectsCount)
                    .input('clientsCount', sql.NVarChar, clientsCount)
                    .input('missionTitle', sql.NVarChar, missionTitle)
                    .input('missionDescription', sql.NVarChar, missionContent)
                    .input('feature1', sql.NVarChar, feature1)
                    .input('feature2', sql.NVarChar, feature2)
                    .input('feature3', sql.NVarChar, feature3)
                    .input('valuesTitle', sql.NVarChar, visionTitle)
                    .input('value1Title', sql.NVarChar, value1Title)
                    .input('value1Description', sql.NVarChar, value1Description)
                    .input('value2Title', sql.NVarChar, value2Title)
                    .input('value2Description', sql.NVarChar, value2Description)
                    .input('value3Title', sql.NVarChar, value3Title)
                    .input('value3Description', sql.NVarChar, value3Description)
                    .input('value4Title', sql.NVarChar, value4Title)
                    .input('value4Description', sql.NVarChar, value4Description)
                    .input('philosophyTitle', sql.NVarChar, philosophyTitle)
                    .input('philosophySubtitle', sql.NVarChar, philosophySubtitle)
                    .input('philosophyDescription', sql.NVarChar, philosophyDescription)
                    .input('typo1Title', sql.NVarChar, typo1Title)
                    .input('typo1Description', sql.NVarChar, typo1Description)
                    .input('typo2Title', sql.NVarChar, typo2Title)
                    .input('typo2Description', sql.NVarChar, typo2Description)
                    .input('typo3Title', sql.NVarChar, typo3Title)
                    .input('typo3Description', sql.NVarChar, typo3Description)
                    .query(`
                        INSERT INTO AboutUsContent (
                            Layout, StoryTitle, StoryDescription, StorySubtitle, ProjectsCount, ClientsCount,
                            MissionTitle, MissionDescription, Feature1, Feature2, Feature3,
                            ValuesTitle, Value1Title, Value1Description, Value2Title, Value2Description,
                            Value3Title, Value3Description, Value4Title, Value4Description,
                            PhilosophyTitle, PhilosophySubtitle, PhilosophyDescription,
                            Typo1Title, Typo1Description, Typo2Title, Typo2Description, Typo3Title, Typo3Description,
                            CreatedAt, UpdatedAt
                        ) VALUES (
                            @layout, @storyTitle, @storyDescription, @storySubtitle, @projectsCount, @clientsCount,
                            @missionTitle, @missionDescription, @feature1, @feature2, @feature3,
                            @valuesTitle, @value1Title, @value1Description, @value2Title, @value2Description,
                            @value3Title, @value3Description, @value4Title, @value4Description,
                            @philosophyTitle, @philosophySubtitle, @philosophyDescription,
                            @typo1Title, @typo1Description, @typo2Title, @typo2Description, @typo3Title, @typo3Description,
                            GETDATE(), GETDATE()
                        )
                    `);
            }
            
            res.json({ success: true, message: 'About Us content saved successfully.' });
        } catch (err) {
            console.error('Error saving about content:', err);
            res.json({ success: false, message: 'Failed to save about content.' });
        }
    });

    // Contact Messages Management API
    router.put('/api/admin/contact-messages/:id/read', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('messageId', sql.Int, id)
                .query('UPDATE ContactSubmissions SET Status = \'Read\' WHERE Id = @messageId');
            
            res.json({ success: true, message: 'Message marked as read.' });
        } catch (err) {
            console.error('Error marking message as read:', err);
            res.json({ success: false, message: 'Failed to mark message as read.' });
        }
    });

    router.put('/api/admin/contact-messages/:id/replied', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('messageId', sql.Int, id)
                .query('UPDATE ContactSubmissions SET Status = \'Replied\', UpdatedAt = GETDATE() WHERE Id = @messageId');
            
            res.json({ success: true, message: 'Message marked as replied.' });
        } catch (err) {
            console.error('Error marking message as replied:', err);
            res.json({ success: false, message: 'Failed to mark message as replied.' });
        }
    });

    router.delete('/api/admin/contact-messages/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('messageId', sql.Int, id)
                .query('DELETE FROM ContactSubmissions WHERE Id = @messageId');
            
            res.json({ success: true, message: 'Message deleted successfully.' });
        } catch (err) {
            console.error('Error deleting message:', err);
            res.json({ success: false, message: 'Failed to delete message.' });
        }
    });

    // Raw Materials API
    router.get('/api/rawmaterials', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT 
                    MaterialID as id,
                    Name as name,
                    QuantityAvailable as stockQuantity,
                    Unit as unit,
                    LastUpdated as createdAt,
                    IsActive as active
                FROM RawMaterials
                WHERE IsActive = 1
                ORDER BY Name ASC
            `);
            res.json({ success: true, materials: result.recordset });
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            res.json({ success: false, message: 'Failed to retrieve raw materials.' });
        }
    });

    // Categories API - Get unique categories from Products table
    router.get('/api/categories', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const result = await pool.request().query(`
                SELECT DISTINCT Category as name
                FROM Products
                WHERE Category IS NOT NULL AND Category != ''
                ORDER BY Category ASC
            `);
            
            // Return categories as simple array for frontend dropdowns
            const categories = result.recordset.map(cat => cat.name);
            res.json({ 
                success: true, 
                categories: categories
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.json({ success: false, message: 'Failed to retrieve categories.' });
        }
    });

    // Raw Materials CRUD API
    router.post('/api/rawmaterials', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { name, unit, stockQuantity } = req.body;
            
            await pool.request()
                .input('name', sql.NVarChar, name)
                .input('unit', sql.NVarChar, unit)
                .input('stockQuantity', sql.Int, stockQuantity)
                .query(`
                    INSERT INTO RawMaterials (Name, Unit, QuantityAvailable, IsActive, LastUpdated)
                    VALUES (@name, @unit, @stockQuantity, 1, GETDATE())
                `);
            
            res.json({ success: true, message: 'Raw material created successfully.' });
        } catch (err) {
            console.error('Error creating raw material:', err);
            res.json({ success: false, message: 'Failed to create raw material.' });
        }
    });

    router.put('/api/rawmaterials/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { name, unit, stockQuantity } = req.body;
            
            await pool.request()
                .input('materialId', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('unit', sql.NVarChar, unit)
                .input('stockQuantity', sql.Int, stockQuantity)
                .query(`
                    UPDATE RawMaterials 
                    SET Name = @name,
                        Unit = @unit,
                        QuantityAvailable = @stockQuantity,
                        LastUpdated = GETDATE()
                    WHERE MaterialID = @materialId
                `);
            
            res.json({ success: true, message: 'Raw material updated successfully.' });
        } catch (err) {
            console.error('Error updating raw material:', err);
            res.json({ success: false, message: 'Failed to update raw material.' });
        }
    });

    router.delete('/api/rawmaterials/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('materialId', sql.Int, id)
                .query('UPDATE RawMaterials SET IsActive = 0 WHERE MaterialID = @materialId');
            
            res.json({ success: true, message: 'Raw material deleted successfully.' });
        } catch (err) {
            console.error('Error deleting raw material:', err);
            res.json({ success: false, message: 'Failed to delete raw material.' });
        }
    });

    // Note: Categories are now managed directly in the Products table
    // No separate Categories table exists - categories are stored as a column in Products

    // Archived Items Management API
    router.get('/api/admin/archived', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID as id,
                    ProductName as name,
                    Category as category,
                    Price as price,
                    IsFeatured as featured,
                    IsActive as active,
                    CreatedAt as createdAt
                FROM Products
                WHERE IsActive = 0
                ORDER BY CreatedAt DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID as id,
                    Name as name,
                    QuantityAvailable as stockQuantity,
                    Unit as unit,
                    LastUpdated as createdAt,
                    IsActive as active
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Fetch archived categories
            const categoriesResult = await pool.request().query(`
                SELECT 
                    CategoryID as id,
                    CategoryName as name,
                    Description as description,
                    IsActive as active,
                    CreatedAt as createdAt
                FROM Categories
                WHERE IsActive = 0
                ORDER BY CreatedAt DESC
            `);
            
            res.json({ 
                success: true, 
                archivedItems: {
                    products: productsResult.recordset,
                    materials: materialsResult.recordset,
                    categories: categoriesResult.recordset
                }
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            res.json({ success: false, message: 'Failed to retrieve archived items.' });
        }
    });

    // Restore archived items API
    router.put('/api/admin/archived/products/:id/restore', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('productId', sql.Int, id)
                .query('UPDATE Products SET IsActive = 1 WHERE ProductID = @productId');
            
            res.json({ success: true, message: 'Product restored successfully.' });
        } catch (err) {
            console.error('Error restoring product:', err);
            res.json({ success: false, message: 'Failed to restore product.' });
        }
    });

    router.put('/api/admin/archived/materials/:id/restore', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('materialId', sql.Int, id)
                .query('UPDATE RawMaterials SET IsActive = 1 WHERE MaterialID = @materialId');
            
            res.json({ success: true, message: 'Raw material restored successfully.' });
        } catch (err) {
            console.error('Error restoring raw material:', err);
            res.json({ success: false, message: 'Failed to restore raw material.' });
        }
    });

    router.put('/api/admin/archived/categories/:id/restore', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('categoryId', sql.Int, id)
                .query('UPDATE Categories SET IsActive = 1 WHERE CategoryID = @categoryId');
            
            res.json({ success: true, message: 'Category restored successfully.' });
        } catch (err) {
            console.error('Error restoring category:', err);
            res.json({ success: false, message: 'Failed to restore category.' });
        }
    });

    // Permanently delete archived items API
    router.delete('/api/admin/archived/products/:id/permanent', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('productId', sql.Int, id)
                .query('DELETE FROM Products WHERE ProductID = @productId');
            
            res.json({ success: true, message: 'Product permanently deleted.' });
        } catch (err) {
            console.error('Error permanently deleting product:', err);
            res.json({ success: false, message: 'Failed to permanently delete product.' });
        }
    });

    router.delete('/api/admin/archived/materials/:id/permanent', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('materialId', sql.Int, id)
                .query('DELETE FROM RawMaterials WHERE MaterialID = @materialId');
            
            res.json({ success: true, message: 'Raw material permanently deleted.' });
        } catch (err) {
            console.error('Error permanently deleting raw material:', err);
            res.json({ success: false, message: 'Failed to permanently delete raw material.' });
        }
    });

    router.delete('/api/admin/archived/categories/:id/permanent', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            await pool.request()
                .input('categoryId', sql.Int, id)
                .query('DELETE FROM Categories WHERE CategoryID = @categoryId');
            
            res.json({ success: true, message: 'Category permanently deleted.' });
        } catch (err) {
            console.error('Error permanently deleting category:', err);
            res.json({ success: false, message: 'Failed to permanently delete category.' });
        }
    });

    // Special handling for Orders routes - need to fetch orders data
    const orderRoutes = [
        { route: 'OrdersPending', status: 'Pending' },
        { route: 'OrdersProcessing', status: 'Processing' },
        { route: 'OrdersShipping', status: 'Shipping' },
        { route: 'OrdersDelivery', status: 'Delivery' },
        { route: 'OrdersReceive', status: 'Received' },
        { route: 'CancelledOrders', status: 'Cancelled' },
        { route: 'CompletedOrders', status: 'Completed' }
    ];

    orderRoutes.forEach(({ route, status }) => {
        router.get(`/Employee/Admin/${route}`, isAuthenticated, async (req, res) => {
            try {
                await pool.connect();
                
                // Fetch all orders with customer, address, and items including payment details
                const ordersResult = await pool.request()
                    .input('status', sql.NVarChar, status)
                    .query(`
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
                        WHERE o.Status = @status
                        ORDER BY o.OrderDate ASC
                    `);
                
                const orders = ordersResult.recordset;
                
                // Decrypt customer and address data for each order
                for (let order of orders) {
                    // Decrypt customer data
                    // Customer data is already plain text
                    
                    // Decrypt address data
                    // Return address data as plain text
                    const addressData = {
                        Label: order.AddressLabel,
                        HouseNumber: order.HouseNumber,
                        Street: order.Street,
                        Barangay: order.Barangay,
                        City: order.City,
                        Province: order.Province,
                        Region: order.Region,
                        PostalCode: order.PostalCode,
                        Country: order.Country
                    };
                    order.AddressLabel = addressData.Label;
                    order.HouseNumber = addressData.HouseNumber;
                    order.Street = addressData.Street;
                    order.Barangay = addressData.Barangay;
                    order.City = addressData.City;
                    order.Province = addressData.Province;
                    order.Region = addressData.Region;
                    order.PostalCode = addressData.PostalCode;
                    order.Country = addressData.Country;
                    
                    // Fetch items for each order
                    const itemsResult = await pool.request()
                        .input('orderId', sql.Int, order.OrderID)
                        .query(`
                            SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, oi.VariationID,
                                   p.Name, p.ImageURL,
                                   pv.VariationName, pv.Color, pv.VariationImageURL
                            FROM OrderItems oi
                            JOIN Products p ON oi.ProductID = p.ProductID
                            LEFT JOIN ProductVariations pv ON oi.VariationID = pv.VariationID
                            WHERE oi.OrderID = @orderId
                        `);
                    order.items = itemsResult.recordset;
                }
                
                res.render(`Employee/Admin/Admin${route}`, { 
                    user: req.session.user, 
                    orders: orders 
                });
            } catch (err) {
                console.error(`Error fetching ${status.toLowerCase()} orders:`, err);
                res.render(`Employee/Admin/Admin${route}`, { 
                    user: req.session.user, 
                    orders: [], 
                    error: `Failed to load ${status.toLowerCase()} orders.` 
                });
            }
        });
    });

    // =============================================================================
    // ORDER PROCESSING ROUTES (Proceed and Cancel for each status)
    // =============================================================================

    // Admin OrdersPending: Proceed to Processing
    router.post('/Employee/Admin/OrdersPending/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Processing' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Processing by Admin`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Admin OrdersPending: Cancel order
    router.post('/Employee/Admin/OrdersPending/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                // Always restore main product stock first
                await pool.request()
                    .input('productId', sql.Int, item.ProductID)
                    .input('quantity', sql.Int, item.Quantity)
                    .query(`UPDATE Products 
                            SET StockQuantity = StockQuantity + @quantity 
                            WHERE ProductID = @productId`);
                console.log(`[ADMIN ORDER CANCELLATION] Restored ${item.Quantity} units to main product ${item.ProductID}`);
                
                // Additionally restore variation stock if there was a variation
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations 
                                SET Quantity = Quantity + @quantity 
                                WHERE VariationID = @variationID`);
                    console.log(`[ADMIN ORDER CANCELLATION] Additionally restored ${item.Quantity} units to variation ${item.VariationID}`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Admin`
            );
            
            console.log(`[ADMIN ORDER CANCELLATION] Order ${orderId} cancelled and stock restored`);
            res.json({ success: true, message: 'Order cancelled and stock restored successfully.' });
        } catch (err) {
            console.error('Error cancelling order:', err);
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin OrdersProcessing: Proceed to Shipping
    router.post('/Employee/Admin/OrdersProcessing/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Shipping' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Shipping by Admin`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Admin OrdersProcessing: Cancel order
    router.post('/Employee/Admin/OrdersProcessing/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                // Always restore main product stock first
                await pool.request()
                    .input('productId', sql.Int, item.ProductID)
                    .input('quantity', sql.Int, item.Quantity)
                    .query(`UPDATE Products 
                            SET StockQuantity = StockQuantity + @quantity 
                            WHERE ProductID = @productId`);
                console.log(`[ADMIN ORDER CANCELLATION] Restored ${item.Quantity} units to main product ${item.ProductID}`);
                
                // Additionally restore variation stock if there was a variation
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations 
                                SET Quantity = Quantity + @quantity 
                                WHERE VariationID = @variationID`);
                    console.log(`[ADMIN ORDER CANCELLATION] Additionally restored ${item.Quantity} units to variation ${item.VariationID}`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Admin`
            );
            
            console.log(`[ADMIN ORDER CANCELLATION] Order ${orderId} cancelled and stock restored`);
            res.json({ success: true, message: 'Order cancelled and stock restored successfully.' });
        } catch (err) {
            console.error('Error cancelling order:', err);
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin OrdersShipping: Proceed to Delivery
    router.post('/Employee/Admin/OrdersShipping/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Delivery' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Delivery by Admin`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Admin OrdersShipping: Cancel order
    router.post('/Employee/Admin/OrdersShipping/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                // Always restore main product stock first
                await pool.request()
                    .input('productId', sql.Int, item.ProductID)
                    .input('quantity', sql.Int, item.Quantity)
                    .query(`UPDATE Products 
                            SET StockQuantity = StockQuantity + @quantity 
                            WHERE ProductID = @productId`);
                console.log(`[ADMIN ORDER CANCELLATION] Restored ${item.Quantity} units to main product ${item.ProductID}`);
                
                // Additionally restore variation stock if there was a variation
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations 
                                SET Quantity = Quantity + @quantity 
                                WHERE VariationID = @variationID`);
                    console.log(`[ADMIN ORDER CANCELLATION] Additionally restored ${item.Quantity} units to variation ${item.VariationID}`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Admin`
            );
            
            console.log(`[ADMIN ORDER CANCELLATION] Order ${orderId} cancelled and stock restored`);
            res.json({ success: true, message: 'Order cancelled and stock restored successfully.' });
        } catch (err) {
            console.error('Error cancelling order:', err);
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin OrdersDelivery: Proceed to Received
    router.post('/Employee/Admin/OrdersDelivery/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Received' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'STATUS_CHANGE',
                'Orders',
                orderId,
                `Order #${orderId} status changed to Received by Admin`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Admin OrdersDelivery: Cancel order
    router.post('/Employee/Admin/OrdersDelivery/Cancel/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            
            // Get order items before cancelling to restore stock
            const orderItemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.ProductID, oi.Quantity, oi.VariationID
                    FROM OrderItems oi
                    WHERE oi.OrderID = @orderId
                `);
            
            // Restore stock for each item
            for (const item of orderItemsResult.recordset) {
                // Always restore main product stock first
                await pool.request()
                    .input('productId', sql.Int, item.ProductID)
                    .input('quantity', sql.Int, item.Quantity)
                    .query(`UPDATE Products 
                            SET StockQuantity = StockQuantity + @quantity 
                            WHERE ProductID = @productId`);
                console.log(`[ADMIN ORDER CANCELLATION] Restored ${item.Quantity} units to main product ${item.ProductID}`);
                
                // Additionally restore variation stock if there was a variation
                if (item.VariationID) {
                    await pool.request()
                        .input('variationID', sql.Int, item.VariationID)
                        .input('quantity', sql.Int, item.Quantity)
                        .query(`UPDATE ProductVariations 
                                SET Quantity = Quantity + @quantity 
                                WHERE VariationID = @variationID`);
                    console.log(`[ADMIN ORDER CANCELLATION] Additionally restored ${item.Quantity} units to variation ${item.VariationID}`);
                }
            }
            
            // Update order status to cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'CANCEL',
                'Orders',
                orderId,
                `Order #${orderId} cancelled by Admin`
            );
            
            console.log(`[ADMIN ORDER CANCELLATION] Order ${orderId} cancelled and stock restored`);
            res.json({ success: true, message: 'Order cancelled and stock restored successfully.' });
        } catch (err) {
            console.error('Error cancelling order:', err);
            res.json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Admin OrdersReceive: Proceed to Completed
    router.post('/Employee/Admin/OrdersReceive/Proceed/:orderId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const orderId = parseInt(req.params.orderId);
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Completed' WHERE OrderID = @orderId`);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'COMPLETE',
                'Orders',
                orderId,
                `Order #${orderId} completed by Admin`
            );
            
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: 'Failed to update order status.' });
        }
    });

    // Admin Alerts route
    router.get('/Employee/Admin/Alerts', isAuthenticated, (req, res) => {
        res.render('Employee/Admin/AdminAlerts', { user: req.session.user });
    });

    // Special handling for Archived route - needs to fetch archived items
    router.get('/Employee/Admin/Archived', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch archived products
            const productsResult = await pool.request().query(`
                SELECT 
                    ProductID,
                    Name,
                    Description,
                    Price,
                    StockQuantity,
                    Category,
                    DateAdded,
                    IsActive
                FROM Products
                WHERE IsActive = 0
                ORDER BY DateAdded DESC
            `);
            
            // Fetch archived raw materials
            const materialsResult = await pool.request().query(`
                SELECT 
                    MaterialID,
                    Name,
                    QuantityAvailable,
                    Unit,
                    LastUpdated,
                    IsActive
                FROM RawMaterials
                WHERE IsActive = 0
                ORDER BY LastUpdated DESC
            `);
            
            // Categories are stored as a column in Products table, not a separate table
            const categoriesResult = { recordset: [] };
            
            const archivedItems = {
                products: productsResult.recordset,
                materials: materialsResult.recordset,
                categories: categoriesResult.recordset
            };
            
            console.log('Archived items found:');
            console.log('Products:', productsResult.recordset.length);
            console.log('Materials:', materialsResult.recordset.length);
            console.log('Categories:', categoriesResult.recordset.length);
            
            res.render('Employee/Admin/AdminArchived', { 
                user: req.session.user, 
                archivedProducts: productsResult.recordset,
                archivedMaterials: materialsResult.recordset,
                archivedCategories: categoriesResult.recordset
            });
        } catch (err) {
            console.error('Error fetching archived items:', err);
            console.error('Error details:', err.message);
            console.error('Error stack:', err.stack);
            req.flash('error', 'Could not fetch archived items: ' + err.message);
            res.render('Employee/Admin/AdminArchived', { 
                user: req.session.user, 
                archivedProducts: [],
                archivedMaterials: [],
                archivedCategories: [],
                error: err.message
            });
        }
    });

    adminRoutes.forEach(route => {
        if (route === 'Products') {
            // Special handling for Products route - needs to fetch products data
            router.get(`/Employee/Admin/${route}`, isAuthenticated, async (req, res) => {
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
                    res.render(`Employee/Admin/Admin${route}`, { user: req.session.user, products, page, totalPages });
                } catch (err) {
                    console.error('Error fetching products:', err);
                    req.flash('error', 'Could not fetch products.');
                    res.render(`Employee/Admin/Admin${route}`, { user: req.session.user, products: [], page: 1, totalPages: 1 });
                }
            });
        } else if (route === 'Materials') {
            // Special handling for Materials route - needs to fetch raw materials data
            router.get(`/Employee/Admin/RawMaterials`, isAuthenticated, async (req, res) => {
                try {
                    await pool.connect();
                    const result = await pool.request().query('SELECT * FROM RawMaterials WHERE IsActive = 1');
                    const materials = result.recordset;
                    res.render('Employee/Admin/AdminMaterials', { user: req.session.user, materials: materials });
                } catch (err) {
                    console.error('Error fetching raw materials:', err);
                    req.flash('error', 'Could not fetch raw materials.');
                    res.render('Employee/Admin/AdminMaterials', { user: req.session.user, materials: [] });
                }
            });

            // Admin - Add Raw Material
            router.post('/Employee/Admin/RawMaterials/Add', isAuthenticated, async (req, res) => {
                try {
                    await pool.connect();
                    const { name, quantity, unit } = req.body;
                    
                    await pool.request()
                        .input('name', sql.NVarChar, name)
                        .input('quantity', sql.Int, quantity)
                        .input('unit', sql.NVarChar, unit)
                        .query(`
                            INSERT INTO RawMaterials (Name, QuantityAvailable, Unit, LastUpdated, IsActive)
                            VALUES (@name, @quantity, @unit, GETDATE(), 1)
                        `);
                    
                    req.flash('success', 'Raw material added successfully!');
                    res.redirect('/Employee/Admin/RawMaterials');
                } catch (err) {
                    console.error('Error adding raw material:', err);
                    req.flash('error', 'Failed to add raw material: ' + err.message);
                    res.redirect('/Employee/Admin/RawMaterials');
                }
            });

            // Admin - Edit Raw Material
            router.post('/Employee/Admin/RawMaterials/Edit', isAuthenticated, async (req, res) => {
                try {
                    await pool.connect();
                    const { materialid, name, quantity, unit } = req.body;
                    
                    await pool.request()
                        .input('materialId', sql.Int, materialid)
                        .input('name', sql.NVarChar, name)
                        .input('quantity', sql.Int, quantity)
                        .input('unit', sql.NVarChar, unit)
                        .query(`
                            UPDATE RawMaterials 
                            SET Name = @name, QuantityAvailable = @quantity, Unit = @unit, LastUpdated = GETDATE()
                            WHERE MaterialID = @materialId
                        `);
                    
                    req.flash('success', 'Raw material updated successfully!');
                    res.redirect('/Employee/Admin/RawMaterials');
                } catch (err) {
                    console.error('Error updating raw material:', err);
                    req.flash('error', 'Failed to update raw material: ' + err.message);
                    res.redirect('/Employee/Admin/RawMaterials');
                }
            });
        } else {
            // Default handling for other admin routes
            router.get(`/Employee/Admin/${route}`, isAuthenticated, (req, res) => {
                res.render(`Employee/Admin/Admin${route}`, { user: req.session.user });
            });
        }
    });

    // =============================================================================
    // INVENTORY ROUTES (All roles can access by default)
    // =============================================================================

    // =============================================================================
    // TRANSACTION ROUTES (All roles can access by default)
    // =============================================================================

    // =============================================================================
    // USER MANAGER ROUTES (All roles can access by default)
    // =============================================================================

    // =============================================================================
    // SUPPORT ROUTES (All roles can access by default)
    // =============================================================================

    // =============================================================================
    // ORDER STATUS ROUTES (All roles can access by default)
    // =============================================================================

    const orderStatusRoutes = [
        'Pending', 'Processing', 'Shipping', 'Delivery', 'Completed', 'Cancelled', 'Receive', 'WalkIn'
    ];

    // =============================================================================
    // USER MANAGEMENT API ROUTES (Admin only)
    // =============================================================================

    // Simple API to get all users (Admin only)
    router.get('/api/admin/users', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    u.UserID,
                    u.Username,
                    u.FullName,
                    u.Email,
                    r.RoleName,
                    u.IsActive
                FROM Users u
                LEFT JOIN Roles r ON u.RoleID = r.RoleID
                WHERE u.IsActive = 1
                ORDER BY u.FullName
            `);

            res.json({ success: true, users: result.recordset });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }
    });

    // User Statistics API

    // =============================================================================
    // AUTHENTICATION ROUTES
    // =============================================================================

    // Legacy token functions removed - using JWT tokens only

    // Login page
    router.get('/login', (req, res) => {
        if (req.session && req.session.user) {
            const userRole = req.session.user.role;
            switch(userRole) {
                case 'Admin':
                    return res.redirect('/Employee/AdminManager');
                case 'InventoryManager':
                    return res.redirect('/Employee/InventoryManager');
                case 'TransactionManager':
                    return res.redirect('/Employee/TransactionManager');
                case 'UserManager':
                    return res.redirect('/Employee/UserManager');
                case 'OrderSupport':
                    return res.redirect('/Employee/OrderSupport');
                default:
                    return res.redirect('/');
            }
        }
        res.render('EmpLogin/EmpLogin', { 
            title: 'Login',
            error: req.flash('error'),
            success: req.flash('success')
        });
    });

    // Employee login page
    router.get('/employee-login', (req, res) => {
        if (req.session && req.session.user) {
            const userRole = req.session.user.role;
            switch(userRole) {
                case 'Admin':
                    return res.redirect('/Employee/AdminManager');
                case 'InventoryManager':
                    return res.redirect('/Employee/InventoryManager');
                case 'TransactionManager':
                    return res.redirect('/Employee/TransactionManager');
                case 'UserManager':
                    return res.redirect('/Employee/UserManager');
                case 'OrderSupport':
                    return res.redirect('/Employee/OrderSupport');
                default:
                    return res.redirect('/');
            }
        }
        res.render('EmpLogin/EmpLogin', { 
            title: 'Employee Login',
            error: req.flash('error'),
            success: req.flash('success')
        });
    });

    // Employee/Admin Login POST route
    router.post('/auth/login', async (req, res) => {
        try {
            const { email, password, rememberMe } = req.body;
            
            console.log('=== LOGIN ATTEMPT ===');
            console.log('Email:', email);
            console.log('Password provided:', password ? 'Yes' : 'No');
            
            if (!email || !password) {
                console.log('Missing email or password');
                req.flash('error', 'Email and password are required.');
                return res.redirect('/login');
            }

            console.log('Connecting to database...');
            await pool.connect();
            console.log('Database connected successfully');
            
            // Find user by email using plain text query
            const userResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT * FROM Users WHERE Email = @email');
            
            const user = userResult.recordset[0];

            console.log('Login attempt for email:', email);
            console.log('User found:', user ? 'Yes' : 'No');
            if (user) {
                console.log('User details:', {
                    UserID: user.UserID,
                    Username: user.Username,
                    Email: user.Email,
                    FullName: user.FullName,
                    RoleID: user.RoleID,
                    IsActive: user.IsActive
                });
            }

            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }

            // Get password hash for verification
            const passwordResult = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query('SELECT PasswordHash FROM Users WHERE UserID = @userId');
            
            if (passwordResult.recordset.length === 0) {
                console.log('No password hash found for user');
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }
            
            const passwordHash = passwordResult.recordset[0].PasswordHash;
            console.log('Password hash found:', passwordHash ? 'Yes' : 'No');

            // Get role name from Roles table
            const roleResult = await pool.request()
                .input('roleId', sql.Int, user.RoleID)
                .query('SELECT RoleName FROM Roles WHERE RoleID = @roleId');
            
            if (roleResult.recordset.length === 0) {
                console.log('No role found for user');
                req.flash('error', 'User role not found. Please contact administrator.');
                return res.redirect('/login');
            }
            
            const roleName = roleResult.recordset[0].RoleName;
            console.log('Role name found:', roleName);

            if (!user.IsActive) {
                req.flash('error', 'Your account has been deactivated. Please contact administrator.');
                return res.redirect('/login');
            }

            // Verify password (handle both bcrypt hashed and plain text)
            let passwordMatch = false;
            
            // Check if password is bcrypt hashed (starts with $2a$ or $2b$)
            if (passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$'))) {
                passwordMatch = await bcrypt.compare(password, passwordHash);
            } else if (passwordHash) {
                // Plain text comparison (for backward compatibility)
                passwordMatch = passwordHash === password;
            }
            
            if (!passwordMatch) {
                // Log failed login attempt
                await logActivity(
                    user.UserID,
                    'LOGIN_FAILED',
                    'Users',
                    user.UserID,
                    `Failed login attempt - incorrect password from ${req.ip || 'unknown IP'}`
                );
                
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }

            // Create session
            const userData = {
                id: user.UserID,
                username: user.Username,
                fullName: user.FullName,
                email: user.Email,
                role: roleName,
                type: 'employee'
            };
            
            req.session.user = userData;

            // Log successful login
            await logActivity(
                user.UserID,
                'LOGIN',
                'Users',
                user.UserID.toString(),
                `Successful login from ${req.ip || 'unknown IP'}`
            );

            // Generate JWT tokens for API access
            let jwtTokens = null;
            try {
                jwtTokens = jwtUtils.generateTokenPair(userData);
                console.log('✅ JWT tokens generated for employee:', email);
            } catch (tokenError) {
                console.error('JWT token generation error:', tokenError);
                // Continue without JWT tokens - session auth will work
            }

            console.log('Login successful for:', email);
            console.log('User role:', roleName);

            // Check if this is an API request (for mobile/frontend)
            const isApiRequest = req.headers.accept && req.headers.accept.includes('application/json');
            
            if (isApiRequest) {
                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: userData,
                    tokens: jwtTokens,
                    sessionId: req.sessionID
                });
            }

            // Ensure session is saved before redirecting (prevents lost session on redirect)
            return req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error', 'Session error, please try again.');
                    return res.redirect('/login');
                }
                // Redirect based on role for web interface
                switch(roleName) {
                    case 'Admin':
                        return res.redirect('/Employee/AdminManager');
                    case 'InventoryManager':
                        return res.redirect('/Employee/InventoryManager');
                    case 'TransactionManager':
                        return res.redirect('/Employee/TransactionManager');
                    case 'UserManager':
                        return res.redirect('/Employee/UserManager');
                    case 'OrderSupport':
                        return res.redirect('/Employee/OrderSupport');
                    default:
                        return res.redirect('/Employee/AdminManager');
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'An error occurred during login. Please try again.');
            res.redirect('/login');
        }
    });

    // Logout
    router.post('/auth/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ success: false, message: 'Logout failed' });
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // =============================================================================
    // CUSTOMER AUTHENTICATION ROUTES
    // =============================================================================

    /**
     * Customer Login (API endpoint)
     * POST /api/auth/customer/login
     */
    router.post('/api/auth/customer/login', async (req, res) => {
        try {
            const { email, password, rememberMe } = req.body;
            
            console.log('=== CUSTOMER LOGIN ATTEMPT ===');
            console.log('Email:', email);
            console.log('Password provided:', password ? 'Yes' : 'No');
            
            if (!email || !password) {
                console.log('Missing email or password');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email and password are required.',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            console.log('Connecting to database...');
            await pool.connect();
            console.log('Database connected successfully');
            
            console.log('Searching for customer with email:', email);
            
            // Find customer by email using plain text query
            const allCustomersResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT 
                        CustomerID,
                        Email,
                        FullName,
                        PhoneNumber,
                        IsActive,
                        CreatedAt
                    FROM Customers 
                    WHERE Email = @email
                `);
            
            console.log('Customer query result:', allCustomersResult.recordset.length);
            
            // Customer data is already plain text
            const customer = allCustomersResult.recordset[0] || null;
            console.log('Customer found:', customer ? 'Yes' : 'No');
            if (customer) {
                console.log('Customer ID:', customer.CustomerID);
                console.log('Customer Email:', customer.Email);
                console.log('Customer IsActive:', customer.IsActive);
            }
            
            if (!customer) {
                console.log('Customer not found with email:', email);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password.',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if customer account is inactive
            if (!customer.IsActive) {
                console.log('Customer account is inactive');
                return res.status(403).json({ 
                    success: false, 
                    message: 'Your account has been deactivated. Please contact customer support.',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            // Get password hash for verification
            const passwordResult = await pool.request()
                .input('customerId', sql.Int, customer.CustomerID)
                .query('SELECT PasswordHash FROM Customers WHERE CustomerID = @customerId');
            
            const passwordHash = passwordResult.recordset[0].PasswordHash;

            // Verify password using bcrypt
            console.log('Verifying password...');
            const passwordMatch = await bcrypt.compare(password, passwordHash);
            console.log('Password match result:', passwordMatch);
            if (!passwordMatch) {
                console.log('Password verification failed');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password.',
                    code: 'INVALID_CREDENTIALS'
                });
            }
            
            console.log('Password verification successful!');

            // Update last login timestamp
            await pool.request()
                .input('customerId', sql.Int, customer.CustomerID)
                .query('UPDATE Customers SET LastLogin = GETDATE() WHERE CustomerID = @customerId');

            // Create customer session data
            const customerData = {
                id: customer.CustomerID,
                fullName: customer.FullName,
                email: customer.Email,
                phoneNumber: customer.PhoneNumber,
                role: 'Customer',
                type: 'customer',
                profileImage: customer.ProfileImage
            };

            // Store in session
            req.session.user = customerData;
            req.session.customerData = customerData;

            // Generate JWT tokens
            let jwtTokens = null;
            
            try {
                // Generate JWT token pair
                jwtTokens = jwtUtils.generateTokenPair(customerData);
                console.log('✅ JWT tokens generated successfully');
            } catch (tokenError) {
                console.error('JWT token creation error:', tokenError);
                // Continue without tokens - session auth will work
            }

            // Return success response for frontend
            res.json({
                success: true,
                message: 'Login successful',
                user: customerData,
                tokens: jwtTokens,
                sessionId: req.sessionID,
                persistentLogin: rememberMe
            });

        } catch (err) {
            console.error('=== CUSTOMER LOGIN ERROR ===');
            console.error('Error type:', err.name);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            console.error('=============================');
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred during login. Please try again.',
                code: 'SERVER_ERROR'
            });
        }
    });

    /**
     * JWT Token Refresh (API endpoint)
     * POST /api/auth/refresh-token
     */
    router.post('/api/auth/refresh-token', async (req, res) => {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }

            // Verify the refresh token
            const decoded = jwtUtils.verifyToken(refreshToken);
            
            if (decoded.tokenType !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token type',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }

            // Get fresh user data from database
            await pool.connect();
            let userData = null;

            if (decoded.type === 'customer') {
                const result = await pool.request()
                    .input('customerId', sql.Int, decoded.id)
                    .query(`
                        SELECT CustomerID, FullName, Email, PhoneNumber, ProfileImage
                        FROM Customers 
                        WHERE CustomerID = @customerId AND IsActive = 1
                    `);
                
                if (result.recordset.length > 0) {
                    const customer = result.recordset[0];
                    const decryptedCustomer = TransparentEncryptionService.processCustomerForDisplay(customer);
                    userData = {
                        id: customer.CustomerID,
                        fullName: decryptedCustomer.FullName,
                        email: decryptedCustomer.Email,
                        phoneNumber: decryptedCustomer.PhoneNumber,
                        role: 'Customer',
                        type: 'customer',
                        profileImage: customer.ProfileImage
                    };
                }
            } else if (decoded.type === 'employee') {
                const result = await pool.request()
                    .input('userId', sql.Int, decoded.id)
                    .query(`
                        SELECT u.UserID, u.Username, u.FullName, u.Email, r.RoleName
                        FROM Users u
                        LEFT JOIN Roles r ON u.RoleID = r.RoleID
                        WHERE u.UserID = @userId AND u.IsActive = 1
                    `);
                
                if (result.recordset.length > 0) {
                    const user = result.recordset[0];
                    const decryptedUser = TransparentEncryptionService.processUserForDisplay(user);
                    userData = {
                        id: user.UserID,
                        username: decryptedUser.Username,
                        fullName: decryptedUser.FullName,
                        email: decryptedUser.Email,
                        role: user.RoleName,
                        type: 'employee'
                    };
                }
            }

            if (!userData) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Generate new access token
            const newAccessToken = jwtUtils.generateAccessToken(userData);

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: newAccessToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m'
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Token refresh failed',
                    code: 'REFRESH_FAILED'
                });
            }
        }
    });

    /**
     * Customer Registration with OTP Verification (API endpoint)
     * POST /api/auth/customer/register-with-otp
     */
    router.post('/api/auth/customer/register-with-otp', async (req, res) => {
        try {
            const { fullName, email, phoneNumber, password, confirmPassword, otp } = req.body;
            
            console.log('📧 OTP Registration attempt for email:', email);
            
            // Validation
            if (!fullName || !email || !password || !otp) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Full name, email, password, and OTP are required.',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Passwords do not match.',
                    code: 'PASSWORD_MISMATCH'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Password must be at least 6 characters long.',
                    code: 'PASSWORD_TOO_SHORT'
                });
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please enter a valid email address.',
                    code: 'INVALID_EMAIL'
                });
            }

            await pool.connect();

            // First verify the OTP
            console.log('🔐 Verifying OTP for email:', email);
            const otpResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('otp', sql.NVarChar, otp)
                .query(`
                    SELECT OTP, ExpiresAt 
                    FROM OTPVerification 
                    WHERE Email = @email AND OTP = @otp AND ExpiresAt > GETDATE()
                `);
            
            if (otpResult.recordset.length === 0) {
                console.log('❌ Invalid or expired OTP for email:', email);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or expired OTP. Please request a new OTP.',
                    code: 'INVALID_OTP'
                });
            }
            
            console.log('✅ OTP verified successfully for email:', email);

            // Check for duplicate email (double check)
            const existing = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT CustomerID FROM Customers WHERE Email = @email');

            if (existing.recordset.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'An account with this email already exists.',
                    code: 'EMAIL_ALREADY_EXISTS'
                });
            }

            // Hash password
            const saltRounds = 12;
            const hash = await bcrypt.hash(password, saltRounds);

            // Insert new customer
            const insertResult = await pool.request()
                .input('fullName', sql.NVarChar, fullName.trim())
                .input('email', sql.NVarChar, email.toLowerCase().trim())
                .input('phoneNumber', sql.NVarChar, phoneNumber || null)
                .input('passwordHash', sql.NVarChar, hash)
                .query(`
                    INSERT INTO Customers (FullName, Email, PhoneNumber, PasswordHash, IsActive, CreatedAt) 
                    OUTPUT INSERTED.CustomerID
                    VALUES (@fullName, @email, @phoneNumber, @passwordHash, 1, GETDATE())
                `);

            const newCustomerId = insertResult.recordset[0].CustomerID;
            console.log('✅ New customer created with ID:', newCustomerId);

            // Clean up the OTP record
            await pool.request()
                .input('email', sql.NVarChar, email)
                .query('DELETE FROM OTPVerification WHERE Email = @email');
            
            console.log('✅ OTP record cleaned up for email:', email);

            // Create customer session data
            const customerData = {
                id: newCustomerId,
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                phoneNumber: phoneNumber,
                role: 'Customer',
                type: 'customer',
                isEmailVerified: true // OTP verification confirms email
            };

            // Store in session
            req.session.user = customerData;
            req.session.customerData = customerData;

            // Generate JWT tokens for new customer
            let jwtTokens = null;
            try {
                jwtTokens = jwtUtils.generateTokenPair(customerData);
                console.log('✅ JWT tokens generated for new customer');
            } catch (tokenError) {
                console.error('JWT token creation error:', tokenError);
                // Continue without tokens - session auth will work
            }

            console.log('🎉 Registration completed successfully for:', email);

            res.status(201).json({ 
                success: true, 
                message: 'Registration successful! Welcome to DesignXcel!',
                user: customerData,
                tokens: jwtTokens
            });

        } catch (err) {
            console.error('❌ OTP Registration error:', err);
            console.error('Error details:', err.message);
            console.error('Error stack:', err.stack);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred during registration. Please try again.',
                code: 'SERVER_ERROR'
            });
        }
    });

    /**
     * Customer Registration (Legacy - Direct registration without OTP)
     * POST /api/auth/customer/register
     */
    router.post('/api/auth/customer/register', async (req, res) => {
        try {
            const { fullName, email, phoneNumber, password, confirmPassword } = req.body;
            
            // Validation
            if (!fullName || !email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Full name, email, and password are required.',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Passwords do not match.',
                    code: 'PASSWORD_MISMATCH'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Password must be at least 6 characters long.',
                    code: 'PASSWORD_TOO_SHORT'
                });
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please enter a valid email address.',
                    code: 'INVALID_EMAIL'
                });
            }

            await pool.connect();

            // Check for duplicate email
            const existing = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT CustomerID FROM Customers WHERE Email = @email');

            if (existing.recordset.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'An account with this email already exists.',
                    code: 'EMAIL_ALREADY_EXISTS'
                });
            }

            // Hash password
            const saltRounds = 12;
            const hash = await bcrypt.hash(password, saltRounds);

            // Insert new customer
            const insertResult = await pool.request()
                .input('fullName', sql.NVarChar, fullName.trim())
                .input('email', sql.NVarChar, email.toLowerCase().trim())
                .input('phoneNumber', sql.NVarChar, phoneNumber || null)
                .input('passwordHash', sql.NVarChar, hash)
                .query(`
                    INSERT INTO Customers (FullName, Email, PhoneNumber, PasswordHash) 
                    OUTPUT INSERTED.CustomerID
                    VALUES (@fullName, @email, @phoneNumber, @passwordHash)
                `);

            const newCustomerId = insertResult.recordset[0].CustomerID;

            // Create customer session data
            const customerData = {
                id: newCustomerId,
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                phoneNumber: phoneNumber,
                role: 'Customer',
                type: 'customer',
                isEmailVerified: false
            };

            // Store in session
            req.session.user = customerData;
            req.session.customerData = customerData;

            // Generate JWT tokens for new customer
            let jwtTokens = null;
            try {
                jwtTokens = jwtUtils.generateTokenPair(customerData);
                console.log('✅ JWT tokens generated for new customer');
            } catch (tokenError) {
                console.error('JWT token creation error:', tokenError);
                // Continue without tokens - session auth will work
            }

            res.status(201).json({ 
                success: true, 
                message: 'Registration successful! Welcome to DesignXcel!',
                user: customerData,
                tokens: jwtTokens
            });

        } catch (err) {
            console.error('Customer registration error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred during registration. Please try again.',
                code: 'SERVER_ERROR'
            });
        }
    });

    /**
     * Check Authentication Status
     * GET /api/auth/status
     */
    router.get('/api/auth/status', async (req, res) => {
        try {
            if (!req.session || !req.session.user) {
                return res.json({ 
                    success: false, 
                    authenticated: false,
                    message: 'Not authenticated'
                });
            }

            res.json({ 
                success: true, 
                authenticated: true,
                user: req.session.user
            });
        } catch (err) {
            console.error('Auth status check error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error checking authentication status'
            });
        }
    });

    /**
     * Forgot Password
     * POST /api/auth/forgot-password
     */
    router.post('/api/auth/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email is required' 
                });
            }

            await pool.connect();
            
            // Check if user exists
            const userResult = await pool.request()
                .input('email', sql.VarChar(255), email)
                .query(`
                    SELECT CustomerID, FullName, Email 
                    FROM Customers 
                    WHERE Email = @email AND IsActive = 1
                `);

            if (userResult.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No account found with this email address' 
                });
            }

            const user = userResult.recordset[0];
            
            // Generate reset token using crypto for better security
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
            
            // Store reset token in database
            try {
                // First, clean up any existing tokens for this user
                await pool.request()
                    .input('customerId', sql.Int, user.CustomerID)
                    .query(`
                        DELETE FROM PasswordResetTokens 
                        WHERE CustomerID = @customerId OR ExpiresAt < GETDATE()
                    `);
                
                // Insert new reset token
                await pool.request()
                    .input('customerId', sql.Int, user.CustomerID)
                    .input('token', sql.NVarChar(255), resetToken)
                    .input('expiresAt', sql.DateTime2, resetTokenExpiry)
                    .query(`
                        INSERT INTO PasswordResetTokens (CustomerID, Token, ExpiresAt)
                        VALUES (@customerId, @token, @expiresAt)
                    `);
                
                console.log(`✅ Password reset token stored for ${email}. Token: ${resetToken}`);
            } catch (dbError) {
                console.error('❌ Error storing reset token:', dbError);
                // Continue with email sending even if token storage fails
            }
            
            // Send password reset email using nodemailer
            const nodemailer = require('nodemailer');
            const fs = require('fs');
            const path = require('path');
            
            console.log('📧 Password reset email config check:');
            console.log('  - OTP_EMAIL_USER:', process.env.OTP_EMAIL_USER ? 'Set' : 'Not set');
            console.log('  - OTP_EMAIL_PASS:', process.env.OTP_EMAIL_PASS ? 'Set' : 'Not set');
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.OTP_EMAIL_USER,
                    pass: process.env.OTP_EMAIL_PASS
                }
            });
            
            // Read HTML template
            const templatePath = path.join(__dirname, 'templates', 'emails', 'auth', 'password-reset-email.html');
            let htmlTemplate = '';
            
            try {
                htmlTemplate = fs.readFileSync(templatePath, 'utf8');
            } catch (templateError) {
                console.error('Error reading password reset email template:', templateError);
                // Fallback to simple text email
                htmlTemplate = `
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.FullName},</p>
                    <p>You requested to reset your password. Click the link below to reset your password:</p>
                    <p><a href="http://localhost:3000/reset-password?token=${resetToken}">Reset Password</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `;
            }
            
            // Replace placeholders in template
            const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
            const personalizedTemplate = htmlTemplate
                .replace(/{{USER_NAME}}/g, user.FullName || 'Valued Customer')
                .replace(/{{RESET_LINK}}/g, resetLink);
            
            // Email options
            const mailOptions = {
                from: `"Design Excellence" <${process.env.OTP_EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your Design Excellence Password',
                html: personalizedTemplate
            };
            
            // Send email
            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('✅ Password reset email sent successfully:', info.messageId);
                
                res.json({ 
                    success: true, 
                    message: 'Password reset instructions have been sent to your email address',
                    // In development, you might want to return the token for testing
                    ...(process.env.NODE_ENV === 'development' && { resetToken, resetLink })
                });
                
            } catch (emailError) {
                console.error('❌ Error sending password reset email:', emailError);
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to send password reset email. Please try again later.' 
                });
            }
            
        } catch (err) {
            console.error('Forgot password error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred while processing your request' 
            });
        }
    });

    /**
     * Reset Password
     * POST /api/auth/reset-password
     */
    router.post('/api/auth/reset-password', async (req, res) => {
        try {
            const { token, password, confirmPassword } = req.body;
            
            if (!token || !password || !confirmPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Token, password, and confirm password are required' 
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Passwords do not match' 
                });
            }

            if (password.length < 8) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Password must be at least 8 characters long' 
                });
            }

            await pool.connect();
            
            // Validate the reset token from database
            const tokenResult = await pool.request()
                .input('token', sql.NVarChar(255), token)
                .query(`
                    SELECT prt.TokenID, prt.CustomerID, prt.ExpiresAt, prt.IsUsed,
                           c.Email, c.FullName
                    FROM PasswordResetTokens prt
                    INNER JOIN Customers c ON prt.CustomerID = c.CustomerID
                    WHERE prt.Token = @token AND prt.IsUsed = 0
                `);

            if (tokenResult.recordset.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or expired reset token' 
                });
            }

            const tokenData = tokenResult.recordset[0];
            
            // Check if token is expired
            if (new Date() > new Date(tokenData.ExpiresAt)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Reset token has expired. Please request a new one.' 
                });
            }

            // Hash the new password
            const bcrypt = require('bcryptjs');
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Update the user's password
            await pool.request()
                .input('customerId', sql.Int, tokenData.CustomerID)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE Customers 
                    SET PasswordHash = @passwordHash
                    WHERE CustomerID = @customerId
                `);
            
            // Mark the token as used
            await pool.request()
                .input('tokenId', sql.Int, tokenData.TokenID)
                .query(`
                    UPDATE PasswordResetTokens 
                    SET IsUsed = 1, UsedAt = GETDATE()
                    WHERE TokenID = @tokenId
                `);
            
            console.log(`✅ Password reset successful for customer ${tokenData.CustomerID} (${tokenData.Email})`);
            
            res.json({ 
                success: true, 
                message: 'Password has been reset successfully' 
            });
            
        } catch (err) {
            console.error('Reset password error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred while resetting your password' 
            });
        }
    });

    /**
     * Customer Logout
     * POST /api/auth/customer/logout
     */
    router.post('/api/auth/customer/logout', async (req, res) => {
        try {
            // Revoke token if exists
            if (req.headers.authorization) {
                const token = req.headers.authorization.replace('Bearer ', '');
                try {
                    await revokeToken(pool, sql, token);
                } catch (tokenError) {
                    console.error('Token revocation error:', tokenError);
                    // Continue with session destruction
                }
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Logout session destruction error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Logout failed' 
                    });
                }
                res.json({ 
                    success: true, 
                    message: 'Logged out successfully' 
                });
            });
        } catch (err) {
            console.error('Customer logout error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred during logout' 
            });
        }
    });





    // =============================================================================
    // CUSTOMER ORDER MANAGEMENT ROUTES
    // =============================================================================

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
            if (status !== 'Receive' && status !== 'Received') {
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

    // Cancel customer order
    router.put('/api/customer/orders/:orderId/cancel', isAuthenticated, async (req, res) => {
        const orderId = req.params.orderId;
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            // Only allow if the order belongs to this customer and is in a cancellable state
            const result = await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('customerId', sql.Int, customerId)
                .query(`SELECT Status FROM Orders WHERE OrderID = @orderId AND CustomerID = @customerId`);
            if (!result.recordset.length) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }
            const status = result.recordset[0].Status;
            if (status === 'Completed' || status === 'Cancelled') {
                return res.status(400).json({ success: false, message: 'Order cannot be cancelled in its current state.' });
            }
            // Update status to Cancelled
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
            return res.json({ success: true, message: 'Order cancelled successfully.' });
        } catch (err) {
            console.error('Error cancelling order:', err);
            return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
        }
    });

    // Get customer orders
    router.get('/api/customer/orders', isAuthenticated, async (req, res) => {
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT 
                        o.OrderID,
                        o.OrderDate,
                        o.Status,
                        o.TotalAmount,
                        o.PaymentMethod,
                        o.DeliveryType,
                        o.DeliveryCost,
                        o.Notes,
                        CASE 
                            WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                            WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                            ELSE o.DeliveryType
                        END as DeliveryTypeName
                    FROM Orders o
                    LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                    WHERE o.CustomerID = @customerId
                    ORDER BY o.OrderDate DESC
                `);
            
            const orders = result.recordset;
            
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
            
            return res.json({ success: true, orders: orders });
        } catch (err) {
            console.error('Error fetching customer orders:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
        }
    });

    // Get customer order details
    router.get('/api/customer/orders/:orderId', isAuthenticated, async (req, res) => {
        const orderId = req.params.orderId;
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            const result = await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT 
                        o.OrderID,
                        o.OrderDate,
                        o.Status,
                        o.TotalAmount,
                        o.PaymentMethod,
                        o.DeliveryType,
                        o.DeliveryCost,
                        o.Notes,
                        o.ShippingAddressID,
                        CASE 
                            WHEN o.DeliveryType = 'pickup' THEN 'Pick up'
                            WHEN o.DeliveryType LIKE 'rate_%' THEN dr.ServiceType
                            ELSE o.DeliveryType
                        END as DeliveryTypeName,
                        a.Label AS AddressLabel, 
                        a.HouseNumber, 
                        a.Street, 
                        a.Barangay, 
                        a.City, 
                        a.Province, 
                        a.Region, 
                        a.PostalCode, 
                        a.Country
                    FROM Orders o
                    LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                    LEFT JOIN DeliveryRates dr ON o.DeliveryType = 'rate_' + CAST(dr.RateID AS NVARCHAR(10))
                    WHERE o.OrderID = @orderId AND o.CustomerID = @customerId
                `);
            
            if (!result.recordset.length) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }
            
            const order = result.recordset[0];
            
            // Decrypt address data if present
            if (order.AddressLabel || order.HouseNumber || order.Street || order.Barangay || order.City || order.Province || order.Region || order.PostalCode || order.Country) {
                // Return address data as plain text
                const addressData = {
                    Label: order.AddressLabel,
                    HouseNumber: order.HouseNumber,
                    Street: order.Street,
                    Barangay: order.Barangay,
                    City: order.City,
                    Province: order.Province,
                    Region: order.Region,
                    PostalCode: order.PostalCode,
                    Country: order.Country
                };
                
                order.AddressLabel = decryptedAddress.Label;
                order.HouseNumber = decryptedAddress.HouseNumber;
                order.Street = decryptedAddress.Street;
                order.Barangay = decryptedAddress.Barangay;
                order.City = decryptedAddress.City;
                order.Province = decryptedAddress.Province;
                order.Region = decryptedAddress.Region;
                order.PostalCode = decryptedAddress.PostalCode;
                order.Country = decryptedAddress.Country;
            }
            
            // Fetch order items
            const itemsResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT oi.OrderItemID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL, p.Description
                    FROM OrderItems oi
                    JOIN Products p ON oi.ProductID = p.ProductID
                    WHERE oi.OrderID = @orderId
                `);
            order.items = itemsResult.recordset;
            
            return res.json({ success: true, order: order });
        } catch (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
        }
    });

    // Get customer addresses
    router.get('/api/customer/addresses', isAuthenticated, async (req, res) => {
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT AddressID, Label, HouseNumber, Street, Barangay, City, Province, Region, PostalCode, Country, IsDefault
                    FROM CustomerAddresses 
                    WHERE CustomerID = @customerId
                    ORDER BY IsDefault DESC, AddressID DESC
                `);
            
            const addresses = result.recordset;
            
            // Decrypt address data using TransparentEncryptionService
            const decryptedAddresses = addresses;
            
            return res.json({ success: true, addresses: decryptedAddresses });
        } catch (err) {
            console.error('Error fetching customer addresses:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch addresses.' });
        }
    });

    // Add customer address
    router.post('/api/customer/addresses', isAuthenticated, async (req, res) => {
        const customerId = req.session.user && req.session.user.id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            const { label, houseNumber, street, barangay, city, province, region, postalCode, country, isDefault } = req.body;
            
            // Encrypt address data using TransparentEncryptionService
            const encryptedAddressData = TransparentEncryptionService.processAddressForStorage({
                Label: label,
                HouseNumber: houseNumber,
                Street: street,
                Barangay: barangay,
                City: city,
                Province: province,
                Region: region,
                PostalCode: postalCode,
                Country: country || 'Philippines'
            });
            
            // If this is set as default, unset other defaults first
            if (isDefault) {
                await pool.request()
                    .input('customerId', sql.Int, customerId)
                    .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerID = @customerId');
            }
            
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('label', sql.NVarChar, encryptedAddressData.Label)
                .input('houseNumber', sql.NVarChar, encryptedAddressData.HouseNumber)
                .input('street', sql.NVarChar, encryptedAddressData.Street)
                .input('barangay', sql.NVarChar, encryptedAddressData.Barangay)
                .input('city', sql.NVarChar, encryptedAddressData.City)
                .input('province', sql.NVarChar, encryptedAddressData.Province)
                .input('region', sql.NVarChar, encryptedAddressData.Region)
                .input('postalCode', sql.NVarChar, encryptedAddressData.PostalCode)
                .input('country', sql.NVarChar, encryptedAddressData.Country)
                .input('isDefault', sql.Bit, isDefault ? 1 : 0)
                .query(`
                    INSERT INTO CustomerAddresses (CustomerID, Label, HouseNumber, Street, Barangay, City, Province, Region, PostalCode, Country, IsDefault)
                    VALUES (@customerId, @label, @houseNumber, @street, @barangay, @city, @province, @region, @postalCode, @country, @isDefault)
                `);
            
            return res.json({ success: true, message: 'Address added successfully.' });
        } catch (err) {
            console.error('Error adding customer address:', err);
            return res.status(500).json({ success: false, message: 'Failed to add address.' });
        }
    });

    // Update customer address
    router.put('/api/customer/addresses/:addressId', isAuthenticated, async (req, res) => {
        const customerId = req.session.user && req.session.user.id;
        const addressId = req.params.addressId;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            const { label, houseNumber, street, barangay, city, province, region, postalCode, country, isDefault } = req.body;
            
            // Encrypt address data using TransparentEncryptionService
            const encryptedAddressData = TransparentEncryptionService.processAddressForStorage({
                Label: label,
                HouseNumber: houseNumber,
                Street: street,
                Barangay: barangay,
                City: city,
                Province: province,
                Region: region,
                PostalCode: postalCode,
                Country: country || 'Philippines'
            });
            
            // If this is set as default, unset other defaults first
            if (isDefault) {
                await pool.request()
                    .input('customerId', sql.Int, customerId)
                    .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerID = @customerId');
            }
            
            await pool.request()
                .input('addressId', sql.Int, addressId)
                .input('customerId', sql.Int, customerId)
                .input('label', sql.NVarChar, encryptedAddressData.Label)
                .input('houseNumber', sql.NVarChar, encryptedAddressData.HouseNumber)
                .input('street', sql.NVarChar, encryptedAddressData.Street)
                .input('barangay', sql.NVarChar, encryptedAddressData.Barangay)
                .input('city', sql.NVarChar, encryptedAddressData.City)
                .input('province', sql.NVarChar, encryptedAddressData.Province)
                .input('region', sql.NVarChar, encryptedAddressData.Region)
                .input('postalCode', sql.NVarChar, encryptedAddressData.PostalCode)
                .input('country', sql.NVarChar, encryptedAddressData.Country)
                .input('isDefault', sql.Bit, isDefault ? 1 : 0)
                .query(`
                    UPDATE CustomerAddresses 
                    SET Label = @label, HouseNumber = @houseNumber, Street = @street, Barangay = @barangay, 
                        City = @city, Province = @province, Region = @region, PostalCode = @postalCode, 
                        Country = @country, IsDefault = @isDefault
                    WHERE AddressID = @addressId AND CustomerID = @customerId
                `);
            
            return res.json({ success: true, message: 'Address updated successfully.' });
        } catch (err) {
            console.error('Error updating customer address:', err);
            return res.status(500).json({ success: false, message: 'Failed to update address.' });
        }
    });

    // Delete customer address
    router.delete('/api/customer/addresses/:addressId', isAuthenticated, async (req, res) => {
        const customerId = req.session.user && req.session.user.id;
        const addressId = req.params.addressId;
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        try {
            await pool.connect();
            await pool.request()
                .input('addressId', sql.Int, addressId)
                .input('customerId', sql.Int, customerId)
                .query('DELETE FROM CustomerAddresses WHERE AddressID = @addressId AND CustomerID = @customerId');
            
            return res.json({ success: true, message: 'Address deleted successfully.' });
        } catch (err) {
            console.error('Error deleting customer address:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete address.' });
        }
    });

    // =============================================================================
    // DASHBOARD API ENDPOINTS
    // =============================================================================

    // API endpoint for products count
    router.get('/api/dashboard/products-count', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM Products 
                WHERE IsActive = 1
            `);
            
            res.json({ count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching products count:', err);
            res.json({ count: 0 });
        }
    });

    // API endpoint for materials count
    router.get('/api/dashboard/materials-count', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const result = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM RawMaterials 
                WHERE IsActive = 1
            `);
            
            res.json({ count: result.recordset[0].count });
        } catch (err) {
            console.error('Error fetching materials count:', err);
            res.json({ count: 0 });
        }
    });

    // API endpoint for safety stock value
    router.get('/api/safety-stock-value', isAuthenticated, async (req, res) => {
        try {
            // For now, return a default safety stock value of 10
            // This could be made configurable in the future
            res.json({ value: 10 });
        } catch (err) {
            console.error('Error fetching safety stock value:', err);
            res.json({ value: 10 });
        }
    });

    // API endpoint for updating safety stock value
    router.post('/api/safety-stock-value', isAuthenticated, async (req, res) => {
        try {
            const { value } = req.body;
            if (!value || value < 1) {
                return res.status(400).json({ success: false, message: 'Invalid safety stock value' });
            }
            
            // For now, just return success - in the future this could be stored in a settings table
            res.json({ success: true, value: parseInt(value) });
        } catch (err) {
            console.error('Error updating safety stock value:', err);
            res.status(500).json({ success: false, message: 'Failed to update safety stock value' });
        }
    });


    // API endpoint for alerts data
    router.get('/Employee/Admin/Alerts/Data', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            // Fetch products with low stock (≤ 20)
            const productsResult = await pool.request().query(`
                SELECT ProductID, Name, StockQuantity
                FROM Products 
                WHERE IsActive = 1 AND StockQuantity <= 20
                ORDER BY StockQuantity ASC
            `);
            
            // Fetch raw materials with low stock (≤ 20)
            const materialsResult = await pool.request().query(`
                SELECT MaterialID, Name, QuantityAvailable, Unit
                FROM RawMaterials 
                WHERE IsActive = 1 AND QuantityAvailable <= 20
                ORDER BY QuantityAvailable ASC
            `);
            
            res.json({
                success: true,
                products: productsResult.recordset,
                rawMaterials: materialsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching alerts data:', err);
            res.json({
                success: false,
                products: [],
                rawMaterials: []
            });
        }
    });

    // =============================================================================
    // PRODUCT MANAGEMENT ROUTES
    // =============================================================================

    // POST route for archiving products (used by AdminProducts.ejs form)
    router.post('/Employee/Admin/Products/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const productId = req.params.id;
            
            // First check if product exists
            const checkResult = await pool.request()
                .input('id', sql.Int, productId)
                .query('SELECT ProductID, Name FROM Products WHERE ProductID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Product not found.');
                return res.redirect('/Employee/Admin/Products');
            }
            
            const productName = checkResult.recordset[0].Name;
            
            // Archive the product (soft delete by setting IsActive = 0)
            await pool.request()
                .input('id', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 0 WHERE ProductID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `Admin archived product "${productName}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            req.flash('success', `Product "${productName}" has been archived. You can restore it from the Archived page.`);
            res.redirect('/Employee/Admin/Products');
        } catch (err) {
            console.error('Error archiving product:', err);
            req.flash('error', 'Failed to archive product. Please try again.');
            res.redirect('/Employee/Admin/Products');
        }
    });

    // POST route for archiving raw materials (used by AdminMaterials.ejs form)
    router.post('/Employee/Admin/RawMaterials/Delete/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const materialId = req.params.id;
            
            // First check if material exists
            const checkResult = await pool.request()
                .input('id', sql.Int, materialId)
                .query('SELECT MaterialID, Name FROM RawMaterials WHERE MaterialID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Raw material not found.');
                return res.redirect('/Employee/Admin/RawMaterials');
            }
            
            const materialName = checkResult.recordset[0].Name;
            
            // Archive the raw material (soft delete by setting IsActive = 0)
            await pool.request()
                .input('id', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 0 WHERE MaterialID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'DELETE',
                'RawMaterials',
                materialId.toString(),
                `Admin archived raw material: "${materialName}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 1, new: 0 } })
            );
            
            req.flash('success', `Raw material "${materialName}" has been archived. You can restore it from the Archived page.`);
            res.redirect('/Employee/Admin/RawMaterials');
        } catch (err) {
            console.error('Error archiving raw material:', err);
            req.flash('error', 'Failed to archive raw material. Please try again.');
            res.redirect('/Employee/Admin/RawMaterials');
        }
    });

    // =============================================================================
    // ARCHIVED ITEMS REACTIVATION ROUTES
    // =============================================================================

    // POST route for reactivating archived products (used by AdminArchived.ejs form)
    router.post('/Employee/Admin/Archived/ReactivateProduct/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const productId = req.params.id;
            
            // First check if product exists and is archived
            const checkResult = await pool.request()
                .input('id', sql.Int, productId)
                .query('SELECT ProductID, Name, IsActive FROM Products WHERE ProductID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Product not found.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            const product = checkResult.recordset[0];
            if (product.IsActive === 1) {
                req.flash('error', 'Product is already active.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            // Reactivate the product (set IsActive = 1)
            await pool.request()
                .input('id', sql.Int, productId)
                .query('UPDATE Products SET IsActive = 1 WHERE ProductID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `Admin reactivated product: "${product.Name}" (ID: ${productId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            req.flash('success', `Product "${product.Name}" has been reactivated and is now available on the Products page.`);
            res.redirect('/Employee/Admin/Archived');
        } catch (err) {
            console.error('Error reactivating product:', err);
            req.flash('error', 'Failed to reactivate product. Please try again.');
            res.redirect('/Employee/Admin/Archived');
        }
    });

    // POST route for reactivating archived raw materials (used by AdminArchived.ejs form)
    router.post('/Employee/Admin/Archived/ReactivateMaterial/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const materialId = req.params.id;
            
            // First check if material exists and is archived
            const checkResult = await pool.request()
                .input('id', sql.Int, materialId)
                .query('SELECT MaterialID, Name, IsActive FROM RawMaterials WHERE MaterialID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Raw material not found.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            const material = checkResult.recordset[0];
            if (material.IsActive === 1) {
                req.flash('error', 'Raw material is already active.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            // Reactivate the raw material (set IsActive = 1)
            await pool.request()
                .input('id', sql.Int, materialId)
                .query('UPDATE RawMaterials SET IsActive = 1 WHERE MaterialID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'RawMaterials',
                materialId.toString(),
                `Admin reactivated raw material: "${material.Name}" (ID: ${materialId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            req.flash('success', `Raw material "${material.Name}" has been reactivated and is now available on the Raw Materials page.`);
            res.redirect('/Employee/Admin/Archived');
        } catch (err) {
            console.error('Error reactivating raw material:', err);
            req.flash('error', 'Failed to reactivate raw material. Please try again.');
            res.redirect('/Employee/Admin/Archived');
        }
    });

    // POST route for reactivating archived categories (used by AdminArchived.ejs form)
    router.post('/Employee/Admin/Archived/ReactivateCategory/:id', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            
            const categoryId = req.params.id;
            
            // First check if category exists and is archived
            const checkResult = await pool.request()
                .input('id', sql.Int, categoryId)
                .query('SELECT CategoryID, CategoryName, IsActive FROM Categories WHERE CategoryID = @id');
            
            if (checkResult.recordset.length === 0) {
                req.flash('error', 'Category not found.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            const category = checkResult.recordset[0];
            if (category.IsActive === 1) {
                req.flash('error', 'Category is already active.');
                return res.redirect('/Employee/Admin/Archived');
            }
            
            // Reactivate the category (set IsActive = 1)
            await pool.request()
                .input('id', sql.Int, categoryId)
                .query('UPDATE Categories SET IsActive = 1 WHERE CategoryID = @id');
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Categories',
                categoryId.toString(),
                `Admin reactivated category "${category.CategoryName}" (ID: ${categoryId})`,
                JSON.stringify({ IsActive: { old: 0, new: 1 } })
            );
            
            req.flash('success', `Category "${category.CategoryName}" has been reactivated and is now available.`);
            res.redirect('/Employee/Admin/Archived');
        } catch (err) {
            console.error('Error reactivating category:', err);
            req.flash('error', 'Failed to reactivate category. Please try again.');
            res.redirect('/Employee/Admin/Archived');
        }
    });

    // Product Management API
    router.post('/Employee/Admin/Products/Add', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { name, description, price, stockquantity, category, requiredMaterials, dimensions } = req.body;
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Parse dimensions data
                let dimensionsJson = '{}';
                if (dimensions) {
                    try {
                        const dimensionsData = JSON.parse(dimensions);
                        dimensionsJson = JSON.stringify(dimensionsData);
                    } catch (e) {
                        console.log('Error parsing dimensions:', e);
                    }
                }

                // Insert product
                const productResult = await transaction.request()
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('stockquantity', sql.Int, stockquantity)
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .query(`
                        INSERT INTO Products (Name, Description, Price, StockQuantity, Category, Dimensions, DateAdded, IsActive)
                        VALUES (@name, @description, @price, @stockquantity, @category, @dimensions, GETDATE(), 1)
                        SELECT SCOPE_IDENTITY() as ProductID
                    `);
                
                const productId = productResult.recordset[0].ProductID;
                
                // Handle file uploads if any
                if (req.files) {
                    // Handle main image
                    if (req.files.image) {
                        const imageFile = req.files.image[0];
                        const imageUrl = `/uploads/products/images/${imageFile.filename}`;
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('imageUrl', sql.NVarChar, imageUrl)
                            .query('UPDATE Products SET ImageURL = @imageUrl WHERE ProductID = @productId');
                    }
                    
                    // Handle thumbnails
                    const thumbnails = [];
                    for (let i = 1; i <= 4; i++) {
                        if (req.files[`thumbnail${i}`]) {
                            const thumbnailFile = req.files[`thumbnail${i}`][0];
                            thumbnails.push(`/uploads/products/thumbnails/${thumbnailFile.filename}`);
                        }
                    }
                    
                    if (thumbnails.length > 0) {
                        await transaction.request()
                            .input('productId', sql.Int, productId)
                            .input('thumbnails', sql.NVarChar, JSON.stringify(thumbnails))
                            .query('UPDATE Products SET ThumbnailURLs = @thumbnails WHERE ProductID = @productId');
                    }
                }
                
                // Handle required materials
                if (requiredMaterials) {
                    const materials = JSON.parse(requiredMaterials);
                    for (const material of materials) {
                        if (material.materialId && material.quantityRequired > 0) {
                            await transaction.request()
                                .input('productId', sql.Int, productId)
                                .input('materialId', sql.Int, material.materialId)
                                .input('quantityRequired', sql.Int, material.quantityRequired)
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                                    VALUES (@productId, @materialId, @quantityRequired)
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'INSERT',
                    'Products',
                    productId.toString(),
                    `Admin created new product: "${name}" (ID: ${productId})`
                );
                
                res.json({ 
                    success: true, 
                    message: 'Product created successfully!',
                    productId: productId
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error creating product:', err);
            res.json({ 
                success: false, 
                message: 'Failed to create product: ' + err.message 
            });
        }
    });

    router.post('/Employee/Admin/Products/Edit', isAuthenticated, productUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail1', maxCount: 1 },
        { name: 'thumbnail2', maxCount: 1 },
        { name: 'thumbnail3', maxCount: 1 },
        { name: 'thumbnail4', maxCount: 1 },
        { name: 'model3d', maxCount: 1 }
    ]), async (req, res) => {
        try {
            await pool.connect();
            const { productid, name, description, price, stockquantity, category, requiredMaterials, dimensions } = req.body;
            
            // Parse dimensions data
            let dimensionsJson = '{}';
            if (dimensions) {
                try {
                    const dimensionsData = JSON.parse(dimensions);
                    dimensionsJson = JSON.stringify(dimensionsData);
                } catch (e) {
                    console.log('Error parsing dimensions:', e);
                }
            }
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Get old product data for change tracking
                const oldProductResult = await transaction.request()
                    .input('productId', sql.Int, productid)
                    .query(`
                        SELECT Name, Description, Price, StockQuantity, Category 
                        FROM Products 
                        WHERE ProductID = @productId
                    `);
                
                const oldProduct = oldProductResult.recordset[0];
                
                // Update product
                await transaction.request()
                    .input('productId', sql.Int, productid)
                    .input('name', sql.NVarChar, name)
                    .input('description', sql.NVarChar, description)
                    .input('price', sql.Decimal(10, 2), price)
                    .input('stockquantity', sql.Int, stockquantity)
                    .input('category', sql.NVarChar, category)
                    .input('dimensions', sql.NVarChar, dimensionsJson)
                    .query(`
                        UPDATE Products 
                        SET Name = @name, Description = @description, Price = @price, 
                            StockQuantity = @stockquantity, Category = @category, Dimensions = @dimensions, UpdatedAt = GETDATE()
                        WHERE ProductID = @productId
                    `);
                
                // Handle file uploads if any
                if (req.files) {
                    // Get current image URLs before updating
                    const currentProduct = await transaction.request()
                        .input('productId', sql.Int, productid)
                        .query('SELECT ImageURL, ThumbnailURLs, Model3DURL FROM Products WHERE ProductID = @productId');
                    
                    const currentImageUrl = currentProduct.recordset[0]?.ImageURL;
                    const currentThumbnailUrls = currentProduct.recordset[0]?.ThumbnailURLs;
                    const currentModel3DURL = currentProduct.recordset[0]?.Model3DURL;
                    
                    // Handle main image
                    if (req.files.image) {
                        // Delete old main image
                        await deleteOldImageFile(currentImageUrl);
                        
                        const imageFile = req.files.image[0];
                        const imageUrl = `/uploads/products/images/${imageFile.filename}`;
                        await transaction.request()
                            .input('productId', sql.Int, productid)
                            .input('imageUrl', sql.NVarChar, imageUrl)
                            .query('UPDATE Products SET ImageURL = @imageUrl WHERE ProductID = @productId');
                    }
                    
                    // Handle thumbnails
                    const thumbnails = [];
                    for (let i = 1; i <= 4; i++) {
                        if (req.files[`thumbnail${i}`]) {
                            const thumbnailFile = req.files[`thumbnail${i}`][0];
                            thumbnails.push(`/uploads/products/thumbnails/${thumbnailFile.filename}`);
                        }
                    }
                    
                    if (thumbnails.length > 0) {
                        // Delete old thumbnails
                        await deleteOldThumbnailFiles(currentThumbnailUrls);
                        
                        await transaction.request()
                            .input('productId', sql.Int, productid)
                            .input('thumbnails', sql.NVarChar, JSON.stringify(thumbnails))
                            .query('UPDATE Products SET ThumbnailURLs = @thumbnails WHERE ProductID = @productId');
                    }
                    
                    // Handle 3D model
                    if (req.files.model3d) {
                        // Delete old 3D model file
                        if (currentModel3DURL) {
                            await deleteOldImageFile(currentModel3DURL);
                        }
                        
                        const model3dFile = req.files.model3d[0];
                        const model3dUrl = `/uploads/products/models/${model3dFile.filename}`;
                        await transaction.request()
                            .input('productId', sql.Int, productid)
                            .input('model3dUrl', sql.NVarChar, model3dUrl)
                            .input('has3dModel', sql.Bit, 1)
                            .query('UPDATE Products SET Model3DURL = @model3dUrl, Has3DModel = @has3dModel WHERE ProductID = @productId');
                    }
                }
                
                // Handle required materials
                if (requiredMaterials) {
                    const materials = JSON.parse(requiredMaterials);
                    
                    // Delete existing materials
                    await transaction.request()
                        .input('productId', sql.Int, productid)
                        .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                    
                    // Insert new materials
                    for (const material of materials) {
                        if (material.materialId && material.quantityRequired > 0) {
                            await transaction.request()
                                .input('productId', sql.Int, productid)
                                .input('materialId', sql.Int, material.materialId)
                                .input('quantityRequired', sql.Int, material.quantityRequired)
                                .query(`
                                    INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                                    VALUES (@productId, @materialId, @quantityRequired)
                                `);
                        }
                    }
                }
                
                await transaction.commit();
                
                // Capture changes for logging
                const newProductData = { Name: name, Description: description, Price: price, StockQuantity: stockquantity, Category: category };
                const changes = captureChanges(oldProduct, newProductData, ['Name', 'Description', 'Price', 'StockQuantity', 'Category']);
                
                // Log the activity
                await logActivity(
                    req.session.user.id,
                    'UPDATE',
                    'Products',
                    productid.toString(),
                    `Admin updated product: "${name}" (ID: ${productid})`,
                    changes
                );
                
                res.json({ 
                    success: true, 
                    message: 'Product updated successfully!'
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error updating product:', err);
            res.json({ 
                success: false, 
                message: 'Failed to update product: ' + err.message 
            });
        }
    });

    // Admin - Update Stock Only
    router.post('/Employee/Admin/Products/UpdateStock', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { productId, newStock } = req.body;
            
            if (!productId || newStock === undefined || newStock === null) {
                return res.json({ 
                    success: false, 
                    message: 'Product ID and new stock value are required.' 
                });
            }
            
            // Get current stock quantity before updating
            const currentStockResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @productId');
            
            if (currentStockResult.recordset.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'Product not found.' 
                });
            }
            
            const oldStock = currentStockResult.recordset[0].StockQuantity;
            
            // Update only the stock quantity
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('newStock', sql.Int, newStock)
                .query('UPDATE Products SET StockQuantity = @newStock, UpdatedAt = GETDATE() WHERE ProductID = @productId');
            
            // Log the activity with actual changes
            const changes = JSON.stringify({
                StockQuantity: {
                    old: oldStock,
                    new: newStock
                }
            });
            
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `Admin updated stock quantity from ${oldStock} to ${newStock} for product ID: ${productId}`,
                changes
            );
            
            res.json({ 
                success: true, 
                message: 'Stock updated successfully!' 
            });
        } catch (err) {
            console.error('Error updating stock:', err);
            res.json({ 
                success: false, 
                message: 'Failed to update stock: ' + err.message 
            });
        }
    });

    // Inventory Manager - Update Stock Only
    router.post('/Employee/InventoryManager/InventoryProducts/UpdateStock', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { productId, newStock } = req.body;
            
            if (!productId || newStock === undefined || newStock === null) {
                return res.json({ 
                    success: false, 
                    message: 'Product ID and new stock value are required.' 
                });
            }
            
            // Get current stock quantity before updating
            const currentStockResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @productId');
            
            if (currentStockResult.recordset.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'Product not found.' 
                });
            }
            
            const oldStock = currentStockResult.recordset[0].StockQuantity;
            
            // Update only the stock quantity
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('newStock', sql.Int, newStock)
                .query('UPDATE Products SET StockQuantity = @newStock, UpdatedAt = GETDATE() WHERE ProductID = @productId');
            
            // Log the activity with actual changes
            const changes = JSON.stringify({
                StockQuantity: {
                    old: oldStock,
                    new: newStock
                }
            });
            
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'Products',
                productId.toString(),
                `InventoryManager updated stock quantity from ${oldStock} to ${newStock} for product ID: ${productId}`,
                changes
            );
            
            res.json({ 
                success: true, 
                message: 'Stock updated successfully!' 
            });
        } catch (err) {
            console.error('Error updating stock:', err);
            res.json({ 
                success: false, 
                message: 'Failed to update stock: ' + err.message 
            });
        }
    });

    // Product Materials API
    router.get('/api/products/:id/materials', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            
            const result = await pool.request()
                .input('productId', sql.Int, id)
                .query(`
                    SELECT 
                        pm.ProductMaterialID,
                        pm.ProductID,
                        pm.MaterialID,
                        pm.QuantityRequired,
                        rm.Name as MaterialName,
                        rm.Unit as MaterialUnit
                    FROM ProductMaterials pm
                    INNER JOIN RawMaterials rm ON pm.MaterialID = rm.MaterialID
                    WHERE pm.ProductID = @productId
                    AND rm.IsActive = 1
                    ORDER BY rm.Name ASC
                `);
            
            res.json({ 
                success: true, 
                materials: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching product materials:', err);
            res.json({ 
                success: false, 
                message: 'Failed to retrieve product materials.' 
            });
        }
    });

    // Add/Update Product Materials API
    router.post('/api/products/:id/materials', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const { id } = req.params;
            const { materials } = req.body; // Array of { materialId, quantityRequired }
            
            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                // Delete existing materials for this product
                await transaction.request()
                    .input('productId', sql.Int, id)
                    .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                
                // Insert new materials
                for (const material of materials) {
                    if (material.materialId && material.quantityRequired > 0) {
                        await transaction.request()
                            .input('productId', sql.Int, id)
                            .input('materialId', sql.Int, material.materialId)
                            .input('quantityRequired', sql.Int, material.quantityRequired)
                            .query(`
                                INSERT INTO ProductMaterials (ProductID, MaterialID, QuantityRequired)
                                VALUES (@productId, @materialId, @quantityRequired)
                            `);
                    }
                }
                
                await transaction.commit();
                res.json({ 
                    success: true, 
                    message: 'Product materials updated successfully.' 
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('Error updating product materials:', err);
            res.json({ 
                success: false, 
                message: 'Failed to update product materials.' 
            });
        }
    });

    router.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.redirect('/login');
        });
    });

    // =============================================================================
    // PRODUCT VARIATIONS API
    // =============================================================================

    // Get variations for a specific product (Admin)
    router.get('/Employee/Admin/Variations/Get/:productId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        v.VariationID,
                        v.ProductID,
                        v.VariationName,
                        v.Color,
                        v.Quantity,
                        v.VariationImageURL,
                        v.IsActive,
                        v.CreatedAt,
                        p.Name as ProductName
                    FROM ProductVariations v
                    JOIN Products p ON v.ProductID = p.ProductID
                    WHERE v.ProductID = @productId
                    ORDER BY v.CreatedAt DESC
                `);
            
            res.json({
                success: true,
                variations: result.recordset
            });
        } catch (err) {
            console.error('Error fetching variations:', err);
            res.json({
                success: false,
                message: 'Failed to retrieve variations.'
            });
        }
    });

    // Get variations for a specific product (InventoryManager)
    router.get('/Employee/InventoryManager/InventoryVariations/Get/:productId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        v.VariationID,
                        v.ProductID,
                        v.VariationName,
                        v.Color,
                        v.Quantity,
                        v.VariationImageURL,
                        v.IsActive,
                        v.CreatedAt,
                        p.Name as ProductName
                    FROM ProductVariations v
                    JOIN Products p ON v.ProductID = p.ProductID
                    WHERE v.ProductID = @productId
                    ORDER BY v.CreatedAt DESC
                `);
            
            res.json({
                success: true,
                variations: result.recordset
            });
        } catch (err) {
            console.error('Error fetching inventory manager variations:', err);
            res.json({
                success: false,
                message: 'Failed to retrieve variations.'
            });
        }
    });

    // Add new variation
    router.post('/Employee/Admin/Variations/Add', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationName, color, quantity, productID, isActive } = req.body;
            
            // Handle image upload
            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/variations/${req.file.filename}`;
            }
            
            const result = await pool.request()
                .input('productID', sql.Int, parseInt(productID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('imageUrl', sql.NVarChar, imageUrl)
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0)
                .query(`
                    INSERT INTO ProductVariations (ProductID, VariationName, Color, Quantity, VariationImageURL, IsActive)
                    VALUES (@productID, @variationName, @color, @quantity, @imageUrl, @isActive)
                `);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'INSERT',
                'ProductVariations',
                null,
                `Admin added new product variation: "${variationName}" (Color: ${color || 'N/A'}, Quantity: ${quantity}) for Product ID: ${productID}`
            );
            
            res.json({
                success: true,
                message: 'Variation added successfully.'
            });
        } catch (err) {
            console.error('Error adding variation:', err);
            res.json({
                success: false,
                message: 'Failed to add variation.'
            });
        }
    });

    // Edit variation
    router.post('/Employee/Admin/Variations/Edit', isAuthenticated, variationUpload.single('variationImage'), async (req, res) => {
        try {
            await pool.connect();
            const { variationID, variationName, color, quantity, isActive } = req.body;
            
            // Handle image upload - only update if new image provided
            let updateQuery = `
                UPDATE ProductVariations 
                SET VariationName = @variationName,
                    Color = @color,
                    Quantity = @quantity,
                    IsActive = @isActive
            `;
            
            const request = pool.request()
                .input('variationID', sql.Int, parseInt(variationID))
                .input('variationName', sql.NVarChar, variationName)
                .input('color', sql.NVarChar, color || null)
                .input('quantity', sql.Int, parseInt(quantity))
                .input('isActive', sql.Bit, isActive === '1' ? 1 : 0);
            
            if (req.file) {
                // Get current variation image URL before updating
                const currentVariation = await pool.request()
                    .input('variationID', sql.Int, parseInt(variationID))
                    .query('SELECT VariationImageURL FROM ProductVariations WHERE VariationID = @variationID');
                
                const currentImageUrl = currentVariation.recordset[0]?.VariationImageURL;
                
                // Delete old variation image
                await deleteOldImageFile(currentImageUrl);
                
                const imageUrl = `/uploads/variations/${req.file.filename}`;
                updateQuery += `, VariationImageURL = @imageUrl`;
                request.input('imageUrl', sql.NVarChar, imageUrl);
            }
            
            updateQuery += ` WHERE VariationID = @variationID`;
            
            await request.query(updateQuery);
            
            // Log the activity
            await logActivity(
                req.session.user.id,
                'UPDATE',
                'ProductVariations',
                variationID.toString(),
                `Admin updated product variation ID ${variationID}: "${variationName}" (Color: ${color || 'N/A'}, Quantity: ${quantity})`
            );
            
            res.json({
                success: true,
                message: 'Variation updated successfully.'
            });
        } catch (err) {
            console.error('Error updating variation:', err);
            res.json({
                success: false,
                message: 'Failed to update variation.'
            });
        }
    });

    // Delete variation
    router.post('/Employee/Admin/Variations/Delete/:variationID', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const variationID = parseInt(req.params.variationID);
            
            await pool.request()
                .input('variationID', sql.Int, variationID)
                .query(`DELETE FROM ProductVariations WHERE VariationID = @variationID`);
            
            res.json({
                success: true,
                message: 'Variation deleted successfully.'
            });
        } catch (err) {
            console.error('Error deleting variation:', err);
            res.json({
                success: false,
                message: 'Failed to delete variation.'
            });
        }
    });

    // Get variations for a specific product (Transaction Manager)
    router.get('/Employee/TransactionManager/TransactionVariations/Get/:productId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        v.VariationID,
                        v.ProductID,
                        v.VariationName,
                        v.Color,
                        v.Quantity,
                        v.VariationImageURL,
                        v.IsActive,
                        v.CreatedAt,
                        p.Name as ProductName
                    FROM ProductVariations v
                    JOIN Products p ON v.ProductID = p.ProductID
                    WHERE v.ProductID = @productId
                    ORDER BY v.CreatedAt DESC
                `);
            
            res.json({ 
                success: true, 
                variations: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching variations:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch variations',
                error: err.message
            });
        }
    });

    // Get variations for a specific product (User Manager)
    router.get('/Employee/UserManager/UserVariations/Get/:productId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        v.VariationID,
                        v.ProductID,
                        v.VariationName,
                        v.Color,
                        v.Quantity,
                        v.VariationImageURL,
                        v.IsActive,
                        v.CreatedAt,
                        p.Name as ProductName
                    FROM ProductVariations v
                    JOIN Products p ON v.ProductID = p.ProductID
                    WHERE v.ProductID = @productId
                    ORDER BY v.CreatedAt DESC
                `);
            
            res.json({ 
                success: true, 
                variations: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching variations:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch variations',
                error: err.message
            });
        }
    });

    // Get variations for a specific product (Order Support)
    router.get('/Employee/OrderSupport/OrderVariations/Get/:productId', isAuthenticated, async (req, res) => {
        try {
            await pool.connect();
            const productId = parseInt(req.params.productId);
            
            const result = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        v.VariationID,
                        v.ProductID,
                        v.VariationName,
                        v.Color,
                        v.Quantity,
                        v.VariationImageURL,
                        v.IsActive,
                        v.CreatedAt,
                        p.Name as ProductName
                    FROM ProductVariations v
                    JOIN Products p ON v.ProductID = p.ProductID
                    WHERE v.ProductID = @productId
                    ORDER BY v.CreatedAt DESC
                `);
            
            res.json({ 
                success: true, 
                variations: result.recordset 
            });
        } catch (err) {
            console.error('Error fetching variations:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch variations',
                error: err.message
            });
        }
    });

    return router;
};



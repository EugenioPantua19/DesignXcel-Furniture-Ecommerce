require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'public', 'uploads', 'profile-images');
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public', 'uploads', 'profile-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Stripe webhook route: must come BEFORE express.json() and express.urlencoded() ---
app.post('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('[STRIPE WEBHOOK] Received event type:', event.type);
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.customer_email;
        const metadata = session.metadata || {};
        let cart = [];
        // Parse cart from metadata
        try {
            if (metadata.cart) {
                cart = JSON.parse(metadata.cart);
                console.log('[STRIPE WEBHOOK] Successfully parsed cart from metadata:', cart);
            } else {
                console.error('[STRIPE WEBHOOK] No cart metadata found in session:', metadata);
            }
        } catch (e) {
            console.error('[STRIPE WEBHOOK] Failed to parse cart metadata:', e);
        }
        // Log received data
        console.log('[STRIPE WEBHOOK] Received checkout.session.completed:', {
            email,
            cart,
            metadata,
            sessionId: session.id,
            amount_total: session.amount_total,
            currency: session.currency
        });
        // Save order to database
        try {
            // Restore session if not present (important for webhooks)
            if (!req.session || !req.session.user) {
                console.log('[STRIPE WEBHOOK] No session found, attempting to restore session for email:', email);
                
                await pool.connect();
                const customerResult = await pool.request()
                    .input('email', sql.NVarChar, email)
                    .query('SELECT * FROM Customers WHERE Email = @email AND IsActive = 1');
                
                if (customerResult.recordset.length > 0) {
                    const customer = customerResult.recordset[0];
                    req.session.user = {
                        id: customer.CustomerID,
                        fullName: customer.FullName,
                        email: customer.Email,
                        role: 'Customer',
                        type: 'customer'
                    };
                    console.log('[STRIPE WEBHOOK] Session restored successfully for:', email);
                } else {
                    console.error('[STRIPE WEBHOOK] Could not restore session, customer not found for email:', email);
                }
            }

            await pool.connect();
            console.log('[STRIPE WEBHOOK] Database connected successfully');
            // Find customer by email
            if (!email) {
                console.error('[STRIPE WEBHOOK] No customer email provided. Order not saved.');
                return res.status(200).send('No customer email, order not saved');
            }
            console.log('[STRIPE WEBHOOK] Looking up customer with email:', email);
            const customerResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT CustomerID, FullName FROM Customers WHERE Email = @email');
            console.log('[STRIPE WEBHOOK] Customer lookup result:', customerResult.recordset);
            const customer = customerResult.recordset[0];
            if (!customer) {
                console.error('[STRIPE WEBHOOK] Customer not found for email:', email);
                return res.status(200).send('Customer not found, order not saved');
            }
            console.log('[STRIPE WEBHOOK] Found customer:', customer);
            if (!Array.isArray(cart) || cart.length === 0) {
                console.error('[STRIPE WEBHOOK] Cart is empty or malformed. Order not saved.');
                return res.status(200).send('Cart is empty or malformed, order not saved');
            }

            // Extract shipping info from metadata
            const deliveryType = metadata.deliveryType || 'pickup';
            const shippingCost = parseFloat(metadata.shippingCost) || 0;
            const pickupDate = metadata.pickupDate || null;
            let shippingAddressId = metadata.shippingAddressId ? parseInt(metadata.shippingAddressId) : null;

            console.log('[STRIPE WEBHOOK] Extracted from metadata:', { deliveryType, shippingCost, pickupDate, shippingAddressId });

            // If no shipping address in metadata, try to get customer's default shipping address
            // Also do this for pickup so admin views can still display an address
            if (!shippingAddressId) {
                console.log('[STRIPE WEBHOOK] No shipping address in metadata, looking up customer default address for CustomerID:', customer.CustomerID);
                const addressResult = await pool.request()
                    .input('customerId', sql.Int, customer.CustomerID)
                    .query('SELECT AddressID FROM CustomerAddresses WHERE CustomerID = @customerId AND IsDefault = 1');
                
                if (addressResult.recordset.length > 0) {
                    shippingAddressId = addressResult.recordset[0].AddressID;
                    console.log('[STRIPE WEBHOOK] Found default shipping address ID:', shippingAddressId);
                } else {
                    console.log('[STRIPE WEBHOOK] No default shipping address found for customer');
                }
            }
            
            // Insert order
            const totalAmountFromCart = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalAmount = session.amount_total / 100; // More reliable total from Stripe

            console.log('[STRIPE WEBHOOK] Calculating total amount. From cart:', totalAmountFromCart, 'From Stripe:', totalAmount, 'for cart items:', cart);
            
            // Get Manila timezone date
            const manilaTime = getManilaTime();
            
            // Determine payment method from metadata
            const webhookPaymentMethod = metadata.paymentMethod || 'E-Wallet';
            // Map UI label to DB allowed values
            const paymentMethodToSave = webhookPaymentMethod === 'Online banking' ? 'Bank Transfer' : webhookPaymentMethod;

            // Convert pickup date if provided
            let pickupDateToSave = null;
            if (pickupDate) {
                try {
                    pickupDateToSave = new Date(pickupDate);
                } catch (e) {
                    console.log('[STRIPE WEBHOOK] Invalid pickup date format:', pickupDate);
                }
            }

            const orderResult = await pool.request()
                .input('customerId', sql.Int, customer.CustomerID)
                .input('status', sql.NVarChar, 'Pending')
                .input('totalAmount', sql.Decimal(10,2), totalAmount)
                .input('paymentMethod', sql.NVarChar, paymentMethodToSave)
                .input('currency', sql.NVarChar, 'PHP')
                .input('orderDate', sql.DateTime, manilaTime)
                .input('paymentDate', sql.DateTime, manilaTime)
                .input('shippingAddressId', sql.Int, shippingAddressId)
                .input('deliveryType', sql.NVarChar, deliveryType)
                .input('deliveryCost', sql.Decimal(10, 2), shippingCost)
                .input('stripeSessionId', sql.NVarChar, session.id)
                .input('paymentStatus', sql.NVarChar, 'Paid')
                .input('pickupDate', sql.DateTime, pickupDateToSave)
                .query(`INSERT INTO Orders (CustomerID, Status, TotalAmount, PaymentMethod, Currency, OrderDate, PaymentDate, ShippingAddressID, DeliveryType, DeliveryCost, StripeSessionID, PaymentStatus, PickupDate)
                        OUTPUT INSERTED.OrderID VALUES (@customerId, @status, @totalAmount, @paymentMethod, @currency, @orderDate, @paymentDate, @shippingAddressId, @deliveryType, @deliveryCost, @stripeSessionId, @paymentStatus, @pickupDate)`);
            const orderId = orderResult.recordset[0].OrderID;
            console.log('[STRIPE WEBHOOK] Order inserted successfully with OrderID:', orderId);
            // Insert order items
            for (const item of cart) {
                console.log('[STRIPE WEBHOOK] Processing order item:', item);
                // Find product by name (more reliable than ID for webhook data)
                let productResult;
                if (item.id && item.id !== 'shipping') {
                    console.log('[STRIPE WEBHOOK] Looking up product by ID:', item.id);
                    productResult = await pool.request()
                        .input('id', sql.Int, item.id)
                        .query('SELECT ProductID, Name FROM Products WHERE ProductID = @id');
                } else if (item.name && item.name !== 'Shipping') {
                    console.log('[STRIPE WEBHOOK] Looking up product by name:', item.name);
                    productResult = await pool.request()
                        .input('name', sql.NVarChar, item.name)
                        .query('SELECT ProductID, Name FROM Products WHERE Name = @name');
                } else {
                    console.log('[STRIPE WEBHOOK] Skipping shipping item or invalid item');
                    continue;
                }

                console.log('[STRIPE WEBHOOK] Product lookup result:', productResult.recordset);
                const product = productResult.recordset[0];
                if (!product) {
                    console.error('[STRIPE WEBHOOK] Product not found for item:', item);
                    // Try alternative search methods
                    if (item.name) {
                        console.log('[STRIPE WEBHOOK] Trying fuzzy name search for:', item.name);
                        productResult = await pool.request()
                            .input('name', sql.NVarChar, '%' + item.name + '%')
                            .query('SELECT ProductID, Name FROM Products WHERE Name LIKE @name');
                        const alternativeProduct = productResult.recordset[0];
                        if (alternativeProduct) {
                            console.log('[STRIPE WEBHOOK] Found product with fuzzy search:', alternativeProduct.Name);
                            product = alternativeProduct;
                        }
                    }
                }

                if (!product) {
                    console.error('[STRIPE WEBHOOK] Product not found for:', item);
                    continue;
                }

                console.log('[STRIPE WEBHOOK] Inserting order item for product:', product.Name);
                await pool.request()
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, product.ProductID)
                    .input('quantity', sql.Int, item.quantity)
                    .input('priceAtPurchase', sql.Decimal(10,2), item.price)
                    .query(`INSERT INTO OrderItems (OrderID, ProductID, Quantity, PriceAtPurchase)
                            VALUES (@orderId, @productId, @quantity, @priceAtPurchase)`);
                console.log('[STRIPE WEBHOOK] Order item inserted successfully for:', product.Name);
            }
            console.log('[STRIPE WEBHOOK] Order saved successfully for customer:', email, 'OrderID:', orderId);
        } catch (err) {
            console.error('[STRIPE WEBHOOK] Error saving order:', err);
            console.error('[STRIPE WEBHOOK] Error stack:', err.stack);
        }
    }
    res.status(200).send('Webhook received');
});

// --- All other middleware/routes ---
// CORS configuration for Railway deployment
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002', 
    'http://localhost:5000',
    process.env.FRONTEND_URL || 'https://designxcel-frontend.railway.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration for Railway deployment
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret_key_here',
    resave: false,
    saveUninitialized: false, // Set to false for best practice
    rolling: true, // Reset expiration on each request
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours session timeout
    }
}));

app.use(flash());

// Force UTF-8 encoding for all HTML responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

// Database configuration for Azure SQL
const dbConfig = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false, // Required for Azure SQL
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    requestTimeout: 30000,
    connectionTimeout: 30000
};

// Helper function to get Manila timezone date
function getManilaTime() {
    const now = new Date();
    // Get Manila time by adding 8 hours to UTC (Philippines is UTC+8)
    return new Date(now.getTime() + (8 * 60 * 60 * 1000));
}

// Database connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect()
    .then(() => {
        console.log('Connected to MSSQL database successfully');
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
    });

// Middleware to make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});


// Routes
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('EmpLogin/EmpLogin');
});

// Enhanced User Management Interface Route
app.get('/Employee/Admin/UserManagement', async (req, res) => {
    // Check if user is authenticated and has admin access
    if (!req.session.user || req.session.user.role !== 'Admin') {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/login');
    }
    
    try {
        res.render('admin/AdminUserManagement');
    } catch (error) {
        console.error('Error rendering user management page:', error);
        req.flash('error', 'Error loading user management page.');
        res.redirect('/Employee/AdminIndex');
    }
});




// --- OTP EMAIL ENDPOINTS ---
const nodemailer = require('nodemailer');
const otpStore = {};

// Helper to generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Invalid email.' });
    }
    const otp = generateOTP();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry
    try {
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.OTP_EMAIL_USER,
                pass: process.env.OTP_EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.OTP_EMAIL_USER,
            to: email,
            subject: 'Your DesignXcel OTP Code',
            text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`
        });
        res.json({ success: true, message: 'OTP sent to email.' });
    } catch (err) {
        console.error('Error sending OTP email:', err);
        res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP required.' });
    }
    const record = otpStore[email];
    if (!record || record.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (Date.now() > record.expires) {
        delete otpStore[email];
        return res.status(400).json({ success: false, message: 'OTP expired.' });
    }
    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified.' });
});

// Customer profile API endpoints
app.get('/api/customer/profile', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        await poolConnect;
        const customerId = req.session.user.id;
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('SELECT CustomerID, FullName, Email, PhoneNumber, Gender, ProfileImage FROM Customers WHERE CustomerID = @customerId');
        const customer = result.recordset[0];
        res.json({ success: true, customer });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
    }
});

// Get all orders for the currently logged-in customer
app.get('/api/customer/orders', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        await poolConnect;
        const customerId = req.session.user.id;
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(`SELECT OrderID, Status, TotalAmount, OrderDate, PaymentMethod FROM Orders WHERE CustomerID = @customerId ORDER BY OrderDate DESC`);
        res.json({ success: true, orders: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
    }
});

// Get orders by email (for webhook order retrieval without authentication)
app.get('/api/orders/by-email', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email parameter is required' });
        }

        await poolConnect;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT o.OrderID, o.Status, o.TotalAmount, o.OrderDate, o.PaymentMethod,
                       c.FullName, c.Email
                FROM Orders o
                INNER JOIN Customers c ON o.CustomerID = c.CustomerID
                WHERE c.Email = @email
                ORDER BY o.OrderDate DESC
            `);

        res.json({ success: true, orders: result.recordset });
    } catch (err) {
        console.error('Error fetching orders by email:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
    }
});

// Cancel an order for the currently logged-in customer
app.put('/api/customer/orders/:orderId/cancel', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        await poolConnect;
        const customerId = req.session.user.id;
        const orderId = parseInt(req.params.orderId);
        // Only allow cancelling if the order belongs to the customer and is not already cancelled
        const orderResult = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('customerId', sql.Int, customerId)
            .query('SELECT Status FROM Orders WHERE OrderID = @orderId AND CustomerID = @customerId');
        if (!orderResult.recordset.length) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        const order = orderResult.recordset[0];
        if (order.Status === 'Cancelled') {
            return res.json({ success: true, message: 'Order already cancelled.' });
        }
        await pool.request()
            .input('orderId', sql.Int, orderId)
            .query(`UPDATE Orders SET Status = 'Cancelled' WHERE OrderID = @orderId`);
        res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to cancel order', error: err.message });
    }
});

// Get all orders with items for the currently logged-in customer
app.get('/api/customer/orders-with-items', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        await poolConnect;
        const customerId = req.session.user.id;
        // Get user info
        const customerResult = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('SELECT CustomerID, FullName, Email, PhoneNumber FROM Customers WHERE CustomerID = @customerId');
        const customer = customerResult.recordset[0];
        // Get all orders with their per-order shipping address
        const ordersResult = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(`
                SELECT 
                    o.OrderID, o.Status, o.TotalAmount, o.OrderDate, o.PaymentMethod,
                    o.DeliveryType, o.DeliveryCost, o.ShippingAddressID,
                    a.Label AS AddressLabel, a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.PostalCode, a.Country
                FROM Orders o
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                WHERE o.CustomerID = @customerId
                ORDER BY o.OrderDate DESC
            `);
        const orders = ordersResult.recordset;
        if (!orders.length) return res.json({ success: true, orders: [] });
        // Get all order items for these orders (with product image)
        const orderIds = orders.map(o => o.OrderID);
        if (!orderIds.length) return res.json({ success: true, orders: [] });
        const orderItemsResult = await pool.request()
            .query(`SELECT oi.OrderID, oi.ProductID, oi.Quantity, oi.PriceAtPurchase, p.Name, p.ImageURL FROM OrderItems oi JOIN Products p ON oi.ProductID = p.ProductID WHERE oi.OrderID IN (${orderIds.join(',')})`);
        const itemsByOrder = {};
        for (const item of orderItemsResult.recordset) {
            if (!itemsByOrder[item.OrderID]) itemsByOrder[item.OrderID] = [];
            itemsByOrder[item.OrderID].push({
                name: item.Name,
                quantity: item.Quantity,
                price: item.PriceAtPurchase,
                image: item.ImageURL || null
            });
        }
        // Attach items, user, and per-order address to orders
        const ordersWithItems = orders.map(order => ({
            OrderID: order.OrderID,
            Status: order.Status,
            TotalAmount: order.TotalAmount,
            OrderDate: order.OrderDate,
            PaymentMethod: order.PaymentMethod,
            DeliveryType: order.DeliveryType,
            DeliveryCost: order.DeliveryCost,
            ShippingAddressID: order.ShippingAddressID,
            items: itemsByOrder[order.OrderID] || [],
            user: {
                fullName: customer.FullName,
                email: customer.Email,
                phoneNumber: customer.PhoneNumber
            },
            address: order.ShippingAddressID ? {
                Label: order.AddressLabel,
                HouseNumber: order.HouseNumber,
                Street: order.Street,
                Barangay: order.Barangay,
                City: order.City,
                Province: order.Province,
                PostalCode: order.PostalCode,
                Country: order.Country
            } : null
        }));
        res.json({ success: true, orders: ordersWithItems });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders with items', error: err.message });
    }
});

app.put('/api/customer/profile', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { fullName, email, phoneNumber, gender } = req.body;
        const customerId = req.session.user.id;
        await poolConnect;
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .input('phoneNumber', sql.NVarChar, phoneNumber)
            .input('gender', sql.NVarChar, gender)
            .query('UPDATE Customers SET FullName = @fullName, Email = @email, PhoneNumber = @phoneNumber, Gender = @gender WHERE CustomerID = @customerId');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
});

// Customer password change endpoint
app.put('/api/customer/change-password', async (req, res) => {
    try {
        console.log('[PASSWORD CHANGE] ===== PASSWORD CHANGE REQUEST =====');
        console.log('[PASSWORD CHANGE] Session ID:', req.sessionID);
        console.log('[PASSWORD CHANGE] Session user:', req.session.user);
        
        if (!req.session.user || req.session.user.role !== 'Customer') {
            console.log('[PASSWORD CHANGE] Unauthorized - no valid session');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - please log in first'
            });
        }
        
        const customerId = req.session.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }
        
        console.log('[PASSWORD CHANGE] Customer ID:', customerId);
        
        await poolConnect;
        
        // Get current password hash
        const customerResult = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('SELECT PasswordHash FROM Customers WHERE CustomerID = @customerId AND IsActive = 1');
        
        const customer = customerResult.recordset[0];
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Verify current password
        const currentPasswordMatch = await bcrypt.compare(currentPassword, customer.PasswordHash);
        if (!currentPasswordMatch) {
            console.log('[PASSWORD CHANGE] Current password verification failed');
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        
        // Update password in database
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('newPasswordHash', sql.NVarChar, newPasswordHash)
            .query('UPDATE Customers SET PasswordHash = @newPasswordHash WHERE CustomerID = @customerId');
        
        console.log('[PASSWORD CHANGE] Password updated successfully for customer:', customerId);
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
        
    } catch (err) {
        console.error('[PASSWORD CHANGE] Error changing password:', err);
        console.error('[PASSWORD CHANGE] Error stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password', 
            error: err.message 
        });
    }
});

// Test endpoint to check session status
app.get('/api/test/session', async (req, res) => {
    try {
        res.json({
            success: true,
            sessionID: req.sessionID,
            hasSession: !!req.session,
            sessionUser: req.session?.user,
            sessionCustomerData: req.session?.customerData,
            sessionKeys: req.session ? Object.keys(req.session) : []
        });
    } catch (err) {
        console.error('[SESSION TEST] Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Test endpoint to check database connection and table existence
app.get('/api/test/database', async (req, res) => {
    try {
        await poolConnect;
        
        // Test basic connection
        const testResult = await pool.request().query('SELECT 1 as test');
        console.log('[DB TEST] Basic connection test:', testResult.recordset);
        
        // Check if CustomerAddresses table exists
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CustomerAddresses'
        `);
        console.log('[DB TEST] CustomerAddresses table check:', tableCheck.recordset);
        
        // Check table structure
        const structureCheck = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CustomerAddresses'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('[DB TEST] CustomerAddresses structure:', structureCheck.recordset);
        
        res.json({ 
            success: true, 
            connection: 'OK',
            tableExists: tableCheck.recordset.length > 0,
            tableStructure: structureCheck.recordset
        });
    } catch (err) {
        console.error('[DB TEST] Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Customer addresses API endpoints
app.get('/api/customer/addresses', async (req, res) => {
    try {
        console.log('[ADDRESS GET] ===== STARTING ADDRESS FETCH =====');
        console.log('[ADDRESS GET] Session ID:', req.sessionID);
        console.log('[ADDRESS GET] Session user:', req.session.user);
        console.log('[ADDRESS GET] Session customerData:', req.session.customerData);
        console.log('[ADDRESS GET] Request headers:', req.headers);
        
        // Check for session in both user and customerData
        const hasUserSession = req.session.user && req.session.user.role === 'Customer';
        const hasCustomerSession = req.session.customerData && req.session.customerData.role === 'Customer';
        
        if (!hasUserSession && !hasCustomerSession) {
            console.log('[ADDRESS GET] Unauthorized - no valid session');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Please log in to view addresses',
                debug: {
                    hasSession: !!req.session,
                    hasUser: !!req.session.user,
                    hasCustomerData: !!req.session.customerData,
                    userRole: req.session.user?.role,
                    customerRole: req.session.customerData?.role,
                    sessionID: req.sessionID
                }
            });
        }
        
        await poolConnect;
        // Get customer ID from either session type
        const customerId = req.session.user?.id || req.session.customerData?.id;
        console.log('[ADDRESS GET] Customer ID:', customerId);
        
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('SELECT * FROM CustomerAddresses WHERE CustomerID = @customerId');
        
        console.log('[ADDRESS GET] Query result:', result.recordset);
        res.json({ success: true, addresses: result.recordset });
    } catch (err) {
        console.error('[ADDRESS GET] Error fetching addresses:', err);
        console.error('[ADDRESS GET] Error stack:', err.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch addresses', error: err.message });
    }
});

app.post('/api/customer/addresses', async (req, res) => {
    try {
        console.log('[ADDRESS API] ===== STARTING ADDRESS CREATION =====');
        console.log('[ADDRESS API] Session ID:', req.sessionID);
        console.log('[ADDRESS API] Session user:', req.session.user);
        console.log('[ADDRESS API] Session customerData:', req.session.customerData);
        console.log('[ADDRESS API] Request body:', req.body);
        console.log('[ADDRESS API] Request headers:', req.headers);
        
        // Check for session in both user and customerData
        const hasUserSession = req.session.user && req.session.user.role === 'Customer';
        const hasCustomerSession = req.session.customerData && req.session.customerData.role === 'Customer';
        
        if (!hasUserSession && !hasCustomerSession) {
            console.log('[ADDRESS API] Unauthorized - no valid session');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Please log in to add addresses',
                debug: {
                    hasSession: !!req.session,
                    hasUser: !!req.session.user,
                    hasCustomerData: !!req.session.customerData,
                    userRole: req.session.user?.role,
                    customerRole: req.session.customerData?.role,
                    sessionID: req.sessionID
                }
            });
        }
        
        // Get customer ID from either session type
        const customerId = req.session.user?.id || req.session.customerData?.id;
        const { label, houseNumber, street, barangay, city, province, region, postalCode, country, isDefault } = req.body;
        
        console.log('[ADDRESS API] Extracted data:', {
            customerId,
            label,
            houseNumber,
            street,
            barangay,
            city,
            province,
            region,
            postalCode,
            country,
            isDefault
        });
        
        await poolConnect;

        // Determine if this address should be default
        const existingCountResult = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('SELECT COUNT(1) AS Cnt, SUM(CASE WHEN IsDefault = 1 THEN 1 ELSE 0 END) AS DefaultCnt FROM CustomerAddresses WHERE CustomerID = @customerId');

        const existingCount = existingCountResult.recordset?.[0]?.Cnt || 0;
        const hasDefaultAlready = (existingCountResult.recordset?.[0]?.DefaultCnt || 0) > 0;
        const makeDefault = isDefault || existingCount === 0 || !hasDefaultAlready;

        // If setting as default, first set all existing addresses to non-default
        if (makeDefault) {
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerID = @customerId');
        }

        console.log('[ADDRESS API] About to execute INSERT query...');

        const insertResult = await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('label', sql.NVarChar, label)
            .input('houseNumber', sql.NVarChar, houseNumber)
            .input('street', sql.NVarChar, street)
            .input('barangay', sql.NVarChar, barangay)
            .input('city', sql.NVarChar, city)
            .input('province', sql.NVarChar, province)
            .input('region', sql.NVarChar, region)
            .input('postalCode', sql.NVarChar, postalCode)
            .input('country', sql.NVarChar, country || 'Philippines')
            .input('isDefault', sql.Bit, makeDefault ? 1 : 0)
            .query(`INSERT INTO CustomerAddresses (CustomerID, Label, HouseNumber, Street, Barangay, City, Province, Region, PostalCode, Country, IsDefault)
                    OUTPUT INSERTED.AddressID
                    VALUES (@customerId, @label, @houseNumber, @street, @barangay, @city, @province, @region, @postalCode, @country, @isDefault)`);

        const newAddressId = insertResult.recordset?.[0]?.AddressID || null;
        console.log('[ADDRESS API] INSERT query executed successfully! New AddressID:', newAddressId);

        res.json({ success: true, addressId: newAddressId, isDefault: makeDefault });
    } catch (err) {
        console.error('[ADDRESS API] Error adding address:', err);
        console.error('[ADDRESS API] Error stack:', err.stack);
        res.status(500).json({ success: false, message: 'Failed to add address', error: err.message });
    }
});

app.put('/api/customer/addresses/:addressId', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const customerId = req.session.user.id;
        const addressId = req.params.addressId;
        const { label, houseNumber, street, barangay, city, province, region, postalCode, country, isDefault } = req.body;
        await poolConnect;
        
        // If setting as default, first set all existing addresses to non-default
        if (isDefault) {
            await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerID = @customerId');
        }
        
        await pool.request()
            .input('addressId', sql.Int, addressId)
            .input('customerId', sql.Int, customerId)
            .input('label', sql.NVarChar, label)
            .input('houseNumber', sql.NVarChar, houseNumber)
            .input('street', sql.NVarChar, street)
            .input('barangay', sql.NVarChar, barangay)
            .input('city', sql.NVarChar, city)
            .input('province', sql.NVarChar, province)
            .input('region', sql.NVarChar, region)
            .input('postalCode', sql.NVarChar, postalCode)
            .input('country', sql.NVarChar, country || 'Philippines')
            .input('isDefault', sql.Bit, isDefault ? 1 : 0)
            .query(`UPDATE CustomerAddresses SET Label=@label, HouseNumber=@houseNumber, Street=@street, Barangay=@barangay, City=@city, Province=@province, Region=@region, PostalCode=@postalCode, Country=@country, IsDefault=@isDefault WHERE AddressID=@addressId AND CustomerID=@customerId`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update address', error: err.message });
    }
});

app.delete('/api/customer/addresses/:addressId', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const customerId = req.session.user.id;
        const addressId = req.params.addressId;
        await poolConnect;
        
        // Check if this is the default address
        const checkResult = await pool.request()
            .input('addressId', sql.Int, addressId)
            .input('customerId', sql.Int, customerId)
            .query('SELECT IsDefault FROM CustomerAddresses WHERE AddressID = @addressId AND CustomerID = @customerId');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        
        const isDefault = checkResult.recordset[0].IsDefault;
        
        // Delete the address
        await pool.request()
            .input('addressId', sql.Int, addressId)
            .input('customerId', sql.Int, customerId)
            .query('DELETE FROM CustomerAddresses WHERE AddressID = @addressId AND CustomerID = @customerId');
        
        // If this was the default address, set another address as default if available
        if (isDefault) {
            const remainingAddresses = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query('SELECT TOP 1 AddressID FROM CustomerAddresses WHERE CustomerID = @customerId ORDER BY CreatedAt ASC');
            
            if (remainingAddresses.recordset.length > 0) {
                await pool.request()
                    .input('addressId', sql.Int, remainingAddresses.recordset[0].AddressID)
                    .input('customerId', sql.Int, customerId)
                    .query('UPDATE CustomerAddresses SET IsDefault = 1 WHERE AddressID = @addressId AND CustomerID = @customerId');
            }
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete address', error: err.message });
    }
});

// Customer profile image upload endpoints
app.post('/api/customer/upload-profile-image', upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const customerId = req.session.user.id;
        const imageUrl = `/uploads/profile-images/${req.file.filename}`;

        await poolConnect;
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('profileImage', sql.NVarChar, imageUrl)
            .query('UPDATE Customers SET ProfileImage = @profileImage WHERE CustomerID = @customerId');

        res.json({ success: true, imageUrl });
    } catch (err) {
        console.error('Profile image upload error:', err);
        res.status(500).json({ success: false, message: 'Failed to upload profile image', error: err.message });
    }
});

app.delete('/api/customer/remove-profile-image', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const customerId = req.session.user.id;

        await poolConnect;
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('UPDATE Customers SET ProfileImage = NULL WHERE CustomerID = @customerId');

        res.json({ success: true });
    } catch (err) {
        console.error('Remove profile image error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove profile image', error: err.message });
    }
});

// Employee/Admin profile API endpoints
app.get('/api/user/profile', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role === 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // For demo, just return session user info
        const { id, username, fullName, email, role } = req.session.user;
        res.json({ success: true, user: { id, username, fullName, email, role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
    }
});

app.put('/api/user/profile', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role === 'Customer') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { fullName, email } = req.body;
        const userId = req.session.user.id;
        await poolConnect;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET FullName = @fullName, Email = @email WHERE UserID = @userId');
        // Update session
        req.session.user.fullName = fullName;
        req.session.user.email = email;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
});

// Logout routes
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Enhanced Role-Based Authentication System
// All routes are now consolidated in routes.js

// Make database connection available to middleware
app.locals.pool = pool;
app.locals.sql = sql;

// Mount the consolidated routes
const employeeRoutes = require('./routes')(sql, pool);
const apiRoutes = require('./api-routes')(sql, pool);

app.use('/', employeeRoutes);
app.use('/', apiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// --- Products API for Frontend ---
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
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
            ORDER BY IsFeatured DESC, DateAdded DESC
        `);
        
        // Process images - convert single image URL to array
        const products = result.recordset.map(product => ({
            ...product,
            images: product.images ? [product.images] : [],
            specifications: product.specifications ? JSON.parse(product.specifications) : {}
        }));
        
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

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        await poolConnect;
        
        const result = await pool.request()
            .input('productId', sql.Int, productId)
            .query(`
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
                WHERE ProductID = @productId AND IsActive = 1
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        const product = result.recordset[0];
        
        // Process images - convert single image URL to array
        product.images = product.images ? [product.images] : [];
        product.specifications = product.specifications ? JSON.parse(product.specifications) : {};
        
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

// Stripe Payment Routes
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items, email, paymentMethod, deliveryType, pickupDate, shippingCost, shippingAddressId } = req.body;

        console.log('Received checkout session request:', {
            items,
            email,
            paymentMethod,
            deliveryType,
            pickupDate,
            shippingCost,
            shippingAddressId
        });
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('No items provided in request');
            return res.status(400).json({ error: 'No items provided' });
        }
        
        const line_items = items.map(item => ({
            price_data: {
                currency: 'php',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));
        
        console.log('Created line items for Stripe:', line_items);
        
        // Build session params
        const sessionParams = {
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/payment?cancelled=true`,
            metadata: {
                cart: JSON.stringify(items),
                paymentMethod: paymentMethod || 'E-Wallet',
                deliveryType: deliveryType || 'pickup',
                pickupDate: pickupDate || '',
                shippingCost: String(typeof shippingCost === 'number' ? shippingCost : 0),
                shippingAddressId: shippingAddressId ? String(shippingAddressId) : ''
            },
        };
        
        if (email && typeof email === 'string' && email.includes('@')) {
            sessionParams.customer_email = email;
            console.log('Adding customer email to session:', email);
        } else {
            console.log('No valid email provided, session will not have customer_email');
        }
        
        console.log('Creating Stripe session with params:', sessionParams);
        
        const session = await stripe.checkout.sessions.create(sessionParams);
        console.log('Stripe session created successfully:', session.id);
        
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session', message: error.message });
    }
});

app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        
        // Retrieve the payment intent to confirm it was successful
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Here you would typically save the order to your database
            res.json({ 
                success: true, 
                message: 'Payment successful',
                paymentIntent: paymentIntent
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Payment failed',
                status: paymentIntent.status
            });
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ 
            error: 'Failed to confirm payment',
            message: error.message 
        });
    }
});

// Test endpoint to simulate webhook locally (for development only)
app.post('/api/test-webhook', async (req, res) => {
    console.log('[TEST WEBHOOK] Simulating webhook call');
    
    // Simulate the webhook event data
    const mockEvent = {
        type: 'checkout.session.completed',
        data: {
            object: {
                id: req.body.sessionId || 'cs_test_' + Date.now(),
                customer_email: req.body.email || 'augmentdoe@gmail.com',
                metadata: {
                    cart: JSON.stringify(req.body.items || []),
                    paymentMethod: req.body.paymentMethod || 'E-Wallet',
                    deliveryType: req.body.deliveryType || 'pickup',
                    shippingCost: req.body.shippingCost || '0',
                    shippingAddressId: req.body.shippingAddressId || ''
                },
                amount_total: req.body.total || 2000,
                currency: 'php'
            }
        }
    };
    
    console.log('[TEST WEBHOOK] Mock event data:', mockEvent);
    
    // Process the mock event
    if (mockEvent.type === 'checkout.session.completed') {
        const session = mockEvent.data.object;
        const email = session.customer_email;
        let cart = [];
        
        // Parse cart from metadata
        try {
            if (session.metadata && session.metadata.cart) {
                cart = JSON.parse(session.metadata.cart);
                console.log('[TEST WEBHOOK] Successfully parsed cart from metadata:', cart);
            } else {
                console.error('[TEST WEBHOOK] No cart metadata found in session:', session.metadata);
            }
        } catch (e) {
            console.error('[TEST WEBHOOK] Failed to parse cart metadata:', e);
        }
        
        // Log received data
        console.log('[TEST WEBHOOK] Received checkout.session.completed:', {
            email,
            cart,
            sessionId: session.id,
            amount_total: session.amount_total,
            currency: session.currency
        });
        
        // Save order to database
        try {
            await poolConnect;
            console.log('[TEST WEBHOOK] Database connected successfully');
            
            // Check if order already exists with this session ID to prevent duplicates
            const existingOrderResult = await pool.request()
                .input('sessionId', sql.NVarChar, session.id)
                .query('SELECT OrderID FROM Orders WHERE StripeSessionID = @sessionId');
            
            if (existingOrderResult.recordset.length > 0) {
                console.log('[TEST WEBHOOK] Order already exists with session ID:', session.id);
                return res.status(200).json({ 
                    success: true, 
                    orderId: existingOrderResult.recordset[0].OrderID,
                    message: 'Order already exists' 
                });
            }
            
            // Find customer by email
            if (!email) {
                console.error('[TEST WEBHOOK] No customer email provided. Order not saved.');
                return res.status(200).json({ success: false, message: 'No customer email, order not saved' });
            }
            
            console.log('[TEST WEBHOOK] Looking up customer with email:', email);
            const customerResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT CustomerID, FullName FROM Customers WHERE Email = @email');
            
            console.log('[TEST WEBHOOK] Customer lookup result:', customerResult.recordset);
            const customer = customerResult.recordset[0];
            if (!customer) {
                console.error('[TEST WEBHOOK] Customer not found for email:', email);
                return res.status(200).json({ success: false, message: 'Customer not found, order not saved' });
            }
            
            console.log('[TEST WEBHOOK] Found customer:', customer);
            if (!Array.isArray(cart) || cart.length === 0) {
                console.error('[TEST WEBHOOK] Cart is empty or malformed. Order not saved.');
                return res.status(200).json({ success: false, message: 'Cart is empty or malformed, order not saved' });
            }
            
            // Get customer's default shipping address
            console.log('[TEST WEBHOOK] Looking up customer default address for CustomerID:', customer.CustomerID);
            const addressResult = await pool.request()
                .input('customerId', sql.Int, customer.CustomerID)
                .query('SELECT AddressID FROM CustomerAddresses WHERE CustomerID = @customerId AND IsDefault = 1');
            
            let shippingAddressId = null;
            if (addressResult.recordset.length > 0) {
                shippingAddressId = addressResult.recordset[0].AddressID;
                console.log('[TEST WEBHOOK] Found default shipping address ID:', shippingAddressId);
            } else {
                console.log('[TEST WEBHOOK] No default shipping address found for customer');
            }
            
            // Insert order
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            console.log('[TEST WEBHOOK] Calculating total amount:', totalAmount, 'for cart items:', cart);
            
            // Get Manila timezone date
            const manilaTime = getManilaTime();
            
            // Determine payment method from metadata
            const webhookPaymentMethod = session.metadata?.paymentMethod || 'E-Wallet';
            const paymentMethodToSave = webhookPaymentMethod === 'Online banking' ? 'Bank Transfer' : webhookPaymentMethod;

            const orderResult = await pool.request()
                .input('customerId', sql.Int, customer.CustomerID)
                .input('status', sql.NVarChar, 'Pending')
                .input('totalAmount', sql.Decimal(10,2), totalAmount)
                .input('paymentMethod', sql.NVarChar, paymentMethodToSave)
                .input('currency', sql.NVarChar, 'PHP')
                .input('orderDate', sql.DateTime, manilaTime)
                .input('paymentDate', sql.DateTime, manilaTime)
                .input('shippingAddressId', sql.Int, shippingAddressId)
                .input('deliveryType', sql.NVarChar, session.metadata?.deliveryType || 'pickup')
                .input('deliveryCost', sql.Decimal(10, 2), parseFloat(session.metadata?.shippingCost) || 0)
                .input('stripeSessionId', sql.NVarChar, session.id)
                .input('paymentStatus', sql.NVarChar, 'Paid')
                .input('pickupDate', sql.DateTime, null)
                .query(`INSERT INTO Orders (CustomerID, Status, TotalAmount, PaymentMethod, Currency, OrderDate, PaymentDate, ShippingAddressID, DeliveryType, DeliveryCost, StripeSessionID, PaymentStatus, PickupDate)
                        OUTPUT INSERTED.OrderID VALUES (@customerId, @status, @totalAmount, @paymentMethod, @currency, @orderDate, @paymentDate, @shippingAddressId, @deliveryType, @deliveryCost, @stripeSessionId, @paymentStatus, @pickupDate)`);
            
            const orderId = orderResult.recordset[0].OrderID;
            console.log('[TEST WEBHOOK] Order inserted successfully with OrderID:', orderId);
            
            // Insert order items
            for (const item of cart) {
                console.log('[TEST WEBHOOK] Processing order item:', item);
                
                // Find product by name (or use item.id if available)
                let productResult;
                if (item.id) {
                    console.log('[TEST WEBHOOK] Looking up product by ID:', item.id);
                    productResult = await pool.request()
                        .input('id', sql.Int, item.id)
                        .query('SELECT ProductID, Name FROM Products WHERE ProductID = @id');
                } else {
                    console.log('[TEST WEBHOOK] Looking up product by name:', item.name);
                    productResult = await pool.request()
                        .input('name', sql.NVarChar, item.name)
                        .query('SELECT ProductID, Name FROM Products WHERE Name = @name');
                }
                
                console.log('[TEST WEBHOOK] Product lookup result:', productResult.recordset);
                
                const product = productResult.recordset[0];
                if (!product) {
                    console.error('[TEST WEBHOOK] Product not found for:', item);
                    continue;
                }
                
                console.log('[TEST WEBHOOK] Inserting order item for product:', product.Name);
                await pool.request()
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, product.ProductID)
                    .input('quantity', sql.Int, item.quantity)
                    .input('priceAtPurchase', sql.Decimal(10,2), item.price)
                    .query(`INSERT INTO OrderItems (OrderID, ProductID, Quantity, PriceAtPurchase)
                            VALUES (@orderId, @productId, @quantity, @priceAtPurchase)`);
                
                console.log('[TEST WEBHOOK] Order item inserted successfully');
            }
            
            console.log('[TEST WEBHOOK] Order saved successfully for customer:', email, 'OrderID:', orderId);
            res.json({ success: true, orderId, message: 'Order saved successfully' });
            
        } catch (err) {
            console.error('[TEST WEBHOOK] Error saving order:', err);
            console.error('[TEST WEBHOOK] Error stack:', err.stack);
            res.status(500).json({ success: false, error: 'Failed to save order', details: err.message });
        }
    } else {
        res.json({ success: false, message: 'Not a checkout.session.completed event' });
    }
});

// Get checkout session details
app.get('/api/checkout-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        res.json({
            success: true,
            session: session
        });
    } catch (error) {
        console.error('Error retrieving checkout session:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve checkout session',
            message: error.message 
        });
    }
});

// Get order details by Stripe session ID
app.get('/api/order/stripe-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        await poolConnect;
        const result = await pool.request()
            .input('sessionId', sql.NVarChar, sessionId)
            .query(`
                SELECT o.*, c.FullName, c.Email,
                       a.HouseNumber, a.Street, a.Barangay, a.City, a.Province, a.PostalCode, a.Country, a.PhoneNumber
                FROM Orders o
                INNER JOIN Customers c ON o.CustomerID = c.CustomerID
                LEFT JOIN CustomerAddresses a ON o.ShippingAddressID = a.AddressID
                WHERE o.StripeSessionID = @sessionId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found for this session'
            });
        }
        
        const order = result.recordset[0];
        
        // Get order items
        const itemsResult = await pool.request()
            .input('orderId', sql.Int, order.OrderID)
            .query(`
                SELECT oi.*, p.Name, p.ImageURL
                FROM OrderItems oi
                INNER JOIN Products p ON oi.ProductID = p.ProductID
                WHERE oi.OrderID = @orderId
            `);
        
        order.items = itemsResult.recordset;
        
        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error('Error retrieving order by session ID:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve order',
            message: error.message 
        });
    }
});

// Public API endpoint for delivery rates
app.get('/api/public/delivery-rates', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT RateID, ServiceType, Price, CreatedAt, IsActive
            FROM DeliveryRates 
            WHERE IsActive = 1
            ORDER BY Price ASC
        `);
        
        res.json({
            success: true,
            deliveryRates: result.recordset
        });
    } catch (error) {
        console.error('Error fetching delivery rates:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch delivery rates',
            message: error.message 
        });
    }
});

// API endpoint for admin to check payment status
app.get('/api/admin/payment-status/:orderId', async (req, res) => {
    try {
        if (!req.session.user || (req.session.user.role !== 'Admin' && req.session.user.role !== 'InventoryManager')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const { orderId } = req.params;
        
        await poolConnect;
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT OrderID, PaymentMethod, PaymentStatus, StripeSessionID, TotalAmount, OrderDate, PaymentDate
                FROM Orders 
                WHERE OrderID = @orderId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const order = result.recordset[0];
        
        // If it's a Stripe order, get additional details
        if (order.StripeSessionID) {
            try {
                const session = await stripe.checkout.sessions.retrieve(order.StripeSessionID);
                order.stripeDetails = {
                    payment_status: session.payment_status,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    customer_email: session.customer_email
                };
            } catch (stripeError) {
                console.error('Error retrieving Stripe session:', stripeError);
                order.stripeDetails = { error: 'Unable to retrieve Stripe details' };
            }
        }
        
        res.json({
            success: true,
            paymentDetails: order
        });
    } catch (error) {
        console.error('Error retrieving payment status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve payment status',
            message: error.message 
        });
    }
});
const sql = require('mssql');

/**
 * Permission checking middleware
 * Checks if the current user has permission to access a specific section/feature
 */
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            console.log(`🔒 Permission Check: ${requiredPermission}`);
            console.log(`   Session user:`, req.session.user);
            console.log(`   User role:`, req.session.user?.role);
            console.log(`   User ID:`, req.session.user?.id);
            
            // Skip permission check for Admin users (they have all permissions)
            if (req.session.user && req.session.user.role === 'Admin') {
                console.log(`   ✅ Admin user - bypassing permission check`);
                return next();
            }

            // Check if user is authenticated
            if (!req.session.user || !req.session.user.id) {
                console.log(`   ❌ No authenticated user`);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
            }

            const userId = req.session.user.id;
            console.log(`   Checking permission for UserID: ${userId}`);

            // Get the pool from the request (passed from routes.js)
            const pool = req.app.locals.pool;
            if (!pool) {
                console.log(`   ❌ Database pool not available`);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database connection not available' 
                });
            }

            // Connect to database
            await pool.connect();

            // Check if user has the required permission
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('permissionName', sql.NVarChar, requiredPermission)
                .query(`
                    SELECT CanAccess 
                    FROM UserPermissions 
                    WHERE UserID = @userId AND PermissionName = @permissionName
                `);

            const hasPermission = result.recordset.length > 0 && result.recordset[0].CanAccess === true;
            console.log(`   Query result: ${result.recordset.length} rows`);
            console.log(`   CanAccess: ${result.recordset[0]?.CanAccess}`);
            console.log(`   hasPermission: ${hasPermission}`);

            if (!hasPermission) {
                console.log(`   ❌ Access denied - redirecting to forbidden page`);
                // For web requests, redirect to forbidden page
                if (req.accepts('html')) {
                    return res.redirect('/Employee/Forbidden');
                }
                
                // For API requests, return JSON error
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied. You do not have permission to access this resource.' 
                });
            }

            console.log(`   ✅ Access granted - continuing to next middleware`);
            // User has permission, continue to next middleware
            next();

        } catch (error) {
            console.error('❌ Permission check error:', error);
            console.error('   Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            // On error, for web requests redirect to forbidden page
            if (req.accepts('html')) {
                console.log('   Redirecting to forbidden page due to error');
                return res.redirect('/Employee/Forbidden');
            }
            
            // For API requests, return JSON error
            return res.status(500).json({ 
                success: false, 
                message: 'Error checking permissions' 
            });
        }
    };
};

/**
 * Multiple permission checking middleware
 * Checks if the current user has ANY of the specified permissions
 */
const checkAnyPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Skip permission check for Admin users (they have all permissions)
            if (req.session.user && req.session.user.role === 'Admin') {
                return next();
            }

            // Check if user is authenticated
            if (!req.session.user || !req.session.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.session.user.id;

            // Get the pool from the request (passed from routes.js)
            const pool = req.app.locals.pool;
            if (!pool) {
                return res.status(500).json({
                    success: false,
                    message: 'Database connection not available'
                });
            }

            // Connect to database
            await pool.connect();

            // Check if user has any of the required permissions
            const permissionList = requiredPermissions.map(p => `'${p}'`).join(',');
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT COUNT(*) as permissionCount
                    FROM UserPermissions
                    WHERE UserID = @userId
                    AND PermissionName IN (${permissionList})
                    AND CanAccess = 1
                `);

            const hasAnyPermission = result.recordset[0].permissionCount > 0;

            if (!hasAnyPermission) {
                // For web requests, redirect to forbidden page
                if (req.accepts('html')) {
                    return res.redirect('/Employee/Forbidden');
                }

                // For API requests, return JSON error
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You do not have permission to access this resource.'
                });
            }

            // User has permission, continue to next middleware
            next();

        } catch (error) {
            console.error('Permission check error:', error);
            
            // On error, for web requests redirect to forbidden page
            if (req.accepts('html')) {
                return res.redirect('/Employee/Forbidden');
            }
            
            // For API requests, return JSON error
            return res.status(500).json({ 
                success: false, 
                message: 'Error checking permissions' 
            });
        }
    };
};

module.exports = {
    checkPermission,
    checkAnyPermission
};

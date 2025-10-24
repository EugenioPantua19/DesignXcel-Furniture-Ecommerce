const jwtUtils = require('../utils/jwtUtils');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and sets user data in request
 */
const jwtAuth = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token required',
                code: 'MISSING_TOKEN'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the token
        const decoded = jwtUtils.verifyToken(token);

        // Set user data in request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            type: decoded.type,
            fullName: decoded.fullName
        };

        // Set token info for potential use
        req.token = {
            token,
            expiresAt: jwtUtils.getTokenExpiration(token),
            issuedAt: new Date(decoded.iat * 1000)
        };

        next();
    } catch (error) {
        console.error('JWT Authentication Error:', error.message);
        
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                code: 'TOKEN_EXPIRED',
                requiresRefresh: true
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token',
                code: 'INVALID_TOKEN'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed',
                code: 'AUTH_FAILED'
            });
        }
    }
};

/**
 * Optional JWT Authentication Middleware
 * Tries to authenticate with JWT but doesn't fail if no token provided
 */
const optionalJwtAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwtUtils.verifyToken(token);

        // Set user data if token is valid
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            type: decoded.type,
            fullName: decoded.fullName
        };

        req.token = {
            token,
            expiresAt: jwtUtils.getTokenExpiration(token),
            issuedAt: new Date(decoded.iat * 1000)
        };

        next();
    } catch (error) {
        // Token is invalid, but continue without authentication
        console.warn('Optional JWT Auth failed:', error.message);
        next();
    }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) allowed to access
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: roles,
                current: userRole
            });
        }

        next();
    };
};

/**
 * User type authorization middleware
 * @param {string|Array} allowedTypes - User type(s) allowed to access
 */
const requireUserType = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userType = req.user.type;
        const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

        if (!types.includes(userType)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid user type',
                code: 'INVALID_USER_TYPE',
                required: types,
                current: userType
            });
        }

        next();
    };
};

module.exports = {
    jwtAuth,
    optionalJwtAuth,
    requireRole,
    requireUserType
};

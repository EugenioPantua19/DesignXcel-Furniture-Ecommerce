const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        this.accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d';
        this.refreshTokenExpiryDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS) || 7;
    }

    /**
     * Generate JWT access token
     * @param {Object} payload - User data to include in token
     * @returns {string} JWT access token
     */
    generateAccessToken(payload) {
        const tokenPayload = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            type: payload.type,
            fullName: payload.fullName,
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(tokenPayload, this.jwtSecret, {
            expiresIn: this.accessTokenExpiry,
            issuer: 'designxcel',
            audience: 'designxcel-users'
        });
    }

    /**
     * Generate JWT refresh token
     * @param {Object} payload - User data to include in token
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(payload) {
        const tokenPayload = {
            id: payload.id,
            email: payload.email,
            type: payload.type,
            tokenType: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(tokenPayload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'designxcel',
            audience: 'designxcel-users'
        });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @returns {Object} Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'designxcel',
                audience: 'designxcel-users'
            });
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    /**
     * Decode JWT token without verification (for debugging)
     * @param {string} token - JWT token to decode
     * @returns {Object} Decoded token payload
     */
    decodeToken(token) {
        return jwt.decode(token);
    }

    /**
     * Generate token pair (access + refresh)
     * @param {Object} userData - User data
     * @returns {Object} Object containing access and refresh tokens
     */
    generateTokenPair(userData) {
        const accessToken = this.generateAccessToken(userData);
        const refreshToken = this.generateRefreshToken(userData);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.accessTokenExpiry
        };
    }

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Valid refresh token
     * @param {Object} userData - Current user data
     * @returns {Object} New access token
     */
    refreshAccessToken(refreshToken, userData) {
        try {
            const decoded = this.verifyToken(refreshToken);
            
            if (decoded.tokenType !== 'refresh') {
                throw new Error('Invalid token type');
            }

            return this.generateAccessToken(userData);
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    /**
     * Generate a secure random token for database storage
     * @returns {string} Random hex token
     */
    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Check if token is expired
     * @param {string} token - JWT token
     * @returns {boolean} True if expired
     */
    isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    /**
     * Get token expiration time
     * @param {string} token - JWT token
     * @returns {Date|null} Expiration date or null if invalid
     */
    getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            return new Date(decoded.exp * 1000);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new JWTUtils();

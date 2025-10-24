/**
 * Environment Configuration Manager
 * Handles environment-specific configurations for the DesignXcel application
 */

const path = require('path');
const fs = require('fs');

class ConfigManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration based on environment
   */
  loadConfiguration() {
    const configPath = path.join(__dirname, 'config', `${this.environment}.json`);
    
    // Default configuration
    let config = {
      environment: this.environment,
      database: this.getDatabaseConfig(),
      server: this.getServerConfig(),
      security: this.getSecurityConfig(),
      features: this.getFeatureConfig(),
      logging: this.getLoggingConfig()
    };

    // Load environment-specific config if exists
    if (fs.existsSync(configPath)) {
      try {
        const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { ...config, ...envConfig };
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error.message);
      }
    }

    return config;
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      connectionString: process.env.DB_CONNECTION_STRING,
      server: process.env.DB_SERVER || 'DESKTOP-F4OI6BT\\SQLEXPRESS',
      username: process.env.DB_USERNAME || 'DesignXcel',
      password: process.env.DB_PASSWORD || 'Azwrathfrozen22@',
      database: process.env.DB_DATABASE || 'DesignXcellDB',
      options: {
        encrypt: false, // Disable encryption for local development
        trustServerCertificate: true, // Trust server certificate for local development
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
      },
      pool: {
        max: 10, // Reduced pool size for local development
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return {
      port: parseInt(process.env.PORT) || 5000,
      host: process.env.HOST || '0.0.0.0',
      cors: {
        origin: this.getCorsOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
      },
      session: {
        secret: process.env.SESSION_SECRET || 'default_session_secret',
        resave: false,
        saveUninitialized: false,
        rolling: false,
        cookie: {
          httpOnly: true,
          secure: false, // Use false for local development
          sameSite: 'lax', // Use 'lax' for local development
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
      }
    };
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      jwt: {
        secret: process.env.JWT_SECRET || 'default_jwt_secret',
        expiresIn: '24h',
        algorithm: 'HS256'
      },
      bcrypt: {
        saltRounds: 12
      },
      helmet: {
        enabled: false, // Disabled for local development
        options: {
          contentSecurityPolicy: false,
          hsts: false
        }
      },
      rateLimit: {
        enabled: false, // Disabled for local development
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000 // requests per window
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        currency: 'php'
      }
    };
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig() {
    return {
      email: {
        enabled: !!process.env.OTP_EMAIL_USER,
        user: process.env.OTP_EMAIL_USER,
        pass: process.env.OTP_EMAIL_PASS,
        service: 'gmail'
      },
      monitoring: {
        enabled: process.env.ENABLE_MONITORING === 'true',
        logLevel: process.env.LOG_LEVEL || 'info'
      },
      debug: {
        enabled: process.env.DEBUG === 'true' || this.environment === 'development'
      }
    };
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return {
      level: process.env.LOG_LEVEL || 'debug', // Use debug for local development
      file: {
        enabled: false, // Disabled for local development
        path: process.env.LOG_FILE_PATH || './logs/app.log',
        errorPath: process.env.ERROR_LOG_PATH || './logs/error.log',
        maxSize: '10MB',
        maxFiles: 5
      },
      console: {
        enabled: true,
        colorize: true // Enable colorized output for local development
      }
    };
  }

  /**
   * Get CORS origins based on environment
   */
  getCorsOrigins() {
    const frontendUrl = process.env.FRONTEND_URL;
    
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://localhost:3000',
      frontendUrl
    ].filter(Boolean);
  }

  /**
   * Get configuration value by key path
   */
  get(keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}.enabled`, false);
  }

  /**
   * Get environment-specific value
   */
  getEnvironmentValue(key, devValue, prodValue) {
    return this.environment === 'production' ? prodValue : devValue;
  }

  /**
   * Validate required configuration
   */
  validate() {
    const required = [
      'security.jwt.secret'
    ];

    const missing = [];
    
    for (const key of required) {
      if (!this.get(key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      console.warn(`Missing recommended configuration: ${missing.join(', ')}`);
      console.warn('Application will use default values for missing configuration');
    }

    return true;
  }

  /**
   * Get all configuration (for debugging)
   */
  getAll() {
    return this.config;
  }
}

module.exports = new ConfigManager();

/**
 * Email Template Service
 * Centralized service for managing and loading email templates
 */

const fs = require('fs');
const path = require('path');

class EmailTemplateService {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates', 'emails');
    }

    /**
     * Load an email template
     * @param {string} category - Template category (auth, notifications, orders)
     * @param {string} templateName - Template filename
     * @returns {string} Template HTML content
     */
    loadTemplate(category, templateName) {
        try {
            const templatePath = path.join(this.templatesDir, category, templateName);
            return fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error(`Error loading template ${category}/${templateName}:`, error.message);
            return this.getFallbackTemplate(category, templateName);
        }
    }

    /**
     * Replace placeholders in template
     * @param {string} template - Template HTML content
     * @param {object} data - Data object with placeholder values
     * @returns {string} Processed template
     */
    replacePlaceholders(template, data) {
        let processedTemplate = template;
        
        // Replace all placeholders in format {{PLACEHOLDER}}
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key.toUpperCase()}}}`;
            const value = data[key] || '';
            processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return processedTemplate;
    }

    /**
     * Get fallback template when main template fails to load
     * @param {string} category - Template category
     * @param {string} templateName - Template name
     * @returns {string} Fallback template HTML
     */
    getFallbackTemplate(category, templateName) {
        const fallbackTemplates = {
            'auth': {
                'otp-email.html': `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #F0B21B;">Design Excellence</h2>
                        <h3>Your OTP Code</h3>
                        <p>Your verification code is: <strong style="font-size: 24px; color: #1f2937;">{{OTP_CODE}}</strong></p>
                        <p>This code is valid for 5 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
                'password-reset-email.html': `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #F0B21B;">Design Excellence</h2>
                        <h3>Password Reset Request</h3>
                        <p>Hello {{USER_NAME}},</p>
                        <p>You requested to reset your password. Click the link below to reset your password:</p>
                        <p><a href="{{RESET_LINK}}" style="background-color: #F0B21B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            },
            'notifications': {
                'default.html': `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #F0B21B;">Design Excellence</h2>
                        <h3>Notification</h3>
                        <p>{{MESSAGE}}</p>
                    </div>
                `
            },
            'orders': {
                'default.html': `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #F0B21B;">Design Excellence</h2>
                        <h3>Order Update</h3>
                        <p>{{MESSAGE}}</p>
                    </div>
                `
            }
        };

        return fallbackTemplates[category]?.[templateName] || fallbackTemplates['notifications']['default.html'];
    }

    /**
     * Get available templates
     * @returns {object} Object with available templates by category
     */
    getAvailableTemplates() {
        const templates = {};
        
        try {
            const categories = fs.readdirSync(this.templatesDir);
            
            categories.forEach(category => {
                const categoryPath = path.join(this.templatesDir, category);
                if (fs.statSync(categoryPath).isDirectory()) {
                    templates[category] = fs.readdirSync(categoryPath)
                        .filter(file => file.endsWith('.html'));
                }
            });
        } catch (error) {
            console.error('Error reading templates directory:', error.message);
        }
        
        return templates;
    }

    /**
     * Validate template placeholders
     * @param {string} template - Template HTML content
     * @param {object} data - Data object
     * @returns {object} Validation result
     */
    validateTemplate(template, data) {
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const placeholders = [];
        let match;
        
        while ((match = placeholderRegex.exec(template)) !== null) {
            placeholders.push(match[1].toUpperCase());
        }
        
        const missingPlaceholders = placeholders.filter(placeholder => 
            !data.hasOwnProperty(placeholder.toLowerCase())
        );
        
        return {
            isValid: missingPlaceholders.length === 0,
            placeholders: placeholders,
            missingPlaceholders: missingPlaceholders,
            providedData: Object.keys(data)
        };
    }

    /**
     * Get template metadata
     * @param {string} category - Template category
     * @param {string} templateName - Template name
     * @returns {object} Template metadata
     */
    getTemplateMetadata(category, templateName) {
        const template = this.loadTemplate(category, templateName);
        const validation = this.validateTemplate(template, {});
        
        return {
            category,
            name: templateName,
            path: path.join(this.templatesDir, category, templateName),
            placeholders: validation.placeholders,
            size: template.length,
            lastModified: fs.statSync(path.join(this.templatesDir, category, templateName)).mtime
        };
    }
}

// Export singleton instance
module.exports = new EmailTemplateService();

// SendGrid Email Helper
// This module handles all email sending via SendGrid API (works on Railway)
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Initialize SendGrid with API key
const initializeSendGrid = () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
        console.error('❌ SENDGRID_API_KEY not found in environment variables');
        return false;
    }
    
    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid initialized successfully');
    return true;
};

/**
 * Send OTP email via SendGrid
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - The OTP code to send
 * @returns {Promise<{success: boolean, message: string, messageId?: string}>}
 */
const sendOtpEmail = async (toEmail, otp) => {
    try {
        // Check if SendGrid is configured
        if (!process.env.SENDGRID_API_KEY) {
            console.log('📧 SendGrid not configured. OTP for development:', otp);
            return {
                success: true,
                message: 'OTP generated (SendGrid not configured)',
                development: true,
                otp: process.env.NODE_ENV === 'development' ? otp : undefined
            };
        }

        // Initialize SendGrid
        if (!initializeSendGrid()) {
            throw new Error('SendGrid initialization failed');
        }

        // Get sender email
        const fromEmail = process.env.OTP_EMAIL_USER || 'design.xcel01@gmail.com';

        // Read HTML template
        const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'auth', 'otp-email.html');
        let htmlTemplate = '';
        
        try {
            htmlTemplate = fs.readFileSync(templatePath, 'utf8');
        } catch (err) {
            console.log('⚠️ Using fallback template');
            htmlTemplate = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your OTP Code - Design Excellence</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #F0B21B; font-size: 32px; font-weight: bold;">Design Excellence</h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Your Verification Code</h2>
                                            <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                                                Thank you for signing up with Design Excellence! To complete your registration, please use the verification code below:
                                            </p>
                                            
                                            <!-- OTP Box -->
                                            <div style="background: linear-gradient(135deg, #F0B21B 0%, #e0a10b 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                                                <div style="font-size: 48px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                    {{OTP_CODE}}
                                                </div>
                                            </div>
                                            
                                            <p style="margin: 30px 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                                <strong>⏱️ This code is valid for 5 minutes.</strong>
                                            </p>
                                            
                                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                                If you didn't request this code, please ignore this email or contact our support team if you have concerns.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                                                © ${new Date().getFullYear()} Design Excellence. All rights reserved.
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                Need help? Contact us at <a href="mailto:support@designexcellence.com" style="color: #F0B21B; text-decoration: none;">support@designexcellence.com</a>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `;
        }

        // Replace placeholder with actual OTP
        const htmlContent = htmlTemplate.replace('{{OTP_CODE}}', otp);

        // Prepare email message
        const msg = {
            to: toEmail,
            from: {
                email: fromEmail,
                name: 'Design Excellence'
            },
            subject: 'Your Design Excellence OTP Code',
            text: `Your OTP code is: ${otp}. It is valid for 5 minutes. If you didn't request this code, please ignore this email.`,
            html: htmlContent,
        };

        console.log('📧 Sending OTP email via SendGrid...');
        console.log('  - To:', toEmail);
        console.log('  - From:', fromEmail);
        console.log('  - OTP:', otp);

        // Send email via SendGrid
        const response = await sgMail.send(msg);
        
        console.log('✅ Email sent successfully via SendGrid');
        console.log('  - Status Code:', response[0].statusCode);
        console.log('  - Message ID:', response[0].headers['x-message-id']);

        return {
            success: true,
            message: 'OTP sent successfully',
            messageId: response[0].headers['x-message-id']
        };

    } catch (error) {
        console.error('❌ Error sending OTP via SendGrid:', error);
        
        // Log more details about the error
        if (error.response) {
            console.error('  - Status Code:', error.response.statusCode);
            console.error('  - Body:', error.response.body);
        }
        
        return {
            success: false,
            message: `Failed to send OTP: ${error.message}`,
            error: error.message
        };
    }
};

/**
 * Send test OTP email via SendGrid
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<{success: boolean, message: string, otp?: string}>}
 */
const sendTestOtpEmail = async (toEmail) => {
    const testOtp = '123456';
    
    try {
        const result = await sendOtpEmail(toEmail, testOtp);
        
        if (result.success) {
            return {
                success: true,
                message: 'Test OTP email sent successfully',
                otp: testOtp
            };
        } else {
            return result;
        }
        
    } catch (error) {
        console.error('❌ Error sending test OTP:', error);
        return {
            success: false,
            message: `Failed to send test OTP: ${error.message}`
        };
    }
};

module.exports = {
    sendOtpEmail,
    sendTestOtpEmail
};


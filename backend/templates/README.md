# Email Templates Directory

This directory contains HTML email templates used throughout the DesignXcel application for various communication purposes.

## 📁 Directory Structure

```
templates/
├── emails/
│   ├── auth/                    # Authentication-related emails
│   │   ├── otp-email.html      # OTP verification emails
│   │   └── password-reset-email.html  # Password reset emails
│   ├── notifications/          # System notifications
│   │   └── (future templates)
│   └── orders/                 # Order-related emails
│       └── (future templates)
└── README.md                   # This file
```

## 📧 Email Templates

### **Authentication Templates** (`emails/auth/`)

#### **1. OTP Email Template** (`otp-email.html`)
- **Purpose**: Send OTP codes for user verification
- **Used in**: 
  - `/api/auth/send-otp` endpoint
  - User registration process
- **Placeholders**: `{{OTP_CODE}}`
- **Features**:
  - Responsive design
  - Brand colors (#F0B21B)
  - Professional styling
  - Mobile-friendly layout

#### **2. Password Reset Template** (`password-reset-email.html`)
- **Purpose**: Send password reset links
- **Used in**: 
  - `/api/auth/forgot-password` endpoint
- **Placeholders**: 
  - `{{USER_NAME}}` - User's full name
  - `{{RESET_LINK}}` - Password reset URL
- **Features**:
  - Responsive design
  - Security-focused messaging
  - Clear call-to-action button
  - Professional branding

## 🎨 Template Features

### **Design System**
- **Primary Color**: #F0B21B (Design Excellence Gold)
- **Secondary Color**: #1f2937 (Dark Gray)
- **Font**: System fonts (Apple, Segoe UI, Roboto)
- **Layout**: Mobile-first responsive design
- **Max Width**: 600px for optimal email client compatibility

### **Common Elements**
- **Header**: Brand logo and gradient background
- **Content**: Clean, readable typography
- **Footer**: Company information and legal disclaimers
- **Buttons**: Styled call-to-action elements
- **Responsive**: Works on desktop and mobile devices

## 🔧 Usage in Code

### **Loading Templates**
```javascript
const path = require('path');
const fs = require('fs');

// Load OTP template
const otpTemplatePath = path.join(__dirname, 'templates', 'emails', 'auth', 'otp-email.html');
const otpTemplate = fs.readFileSync(otpTemplatePath, 'utf8');

// Load password reset template
const resetTemplatePath = path.join(__dirname, 'templates', 'emails', 'auth', 'password-reset-email.html');
const resetTemplate = fs.readFileSync(resetTemplatePath, 'utf8');
```

### **Replacing Placeholders**
```javascript
// OTP template
const htmlContent = otpTemplate.replace('{{OTP_CODE}}', otpCode);

// Password reset template
const personalizedTemplate = resetTemplate
    .replace(/{{USER_NAME}}/g, user.FullName || 'Valued Customer')
    .replace(/{{RESET_LINK}}/g, resetLink);
```

## 📱 Email Client Compatibility

### **Tested Clients**
- ✅ Gmail (Web, Mobile, Desktop)
- ✅ Outlook (Web, Desktop, Mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Thunderbird

### **Best Practices**
- Inline CSS for maximum compatibility
- Fallback fonts for cross-platform support
- Responsive design with media queries
- Alt text for images
- Proper HTML structure

## 🚀 Adding New Templates

### **1. Create Template File**
```bash
# For authentication emails
touch backend/templates/emails/auth/new-auth-template.html

# For notifications
touch backend/templates/emails/notifications/new-notification.html

# For orders
touch backend/templates/emails/orders/order-confirmation.html
```

### **2. Template Structure**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Email Subject</title>
    <style>
        /* Include common styles from existing templates */
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <!-- Header content -->
        </div>
        <div class="email-content">
            <!-- Main content with {{PLACEHOLDERS}} -->
        </div>
        <div class="email-footer">
            <!-- Footer content -->
        </div>
    </div>
</body>
</html>
```

### **3. Update Code References**
```javascript
// Update the template path in your route handler
const templatePath = path.join(__dirname, 'templates', 'emails', 'category', 'template-name.html');
```

## 🔍 Testing Templates

### **Local Testing**
1. **Preview in Browser**: Open HTML files directly in browser
2. **Email Testing Tools**: Use tools like Litmus or Email on Acid
3. **Send Test Emails**: Use development email accounts

### **Production Testing**
1. **Staging Environment**: Test with real email addresses
2. **Multiple Clients**: Test across different email clients
3. **Mobile Testing**: Verify mobile responsiveness

## 📋 Template Checklist

When creating new templates:

- [ ] Responsive design (mobile-friendly)
- [ ] Brand colors and fonts
- [ ] Placeholder variables documented
- [ ] Fallback content for missing data
- [ ] Alt text for images
- [ ] Unsubscribe link (if applicable)
- [ ] Legal disclaimers
- [ ] Cross-client compatibility
- [ ] Accessibility considerations

## 🛠️ Maintenance

### **Regular Updates**
- Review templates quarterly
- Update brand elements as needed
- Test with new email clients
- Optimize for performance

### **Version Control**
- Track changes to templates
- Document placeholder changes
- Maintain backup versions
- Test before deploying changes

## 📚 Related Documentation

- [Email Service Configuration](../docs/EMAIL_SETUP.md)
- [Authentication Flow](../docs/AUTH_IMPLEMENTATION.md)
- [API Documentation](../docs/API_REFERENCE.md)

## 🆘 Troubleshooting

### **Common Issues**

1. **Template Not Loading**
   - Check file path in code
   - Verify file exists
   - Check file permissions

2. **Placeholders Not Replacing**
   - Verify placeholder syntax: `{{PLACEHOLDER}}`
   - Check replacement code
   - Test with sample data

3. **Styling Issues**
   - Use inline CSS
   - Test in multiple email clients
   - Check for CSS conflicts

4. **Mobile Display Problems**
   - Test responsive design
   - Check viewport meta tag
   - Verify media queries

### **Support**
For template-related issues, check:
1. Email service logs
2. Template file syntax
3. Placeholder replacement logic
4. Email client compatibility

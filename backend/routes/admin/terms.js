// Terms and Conditions API Routes
const express = require('express');
const router = express.Router();
const db = require('../../config/database'); // Adjust path as needed

// GET /api/admin/terms - Fetch terms and conditions
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM terms_and_conditions ORDER BY id DESC LIMIT 1';
        const [rows] = await db.execute(query);
        
        if (rows.length === 0) {
            return res.json({
                signupTermsTitle: 'Terms & Conditions',
                signupTermsContent: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                signupTermsCheckboxText: 'I agree to the Terms and Conditions',
                checkoutTermsTitle: 'Terms and Conditions',
                checkoutTermsContent: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                checkoutTermsCheckboxText: 'I have read and agree to the Terms and Conditions',
                termsLastUpdated: '',
                termsVersion: '1.0',
                requireAgreement: true
            });
        }
        
        const terms = rows[0];
        res.json({
            signupTermsTitle: terms.signup_terms_title,
            signupTermsContent: terms.signup_terms_content,
            signupTermsCheckboxText: terms.signup_terms_checkbox_text,
            checkoutTermsTitle: terms.checkout_terms_title,
            checkoutTermsContent: terms.checkout_terms_content,
            checkoutTermsCheckboxText: terms.checkout_terms_checkbox_text,
            termsLastUpdated: terms.terms_last_updated,
            termsVersion: terms.terms_version,
            requireAgreement: terms.require_agreement
        });
    } catch (error) {
        console.error('Error fetching terms and conditions:', error);
        res.status(500).json({ error: 'Failed to fetch terms and conditions' });
    }
});

// POST /api/admin/terms - Save terms and conditions
router.post('/', async (req, res) => {
    try {
        const {
            signupTermsTitle,
            signupTermsContent,
            signupTermsCheckboxText,
            checkoutTermsTitle,
            checkoutTermsContent,
            checkoutTermsCheckboxText,
            termsLastUpdated,
            termsVersion,
            requireAgreement
        } = req.body;
        
        // Check if terms already exist
        const checkQuery = 'SELECT id FROM terms_and_conditions ORDER BY id DESC LIMIT 1';
        const [existingRows] = await db.execute(checkQuery);
        
        if (existingRows.length > 0) {
            // Update existing terms
            const updateQuery = `
                UPDATE terms_and_conditions SET
                    signup_terms_title = ?,
                    signup_terms_content = ?,
                    signup_terms_checkbox_text = ?,
                    checkout_terms_title = ?,
                    checkout_terms_content = ?,
                    checkout_terms_checkbox_text = ?,
                    terms_last_updated = ?,
                    terms_version = ?,
                    require_agreement = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await db.execute(updateQuery, [
                signupTermsTitle,
                signupTermsContent,
                signupTermsCheckboxText,
                checkoutTermsTitle,
                checkoutTermsContent,
                checkoutTermsCheckboxText,
                termsLastUpdated,
                termsVersion,
                requireAgreement,
                existingRows[0].id
            ]);
        } else {
            // Insert new terms
            const insertQuery = `
                INSERT INTO terms_and_conditions (
                    signup_terms_title,
                    signup_terms_content,
                    signup_terms_checkbox_text,
                    checkout_terms_title,
                    checkout_terms_content,
                    checkout_terms_checkbox_text,
                    terms_last_updated,
                    terms_version,
                    require_agreement
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await db.execute(insertQuery, [
                signupTermsTitle,
                signupTermsContent,
                signupTermsCheckboxText,
                checkoutTermsTitle,
                checkoutTermsContent,
                checkoutTermsCheckboxText,
                termsLastUpdated,
                termsVersion,
                requireAgreement
            ]);
        }
        
        res.json({ success: true, message: 'Terms and conditions saved successfully' });
    } catch (error) {
        console.error('Error saving terms and conditions:', error);
        res.status(500).json({ error: 'Failed to save terms and conditions' });
    }
});

// GET /api/terms - Public endpoint to fetch terms for frontend
router.get('/public', async (req, res) => {
    try {
        const query = 'SELECT * FROM terms_and_conditions ORDER BY id DESC LIMIT 1';
        const [rows] = await db.execute(query);
        
        if (rows.length === 0) {
            return res.json({
                signupTerms: {
                    title: 'Terms & Conditions',
                    content: 'By creating an account, you agree to:\n• Our Terms of Service and Privacy Policy\n• Receive communications about your account and orders\n• Provide accurate and complete information\n• Maintain the security of your account credentials',
                    checkboxText: 'I agree to the Terms and Conditions'
                },
                checkoutTerms: {
                    title: 'Terms and Conditions',
                    content: 'By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.\n\n• All sales are final unless otherwise stated.\n• Shipping and delivery times are estimates and may vary.\n• You are responsible for providing accurate shipping information.\n• For full details, please visit our Terms and Conditions page.',
                    checkboxText: 'I have read and agree to the Terms and Conditions'
                },
                requireAgreement: true
            });
        }
        
        const terms = rows[0];
        res.json({
            signupTerms: {
                title: terms.signup_terms_title,
                content: terms.signup_terms_content,
                checkboxText: terms.signup_terms_checkbox_text
            },
            checkoutTerms: {
                title: terms.checkout_terms_title,
                content: terms.checkout_terms_content,
                checkboxText: terms.checkout_terms_checkbox_text
            },
            requireAgreement: terms.require_agreement,
            lastUpdated: terms.terms_last_updated,
            version: terms.terms_version
        });
    } catch (error) {
        console.error('Error fetching public terms:', error);
        res.status(500).json({ error: 'Failed to fetch terms and conditions' });
    }
});

module.exports = router;

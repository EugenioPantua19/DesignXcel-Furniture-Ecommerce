import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import Captcha from '../components/Captcha';
import TermsModal from '../components/TermsModal';
import SignupSuccessModal from '../components/SignupSuccessModal';
import { validatePassword } from '../../../shared/utils/validation/passwordValidation';
import { Bars } from 'react-loader-spinner';
import './auth.css';
import apiClient from '../../../shared/services/api/apiClient';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);
    
    // Visual section data - fallback data in case API fails
    const fallbackVisualData = [
        {
            backgroundImage: `${process.env.REACT_APP_API_URL || ''}/img/login-bg.jpg`,
            testimonial: "Design Excellence transformed our office space into a modern, functional environment that boosts productivity and employee satisfaction.",
            author: "Cameron Williamson",
            role: "Interior Designer"
        },
        {
            backgroundImage: `${process.env.REACT_APP_API_URL || ''}/img/pexels-staircase.jpg`,
            testimonial: "The attention to detail and quality craftsmanship in every piece we've purchased has exceeded our expectations.",
            author: "Annette Black",
            role: "Architecture"
        }
    ];
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordValidation, setPasswordValidation] = useState(null);
    
    // Modal states
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false);
    const [signupUserData, setSignupUserData] = useState(null);
    
    // --- OTP registration states ---
    const [registerStep, setRegisterStep] = useState(1); // 1=email, 2=otp, 3=full
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    // ---
    
    // --- Captcha states ---
    const [captchaVerified, setCaptchaVerified] = useState(false);
    // ---
    
    const { loginCustomer, registerCustomer } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Public terms for signup
    const [publicTerms, setPublicTerms] = useState(null);

    // Get the intended destination from location state
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const terms = await apiClient.get('/api/terms');
                if (mounted) setPublicTerms(terms);
            } catch (e) {
                // silent
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Fetch real testimonials from backend
    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setTestimonialsLoading(true);
                const response = await apiClient.get('/api/testimonials');
                if (response && response.length > 0) {
                    // Transform backend data to match our visual data format
                    const apiBase = process.env.REACT_APP_API_URL || '';
                    const transformedTestimonials = response.map((testimonial, index) => ({
                        backgroundImage: index % 2 === 0 ? `${apiBase}/img/login-bg.jpg` : `${apiBase}/img/pexels-staircase.jpg`,
                        testimonial: testimonial.text,
                        author: testimonial.name,
                        role: testimonial.profession,
                        rating: testimonial.rating,
                        imageUrl: testimonial.imageUrl
                    }));
                    setTestimonials(transformedTestimonials);
                } else {
                    // Use fallback data if no testimonials found
                    setTestimonials(fallbackVisualData);
                }
            } catch (error) {
                console.error('Error fetching testimonials:', error);
                // Use fallback data on error
                setTestimonials(fallbackVisualData);
            } finally {
                setTestimonialsLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    // Auto-rotate visual content
    useEffect(() => {
        if (testimonials.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentVisualIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [testimonials.length]);

    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        // Input restrictions
        if (name === 'firstName' || name === 'lastName') {
            // Allow letters only
            value = value.replace(/[^A-Za-z]/g, '');
        }
        if (name === 'phone') {
            // Digits only and limit to 11 characters
            value = value.replace(/\D/g, '').slice(0, 11);
        }

        setFormData({
            ...formData,
            [name]: value
        });
        
        // Validate password in real-time when password field changes
        if (name === 'password' && !isLogin) {
            if (value.length > 0) {
                const validation = validatePassword(value);
                setPasswordValidation(validation);
            } else {
                setPasswordValidation(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const result = await loginCustomer(formData.email, formData.password, rememberMe);
                if (result.success) {
                    // Check if user has guest cart items
                    const guestCart = localStorage.getItem('shopping-cart-guest');
                    let hasGuestCartItems = false;
                    
                    if (guestCart) {
                        try {
                            const guestCartData = JSON.parse(guestCart);
                            hasGuestCartItems = guestCartData.items && guestCartData.items.length > 0;
                        } catch (error) {
                            console.error('Error checking guest cart:', error);
                        }
                    }

                    // Determine redirect destination based on role and intended destination
                    let redirectTo = from;

                    // If user was trying to access admin area, check permissions
                    if (from.startsWith('/admin')) {
                        if (result.user.role === 'Admin' || result.user.role === 'Employee') {
                            redirectTo = from;
                        } else {
                            redirectTo = '/'; // Redirect customers away from admin
                        }
                    } else if (from === '/' || from === '/login') {
                        // Default redirect based on role and guest cart
                        if (result.user.role === 'Admin' || result.user.role === 'Employee') {
                            redirectTo = '/admin';
                        } else if (hasGuestCartItems) {
                            // If user has guest cart items, redirect to cart
                            redirectTo = '/cart';
                        } else {
                            redirectTo = '/';
                        }
                    }

                    navigate(redirectTo, { replace: true });
                } else {
                    setError(result.error);
                }
            } else {
                // Validate password before registration
                if (!passwordValidation || !passwordValidation.isValid) {
                    setError('Please fix password requirements before proceeding');
                    setLoading(false);
                    return;
                }

                // Check if passwords match
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                // Check if terms are accepted
                if (!acceptedTerms) {
                    setError('You must accept the terms and conditions to continue');
                    setLoading(false);
                    return;
                }

                // Basic field validation
                const nameRegex = /^[A-Za-z]+$/;
                const phoneRegex = /^\d{11}$/;
                if (!nameRegex.test(formData.firstName)) {
                    setError('First name must contain letters only');
                    setLoading(false);
                    return;
                }
                if (!nameRegex.test(formData.lastName)) {
                    setError('Last name must contain letters only');
                    setLoading(false);
                    return;
                }
                if (!phoneRegex.test(formData.phone)) {
                    setError('Phone number must be exactly 11 digits');
                    setLoading(false);
                    return;
                }

                // Compose fullName and map phone to phoneNumber for backend
                const registrationData = {
                    fullName: (formData.firstName + ' ' + formData.lastName).trim(),
                    email: formData.email,
                    phoneNumber: formData.phone,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                };
                const result = await registerCustomer(registrationData);
                if (result.success) {
                    // Store user data and show success modal
                    setSignupUserData(result.user);
                    setShowSignupSuccessModal(true);
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // --- Captcha handlers ---
    const handleCaptchaVerified = () => {
        setCaptchaVerified(true);
    };

    // --- Signup success modal handlers ---
    const handleSignupSuccessClose = () => {
        setShowSignupSuccessModal(false);
        setSignupUserData(null);
        // Navigate to home page after modal closes
        navigate('/', { replace: true });
    };

    const handleCaptchaReset = () => {
        setCaptchaVerified(false);
    };
    // ---

    // --- OTP handlers ---
    const handleSendOtp = async (e) => {
        e.preventDefault();
        
        // Check if captcha is verified
        if (!captchaVerified) {
            setOtpError('Please complete the security verification first');
            return;
        }
        
        setOtpLoading(true);
        setOtpError('');
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                setRegisterStep(2);
                setPasswordValidation(null); // Reset password validation when moving to next step
            } else {
                // Handle specific error cases
                if (data.code === 'EMAIL_ALREADY_EXISTS') {
                    setOtpError('This email is already registered. Please use a different email or try logging in instead.');
                } else {
                    setOtpError(data.message || 'Failed to send OTP');
                }
            }
        } catch (err) {
            setOtpError('Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        setOtpError('');
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            const data = await res.json();
            if (data.success) {
                setOtpVerified(true);
                setRegisterStep(3);
                setPasswordValidation(null); // Reset password validation when moving to next step
            } else {
                setOtpError(data.message || 'Invalid OTP');
            }
        } catch (err) {
            setOtpError('Failed to verify OTP');
        } finally {
            setOtpLoading(false);
        }
    };
    // ---

    return (
        <div className="auth-page-new">
            <div className="auth-container-new">
                {/* Left Side - Form */}
                <div className="auth-form-section">
                    <div className="auth-form-wrapper">
                        {/* Logo */}
                        <div className="auth-logo">
                            <img 
                                src="/design-excellence-logo.png" 
                                alt="Design Excellence" 
                                className="logo-image"
                            />
                        </div>

                        {/* Form Header */}
                        <div className="auth-form-header">
                            <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
                            <p className="auth-subtitle">
                                {isLogin
                                    ? 'Please fill your detail to access your account.'
                                    : 'Fill your information below or register with your social account.'
                                }
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="auth-form-new">
                            {error && (
                                <div className="error-message-new">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2"/>
                                        <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2"/>
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                                    {/* Registration multi-step logic */}
                                    {!isLogin && (
                                        <>
                                            {/* Step 1: Email input and send OTP */}
                                            {registerStep === 1 && (
                                                <div className="form-group-modern">
                                                    <label>Email Address</label>
                                                    <div className="input-wrapper">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9-2 2-2z" stroke="#808080" strokeWidth="1.5"/>
                                                            <polyline points="22,6 12,13 2,6" stroke="#808080" strokeWidth="1.5"/>
                                                        </svg>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            placeholder="Enter your email address"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            required
                                                            disabled={otpSent}
                                                        />
                                                    </div>
                                                    
                                                    {/* Security Verification Message */}
                                                    <div className="security-notice" style={{ 
                                                        background: '#f8f9fa', 
                                                        border: '1px solid #e9ecef', 
                                                        borderRadius: '8px', 
                                                        padding: '12px', 
                                                        margin: '12px 0',
                                                        fontSize: '0.9rem',
                                                        color: '#6c757d',
                                                        textAlign: 'center'
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6c757d" strokeWidth="2"/>
                                                        </svg>
                                                        Complete the security verification below to send OTP
                                                    </div>
                                                    
                                                    {/* Captcha Component */}
                                                    <Captcha 
                                                        onCaptchaVerified={handleCaptchaVerified}
                                                        isVerified={captchaVerified}
                                                        onReset={handleCaptchaReset}
                                                    />
                                                    
                                                    <button
                                                        type="button"
                                                        className="auth-submit-btn-modern"
                                                        onClick={handleSendOtp}
                                                        disabled={otpLoading || !formData.email || !captchaVerified}
                                                        style={{ marginTop: 12 }}
                                                    >
                                                        {otpLoading ? 'Sending OTP...' : 
                                                         !captchaVerified ? 'Complete Security Verification' : 'Send OTP'}
                                                    </button>
                                                    {otpError && (
                                                        <div className="error-message-modern">
                                                            <span>{otpError}</span>
                                                            {otpError.includes('already registered') && (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setIsLogin(true)}
                                                                    className="error-login-link"
                                                                >
                                                                    Click here to login instead
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* Step 2: OTP input and verify */}
                                            {registerStep === 2 && (
                                                <div className="form-group-modern">
                                                    <label>Enter OTP sent to your email</label>
                                                    <div className="input-wrapper">
                                                        <input
                                                            type="text"
                                                            name="otp"
                                                            placeholder="Enter OTP"
                                                            value={otp}
                                                            onChange={e => setOtp(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="auth-submit-btn-modern"
                                                        onClick={handleVerifyOtp}
                                                        disabled={otpLoading || !otp}
                                                        style={{ marginTop: 12 }}
                                                    >
                                                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                                                    </button>
                                                    {otpError && <div className="error-message-modern"><span>{otpError}</span></div>}
                                                </div>
                                            )}
                            {/* Registration fields */}
                            {!isLogin && registerStep === 3 && (
                                <>
                                    <div className="form-row-new">
                                        <div className="form-group-new">
                                            <label>First Name *</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="Enter First Name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group-new">
                                            <label>Last Name *</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Enter Last Name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-new">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="form-group-new">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Enter Phone Number (11 digits)"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-new">
                                        <label>Password *</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Enter Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2"/>
                                                        <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2"/>
                                                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {/* Password Strength Indicator */}
                                        {passwordValidation && (
                                            <PasswordStrengthIndicator 
                                                password={formData.password}
                                                showRequirements={true}
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="form-group-new">
                                        <label>Confirm Password *</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="Confirm Password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2"/>
                                                        <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2"/>
                                                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {/* Password Match Indicator */}
                                        {formData.confirmPassword && (
                                            <div className={`password-match-indicator ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                                                {formData.password === formData.confirmPassword ? (
                                                    <span className="match-text">✓ Passwords match</span>
                                                ) : (
                                                    <span className="no-match-text">✗ Passwords do not match</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Terms and Conditions */}
                                    <div className="terms-checkbox-new">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            required
                                        />
                                        <label htmlFor="acceptTerms">
                                            Agree with <span 
                                                className="terms-link" 
                                                onClick={() => setShowTermsModal(true)}
                                            >Terms & Condition</span> and <span 
                                                className="terms-link" 
                                                onClick={() => setShowPrivacyModal(true)}
                                            >Privacy Policy</span>
                                        </label>
                                    </div>
                                </>
                            )}
                                        </>
                                    )}

                            {/* Login fields */}
                            {isLogin && (
                                <>
                                    <div className="form-group-new">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-new">
                                        <label>Password *</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Enter Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2"/>
                                                        <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2"/>
                                                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Remember me and Forgot password */}
                            {isLogin && (
                                <div className="form-options-new">
                                    <label className="remember-me">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Remember me
                                    </label>
                                    <Link to="/forgot-password" className="forgot-password-link">
                                        Forgot Password?
                                    </Link>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button type="submit" className="auth-submit-btn-new" disabled={loading || (!isLogin && registerStep !== 3) || (!isLogin && !acceptedTerms)}>
                                {loading ? (
                                    <Bars color="#ffffff" height={20} width={20} />
                                ) : (
                                    isLogin ? 'Sign In' : 'Sign Up'
                                )}
                            </button>

                        </form>

                        {/* Sign Up Link */}
                        <div className="auth-switch-link">
                            {isLogin ? (
                                <>
                                    Don't have an account?{' '}
                                    <button 
                                        type="button" 
                                        className="switch-link-btn"
                                        onClick={() => {
                                            setIsLogin(false);
                                            setError('');
                                            setPasswordValidation(null);
                                            setFormData({
                                                email: '',
                                                password: '',
                                                confirmPassword: '',
                                                firstName: '',
                                                lastName: '',
                                                phone: ''
                                            });
                                            setAcceptedTerms(false);
                                            setCaptchaVerified(false);
                                            setRegisterStep(1);
                                            setOtpSent(false);
                                            setOtpVerified(false);
                                            setOtp('');
                                            setOtpError('');
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button 
                                        type="button" 
                                        className="switch-link-btn"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setError('');
                                            setPasswordValidation(null);
                                            setFormData({
                                                email: '',
                                                password: '',
                                                confirmPassword: '',
                                                firstName: '',
                                                lastName: '',
                                                phone: ''
                                            });
                                            setAcceptedTerms(false);
                                            setCaptchaVerified(false);
                                            setRegisterStep(1);
                                            setOtpSent(false);
                                            setOtpVerified(false);
                                            setOtp('');
                                            setOtpError('');
                                        }}
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Visual */}
                <div 
                    className="auth-visual-section"
                    style={{
                        backgroundImage: testimonials.length > 0 ? `url(${testimonials[currentVisualIndex]?.backgroundImage})` : 'linear-gradient(135deg, #4D5157 0%, #36454f 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="auth-visual-wrapper">
                        <div className="visual-content">
                            {testimonialsLoading ? (
                                <div className="testimonial-overlay">
                                    <div className="loading-spinner">
                                        <Bars color="#F0B21B" height={80} width={80} />
                                        <p>Loading testimonials...</p>
                                    </div>
                                </div>
                            ) : testimonials.length > 0 ? (
                                <>
                                    <div className="testimonial-overlay">
                                        <p className="testimonial-quote">
                                            "{testimonials[currentVisualIndex]?.testimonial}"
                                        </p>
                                        <div className="testimonial-author">
                                            <h4>{testimonials[currentVisualIndex]?.author}</h4>
                                            <p>{testimonials[currentVisualIndex]?.role}</p>
                                            {testimonials[currentVisualIndex]?.rating && (
                                                <div className="testimonial-rating">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={`star ${i < testimonials[currentVisualIndex].rating ? 'filled' : ''}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="carousel-indicators">
                                        {testimonials.map((_, index) => (
                                            <div 
                                                key={index}
                                                className={`indicator ${index === currentVisualIndex ? 'active' : ''}`}
                                                onClick={() => setCurrentVisualIndex(index)}
                                            ></div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="testimonial-overlay">
                                    <p className="testimonial-quote">
                                        "Welcome to Design Excellence - Your trusted partner in creating beautiful spaces."
                                    </p>
                                    <div className="testimonial-author">
                                        <h4>Design Excellence Team</h4>
                                        <p>Interior Design Specialists</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Terms and Conditions Modal */}
            <TermsModal 
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                type="terms"
            />
            
            {/* Privacy Policy Modal */}
            <TermsModal 
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                type="privacy"
            />
            
            {/* Signup Success Modal */}
            <SignupSuccessModal 
                isOpen={showSignupSuccessModal}
                onClose={handleSignupSuccessClose}
                userData={signupUserData}
            />
        </div>
    );
};

export default Login;
export { Login as LoginPage };
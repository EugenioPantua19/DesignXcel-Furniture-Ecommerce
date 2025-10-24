import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bars } from 'react-loader-spinner';
import './auth.css';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
    const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);
    
    const navigate = useNavigate();
    
    // Visual section data - fallback data in case API fails
    const fallbackVisualData = [
        {
            backgroundImage: '/img/login-bg.jpg',
            testimonial: "Design Excellence transformed our office space into a modern, functional environment that boosts productivity and employee satisfaction.",
            author: "Cameron Williamson",
            role: "Interior Designer"
        },
        {
            backgroundImage: '/img/pexels-staircase.jpg',
            testimonial: "The attention to detail and quality craftsmanship in every piece we've purchased has exceeded our expectations.",
            author: "Annette Black",
            role: "Architecture"
        }
    ];

    // Get token from URL parameters
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            // In a real implementation, you would validate the token here
            setTokenValid(true);
        } else {
            setTokenValid(false);
        }
    }, [searchParams]);

    // Fetch real testimonials from backend
    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setTestimonialsLoading(true);
                const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiBase}/api/testimonials`);
                if (response && response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        // Transform backend data to match our visual data format
                        const transformedTestimonials = data.map((testimonial, index) => ({
                            backgroundImage: index % 2 === 0 ? '/img/login-bg.jpg' : '/img/pexels-staircase.jpg',
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
                } else {
                    // Use fallback data on error
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const apiBase2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBase2}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    token, 
                    password, 
                    confirmPassword 
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    // Show loading while checking token
    if (tokenValid === null) {
        return (
            <div className="auth-page-new">
                <div className="auth-container-new">
                    <div className="auth-form-section">
                        <div className="auth-form-wrapper">
                            <div className="loading-spinner">
                                <Bars color="#F0B21B" height={80} width={80} />
                                <p>Validating reset link...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if token is invalid
    if (tokenValid === false) {
        return (
            <div className="auth-page-new">
                <div className="auth-container-new">
                    <div className="auth-form-section">
                        <div className="auth-form-wrapper">
                            <div className="auth-logo">
                                <img 
                                    src="/design-excellence-logo.png" 
                                    alt="Design Excellence" 
                                    className="logo-image"
                                />
                            </div>
                            <div className="auth-form-header">
                                <h1>Invalid Reset Link</h1>
                                <p className="auth-subtitle">
                                    This password reset link is invalid or has expired.
                                </p>
                            </div>
                            <div className="error-message-new">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2"/>
                                    <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2"/>
                                </svg>
                                <span>Please request a new password reset link.</span>
                            </div>
                            <button 
                                type="button" 
                                className="auth-submit-btn-new"
                                onClick={handleBackToLogin}
                            >
                                Back to Login
                            </button>
                            <div className="auth-switch-link">
                                Need a new reset link?{' '}
                                <Link to="/forgot-password" className="switch-link-btn">
                                    Request Reset
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            <h1>Reset Password</h1>
                            <p className="auth-subtitle">
                                {success 
                                    ? 'Your password has been reset successfully!'
                                    : 'Enter your new password below.'
                                }
                            </p>
                        </div>

                        {/* Form */}
                        {!success ? (
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

                                <div className="form-group-new">
                                    <label>New Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength="8"
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

                                <div className="form-group-new">
                                    <label>Confirm New Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength="8"
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
                                    {confirmPassword && (
                                        <div className={`password-match-indicator ${password === confirmPassword ? 'match' : 'no-match'}`}>
                                            {password === confirmPassword ? (
                                                <span className="match-text">✓ Passwords match</span>
                                            ) : (
                                                <span className="no-match-text">✗ Passwords do not match</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button 
                                    type="submit" 
                                    className="auth-submit-btn-new" 
                                    disabled={loading || !password || !confirmPassword}
                                >
                                    {loading ? (
                                        <Bars color="#ffffff" height={20} width={20} />
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="success-container">
                                <div className="success-message-modern">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2"/>
                                        <path d="M9 12l2 2 4-4" stroke="#28a745" strokeWidth="2"/>
                                    </svg>
                                    <span>Password reset successfully!</span>
                                </div>
                                
                                <div className="success-instructions">
                                    <p>Your password has been updated successfully.</p>
                                    <p>You will be redirected to the login page in a few seconds.</p>
                                </div>

                                <button 
                                    type="button" 
                                    className="auth-submit-btn-new"
                                    onClick={handleBackToLogin}
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}

                        {/* Back to Login Link */}
                        {!success && (
                            <div className="auth-switch-link">
                                Remember your password?{' '}
                                <Link to="/login" className="switch-link-btn">
                                    Sign In
                                </Link>
                            </div>
                        )}
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
        </div>
    );
};

export default ResetPasswordPage;
export { ResetPasswordPage };

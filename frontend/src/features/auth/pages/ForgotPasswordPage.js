import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
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
        setSuccess(false);

        try {
            const apiBase2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBase2}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to send reset email. Please try again.');
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
                            <h1>Forgot Password</h1>
                            <p className="auth-subtitle">
                                {success 
                                    ? 'Check your email for reset instructions.'
                                    : 'Enter your email address and we\'ll send you a link to reset your password.'
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
                                    <label>Email Address *</label>
                                    <div className="input-wrapper">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9-2 2-2z" stroke="#808080" strokeWidth="1.5"/>
                                            <polyline points="22,6 12,13 2,6" stroke="#808080" strokeWidth="1.5"/>
                                        </svg>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button 
                                    type="submit" 
                                    className="auth-submit-btn-new" 
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        'Sending...'
                                    ) : (
                                        'Send Reset Link'
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
                                    <span>Password reset email sent successfully!</span>
                                </div>
                                
                                <div className="success-instructions">
                                    <p>We've sent a password reset link to <strong>{email}</strong></p>
                                    <p>Please check your email and follow the instructions to reset your password.</p>
                                    <p>If you don't see the email, check your spam folder.</p>
                                </div>

                                <button 
                                    type="button" 
                                    className="auth-submit-btn-new"
                                    onClick={handleBackToLogin}
                                >
                                    Back to Login
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

export default ForgotPasswordPage;
export { ForgotPasswordPage };

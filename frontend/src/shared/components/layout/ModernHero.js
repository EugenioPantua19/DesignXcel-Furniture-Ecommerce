import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './modern-hero.css';

const ModernHero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hero, setHero] = useState({
        mainHeading: 'Premium Office Furniture Solutions',
        descriptionLine1: 'Transform your workspace with our premium collection of office furniture',
        descriptionLine2: 'Discover our premium collection of office furniture designed for modern professionals',
        buttonText: 'SHOP NOW',
        buttonLink: '/products',
        textColor: '#ffffff',
        buttonBgColor: '#ffc107',
        buttonTextColor: '#333333',
        heroBannerImages: []
    });

    useEffect(() => {
        let isMounted = true;
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        fetch(`${API_BASE}/api/hero-banner`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                const normalizeUrl = (u) => {
                    if (!u) return u;
                    try {
                        if (u.startsWith('http://') || u.startsWith('https://')) return u;
                        if (u.startsWith('/')) {
                            // URL encode the path to handle spaces and special characters
                            const encodedPath = u.split('/').map(segment => encodeURIComponent(segment)).join('/');
                            return `${API_BASE}${encodedPath}`;
                        }
                        return `${API_BASE}/${u}`;
                    } catch (_) {
                        return u;
                    }
                };
                const images = Array.isArray(data.heroBannerImages) ? data.heroBannerImages.map(normalizeUrl) : [];
                
                
                // Test with a known working image
                if (images.length === 0) {
                    console.log('No images found, testing with a sample image...');
                    images.push('https://via.placeholder.com/1920x600/ffc107/ffffff?text=Test+Image');
                }
                
                setHero({
                    mainHeading: data.mainHeading || 'Premium Office Furniture Solutions',
                    descriptionLine1: data.descriptionLine1 || 'Transform your workspace with our premium collection of office furniture',
                    descriptionLine2: data.descriptionLine2 || 'Discover our premium collection of office furniture designed for modern professionals',
                    buttonText: data.buttonText || 'SHOP NOW',
                    buttonLink: data.buttonLink || '/products',
                    textColor: data.textColor || '#ffffff',
                    buttonBgColor: data.buttonBgColor || '#ffc107',
                    buttonTextColor: data.buttonTextColor || '#333333',
                    button2Text: data.button2Text,
                    button2Link: data.button2Link,
                    button2BgColor: data.button2BgColor,
                    button2TextColor: data.button2TextColor,
                    heroBannerImages: images
                });
            })
            .catch((error) => {
                console.error('Error fetching hero banner:', error);
                // keep defaults on error
            });
        return () => { isMounted = false; };
    }, []);

    const backgroundImages = hero.heroBannerImages && hero.heroBannerImages.length > 0
        ? hero.heroBannerImages
        : [];
    

    // Auto-slide functionality
    useEffect(() => {
        if (backgroundImages.length <= 1) return; // no rotation needed
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [backgroundImages.length]);
    
    const handleSlideChange = (index) => {
        setCurrentSlide(index);
    };
    
    const handlePreviousSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length);
    };
    
    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    };
    
    return (
        <section className="modern-hero">
            {/* Background Image Slider */}
            <div className="hero-bg-slider">
                {backgroundImages.length > 0 ? (
                    backgroundImages.map((image, index) => (
                        <div
                            key={index}
                            className={`bg-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ 
                                backgroundImage: `url(${image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    ))
                ) : (
                    <div className="bg-slide active" style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }} />
                )}
            </div>
            
            {/* Background Overlay */}
            <div className="hero-bg-overlay"></div>
            
            <div className="hero-container">
                <div className="hero-content">
                    <h1 className="hero-title" style={{ color: hero.textColor }}>
                        {hero.mainHeading}
                    </h1>
                    {(hero.descriptionLine1 || hero.descriptionLine2) && (
                        <p className="hero-subtitle" style={{ color: hero.textColor }}>
                            {hero.descriptionLine1}
                            {hero.descriptionLine2 ? ` ${hero.descriptionLine2}` : ''}
                        </p>
                    )}
                    <div className="hero-actions">
                        <Link
                            to={hero.buttonLink || '/products'}
                            className="btn"
                            style={{ backgroundColor: hero.buttonBgColor, color: hero.buttonTextColor }}
                        >
                            {hero.buttonText || 'SHOP NOW'}
                        </Link>
                        {/* Optional second button if provided */}
                        {hero.button2Text && hero.button2Link && (
                            <Link
                                to={hero.button2Link}
                                className="btn btn-secondary"
                                style={{ backgroundColor: hero.button2BgColor || '#6c757d', color: hero.button2TextColor || '#ffffff' }}
                            >
                                {hero.button2Text}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Arrow Navigation */}
            {backgroundImages.length > 1 && (
                <>
                    <button 
                        className="slider-arrow slider-arrow-left"
                        onClick={handlePreviousSlide}
                        aria-label="Previous slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    
                    <button 
                        className="slider-arrow slider-arrow-right"
                        onClick={handleNextSlide}
                        aria-label="Next slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </>
            )}
            
            {/* Minimal Slider Indicators */}
            {backgroundImages.length > 1 && (
                <div className="slider-indicators">
                    {backgroundImages.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => handleSlideChange(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ModernHero;

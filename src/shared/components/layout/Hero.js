import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUtils';
import './hero.css';

const Hero = () => {
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
        console.log('Hero: Fetching hero banner data...');
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        fetch(`${apiBase}/api/hero-banner`)
            .then(res => {
                console.log('Hero: API response status:', res.status);
                return res.json();
            })
            .then(data => {
                if (!isMounted) return;
                console.log('Hero: API response data:', data);
                let images = [];
                if (data.success && data.heroBanner) {
                    console.log('Hero banner data loaded successfully:', data.heroBanner);
                    images = Array.isArray(data.heroBanner.heroBannerImages) ? data.heroBanner.heroBannerImages.map(img => {
                        // Handle both string filenames and object with filename property
                        const filename = typeof img === 'string' ? img : img.filename;
                        const imageUrl = getImageUrl(`hero-banners/${filename}`);
                        console.log('Hero: Image URL constructed:', imageUrl);
                        return imageUrl;
                    }) : [];
                    
                    setHero({
                        mainHeading: data.heroBanner.mainHeading || 'Premium Office Furniture Solutions',
                        descriptionLine1: data.heroBanner.descriptionLine1 || 'Transform your workspace with our premium collection of office furniture',
                        descriptionLine2: data.heroBanner.descriptionLine2 || 'Discover our premium collection of office furniture designed for modern professionals',
                        buttonText: data.heroBanner.buttonText || 'SHOP NOW',
                        buttonLink: data.heroBanner.buttonLink || '/products',
                        textColor: data.heroBanner.textColor || '#ffffff',
                        buttonBgColor: data.heroBanner.buttonBgColor || '#ffc107',
                        buttonTextColor: data.heroBanner.buttonTextColor || '#333333',
                        button2Text: data.heroBanner.button2Text,
                        button2Link: data.heroBanner.button2Link,
                        button2BgColor: data.heroBanner.button2BgColor,
                        button2TextColor: data.heroBanner.button2TextColor,
                        heroBannerImages: images
                    });
                } else {
                    console.log('Hero banner data format issue:', data);
                    // Test with a known working image
                    if (images.length === 0) {
                        console.log('No images found, testing with a sample image...');
                        images.push('https://via.placeholder.com/1920x600/ffc107/ffffff?text=Test+Image');
                    }
                }
            })
            .catch((error) => {
                console.error('Hero: Error fetching hero banner:', error);
                console.error('Hero: Error details:', {
                    message: error.message,
                    stack: error.stack
                });
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
        <section className="hero">
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
                    <div className="hero-actions" style={{
                        '--hero-button-bg': hero.buttonBgColor || '#F0B21B',
                        '--hero-button-text': hero.buttonTextColor || '#ffffff',
                        '--hero-button2-bg': hero.button2BgColor || '#F0B21B',
                        '--hero-button2-text': hero.button2TextColor || '#ffffff'
                    }}>
                        <Link
                            to={hero.buttonLink || '/products'}
                            className="btn"
                        >
                            {hero.buttonText || 'SHOP NOW'}
                        </Link>
                        {/* Optional second button if provided */}
                        {hero.button2Text && hero.button2Link && (
                            <Link
                                to={hero.button2Link}
                                className="btn btn-secondary"
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

export default Hero;

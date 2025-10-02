import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../features/products/components/ProductCard';
import ModernTestimonials from '../shared/components/feedback/ModernTestimonials';
import ModernHero from '../shared/components/layout/ModernHero';
import { ContactSection } from '../shared/components/layout';
import { getFeaturedProducts, productService } from '../features/products/services/productService';
import { PageLoader } from '../shared/components/ui';
import './pages.css';

const Home = () => {
    // Featured Products
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Categories
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    
    // Slider state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [itemsPerSlide, setItemsPerSlide] = useState(4);

    useEffect(() => {
        loadFeaturedProducts();
        loadCategories();
        
        // Set items per slide based on screen size
        const updateItemsPerSlide = () => {
            if (window.innerWidth <= 480) {
                setItemsPerSlide(1);
            } else if (window.innerWidth <= 768) {
                setItemsPerSlide(2);
            } else if (window.innerWidth <= 1024) {
                setItemsPerSlide(3);
            } else {
                setItemsPerSlide(4);
            }
        };
        
        updateItemsPerSlide();
        window.addEventListener('resize', updateItemsPerSlide);
        
        return () => window.removeEventListener('resize', updateItemsPerSlide);
    }, []);

    const loadFeaturedProducts = async () => {
        try {
            // Try to get from the frontend API endpoint to get featured products with discounts
            const response = await fetch('http://localhost:5000/api/products');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.products) {
                    // Filter for featured products
                    const featured = data.products
                        .filter(p => p.featured)
                        .map(p => ({
                            id: p.id,
                            name: p.name,
                            description: p.description,
                            price: p.price,
                            image: p.images && p.images.length > 0 ? p.images[0] : null,
                            hasDiscount: p.hasDiscount,
                            discountInfo: p.discountInfo,
                            ...p
                        }));
                    
                    if (featured.length > 0) {
                        setFeaturedProducts(featured);
                    } else {
                        // If no featured products from backend, use mock data
                        const mockResponse = await getFeaturedProducts();
                        setFeaturedProducts(mockResponse.products || []);
                    }
                } else {
                    // If no featured products from backend, use mock data
                    const mockResponse = await getFeaturedProducts();
                    setFeaturedProducts(mockResponse.products || []);
                }
            } else {
                // If backend is not available, use mock data
                const mockResponse = await getFeaturedProducts();
                setFeaturedProducts(mockResponse.products || []);
            }
        } catch (error) {
            console.error('Error loading featured products:', error);
            // Fallback to mock data
            try {
                const mockResponse = await getFeaturedProducts();
                setFeaturedProducts(mockResponse.products || []);
            } catch (mockError) {
                console.error('Error loading mock products:', mockError);
                setFeaturedProducts([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            setCategoriesLoading(true);
            const categoriesData = await productService.getCategoriesWithCounts();
            
            // Add icons and transform the data
            const categoriesWithIcons = categoriesData.map(category => ({
                ...category,
                id: category.name.toLowerCase().replace(/\s+/g, '-'),
                icon: getCategoryIcon(category.name)
            }));
            
            setCategories(categoriesWithIcons);
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to default categories if API fails
            setCategories(getDefaultCategories());
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Helper function to get category icon based on category name
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'Desk': (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="12" rx="2" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M3 10h18" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M8 21v-7" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M16 21v-7" stroke="#F0B21B" strokeWidth="2"/>
                </svg>
            ),
            'Chair': (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12V7a7 7 0 0 1 14 0v5" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M22 19H2l2-7h16l2 7Z" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M6 19v2" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M18 19v2" stroke="#F0B21B" strokeWidth="2"/>
                </svg>
            ),
            'Storage': (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#F0B21B" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="#F0B21B" strokeWidth="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#F0B21B" strokeWidth="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#F0B21B" strokeWidth="2"/>
                    <polyline points="10,9 9,9 8,9" stroke="#F0B21B" strokeWidth="2"/>
                </svg>
            ),
            'Conference': (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21h18" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M5 21V7l8-4v18" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M19 21V11l-6-4" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M9 9v.01" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M9 12v.01" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M9 15v.01" stroke="#F0B21B" strokeWidth="2"/>
                    <path d="M9 18v.01" stroke="#F0B21B" strokeWidth="2"/>
                </svg>
            ),
            'Accessories': (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="#F0B21B" strokeWidth="2"/>
                </svg>
            )
        };
        
        return iconMap[categoryName] || (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="#F0B21B" strokeWidth="2"/>
            </svg>
        );
    };

    // Default categories fallback
    const getDefaultCategories = () => [
        {
            id: 'desks',
            name: 'Office Desks',
            count: 12,
            icon: getCategoryIcon('Desk'),
            categoryName: 'Desk'
        },
        {
            id: 'chairs',
            name: 'Office Chairs',
            count: 8,
            icon: getCategoryIcon('Chair'),
            categoryName: 'Chair'
        },
        {
            id: 'storage',
            name: 'Storage Solutions',
            count: 15,
            icon: getCategoryIcon('Storage'),
            categoryName: 'Storage'
        },
        {
            id: 'conference',
            name: 'Conference Furniture',
            count: 6,
            icon: getCategoryIcon('Conference'),
            categoryName: 'Conference'
        },
        {
            id: 'accessories',
            name: 'Office Accessories',
            count: 20,
            icon: getCategoryIcon('Accessories'),
            categoryName: 'Accessories'
        }
    ];

    // Testimonials state
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    
    // Testimonials design settings state
    const [testimonialsDesign, setTestimonialsDesign] = useState({
        theme: 'default',
        layout: 'grid',
        perRow: '3',
        animation: 'none',
        bgColor: '#ffffff',
        textColor: '#333333',
        accentColor: '#ffc107',
        borderRadius: '8',
        showRating: true,
        showImage: true,
        showTitle: true,
        textAlign: 'left'
    });
    
    // Hero banner settings state
    const [heroBanner, setHeroBanner] = useState({
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

    // Carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        // Fetch testimonials
        fetch('http://localhost:5000/api/testimonials')
            .then(res => res.json())
            .then(data => setTestimonials(data.testimonials || []))
            .catch(() => setTestimonials([]));
        
        // Fetch testimonials design settings
        fetch('http://localhost:5000/api/testimonials-design')
            .then(res => res.json())
            .then(data => {
                console.log('Testimonials design settings loaded:', data);
                setTestimonialsDesign(data);
            })
            .catch((error) => {
                // Use default values if API fails
                console.log('Using default testimonials design settings due to error:', error);
            });
        
        // Fetch hero banner settings
        fetch('http://localhost:5000/api/hero-banner')
            .then(res => res.json())
            .then(data => {
                console.log('Hero banner settings loaded:', data);
                setHeroBanner(data);
            })
            .catch((error) => {
                // Use default values if API fails
                console.log('Using default hero banner settings due to error:', error);
            });
    }, []);

    // Auto-rotate hero banner images
    useEffect(() => {
        if (heroBanner.heroBannerImages && heroBanner.heroBannerImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prev => (prev + 1) % heroBanner.heroBannerImages.length);
            }, 4000); // Change every 4 seconds
            
            return () => clearInterval(interval);
        }
    }, [heroBanner.heroBannerImages]);

    const handlePrevTestimonial = () => {
        setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };
    const handleNextTestimonial = () => {
        setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    };

    const currentTestimonial = testimonials[testimonialIndex] || {};
    const DEFAULT_IMAGE = '/placeholder.png'; // Place this in your public folder

    // Slider navigation functions
    const totalSlides = Math.ceil(featuredProducts.length / itemsPerSlide);
    
    const nextSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }
    };
    
    const prevSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
        }
    };
    
    const goToSlide = (slideIndex) => {
        if (totalSlides > 1 && slideIndex >= 0 && slideIndex < totalSlides) {
            setCurrentSlide(slideIndex);
        }
    };
    
    // Reset current slide when itemsPerSlide changes
    useEffect(() => {
        setCurrentSlide(0);
    }, [itemsPerSlide, featuredProducts.length]);

    return (
        <PageLoader isLoading={loading} text="Loading featured products...">
            <>
                <style>
                {`
                    /* Testimonials Theme Styles */
                    .testimonials-container {
                        margin-top: 2rem;
                    }
                    
                    /* Default Theme */
                    .testimonial-item.testimonial-default {
                        background: white;
                        padding: 20px;
                        border: 1px solid #ddd;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    
                    /* Modern Theme */
                    .testimonial-item.testimonial-modern {
                        background: linear-gradient(135deg, white 0%, #f8f9fa 100%);
                        padding: 25px;
                        border: none;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                        text-align: center;
                        transition: transform 0.3s ease;
                    }
                    
                    .testimonial-item.testimonial-modern:hover {
                        transform: translateY(-5px);
                    }
                    
                    /* Minimal Theme */
                    .testimonial-item.testimonial-minimal {
                        background: transparent;
                        padding: 20px;
                        border-left: 3px solid;
                        box-shadow: none;
                        text-align: left;
                    }
                    
                    /* Elegant Theme */
                    .testimonial-item.testimonial-elegant {
                        background: white;
                        padding: 30px;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        text-align: left;
                        position: relative;
                    }
                    
                    .testimonial-item.testimonial-elegant {
                        position: relative;
                    }
                    
                    .elegant-quote-mark {
                        z-index: 1;
                    }
                    
                    /* Bold Theme */
                    .testimonial-item.testimonial-bold {
                        background: inherit;
                        color: white;
                        padding: 25px;
                        border: none;
                        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                        text-align: center;
                        transform: rotate(-1deg);
                    }
                    
                    /* Animation Classes */
                    .testimonials-container[style*="fade"] .testimonial-item {
                        opacity: 0;
                        animation: fadeIn 0.6s ease-out forwards;
                    }
                    
                    .testimonials-container[style*="slide"] .testimonial-item {
                        opacity: 0;
                        transform: translateY(30px);
                        animation: slideUp 0.6s ease-out forwards;
                    }
                    
                    .testimonials-container[style*="bounce"] .testimonial-item {
                        opacity: 0;
                        animation: bounceIn 0.6s ease-out forwards;
                    }
                    
                    .testimonials-container[style*="zoom"] .testimonial-item {
                        opacity: 0;
                        transform: scale(0.8);
                        animation: zoomIn 0.6s ease-out forwards;
                    }
                    
                    /* Animation Keyframes */
                    @keyframes fadeIn {
                        to { opacity: 1; }
                    }
                    
                    @keyframes slideUp {
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                    
                    @keyframes bounceIn {
                        0% { opacity: 0; transform: scale(0.3); }
                        50% { opacity: 1; transform: scale(1.05); }
                        70% { transform: scale(0.9); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    
                    @keyframes zoomIn {
                        to { 
                            opacity: 1; 
                            transform: scale(1); 
                        }
                    }
                    
                    /* Testimonials Grid */
                    .testimonials-grid {
                        margin-top: 2rem;
                    }
                    
                    .testimonial-item {
                        margin-bottom: 1rem;
                    }
                    
                    .testimonial-image {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    
                    .testimonial-text {
                        margin-bottom: 15px;
                        font-style: italic;
                        line-height: 1.6;
                    }
                    
                    .testimonial-author {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    
                    .testimonial-author h4 {
                        margin: 0 0 5px 0;
                        font-size: 18px;
                    }
                    
                    .testimonial-author p {
                        margin: 0;
                        color: #666;
                        font-size: 14px;
                    }
                    
                    .testimonial-stars {
                        text-align: center;
                        font-size: 18px;
                    }
                    
                    .star {
                        margin: 0 2px;
                    }
                    
                    /* Hero Carousel Styles */
                    .hero {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .hero-navigation {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        padding: 0 20px;
                        z-index: 10;
                    }
                    
                    .nav-arrow {
                        background: rgba(0, 0, 0, 0.5);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        font-size: 24px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .nav-arrow:hover {
                        background: rgba(0, 0, 0, 0.8);
                        transform: scale(1.1);
                    }
                    
                    .hero-indicators {
                        position: absolute;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 10px;
                        z-index: 10;
                    }
                    
                    .indicator {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.5);
                        transition: all 0.3s ease;
                    }
                    
                    .indicator.active {
                        background: white;
                        transform: scale(1.2);
                    }
                    
                    .indicator:hover {
                        background: rgba(255, 255, 255, 0.8);
                    }
                    
                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .testimonials-grid {
                            grid-template-columns: 1fr !important;
                        }
                        
                        .nav-arrow {
                            width: 40px;
                            height: 40px;
                            font-size: 20px;
                        }
                    }
                    
                    @media (max-width: 1024px) {
                        .testimonials-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                        }
                    }
                `}
            </style>
            <div className="home">
            <div className="home-main-content">
            {/* Modern Hero Section */}
            <ModernHero />

            {/* Featured Categories */}
            <section className="featured-categories">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Categories</h2>
                        <Link to="/products" className="view-all">View All Categories →</Link>
                    </div>
                    {categoriesLoading ? (
                        <div className="categories-loading">
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <p>Loading categories...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="categories-grid">
                            {categories.map((category, index) => (
                                <Link
                                    key={index}
                                    to={`/products?category=${encodeURIComponent(category.categoryName)}`}
                                    className="category-card"
                                >
                                    <div className="category-icon">{category.icon}</div>
                                    <h3>{category.name}</h3>
                                    <p>{category.count} Products</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-products">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Products</h2>
                        <Link to="/products" className="view-all">View All Products →</Link>
                    </div>
                    {loading ? (
                        <div className="loading">Loading featured products...</div>
                    ) : (
                        <div className="products-slider">
                            <button 
                                className="slider-nav prev" 
                                onClick={prevSlide}
                                disabled={totalSlides <= 1}
                                aria-label="Previous products"
                            >
                                ‹
                            </button>
                            <div className="products-slider-container" style={{
                                transform: `translateX(-${currentSlide * 100}%)`
                            }}>
                                {Array.from({ length: totalSlides }, (_, slideIndex) => {
                                    const slideProducts = featuredProducts.slice(
                                        slideIndex * itemsPerSlide, 
                                        (slideIndex + 1) * itemsPerSlide
                                    );
                                    
                                    return (
                                        <div key={slideIndex} className="slide">
                                            {slideProducts.map(product => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                            <button 
                                className="slider-nav next" 
                                onClick={nextSlide}
                                disabled={totalSlides <= 1}
                                aria-label="Next products"
                            >
                                ›
                            </button>
                            <div className="slider-dots">
                                {Array.from({ length: totalSlides }, (_, index) => (
                                    <button
                                        key={index}
                                        className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                                        onClick={() => goToSlide(index)}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Modern Testimonials Section */}
            <ModernTestimonials designSettings={testimonialsDesign} />
            
            {/* Contact Section with Map */}
            <ContactSection />
            </div>
        </div>
        </>
        </PageLoader>
    );
};

export default Home;
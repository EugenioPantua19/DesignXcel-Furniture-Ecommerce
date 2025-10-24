import React, { useState, useEffect, useRef } from 'react';
import './slider.css';

const Slider = ({ 
  children, 
  itemsPerView = 4, 
  showArrows = true, 
  showDots = true, 
  autoPlay = false, 
  autoPlayInterval = 3000,
  className = '',
  title = '',
  subtitle = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(itemsPerView);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);

  // Update items per slide based on screen size and content type
  useEffect(() => {
    const updateItemsPerSlide = () => {
      const width = window.innerWidth;
      const isTestimonials = className.includes('testimonials');
      const isProducts = className.includes('products');
      const isCategories = className.includes('categories');
      
      if (width <= 480) {
        // Mobile: 3 items for categories, 2 for products, 1 for testimonials
        if (isTestimonials) setItemsPerSlide(1);
        else if (isProducts) setItemsPerSlide(2);
        else if (isCategories) setItemsPerSlide(3);
        else setItemsPerSlide(2); // default
      } else if (width <= 768) {
        // Tablet: 3 items for categories, 2 for products, 1 for testimonials
        if (isTestimonials) setItemsPerSlide(1);
        else if (isProducts) setItemsPerSlide(2);
        else if (isCategories) setItemsPerSlide(3);
        else setItemsPerSlide(2); // default
      } else if (width <= 1199) {
        // Desktop: 3 items for categories/products, 2 for testimonials
        setItemsPerSlide(isTestimonials ? 2 : 3);
      } else {
        // Large desktop: 4 items for categories/products, 3 for testimonials
        setItemsPerSlide(isTestimonials ? 3 : 4);
      }
    };

    updateItemsPerSlide();
    window.addEventListener('resize', updateItemsPerSlide);
    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, [itemsPerView, className]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && children.length > itemsPerSlide) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, children.length, itemsPerSlide]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay && children.length > itemsPerSlide) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
  };

  const totalSlides = Math.ceil(children.length / itemsPerSlide);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && totalSlides > 1) {
      nextSlide();
    }
    if (isRightSwipe && totalSlides > 1) {
      prevSlide();
    }
  };

  // Reset current slide when itemsPerSlide changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerSlide]);

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <div className={`slider-container ${className}`}>
      {(title || subtitle) && (
        <div className="slider-header">
          {title && <h2 className="slider-title">{title}</h2>}
          {subtitle && <p className="slider-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div 
        className="slider-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showArrows && totalSlides > 1 && (
          <>
            <button 
              className="slider-arrow slider-arrow-prev"
              onClick={prevSlide}
              disabled={isTransitioning}
              aria-label="Previous slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="slider-arrow slider-arrow-next"
              onClick={nextSlide}
              disabled={isTransitioning}
              aria-label="Next slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        <div className="slider-track" ref={sliderRef}>
          <div 
            className="slider-content"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none'
            }}
          >
            {Array.from({ length: totalSlides }, (_, slideIndex) => {
              const slideItems = children.slice(
                slideIndex * itemsPerSlide,
                (slideIndex + 1) * itemsPerSlide
              );
              
              return (
                <div key={slideIndex} className="slider-slide">
                  {slideItems}
                </div>
              );
            })}
          </div>
        </div>

        {showDots && totalSlides > 1 && (
          <div className="slider-dots">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;

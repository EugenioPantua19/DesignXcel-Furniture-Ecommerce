import React, { useState, useEffect } from 'react';
import { FaChevronUp } from 'react-icons/fa';
import './ScrollUpButton.css';

/**
 * ScrollUpButton Component
 * A minimal, simple scroll-up button that matches the frontend design
 */
const ScrollUpButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Scroll to top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            className={`scroll-up-button ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
        >
            <FaChevronUp size={20} />
        </button>
    );
};

export default ScrollUpButton;

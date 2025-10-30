import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChristmasIcons } from '../christmas';

const Footer = () => {
  const [contactData, setContactData] = useState({
    email: 'info@designxcel.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business District, Office Plaza, Suite 500, Metro City, MC 12345'
  });
  const [currentTheme, setCurrentTheme] = useState('default');

  // Fetch contact data from the same API endpoint as header
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBase}/api/header-banner`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setContactData({
              email: data.contactEmail || 'designexcellence1@gmail.com',
              phone: data.contactPhone || '(02) 413-6682',
              address: data.contactAddress || '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City'
            });
          }
        }
      } catch (error) {
        // Error fetching contact data - keep default values
      }
    };

    fetchContactData();
  }, []);

  // Detect current theme from body class
  useEffect(() => {
    const detectTheme = () => {
      const bodyClasses = document.body.className;
      if (bodyClasses.includes('theme-christmas')) {
        setCurrentTheme('christmas');
      } else if (bodyClasses.includes('theme-dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('default');
      }
    };

    // Initial detection
    detectTheme();

    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer-main" style={{ padding: '1rem 0 0', minHeight: '240px' }}>
      <div className="footer-container" style={{ padding: '0 1rem' }}>
        {/* Main Footer Content */}
        <div className="footer-content" style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '1rem', 
          paddingBottom: '1rem' 
        }}>
          {/* Left Section - Company Info */}
          <div className="footer-section footer-company" style={{ textAlign: 'left' }}>
            <div className="footer-logo" style={{ width: '160px', height: '40px' }}>
              <img src="/design-excellence-logo.png" alt="Design Excellence Logo" className="footer-logo-img" width={160} height={40} style={{ width: '160px', height: '40px', objectFit: 'contain' }} />
            </div>
            <p className="footer-description" style={{ color: '#FFFFFF', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.5rem' }}>
              Premium office furniture for modern workplaces. We specialize in ergonomic solutions that enhance productivity and comfort for your business.
            </p>
            <div className="social-links" style={{ gap: '0.5rem', display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <a href="https://www.facebook.com/designexcellence01/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook" style={{ textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Center Sections */}
          <div className="footer-section" style={{ textAlign: 'left' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Company</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.3rem' }}><Link to="/about" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.8rem' }}>About Us</Link></li>
              <li style={{ marginBottom: '0.3rem' }}><Link to="/products" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.8rem' }}>Our Products</Link></li>
              <li style={{ marginBottom: '0.3rem' }}><Link to="/contact" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.8rem' }}>Contact Us</Link></li>
            </ul>
          </div>
          
          <div className="footer-section" style={{ textAlign: 'left' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Customer Services</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.3rem' }}><Link to="/account" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.8rem' }}>My Account</Link></li>
              <li style={{ marginBottom: '0.3rem' }}><Link to="/orders" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.8rem' }}>Track Your Order</Link></li>
            </ul>
          </div>
          
          
          {/* Right Section - Contact Info */}
          <div className="footer-section footer-contact" style={{ textAlign: 'left', maxWidth: '250px' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Contact Info</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '500', minWidth: '45px', flexShrink: 0 }}>Phone:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.75rem', lineHeight: '1.3' }}>{contactData.phone}</span>
              </li>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '500', minWidth: '45px', flexShrink: 0 }}>Email:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.75rem', lineHeight: '1.3' }}>{contactData.email}</span>
              </li>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '500', minWidth: '45px', flexShrink: 0 }}>Address:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.75rem', lineHeight: '1.3' }}>{contactData.address}</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="footer-bottom" style={{ padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="footer-container">
            <div className="footer-bottom-content" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '1rem'
            }}>
              {currentTheme === 'christmas' && (
                <div className="christmas-footer-decoration">
                  <ChristmasIcons.Sleigh size={16} />
                  <ChristmasIcons.Reindeer size={16} />
                </div>
              )}
              <p className="copyright" style={{ color: '#FFFFFF', fontSize: '0.8rem', margin: 0 }}>Copyright © 2024 DesignXcel. All Rights Reserved.</p>
              {currentTheme === 'christmas' && (
                <div className="christmas-footer-decoration">
                  <ChristmasIcons.Gift size={16} />
                  <ChristmasIcons.Bell size={16} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
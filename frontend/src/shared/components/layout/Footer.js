import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [contactData, setContactData] = useState({
    email: 'info@designxcel.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business District, Office Plaza, Suite 500, Metro City, MC 12345'
  });

  // Fetch contact data from the same API endpoint as header
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await fetch('/api/header-banner');
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
        console.error('Error fetching contact data:', error);
        // Keep default values on error
      }
    };

    fetchContactData();
  }, []);

  return (
    <footer className="footer-main" style={{ padding: '0.75rem 0 0' }}>
      <div className="footer-container" style={{ padding: '0 1rem' }}>
        {/* Main Footer Content */}
        <div className="footer-content" style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '0.75rem', 
          paddingBottom: '0.75rem' 
        }}>
          {/* Left Section - Company Info */}
          <div className="footer-section footer-company" style={{ textAlign: 'left' }}>
            <div className="footer-logo">
              <img src="/design-excellence-logo.png" alt="Design Excellence Logo" className="footer-logo-img" />
            </div>
            <p className="footer-description" style={{ color: '#FFFFFF', fontSize: '0.85rem', lineHeight: '1.3', marginBottom: '0.75rem' }}>
              Premium office furniture for modern workplaces. We specialize in ergonomic solutions that enhance productivity and comfort for your business.
            </p>
            <div className="social-links" style={{ gap: '0.75rem', display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <a href="https://www.facebook.com/designexcellence01/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook" style={{ textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4D5157">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter" style={{ textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#4D5157">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Center Sections */}
          <div className="footer-section" style={{ textAlign: 'left' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>Company</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/about" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>About Us</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/products" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Our Products</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/contact" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Contact Us</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/careers" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Careers</Link></li>
            </ul>
          </div>
          
          <div className="footer-section" style={{ textAlign: 'left' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>Customer Services</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/account" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>My Account</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/track-order" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Track Your Order</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/returns" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Returns & Exchanges</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/faq" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-section" style={{ textAlign: 'left' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>Our Information</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/privacy" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy Policy</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/terms" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Terms & Conditions</Link></li>
              <li style={{ marginBottom: '0.4rem' }}><Link to="/shipping" className="footer-link" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.85rem' }}>Shipping Policy</Link></li>
            </ul>
          </div>
          
          {/* Right Section - Contact Info */}
          <div className="footer-section footer-contact" style={{ textAlign: 'left', maxWidth: '250px' }}>
            <h4 className="footer-subtitle" style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Contact Info</h4>
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '500', minWidth: '50px', flexShrink: 0 }}>Phone:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.8rem', lineHeight: '1.3' }}>{contactData.phone}</span>
              </li>
              <li style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '500', minWidth: '50px', flexShrink: 0 }}>Email:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.8rem', lineHeight: '1.3' }}>{contactData.email}</span>
              </li>
              <li style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="contact-label" style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '500', minWidth: '50px', flexShrink: 0 }}>Address:</span>
                <span className="contact-value" style={{ color: '#FFFFFF', fontSize: '0.8rem', lineHeight: '1.3' }}>{contactData.address}</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="footer-bottom" style={{ padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="footer-container">
            <div className="footer-bottom-content" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <p className="copyright" style={{ color: '#FFFFFF', fontSize: '0.8rem', margin: 0 }}>Copyright © 2024 DesignXcel. All Rights Reserved.</p>
              <div className="footer-controls">
                <div className="control-group">
                  <select className="control-select" style={{ 
                    background: 'transparent', 
                    color: '#FFFFFF', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '4px', 
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.8rem'
                  }}>
                    <option value="en" style={{ background: '#F0B21B', color: '#333' }}>English</option>
                    <option value="es" style={{ background: '#F0B21B', color: '#333' }}>Español</option>
                    <option value="fr" style={{ background: '#F0B21B', color: '#333' }}>Français</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
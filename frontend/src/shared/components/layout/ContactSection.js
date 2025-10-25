import React, { useState } from 'react';
import apiConfig from '../../services/api/apiConfig.js';
import EnhancedLeafletMap from '../ui/EnhancedLeafletMap';
import '../ui/LeafletMap.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(apiConfig.getApiUrl('/api/contact/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
        // Contact form submission failed
      }
    } catch (error) {
      setSubmitStatus('error');
      // Contact form submission error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-content">
          {/* Left Column - Contact Information */}
          <div className="contact-info-column">
            <h2 className="contact-title">Get Touch in Excellence</h2>
            <p className="contact-description">
              Have questions about our premium office solutions? Our team is here to help you create the perfect workspace.
            </p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Email Us</h4>
                  <p>info@designexcellence.com</p>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9846 21.5573 21.2136 21.3521 21.4019C21.1469 21.5902 20.9046 21.7335 20.6407 21.8227C20.3768 21.9119 20.0974 21.9454 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3146 6.72533 15.2661 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.09456 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85685 2.63476 2.65219C2.82196 2.44753 3.04965 2.28369 3.30351 2.17162C3.55737 2.05956 3.83197 2.00195 4.10999 2H7.10999C7.59522 1.99522 8.06569 2.16708 8.43373 2.48353C8.80177 2.79999 9.04201 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97351 7.27675 9.89382 7.65353C9.81413 8.03031 9.62902 8.37769 9.35999 8.65L8.08999 9.92C9.51351 12.4135 11.5865 14.4865 14.08 15.91L15.35 14.64C15.6223 14.3709 15.9697 14.1858 16.3465 14.1061C16.7233 14.0264 17.1121 14.0554 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5765C21.8437 15.9498 22.0122 16.4258 22 16.92Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Call Us</h4>
                  <p>+1 234 567 890</p>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <h4>Visit Us</h4>
                  <p>1 Binmaka St, cor Biak na Bato, Quezon City, 1115 Kalakhang Maynila</p>
                </div>
              </div>
            </div>
            
            <div className="contact-tagline">
              Creating exceptional office environments through innovative furniture solutions.
            </div>
            
            {/* Social Media Links */}
            <div className="contact-social-links">
              <h4 className="social-links-title">Follow Us</h4>
              <div className="social-links">
                <a href="https://www.facebook.com/designexcellence01/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Right Column - Contact Form */}
          <div className="contact-form-column">
            <div className="contact-form-header">
              Contact Form
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              {/* Success/Error Messages */}
              {submitStatus === 'success' && (
                <div className="form-message form-message-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Thank you for your message! We will get back to you soon.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="form-message form-message-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Failed to send your message. Please try again later.
                </div>
              )}

              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <textarea
                  name="message"
                  placeholder="Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Map Section */}
        <div className="contact-map-section">
          <div className="map-container">
            <h3 className="map-title">Find Us</h3>
            <div className="map-wrapper">
              <EnhancedLeafletMap
                height="450px"
                width="100%"
              />
            </div>
            <div className="map-address">
              <div className="address-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="address-text">
                <strong>Address:</strong><br />
                1 Binmaka St, cor Biak na Bato, Quezon City, 1115 Kalakhang Maynila
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

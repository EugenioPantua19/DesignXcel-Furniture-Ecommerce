import React, { useState, useEffect } from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import Slider from '../ui/Slider';
import AudioLoader from '../ui/AudioLoader';
import { getImageUrl } from '../../utils/imageUtils';
import './testimonials.css';
import '../ui/slider.css';

const Testimonials = ({ designSettings = {} }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/testimonials`);
      if (response.ok) {
        const data = await response.json();
        // Extract testimonials array from the response
        setTestimonials(data.testimonials || []);
      } else {
        // Fallback to default testimonials if API fails
        setTestimonials(getDefaultTestimonials());
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials(getDefaultTestimonials());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTestimonials = () => [
    {
      id: 1,
      name: "Leslie Alexander",
      profession: "Architecture",
      rating: 5.0,
      text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
      imageUrl: "/images/testimonials/leslie.jpg"
    },
    {
      id: 2,
      name: "Jenny Wilson",
      profession: "Interior Designer",
      rating: 5.0,
      text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
      imageUrl: "/images/testimonials/jenny.jpg"
    }
  ];

  // Navigation functions removed - now handled by Slider component

  if (loading) {
    return (
      <section className="testimonials">
        <div className="container">
          <div className="loading">
            <AudioLoader size="large" color="#F0B21B" />
            <p>Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  // Apply design settings
  const sectionStyle = {
    backgroundColor: designSettings.bgColor || '#f8f9fa'
  };

  const accentColor = designSettings.accentColor || '#F0B21B';

  return (
    <section className="testimonials" style={sectionStyle}>
      <div className="container">
        {/* Header */}
        <div className="testimonials-header">
          <div className="testimonials-label">
            <div className="label-line" style={{ backgroundColor: accentColor }}></div>
            <span>TESTIMONIAL</span>
          </div>
          <h2 className="testimonials-title">
            <span>What Our</span> <span className="accent-text">Clients Say</span>
          </h2>
        </div>

        {/* Desktop Layout - Grid if < 6 items, Slider if >= 6 items */}
        {testimonials.length < 6 ? (
          <div className="testimonials-grid desktop-only">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                {/* Quote Icon - Only show if enabled */}
                {designSettings.showQuoteIcon !== false && (
                  <div className="quote-icon" style={{ color: accentColor }}>
                    <FaQuoteLeft />
                  </div>
                )}

                {/* Client Profile */}
                <div className="client-profile">
                  {/* Profile Image - Only show if enabled */}
                  {designSettings.showImage !== false && (
                    <div className="profile-image-container">
                      <div className="profile-bg" style={{ backgroundColor: accentColor }}></div>
                      <img
                        src={getImageUrl(testimonial.imageUrl) || '/images/placeholder-avatar.svg'}
                        alt={testimonial.name}
                        className="profile-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder-avatar.svg';
                        }}
                      />
                    </div>
                  )}
                  <div className="client-info">
                    <h4 className="client-name">{testimonial.name}</h4>
                    {/* Profession - Only show if enabled */}
                    {designSettings.showTitle !== false && (
                      <p className="client-profession">{testimonial.profession}</p>
                    )}
                    {/* Rating - Only show if enabled */}
                    {designSettings.showRating !== false && (
                      <div className="client-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className="star" style={{ color: accentColor }} />
                          ))}
                        </div>
                        <span className="rating-value">{testimonial.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimonial Text */}
                <div className="testimonial-text">
                  <p>{testimonial.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Slider 
            itemsPerView={3}
            showArrows={true}
            showDots={true}
            autoPlay={true}
            autoPlayInterval={6000}
            className="testimonials-slider desktop-only"
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                {/* Quote Icon - Only show if enabled */}
                {designSettings.showQuoteIcon !== false && (
                  <div className="quote-icon" style={{ color: accentColor }}>
                    <FaQuoteLeft />
                  </div>
                )}

                {/* Client Profile */}
                <div className="client-profile">
                  {/* Profile Image - Only show if enabled */}
                  {designSettings.showImage !== false && (
                    <div className="profile-image-container">
                      <div className="profile-bg" style={{ backgroundColor: accentColor }}></div>
                      <img
                        src={getImageUrl(testimonial.imageUrl) || '/images/placeholder-avatar.svg'}
                        alt={testimonial.name}
                        className="profile-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder-avatar.svg';
                        }}
                      />
                    </div>
                  )}
                  <div className="client-info">
                    <h4 className="client-name">{testimonial.name}</h4>
                    {/* Profession - Only show if enabled */}
                    {designSettings.showTitle !== false && (
                      <p className="client-profession">{testimonial.profession}</p>
                    )}
                    {/* Rating - Only show if enabled */}
                    {designSettings.showRating !== false && (
                      <div className="client-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className="star" style={{ color: accentColor }} />
                          ))}
                        </div>
                        <span className="rating-value">{testimonial.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimonial Text */}
                <div className="testimonial-text">
                  <p>{testimonial.text}</p>
                </div>
              </div>
            ))}
          </Slider>
        )}

        {/* Mobile Slider Layout */}
        <Slider 
          itemsPerView={2}
          showArrows={true}
          showDots={true}
          autoPlay={true}
          autoPlayInterval={6000}
          className="testimonials-slider mobile-only"
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              {/* Quote Icon - Only show if enabled */}
              {designSettings.showQuoteIcon !== false && (
                <div className="quote-icon" style={{ color: accentColor }}>
                  <FaQuoteLeft />
                </div>
              )}

              {/* Client Profile */}
              <div className="client-profile">
                {/* Profile Image - Only show if enabled */}
                {designSettings.showImage !== false && (
                  <div className="profile-image-container">
                    <div className="profile-bg" style={{ backgroundColor: accentColor }}></div>
                    <img
                      src={getImageUrl(testimonial.imageUrl) || '/images/placeholder-avatar.svg'}
                      alt={testimonial.name}
                      className="profile-image"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-avatar.svg';
                      }}
                    />
                  </div>
                )}
                <div className="client-info">
                  <h4 className="client-name">{testimonial.name}</h4>
                  {/* Profession - Only show if enabled */}
                  {designSettings.showTitle !== false && (
                    <p className="client-profession">{testimonial.profession}</p>
                  )}
                  {/* Rating - Only show if enabled */}
                  {designSettings.showRating !== false && (
                    <div className="client-rating">
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar key={star} className="star" style={{ color: accentColor }} />
                        ))}
                      </div>
                      <span className="rating-value">{testimonial.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Testimonial Text */}
              <div className="testimonial-text">
                <p>{testimonial.text}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonials;
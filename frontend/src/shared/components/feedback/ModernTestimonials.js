import React, { useState, useEffect } from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import './modern-testimonials.css';

const ModernTestimonials = ({ designSettings = {} }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/testimonials');
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
      imageURL: "/images/testimonials/leslie.jpg"
    },
    {
      id: 2,
      name: "Jenny Wilson",
      profession: "Interior Designer",
      rating: 5.0,
      text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
      imageURL: "/images/testimonials/jenny.jpg"
    }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const handleIndicatorClick = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <section className="modern-testimonials">
        <div className="container">
          <div className="loading">Loading testimonials...</div>
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
    <section className="modern-testimonials" style={sectionStyle}>
      <div className="container">
        {/* Header */}
        <div className="testimonials-header">
          <div className="testimonials-label">
            <div className="label-line" style={{ backgroundColor: accentColor }}></div>
            <span>Testimonial</span>
          </div>
          <h2 className="testimonials-title">
            What Our <span className="accent-text" style={{ color: accentColor }}>Clients Say</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="testimonials-grid">
          {testimonials.slice(0, 2).map((testimonial, index) => (
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
                      src={testimonial.imageURL ? `http://localhost:5000${testimonial.imageURL}` : '/images/placeholder-avatar.svg'}
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

        {/* Navigation Indicators - Only show if more than 2 testimonials */}
        {testimonials.length > 2 && (
          <div className="testimonials-indicators">
            {Array.from({ length: Math.ceil(testimonials.length / 2) }, (_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                style={{ 
                  backgroundColor: index === currentIndex ? accentColor : '#d1d5db' 
                }}
                onClick={() => handleIndicatorClick(index)}
                aria-label={`Go to testimonial page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ModernTestimonials;

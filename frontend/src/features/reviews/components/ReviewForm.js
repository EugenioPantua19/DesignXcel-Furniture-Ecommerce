import React, { useState } from 'react';

const ReviewForm = ({ productId, productName, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    comment: '',
    images: []
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating: rating
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    const newImages = [...imageFiles, ...videoFiles].map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Review title is required';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Review content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('rating', formData.rating);
      submitData.append('title', formData.title);
      submitData.append('comment', formData.comment);
      submitData.append('productId', productId);
      
      // Append image files
      formData.images.forEach((image, index) => {
        submitData.append(`images`, image.file);
      });

      const result = await onSubmit(submitData);
      
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          rating: 5,
          title: '',
          comment: '',
          images: []
        });
        setErrors({});
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit review' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`star-btn ${i <= rating ? 'active' : ''}`}
          onClick={() => handleRatingChange(i)}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="review-form-container">
      <div className="review-form">
        <h3>Add your review</h3>
        <p className="form-note">Your email address will not be published. Required fields are marked*</p>
        
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex. John Doe"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@gmail.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label>Your Rating *</label>
            <div className="rating-input">
              {renderStars(formData.rating)}
            </div>
          </div>

          {/* Review Title */}
          <div className="form-group">
            <label htmlFor="title">Add Review Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Write Title here"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Review Content */}
          <div className="form-group">
            <label htmlFor="comment">Add Detailed Review *</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Write here"
              rows="5"
              className={errors.comment ? 'error' : ''}
            />
            {errors.comment && <span className="error-message">{errors.comment}</span>}
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>Photo / Video (Optional)</label>
            <div className="image-upload-area">
              <div className="upload-zone">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="3"/>
                  <path d="M12 10v6"/>
                  <path d="M9 13h6"/>
                </svg>
                <p>Drag a Photo or Video</p>
                <button type="button" className="browse-btn">
                  Browse
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
              </div>
            </div>
            
            {/* Preview uploaded images */}
            {formData.images.length > 0 && (
              <div className="image-preview">
                {formData.images.map((image, index) => (
                  <div key={index} className="preview-item">
                    <img src={image.url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                    {image.type === 'video' && (
                      <div className="video-indicator">Video</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

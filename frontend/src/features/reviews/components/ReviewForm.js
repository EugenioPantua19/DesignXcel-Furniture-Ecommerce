import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  MessageIcon, 
  ImageIcon, 
  VideoIcon, 
  SendIcon, 
  StarIcon,
  XIcon,
  CameraIcon,
  LockIcon,
  AlertTriangleIcon,
  PlayIcon,
  SparklesIcon
} from '../../../shared/components/ui/SvgIcons';
import './review-form.css';

const ReviewForm = ({ productId, productName, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5, // Default to 5 stars
    title: '',
    comment: '',
    images: []
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Debug: Monitor rating state changes
  useEffect(() => {
    console.log('Frontend: Rating state changed to:', formData.rating, 'Type:', typeof formData.rating);
  }, [formData.rating]);

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
    console.log('Frontend: Rating changed to:', rating, 'Type:', typeof rating);
    setFormData(prev => ({
      ...prev,
      rating: rating
    }));
    
    // Clear rating error when user selects a rating
    if (errors.rating) {
      setErrors(prev => ({
        ...prev,
        rating: ''
      }));
    }
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

    // Validate rating
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Please select a rating between 1 and 5 stars';
    }

    console.log('Frontend: Form validation - Rating:', formData.rating, 'Type:', typeof formData.rating);

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
      // Ensure rating is a valid number before submission
      const ratingValue = Number(formData.rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setErrors({ submit: 'Please select a valid rating between 1 and 5 stars' });
        setSubmitting(false);
        return;
      }

      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('rating', String(ratingValue)); // Ensure it's a string for FormData
      submitData.append('title', formData.title);
      submitData.append('comment', formData.comment);
      submitData.append('productId', productId);
      
      // Debug logging
      console.log('Frontend: Form data before submission:', formData);
      console.log('Frontend: Rating value:', formData.rating, 'Type:', typeof formData.rating);
      console.log('Frontend: Converted rating value:', ratingValue, 'Type:', typeof ratingValue);
      
      // Append image files
      formData.images.forEach((image, index) => {
        submitData.append(`images`, image.file);
      });

      // Log FormData contents
      console.log('Frontend: FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}:`, value, 'Type:', typeof value);
      }

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
          <StarIcon size={20} />
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="review-form-container">
      <div className="review-form">
        <div className="form-header">
          <div className="header-content">
            <MessageIcon size={24} className="header-icon" />
            <div>
              <h3>Share Your Experience</h3>
              <p className="form-subtitle">Help others by sharing your honest review of {productName}</p>
            </div>
          </div>
          <p className="form-note">
            <span className="privacy-note">
              <LockIcon size={14} className="privacy-icon" />
              Your email will not be published
            </span>
            <span className="required-note">* Required fields</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="form-section">
            <div className="section-header">
              <UserIcon size={20} className="section-icon" />
              <h4>Your Information</h4>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  <UserIcon size={16} className="label-icon" />
                  Full Name *
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.name ? 'error' : ''}
                  />
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">
                  <MessageIcon size={16} className="label-icon" />
                  Email Address *
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="form-section">
            <div className="section-header">
              <StarIcon size={20} className="section-icon" />
              <h4>Rate This Product</h4>
            </div>
            <div className="rating-section">
              <div className="rating-label-container">
                <label>How would you rate this product? *</label>
                <div className="rating-description">
                  <span className="rating-text">
                    {formData.rating === 1 && "Poor - Not satisfied"}
                    {formData.rating === 2 && "Fair - Below expectations"}
                    {formData.rating === 3 && "Good - Meets expectations"}
                    {formData.rating === 4 && "Very Good - Exceeds expectations"}
                    {formData.rating === 5 && "Excellent - Outstanding quality"}
                  </span>
                </div>
              </div>
              <div className="rating-input">
                {renderStars(formData.rating)}
              </div>
              {errors.rating && <span className="error-message">{errors.rating}</span>}
            </div>
          </div>

          {/* Review Content Section */}
          <div className="form-section">
            <div className="section-header">
              <MessageIcon size={20} className="section-icon" />
              <h4>Your Review</h4>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">
                <MessageIcon size={16} className="label-icon" />
                Review Title *
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Summarize your experience in a few words"
                  className={errors.title ? 'error' : ''}
                />
              </div>
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="comment">
                <MessageIcon size={16} className="label-icon" />
                Detailed Review *
              </label>
              <div className="textarea-wrapper">
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Share your detailed experience with this product. What did you like? What could be improved? How does it meet your needs?"
                  rows="6"
                  className={errors.comment ? 'error' : ''}
                />
                <div className="character-count">
                  {formData.comment.length}/500 characters
                </div>
              </div>
              {errors.comment && <span className="error-message">{errors.comment}</span>}
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="form-section">
            <div className="section-header">
              <CameraIcon size={20} className="section-icon" />
              <h4>Add Photos or Videos</h4>
              <span className="optional-badge">Optional</span>
            </div>
            
            <div className="upload-section">
              <div className="upload-info">
                <p>Help others by sharing photos or videos of the product</p>
                <div className="upload-tips">
                  <span className="tip">
                    <CameraIcon size={12} className="tip-icon" />
                    Show the product in use
                  </span>
                  <span className="tip">
                    <PlayIcon size={12} className="tip-icon" />
                    Share unboxing or setup videos
                  </span>
                  <span className="tip">
                    <SparklesIcon size={12} className="tip-icon" />
                    Highlight key features
                  </span>
                </div>
              </div>
              
              <div className="upload-zone">
                <div className="upload-content">
                  <div className="upload-icons">
                    <ImageIcon size={32} className="upload-icon" />
                    <VideoIcon size={32} className="upload-icon" />
                  </div>
                  <div className="upload-text">
                    <h5>Drag & Drop or Click to Upload</h5>
                    <p>Support: JPG, PNG, MP4, MOV (Max 10MB each)</p>
                  </div>
                  <button type="button" className="browse-btn">
                    <CameraIcon size={16} />
                    Choose Files
                  </button>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
              </div>
              
              {/* Preview uploaded media */}
              {formData.images.length > 0 && (
                <div className="media-preview">
                  <div className="preview-header">
                    <span className="preview-count">{formData.images.length} file(s) selected</span>
                  </div>
                  <div className="preview-grid">
                    {formData.images.map((image, index) => (
                      <div key={index} className="preview-item">
                        <div className="preview-content">
                          {image.type === 'video' ? (
                            <div className="video-preview">
                              <VideoIcon size={24} className="video-icon" />
                              <span className="video-label">Video</span>
                            </div>
                          ) : (
                            <img src={image.url} alt={`Preview ${index + 1}`} />
                          )}
                        </div>
                        <button
                          type="button"
                          className="remove-media"
                          onClick={() => removeImage(index)}
                          title="Remove file"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message submit-error">
              <AlertTriangleIcon size={16} className="error-icon" />
              {errors.submit}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  Publishing Review...
                </>
              ) : (
                <>
                  <SendIcon size={16} />
                  Publish Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

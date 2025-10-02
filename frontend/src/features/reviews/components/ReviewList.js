import React from 'react';

const ReviewList = ({ reviews, loading, currentPage, totalPages, onPageChange }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <svg 
          key={i} 
          className={`star ${i < rating ? 'star-filled' : 'star-empty'}`}
          viewBox="0 0 20 20" 
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      );
    }
    return stars;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="review-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="review-list empty">
        <div className="empty-state">
          <h4>No reviews yet</h4>
          <p>Be the first to review this product!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <div key={review.id} className="review-item">
          <div className="review-header">
            <div className="reviewer-info">
              <div className="reviewer-avatar">
                {review.profileImage ? (
                  <img src={review.profileImage} alt={review.customerName} />
                ) : (
                  <div className="avatar-placeholder">
                    {getInitials(review.customerName)}
                  </div>
                )}
              </div>
              <div className="reviewer-details">
                <div className="reviewer-name">{review.customerName}</div>
                {review.isVerified && (
                  <div className="verified-badge">(Verified)</div>
                )}
              </div>
            </div>
            <div className="review-date">
              {formatDate(review.createdAt)}
            </div>
          </div>

          <div className="review-content">
            <h4 className="review-title">{review.title}</h4>
            <p className="review-text">{review.comment}</p>
            
            <div className="review-rating">
              <div className="rating-stars">
                {renderStars(review.rating)}
              </div>
              <span className="rating-value">{review.rating}.0</span>
            </div>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="review-images">
                {review.images.map((image, index) => (
                  <div key={index} className="review-image">
                    <img 
                      src={image.url} 
                      alt={`Review image ${index + 1}`}
                      onClick={() => window.open(image.url, '_blank')}
                    />
                    {image.type === 'video' && (
                      <div className="play-overlay">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="review-pagination">
          <button 
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;

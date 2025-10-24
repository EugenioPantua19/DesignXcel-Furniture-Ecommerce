import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import ReviewStats from './ReviewStats';
import { 
  ReviewIcon, 
  FilterIcon, 
  SortIcon, 
  MessageIcon,
  StarIcon 
} from '../../../shared/components/ui/SvgIcons';
import './review-section.css';

const ReviewSection = ({ productId, productName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviewsPerPage = 4;

  // Load reviews and stats
  useEffect(() => {
    loadReviews();
    loadReviewStats();
  }, [productId, sortBy, currentPage]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/products/${productId}/reviews?sort=${sortBy}&page=${currentPage}&limit=${reviewsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      // Error loading reviews
    } finally {
      setLoading(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const apiBase2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase2}/api/products/${productId}/reviews/stats?_t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        setReviewStats(data.stats);
      }
    } catch (error) {
      // Error loading review stats
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      // Check if reviewData is FormData (for file uploads) or regular object
      let requestBody;
      let headers = {};
      
      if (reviewData instanceof FormData) {
        // Add customerId to FormData
        const customerId = user?.id || user?.customerId || 1; // Default to 1 if no user
        reviewData.append('customerId', customerId);
        requestBody = reviewData;
        // Don't set Content-Type header for FormData - browser will set it with boundary
      } else {
        // Handle regular JSON data
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          ...reviewData,
          customerId: user?.id || user?.customerId || 1
        });
      }



      const apiBase3 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase3}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: headers,
        body: requestBody,
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload reviews and stats
        await loadReviews();
        await loadReviewStats();
        setShowReviewForm(false);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      // Error submitting review
      return { success: false, error: 'Failed to submit review' };
    }
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(reviewStats.totalReviews / reviewsPerPage);

  return (
    <div className="review-section">
      {/* Review Stats */}
      <ReviewStats 
        stats={reviewStats}
        productName={productName}
      />

      {/* Reviews Header */}
      <div className="reviews-header">
        <div className="header-title">
          <MessageIcon size={24} className="header-icon" />
          <div>
            <h3>Customer Reviews</h3>
            <p className="header-subtitle">
              {reviewStats.totalReviews > 0 
                ? `${reviewStats.totalReviews} verified reviews from customers who purchased this product`
                : 'Be the first to share your experience with this product'
              }
            </p>
          </div>
        </div>
        
        {/* Review Controls */}
        {reviewStats.totalReviews > 0 && (
          <div className="review-controls">
            <div className="results-info">
              <span className="review-count">
                Showing {((currentPage - 1) * reviewsPerPage) + 1}-{Math.min(currentPage * reviewsPerPage, reviewStats.totalReviews)} of {reviewStats.totalReviews} reviews
              </span>
            </div>
            <div className="sort-controls">
              <SortIcon size={16} className="sort-icon" />
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Review List */}
      <ReviewList 
        reviews={reviews}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add Review Section */}
      <div className="add-review-section">
        {user ? (
          <div className="review-action-card">
            <div className="action-content">
              <div className="action-header">
                <StarIcon size={24} className="action-icon" />
                <div>
                  <h4>Share Your Experience</h4>
                  <p>Help other customers by sharing your honest review</p>
                </div>
              </div>
              <button 
                className={`add-review-btn ${showReviewForm ? 'active' : ''}`}
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <ReviewIcon size={18} />
                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
              </button>
            </div>
          </div>
        ) : (
          <div className="login-prompt-card">
            <div className="prompt-content">
              <MessageIcon size={32} className="prompt-icon" />
              <div className="prompt-text">
                <h4>Want to share your experience?</h4>
                <p>Join our community of verified customers and help others make informed decisions</p>
                <a href="/login" className="login-link">
                  Sign in to write a review
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm 
          productId={productId}
          productName={productName}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default ReviewSection;

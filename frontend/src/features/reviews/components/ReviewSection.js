import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import ReviewStats from './ReviewStats';
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
      const response = await fetch(`/api/products/${productId}/reviews?sort=${sortBy}&page=${currentPage}&limit=${reviewsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews/stats`);
      const data = await response.json();
      
      if (data.success) {
        setReviewStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          customerId: user?.id || 'guest'
        }),
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
      console.error('Error submitting review:', error);
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

      {/* Review List Header */}
      <div className="review-list-header">
        <h3>Review List</h3>
        <div className="review-controls">
          <span className="review-count">
            Showing {((currentPage - 1) * reviewsPerPage) + 1}-{Math.min(currentPage * reviewsPerPage, reviewStats.totalReviews)} of {reviewStats.totalReviews} results
          </span>
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review List */}
      <ReviewList 
        reviews={reviews}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add Review Button */}
      {user && (
        <div className="add-review-section">
          <button 
            className="add-review-btn"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel' : 'Add Your Review'}
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm 
          productId={productId}
          productName={productName}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Login Prompt for Non-authenticated Users */}
      {!user && (
        <div className="login-prompt">
          <p>Please <a href="/login">login</a> to leave a review.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;

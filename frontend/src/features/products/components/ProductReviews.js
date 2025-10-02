import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { getProductReviews, addProductReview, getProductReviewStats } from '../../reviews/services/reviewService';
import './product-reviews.css';

const ProductReviews = ({ productId }) => {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: ''
    });
    const [error, setError] = useState('');
    const [userReview, setUserReview] = useState(null);

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const [reviewsResponse, statsResponse] = await Promise.all([
                getProductReviews(productId),
                getProductReviewStats(productId)
            ]);

            if (reviewsResponse.success) {
                setReviews(reviewsResponse.reviews);
                
                // Check if current user has already reviewed this product
                if (isAuthenticated && user) {
                    const userReview = reviewsResponse.reviews.find(
                        review => review.userId === user.id
                    );
                    setUserReview(userReview);
                }
            }
            if (statsResponse.success) {
                setStats(statsResponse.stats);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            setError('You must be logged in to submit a review');
            return;
        }

        if (!newReview.comment.trim()) {
            setError('Please enter a comment');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const reviewData = {
                rating: newReview.rating,
                comment: newReview.comment.trim(),
                userId: user.id,
                customerId: user.id, // Add customerId for backend API
                userName: `${user.firstName} ${user.lastName}`.trim() || user.email
            };

            const response = await addProductReview(productId, reviewData);
            
            if (response.success) {
                // Update reviews list - replace existing review or add new one
                setReviews(prev => {
                    const existingIndex = prev.findIndex(r => r.userId === user.id);
                    if (existingIndex >= 0) {
                        // Update existing review
                        const updated = [...prev];
                        updated[existingIndex] = response.review;
                        return updated;
                    } else {
                        // Add new review
                        return [response.review, ...prev];
                    }
                });
                
                setUserReview(response.review);
                setNewReview({ rating: 5, comment: '' });
                setShowReviewForm(false);
                setEditingReview(null);
                
                // Reload stats
                const statsResponse = await getProductReviewStats(productId);
                if (statsResponse.success) {
                    setStats(statsResponse.stats);
                }
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setNewReview({
            rating: review.rating,
            comment: review.comment
        });
        setShowReviewForm(true);
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setNewReview({ rating: 5, comment: '' });
        setShowReviewForm(false);
        setError('');
    };

    const formatDate = (dateString) => {
        try {
            console.log('Formatting date:', dateString, 'Type:', typeof dateString);
            
            // Handle null, undefined, or empty string
            if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
                console.log('Date string is empty, null, or undefined');
                return 'Date not available';
            }
            
            // Handle different date formats
            let date;
            
            // If it's already a Date object
            if (dateString instanceof Date) {
                date = dateString;
            }
            // If it's a string, try to parse it
            else if (typeof dateString === 'string') {
                // Trim whitespace
                const trimmedDate = dateString.trim();
                if (!trimmedDate) {
                    console.log('Date string is empty after trimming');
                    return 'Date not available';
                }
                
                // Try different date formats
                date = new Date(trimmedDate);
                
                // If that fails, try parsing as ISO string
                if (isNaN(date.getTime())) {
                    // Try to handle SQL Server datetime format
                    const sqlDate = trimmedDate.replace('T', ' ').replace('Z', '');
                    date = new Date(sqlDate);
                }
                
                // If still fails, try other common formats
                if (isNaN(date.getTime())) {
                    // Try parsing as timestamp
                    const timestamp = parseInt(trimmedDate);
                    if (!isNaN(timestamp)) {
                        date = new Date(timestamp);
                    }
                }
            }
            // If it's a number (timestamp)
            else if (typeof dateString === 'number') {
                date = new Date(dateString);
            }
            else {
                console.log('Unknown date format:', dateString);
                return 'Date not available';
            }
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.log('Invalid date after parsing:', dateString);
                return 'Date not available';
            }
            
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            console.log('Successfully formatted date:', formattedDate);
            return formattedDate;
            
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date not available';
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={`star ${index < rating ? 'filled' : 'empty'}`}
            >
                ★
            </span>
        ));
    };

    const renderRatingBar = (rating, count, total) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <div key={rating} className="rating-bar">
                <span className="rating-label">{rating} stars</span>
                <div className="rating-progress">
                    <div 
                        className="rating-fill" 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <span className="rating-count">{count}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="product-reviews">
                <div className="reviews-loading">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="product-reviews">
            <div className="reviews-header">
                <h3>Customer Reviews</h3>
                {isAuthenticated && (
                    <div className="review-actions">
                        {userReview ? (
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleEditReview(userReview)}
                            >
                                Edit Your Review
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowReviewForm(!showReviewForm)}
                            >
                                {showReviewForm ? 'Cancel' : 'Write a Review'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Review Statistics */}
            {stats && (
                <div className="reviews-stats">
                    <div className="stats-overview">
                        <div className="average-rating">
                            <div className="rating-number">{stats.averageRating}</div>
                            <div className="rating-stars">
                                {renderStars(Math.round(stats.averageRating))}
                            </div>
                            <div className="total-reviews">
                                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="rating-distribution">
                            {[5, 4, 3, 2, 1].map(rating => 
                                renderRatingBar(rating, stats.ratingDistribution[rating], stats.totalReviews)
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="review-form-container">
                    <form onSubmit={handleSubmitReview} className="review-form">
                        <h4>{editingReview ? 'Edit Your Review' : 'Write Your Review'}</h4>
                        
                        <div className="form-group">
                            <label>Rating</label>
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        type="button"
                                        className={`rating-star ${rating <= newReview.rating ? 'selected' : ''}`}
                                        onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="rating-text">
                                    {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="review-comment">Your Review</label>
                            <textarea
                                id="review-comment"
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Share your experience with this product..."
                                rows="4"
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancelEdit}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="no-reviews">
                        <p>No reviews yet. Be the first to review this product!</p>
                        {!isAuthenticated && (
                            <p className="login-prompt">
                                <a href="/login">Log in</a> to write a review.
                            </p>
                        )}
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className={`review-item ${isAuthenticated && user && review.userId === user.id ? 'user-review' : ''}`}>
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">{review.userName}</span>
                                    <div className="review-rating">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                                <div className="review-meta">
                                    <div className="review-date">
                                        {formatDate(review.createdAt)}
                                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                                            <span className="edited-indicator"> (edited)</span>
                                        )}
                                    </div>
                                    {isAuthenticated && user && review.userId === user.id && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => handleEditReview(review)}
                                            disabled={editingReview}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="review-content">
                                <p>{review.comment}</p>
                            </div>
                            {review.helpful > 0 && (
                                <div className="review-helpful">
                                    {review.helpful} people found this helpful
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews; 
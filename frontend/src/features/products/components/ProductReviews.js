import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
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
                <div className="header-content">
                    <div className="header-title">
                        <svg className="header-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
                        </svg>
                        <h3>Reviews</h3>
                        {stats && (
                            <span className="review-count">({stats.totalReviews})</span>
                        )}
                    </div>
                    {isAuthenticated && (
                        <div className="review-actions">
                            {userReview ? (
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEditReview(userReview)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Edit
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {showReviewForm ? 'Cancel' : 'Add Review'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Statistics - Simplified */}
            {stats && (
                <div className="reviews-stats">
                    <div className="stats-overview">
                        <div className="average-rating">
                            <div className="rating-display">
                                <div className="rating-number">{stats.averageRating}</div>
                                <div className="rating-stars">
                                    {renderStars(Math.round(stats.averageRating))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="review-form-container">
                    <div className="form-card">
                        <div className="form-header">
                            <h3>{editingReview ? 'Edit Your Review' : 'Write Your Review'}</h3>
                            <p>Share your experience with this product</p>
                        </div>
                        
                        <form onSubmit={handleSubmitReview} className="review-form">
                            <div className="form-group">
                                <label className="form-label">
                                    <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
                                    </svg>
                                    Rating
                                </label>
                                <div className="rating-input">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            className={`rating-star ${rating <= newReview.rating ? 'selected' : ''}`}
                                            onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                                            title={`${rating} star${rating !== 1 ? 's' : ''}`}
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
                                <label className="form-label" htmlFor="review-comment">
                                    <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Your Review
                                </label>
                                <textarea
                                    id="review-comment"
                                    className="form-textarea"
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="Share your experience with this product..."
                                    rows="4"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="loading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            {editingReview ? 'Update Review' : 'Submit Review'}
                                        </>
                                    )}
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
                </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="no-reviews">
                        <div className="no-reviews-content">
                            <svg className="no-reviews-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h4>No reviews yet</h4>
                            <p>Be the first to review this product!</p>
                            {!isAuthenticated && (
                                <div className="login-prompt">
                                    <svg className="login-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <a href="/login">Log in</a> to write a review.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className={`review-item ${isAuthenticated && user && review.userId === user.id ? 'user-review' : ''}`}>
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="reviewer-details">
                                        <span className="reviewer-name">{review.userName}</span>
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                </div>
                                <div className="review-meta">
                                    <div className="review-date">
                                        <svg className="date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span>{formatDate(review.createdAt)}</span>
                                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                                            <span className="edited-indicator">
                                                <svg className="edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                edited
                                            </span>
                                        )}
                                    </div>
                                    {isAuthenticated && user && review.userId === user.id && (
                                        <button
                                            className="btn btn-edit-small"
                                            onClick={() => handleEditReview(review)}
                                            disabled={editingReview}
                                            title="Edit your review"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="review-content">
                                <p>{review.comment}</p>
                            </div>
                            {review.helpful > 0 && (
                                <div className="review-helpful">
                                    <svg className="helpful-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 9V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3H11L9.5 6.5C9.5 6.5 8.5 8 7 8H4C3.44772 8 3 8.44772 3 9V17C3 17.5523 3.44772 18 4 18H7C7.55228 18 8 17.5523 8 17V12H10.5C11.3284 12 12 11.3284 12 10.5V9.5C12 8.67157 12.6716 8 13.5 8H17C17.5523 8 18 7.55228 18 7V5C18 4.44772 17.5523 4 17 4H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>{review.helpful} people found this helpful</span>
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
import React from 'react';

const ReviewStats = ({ stats, productName }) => {
  const { averageRating, totalReviews, ratingDistribution } = stats;

  const renderStars = (rating, size = 'large') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg 
            key={i} 
            className={`star star-filled ${size}`}
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg 
            key={i} 
            className={`star star-half ${size}`}
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <defs>
              <linearGradient id="half-fill">
                <stop offset="50%" stopColor="currentColor"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#half-fill)"/>
          </svg>
        );
      } else {
        stars.push(
          <svg 
            key={i} 
            className={`star star-empty ${size}`}
            viewBox="0 0 20 20" 
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        );
      }
    }
    return stars;
  };

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="review-stats">
      <div className="stats-container">
        {/* Overall Rating */}
        <div className="overall-rating">
          <div className="rating-number">
            {averageRating.toFixed(1)}
          </div>
          <div className="rating-out-of">out of 5</div>
          <div className="rating-stars">
            {renderStars(averageRating)}
          </div>
          <div className="rating-count">
            ({totalReviews} Review{totalReviews !== 1 ? 's' : ''})
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="rating-bar">
                <div className="rating-label">
                  <span className="star-count">{rating}</span>
                  <svg className="star-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="rating-count">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewStats;

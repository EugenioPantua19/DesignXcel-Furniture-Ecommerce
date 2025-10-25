import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../../shared/contexts/WishlistContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import { useCart } from '../../../shared/contexts/CartContext';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import PageHeader from '../../../shared/components/layout/PageHeader';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import { getPrimaryImageUrl } from '../../../shared/utils/imageUtils';
import { 
  HeartIcon, 
  ShoppingBagIcon, 
  TrashIcon,
  EyeIcon,
  StarIcon
} from '../../../shared/components/ui/SvgIcons';
import './WishlistPage.css';

const WishlistPage = () => {
  const { 
    wishlist, 
    removeFromWishlist, 
    clearWishlist 
  } = useWishlist();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleRemoveItem = (e, productId) => {
    e.stopPropagation();
    removeFromWishlist(productId);
  };

  const handleClearAll = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClear = () => {
    clearWishlist();
    setShowClearConfirmation(false);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/cart');
  };

  const handleAddAllToCart = () => {
    wishlist.forEach(item => {
      addToCart(item, 1);
    });
    navigate('/cart');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="wishlist-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'My Wishlist' }
        ]}
        title="My Wishlist"
        subtitle={`${wishlist.length} items`}
      />
      
      <div className="wishlist-container">
        {/* Content */}
        <div className="wishlist-content">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty">
              <div className="empty-wishlist-content">
                <div className="empty-wishlist-icon">
                  <HeartIcon size={64} color="#d1d5db" />
                </div>
                <h2>Your wishlist is empty</h2>
                <p>Start adding products you love to your wishlist!</p>
                <div className="empty-wishlist-actions">
                  <button 
                    className="browse-products-btn"
                    onClick={() => navigate('/products')}
                  >
                    <ShoppingBagIcon size={16} color="#ffffff" />
                    Browse Products
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Actions Bar */}
              <div className="wishlist-actions-bar">
                <button 
                  className="add-all-to-cart-btn"
                  onClick={handleAddAllToCart}
                >
                  <ShoppingBagIcon size={16} color="#ffffff" />
                  Add All to Cart
                </button>
                <button 
                  className="clear-wishlist-btn"
                  onClick={handleClearAll}
                >
                  <TrashIcon size={16} color="#6b7280" />
                  Clear All
                </button>
              </div>

              {/* Products Grid */}
              <div className="wishlist-grid">
                {wishlist.map((item) => (
                  <div 
                    key={item.id} 
                    className="wishlist-item"
                    onClick={() => handleProductClick(item.id)}
                  >
                    <div className="wishlist-item-image">
                      <img 
                        src={getPrimaryImageUrl(item)} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                      <div className="wishlist-item-actions">
                        <button 
                          className="view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(item.id);
                          }}
                          title="View Product"
                        >
                          <EyeIcon size={16} color="#ffffff" />
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={(e) => handleRemoveItem(e, item.id)}
                          title="Remove from wishlist"
                        >
                          <TrashIcon size={16} color="#ffffff" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="wishlist-item-info">
                      <h3 className="wishlist-item-name">{item.name}</h3>
                      <p className="wishlist-item-category">{item.categoryName}</p>
                      
                      <div className="wishlist-item-rating">
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              size={14} 
                              color={i < (item.averageRating || 0) ? "#F0B21B" : "#d1d5db"} 
                            />
                          ))}
                        </div>
                        <span className="rating-value">
                          {item.averageRating ? item.averageRating.toFixed(1) : '0.0'}
                        </span>
                      </div>
                      
                      <div className="wishlist-item-price">
                        {item.hasDiscount && item.discountInfo ? (
                          <>
                            <span className="original-price">₱{item.price.toLocaleString()}</span>
                            <span className="discount-price">₱{item.discountInfo.discountedPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="price">₱{item.price.toLocaleString()}</span>
                        )}
                      </div>
                      
                      <div className="wishlist-item-meta">
                        <span className="added-date">Added {formatDate(item.addedAt)}</span>
                      </div>
                      
                      <button 
                        className="add-to-cart-btn"
                        onClick={(e) => handleAddToCart(e, item)}
                      >
                        <ShoppingBagIcon size={16} color="#ffffff" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clear Wishlist Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirmation}
        onClose={() => setShowClearConfirmation(false)}
        onConfirm={handleConfirmClear}
        title="Clear Wishlist"
        message="Are you sure you want to remove all items from your wishlist? This action cannot be undone."
        confirmText="Clear Wishlist"
        cancelText="Keep Items"
        type="warning"
      />
    </div>
  );
};

export default WishlistPage;

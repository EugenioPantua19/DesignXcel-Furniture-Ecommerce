import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useCart } from '../../contexts/CartContext';
import { getPrimaryImageUrl } from '../../utils/imageUtils';
import { 
  XIcon, 
  HeartIcon, 
  ShoppingBagIcon, 
  TrashIcon,
  EyeIcon,
  StarIcon
} from '../ui/SvgIcons';
import './wishlist-popup.css';

const WishlistPopup = () => {
  const { 
    wishlist, 
    isWishlistOpen, 
    closeWishlist, 
    removeFromWishlist, 
    clearWishlist 
  } = useWishlist();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!isWishlistOpen) return null;

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    closeWishlist();
  };

  const handleRemoveItem = (e, productId) => {
    e.stopPropagation();
    removeFromWishlist(productId);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      clearWishlist();
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/cart');
    closeWishlist();
  };

  const handleAddAllToCart = () => {
    wishlist.forEach(item => {
      addToCart(item, 1);
    });
    navigate('/cart');
    closeWishlist();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStockStatus = (stock) => {
    const currentStock = stock || 0;
    if (currentStock === 0) {
      return { status: 'Out of Stock', color: '#ef4444' };
    } else if (currentStock <= 5) {
      return { status: 'Low Stock', color: '#f59e0b' };
    } else {
      return { status: 'In Stock', color: '#10b981' };
    }
  };

  return (
    <div className="wishlist-overlay" onClick={closeWishlist}>
      <div className="wishlist-popup" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wishlist-header">
          <div className="wishlist-title">
            <HeartIcon size={24} color="#F0B21B" />
            <h3>Wishlist</h3>
          </div>
          <button 
            className="close-btn"
            onClick={closeWishlist}
            title="Close wishlist"
          >
            <XIcon size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div className="wishlist-content">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty">
              <div className="empty-icon">
                <HeartIcon size={48} color="#d1d5db" />
              </div>
              <h4>Your wishlist is empty</h4>
              <p>Start adding products you love to your wishlist!</p>
              <button 
                className="browse-products-btn"
                onClick={() => {
                  navigate('/products');
                  closeWishlist();
                }}
              >
                <ShoppingBagIcon size={16} color="#ffffff" />
                Browse Products
              </button>
            </div>
          ) : (
            <div className="wishlist-table-container">
              <table className="wishlist-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Date Added</th>
                    <th>Stock Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wishlist.map((item) => {
                    const stockStatus = getStockStatus(item.stockQuantity || item.stock);
                    return (
                      <tr key={item.id} className="wishlist-row">
                        <td className="product-cell">
                          <button 
                            className="remove-item-btn"
                            onClick={(e) => handleRemoveItem(e, item.id)}
                            title="Remove from wishlist"
                          >
                            <XIcon size={16} color="#6b7280" />
                          </button>
                          <div className="product-info">
                            <div className="product-image">
                              <img 
                                src={getPrimaryImageUrl(item)} 
                                alt={item.name}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjhmOWZhIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                                }}
                              />
                            </div>
                            <div className="product-details">
                              <h4 className="product-name" onClick={() => handleProductClick(item.id)}>
                                {item.name}
                              </h4>
                              <p className="product-color">
                                Color: {item.color || 'Default'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="price-cell">
                          <span className="current-price">
                            {formatPrice(item.hasDiscount && item.discountInfo 
                              ? item.discountInfo.discountedPrice 
                              : item.price
                            )}
                          </span>
                          {item.hasDiscount && item.discountInfo && (
                            <span className="original-price">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </td>
                        <td className="date-cell">
                          {formatDate(item.addedAt)}
                        </td>
                        <td className="stock-cell">
                          <span 
                            className="stock-status"
                            style={{ color: stockStatus.color }}
                          >
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button 
                            className="add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e, item)}
                            disabled={stockStatus.status === 'Out of Stock'}
                          >
                            Add to Cart
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {wishlist.length > 0 && (
          <div className="wishlist-footer">
            <div className="wishlist-actions">
              <button 
                className="clear-wishlist-btn"
                onClick={handleClearAll}
              >
                Clear Wishlist
              </button>
              <button 
                className="add-all-btn"
                onClick={handleAddAllToCart}
              >
                Add All to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPopup;
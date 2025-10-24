import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPrimaryImageUrl } from '../../utils/imageUtils';

const QuickViewModal = ({ open, onClose, product, formatPrice, onAddToCart }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open || !product) return null;

  const name = product.Name || product.name || 'Product';
  const price = product.Price ?? product.price ?? 0;
  const hasDiscount = product.hasDiscount;
  const discountInfo = product.discountInfo;
  const description = product.Description || product.description || '';
  const category = product.Category || product.categoryName || product.category || '';
  const stock = product.StockQuantity ?? product.stock ?? product.quantity ?? null;
  const soldQuantity = product.soldQuantity ?? 0;
  const dimensions = product.Dimensions || product.dimensions || '';
  
  const imageUrl = getPrimaryImageUrl(product);
  const displayPrice = (hasDiscount && discountInfo) ? discountInfo.discountedPrice : price;

  const handleAdd = () => {
    onAddToCart?.(product);
  };

  const modalContent = (
    <div className="quickview-modal-overlay" onClick={onClose}>
      <div className="quickview-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="quickview-close-btn" onClick={onClose} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Product Image */}
        <div className="quickview-image-section">
          <div className="quickview-image-container">
            <img 
              src={imageUrl || '/images/placeholder-product.jpg'} 
              alt={name}
              className="quickview-product-image"
              onError={(e) => {
                e.target.src = '/images/placeholder-product.jpg';
              }}
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="quickview-details-section">
          <div className="quickview-content">
            {/* Category */}
            {category && (
              <div className="quickview-category">
                {category}
              </div>
            )}

            {/* Product Name */}
            <h2 className="quickview-title">{name}</h2>

            {/* Price */}
            <div className="quickview-price-section">
              <div className="quickview-price">
                {formatPrice ? formatPrice(displayPrice) : `₱${displayPrice.toLocaleString()}`}
              </div>
              {hasDiscount && discountInfo && (
                <div className="quickview-original-price">
                  {formatPrice ? formatPrice(price) : `₱${price.toLocaleString()}`}
                </div>
              )}
            </div>

            {/* Stock Status */}
            {stock !== null && (
              <div className="quickview-stock">
                <span className={`stock-badge ${stock === 0 ? 'out-of-stock' : stock <= 10 ? 'low-stock' : 'in-stock'}`}>
                  {stock === 0 ? 'Out of Stock' : stock <= 10 ? `Only ${stock} left` : 'In Stock'}
                </span>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="quickview-description">
                <p>{description}</p>
              </div>
            )}

            {/* Dimensions */}
            {dimensions && (
              <div className="quickview-dimensions">
                <span className="dimensions-label">Dimensions:</span>
                <span className="dimensions-value">{dimensions}</span>
              </div>
            )}

            {/* Actions */}
            <div className="quickview-actions">
              <button 
                className="quickview-add-to-cart-btn"
                onClick={handleAdd}
                disabled={stock === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="m1 1 4 4 13 0 3 8-1 1H6"></path>
                </svg>
                Add to Cart
              </button>
              <button className="quickview-view-details-btn" onClick={onClose}>
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QuickViewModal;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import QuickViewModal from '../../../shared/components/ui/QuickViewModal';
import '../../products/components/product-card.css';

const CustomFurnitureCard = ({ product }) => {
  const { 
    id, 
    name, 
    price, 
    images, 
    image, 
    description, 
    rating = 0, 
    reviews = 0,
    hasDiscount = false,
    discountInfo = null,
    categoryName
  } = product || {
    id: 1,
    name: 'Custom Furniture',
    price: 0,
    image: '/logo192.png',
    description: 'Custom furniture piece.',
    rating: 0,
    reviews: 0
  };

  const { formatPrice } = useCurrency();
  
  // Calculate display price and discount info from real data
  const displayPrice = hasDiscount && discountInfo ? discountInfo.discountedPrice : price;
  const originalPrice = hasDiscount && discountInfo ? price : null;
  const discountPercentage = hasDiscount && discountInfo && discountInfo.discountType === 'percentage' 
    ? discountInfo.discountValue 
    : null;

  // Derive stock quantity from various possible fields
  const stockQuantity = (product && (
    product.StockQuantity ?? product.stock ?? product.quantity ?? null
  ));

  // Handle images - support both single image and images array
  const getImageUrl = () => {
    // First try to get from images array (from API)
    if (images && images.length > 0) {
      const imageUrl = images[0];
      if (imageUrl.startsWith('/')) {
        return `http://localhost:5000${imageUrl}`;
      }
      return imageUrl;
    }
    
    // Fallback to single image field
    if (image) {
      if (image.startsWith('/')) {
        return `http://localhost:5000${image}`;
      }
      return image;
    }
    
    // Final fallback
    return '/logo192.png';
  };

  const imageUrl = getImageUrl();

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);
  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const handle3DCustomization = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/3d-customization/${id}`);
  };

  // Simple stock pill style
  const stockPillStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    background: stockQuantity === 0 ? '#DC3545' : (stockQuantity <= 10 ? '#FF9800' : '#E5F7EE'),
    color: stockQuantity === 0 ? '#fff' : (stockQuantity <= 10 ? '#222' : '#0F5132'),
    border: stockQuantity === 0 ? '1px solid #b02a37' : (stockQuantity <= 10 ? '1px solid #ffa726' : '1px solid #A7E3C4')
  };

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="product-card-redesigned" onClick={handleCardClick}>
      <div className="product-card-image-container">
        {/* Discount badge - top left */}
        {hasDiscount && originalPrice && (
          <div className="discount-badge">{discountPercentage ? `${discountPercentage}% off` : 'Sale'}</div>
        )}
        
        {/* Product image */}
        <img className="product-image" src={imageUrl} alt={name} />
        
        {/* Action icons - top right */}
        <div className="action-icons">
          <button className="action-icon" aria-label="Add to wishlist" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button className="action-icon" aria-label="Quick view" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button 
            className="action-icon" 
            aria-label="3D Customization" 
            onClick={handle3DCustomization}
            title="3D Customization"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </button>
          <button className="action-icon" aria-label="Add to cart" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, 1); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="product-card-content">
        {/* Category */}
        <div className="product-category">{categoryName || 'Custom Furniture'}</div>
        
        {/* Product name */}
        <div className="product-name">{name || 'Custom Furniture'}</div>
        
        {/* Price section */}
        <div className="product-price-section">
          <span className="current-price">{formatPrice(displayPrice)}</span>
          {originalPrice && <span className="original-price">{formatPrice(originalPrice)}</span>}
        </div>
        
        {/* Rating */}
        <div className="product-rating">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="rating-value">{rating ? rating.toFixed(1) : '0.0'}</span>
        </div>
      </div>

      <QuickViewModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        product={product}
        formatPrice={formatPrice}
        onAddToCart={(p) => { addToCart(p, 1); setQuickOpen(false); }}
      />

    </div>
  );
};

export default CustomFurnitureCard;

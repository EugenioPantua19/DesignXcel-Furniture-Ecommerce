import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import apiConfig from '../../../shared/services/api/apiConfig';
import { StarIcon } from '../../../shared/components/ui/SvgIcons';
import QuickViewModal from '../../../shared/components/ui/QuickViewModal';
import './product-card.css';

const ProductCard = ({ product }) => {
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
    categoryName,
    stockQuantity = 0,
    stock = 0,
    soldQuantity = 0
  } = product || {
    id: 1,
    name: 'Product Name',
    price: 0,
    image: '/logo192.png',
    description: 'Product description.',
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

  // Stock status logic
  const currentStock = stockQuantity || stock || 0;
  const getStockStatus = () => {
    if (currentStock === 0) {
      return { status: 'sold-out', label: 'Sold Out', color: '#DC3545', bgColor: '#F8D7DA' };
    } else if (currentStock <= 5) {
      return { status: 'low-stock', label: `Only ${currentStock} left`, color: '#856404', bgColor: '#FFF3CD' };
    } else if (currentStock <= 10) {
      return { status: 'limited-stock', label: `Limited Stock`, color: '#856404', bgColor: '#FFF3CD' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: '#155724', bgColor: '#D4EDDA' };
    }
  };

  const stockStatus = getStockStatus();

  // Handle images - support both single image and images array
  const getImageUrl = () => {
    // First try to get from images array (from API)
    if (images && images.length > 0) {
      const imageUrl = images[0];
      if (imageUrl && imageUrl.startsWith('/')) {
        // Use relative URL since proxy is configured
        return imageUrl;
      }
      return imageUrl;
    }
    
    // Fallback to single image field
    if (image) {
      if (image.startsWith('/')) {
        // Use relative URL since proxy is configured
        return image;
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

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="product-card-redesigned" onClick={handleCardClick}>
      <div className="product-card-image-container">
        {/* Discount badge - top left (only show if there's a discount) */}
        {hasDiscount && originalPrice && discountPercentage && (
          <div className="discount-badge">{discountPercentage}% off</div>
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
        <div className="product-category">{categoryName || 'Product'}</div>
        
        {/* Product name */}
        <div className="product-name">{name || 'Product Name'}</div>
        
        {/* Price section */}
        <div className="product-price-section">
          <span className="current-price">{formatPrice(displayPrice)}</span>
          {originalPrice && <span className="original-price">{formatPrice(originalPrice)}</span>}
        </div>
        
        {/* Stock indicator */}
        <div className="product-stock-indicator">
          <div 
            className="stock-dot" 
            style={{ backgroundColor: stockStatus.color }}
          ></div>
          <span className="stock-text">{stockStatus.label}</span>
        </div>
        
        {/* Sold quantity */}
        <div className="product-sold-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="sold-text">{soldQuantity || 0} sold</span>
        </div>
        
        {/* Rating */}
        <div className="product-rating">
          <StarIcon size={16} color="#fbbf24" />
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

export default ProductCard; 
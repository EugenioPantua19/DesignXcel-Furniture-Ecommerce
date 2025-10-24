import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import apiConfig from '../../../shared/services/api/apiConfig.js';
import { PlusIcon, MinusIcon, TrashIcon } from '../../../shared/components/ui/SvgIcons';
import { getImageUrl } from '../../../shared/utils/imageUtils';
import { useState } from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove, checked = true, onCheck = () => {} }) => {
  const { id, product, quantity, price: itemPrice, variationId, variationName, useOriginalProduct, selectedVariation } = item;
  const { name, price: originalPrice, images, hasDiscount, discountInfo } = product || {};
  const { useOriginalProduct: productUseOriginal, selectedVariation: productSelectedVariation } = product || {};
  const { formatPrice } = useCurrency();
  const [imageError, setImageError] = useState(false);
  
  // Use discounted price if available, otherwise use original price
  const displayPrice = itemPrice || originalPrice;

  // Use the utility function to get the image URL
  const imageUrl = getImageUrl(selectedVariation?.imageUrl || images?.[0]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="cart-item">
      
      {/* Product Section */}
      <div className="cart-item-product">
        <div className="cart-item-image">
          {!imageError && imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null' ? (
            <img 
              src={imageUrl} 
              alt={name || 'Product image'}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="image-placeholder">
              📦
            </div>
          )}
        </div>
        <div className="cart-item-details">
          <h3 className="cart-item-name">{name}</h3>
          <div className="cart-item-variant">
            {useOriginalProduct || !selectedVariation ? (
              <span className="variant-pill">Standard</span>
            ) : (
              <span className="variant-pill">
                Color: {selectedVariation.color || selectedVariation.name}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Price Section */}
      <div className="cart-item-price">
        {hasDiscount && discountInfo ? (
          <div className="discounted-price-display">
            <span className="discounted-price">{formatPrice(discountInfo.discountedPrice)}</span>
            <span className="original-price-crossed">{formatPrice(originalPrice)}</span>
            <span className="discount-badge">
              {discountInfo.discountType === 'percentage' 
                ? `-${discountInfo.discountValue}%` 
                : `-${formatPrice(discountInfo.discountAmount)}`
              }
            </span>
          </div>
        ) : (
          <span className="regular-price">{formatPrice(displayPrice)}</span>
        )}
      </div>
      
      {/* Quantity Section */}
      <div className="cart-item-quantity">
        {/* Remove Button */}
        <button 
          className="remove-btn"
          onClick={() => onRemove(id)}
          title="Remove item"
        >
          ×
        </button>
        
        <div className="quantity-controls">
          <button 
            className="quantity-btn"
            onClick={() => onUpdateQuantity(id, quantity - 1)}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="quantity-display">{quantity}</span>
          <button 
            className="quantity-btn"
            onClick={() => onUpdateQuantity(id, quantity + 1)}
          >
            +
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default CartItem; 
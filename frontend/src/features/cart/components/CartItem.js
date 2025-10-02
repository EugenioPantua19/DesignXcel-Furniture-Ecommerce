import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import apiConfig from '../../../shared/services/api/apiConfig';
import { PlusIcon, MinusIcon, TrashIcon } from '../../../shared/components/ui/SvgIcons';

const CartItem = ({ item, onUpdateQuantity, onRemove, checked = true, onCheck = () => {} }) => {
  const { id, product, quantity, price: itemPrice, variationId, variationName, useOriginalProduct, selectedVariation } = item;
  const { name, price: originalPrice, images, hasDiscount, discountInfo } = product || {};
  const { useOriginalProduct: productUseOriginal, selectedVariation: productSelectedVariation } = product || {};
  const { formatPrice } = useCurrency();
  
  // Use discounted price if available, otherwise use original price
  const displayPrice = itemPrice || originalPrice;

  // Use backend image if available, prefer variation image if a variation is selected
  const getImageUrl = () => {
    // Prefer variation image if a variation is selected
    if (!useOriginalProduct && selectedVariation && selectedVariation.imageUrl) {
      return selectedVariation.imageUrl.startsWith('http')
        ? selectedVariation.imageUrl
        : `http://localhost:5000${selectedVariation.imageUrl}`;
    }
    // Fallback to product images
    if (images && images.length > 0) {
      const image = images[0]; // Use first image
      if (image.startsWith('/')) {
        return image; // Use relative URL since proxy is configured
      } else if (image.startsWith('http')) {
        return image;
      } else {
        return image; // Use relative URL since proxy is configured
      }
    }
    return '/logo192.png';
  };

  const imageUrl = getImageUrl();

  return (
    <div className="cart-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onCheck(id, e.target.checked)}
        className="cart-item-checkbox"
      />
      <div className="cart-item-image">
        <img 
          src={imageUrl} 
          alt={name}
        />
      </div>
      <div className="cart-item-details">
        <div className="cart-item-info">
          <h3 className="cart-item-name">{name}</h3>
          
          {/* Variant details display */}
          <div className="cart-item-variant">
            {useOriginalProduct || !selectedVariation ? (
              <span className="variant-pill">Standard</span>
            ) : (
              <span className="variant-pill">
                Variant: {selectedVariation.name}
                {selectedVariation.color ? ` · ${selectedVariation.color}` : ''}
              </span>
            )}
          </div>
          
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
        </div>
        <div className="cart-item-controls">
          <div className="quantity-controls">
            <button 
              className="quantity-btn"
              onClick={() => onUpdateQuantity(id, quantity - 1)}
              disabled={quantity <= 1}
            >
              <MinusIcon size={14} color="#6b7280" />
            </button>
            <span className="quantity-display">{quantity}</span>
            <button 
              className="quantity-btn"
              onClick={() => onUpdateQuantity(id, quantity + 1)}
            >
              <PlusIcon size={14} color="#6b7280" />
            </button>
          </div>
          <div className="cart-item-actions">
            <div className="cart-item-total">{formatPrice(displayPrice * quantity)}</div>
            <button 
              className="remove-btn"
              onClick={() => onRemove(id)}
              title="Remove item"
            >
              <TrashIcon size={16} color="#ef4444" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem; 
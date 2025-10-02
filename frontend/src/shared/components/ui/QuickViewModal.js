import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiConfig from '../../services/api/apiConfig';

const leftPaneStyle = {
  background: '#f8fafc',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const rightPaneStyle = {
  padding: '18px 20px',
  overflowY: 'auto'
};

const closeBtnStyle = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'transparent',
  border: 'none',
  fontSize: '22px',
  cursor: 'pointer',
  zIndex: 1
};

const pillStyle = {
  display: 'inline-block',
  borderRadius: '12px',
  fontSize: 12,
  fontWeight: 600,
  marginLeft: 8
};

const QuickViewModal = ({ open, onClose, product, formatPrice, onAddToCart }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) {
      // Prevent background scroll and layout shift
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  // Don't render anything if modal is not open
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
  
  // Handle images - support both single image and images array (same logic as ProductCard)
  const images = product.images || product.Images || [];
  const image = product.ImageURL || product.image || '';
  
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
  
  // Debug logging
  console.log('QuickView Modal - Product data:', {
    product,
    images,
    image,
    imageUrl,
    name
  });
  
  // Calculate display price
  const displayPrice = (hasDiscount && discountInfo) ? discountInfo.discountedPrice : price;

  const stockPill = {
    ...pillStyle,
    background: stock === 0 ? '#DC3545' : (stock <= 10 ? '#FFECB3' : '#E5F7EE'),
    color: stock === 0 ? '#fff' : (stock <= 10 ? '#8D6E63' : '#0F5132'),
    border: stock === 0 ? 'none' : (stock <= 10 ? '1px solid #FFE082' : '1px solid #A7E3C4')
  };

  const handleAdd = () => {
    onAddToCart?.(product);
  };

  const modalContent = (
    <div className="quick-view-modal-overlay" onMouseDown={(e)=>e.stopPropagation()} onClick={onClose}>
      <div className="quick-view-modal-content" onMouseDown={(e)=>e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" style={closeBtnStyle} onClick={onClose}>×</button>
        <div style={leftPaneStyle}>
          <img 
            src={imageUrl} 
            alt={name} 
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            onError={(e) => {
              console.log('Image failed to load:', imageUrl);
              e.target.src = '/logo192.png';
            }}
            onLoad={() => console.log('Image loaded successfully:', imageUrl)}
          />
        </div>
        <div style={rightPaneStyle}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>{name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>
                {formatPrice ? formatPrice(displayPrice) : `₱${displayPrice.toFixed(2)}`}
              </span>
              {hasDiscount && discountInfo && (
                <span style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'line-through' }}>
                  {formatPrice ? formatPrice(price) : `₱${price.toFixed(2)}`}
                </span>
              )}
              {stock !== null && (
                <span style={stockPill}>
                  {stock === 0 ? 'Out of Stock' : `In Stock: ${stock}`}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {category ? (
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Category</div>
                <div style={{ fontWeight: 600 }}>{category}</div>
              </div>
            ) : null}
            {dimensions ? (
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Dimensions</div>
                <div style={{ fontWeight: 600 }}>{dimensions}</div>
              </div>
            ) : null}
            {soldQuantity > 0 ? (
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Sold</div>
                <div style={{ fontWeight: 600 }}>{soldQuantity} units</div>
              </div>
            ) : null}
          </div>

          {description ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Description</div>
              <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{description}</div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAdd} style={{ background: '#F0B21B', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Add to Cart</button>
            <button onClick={onClose} style={{ background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QuickViewModal;
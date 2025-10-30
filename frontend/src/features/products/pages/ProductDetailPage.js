import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import { useWishlist } from '../../../shared/contexts/WishlistContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import { getProductById, getProductVariations } from '../services/productService';
import apiConfig from '../../../shared/services/api/apiConfig.js';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import Breadcrumb from '../../../shared/components/layout/Breadcrumb';
import CartSuccessModal from '../../../shared/components/ui/CartSuccessModal';
import { PageLoader } from '../../../shared/components/ui';
import ReviewSection from '../../reviews/components/ReviewSection';
import { getImageUrl } from '../../../shared/utils/imageUtils';
import './product-detail.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, canAddItem, getMaxQuantityForProduct, getRemainingSlots, CART_LIMITS } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [useOriginalProduct, setUseOriginalProduct] = useState(true);
  const [activeTab, setActiveTab] = useState('additional-info');
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Update meta tags for social sharing
  useEffect(() => {
    if (product) {
      // Update page title
      document.title = `${product.name} - Design Excellence`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', product.description || `Premium ${product.name} from Design Excellence - Quality office furniture for modern workplaces.`);
      }
      
      // Add Open Graph meta tags
      const addOrUpdateMetaTag = (property, content) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      // Add Twitter Card meta tags
      const addOrUpdateTwitterMeta = (name, content) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      const productImage = getImageUrl(product.images?.[0] || product.thumbnails?.[0] || '');
      const productDescription = product.description || `Premium ${product.name} from Design Excellence - Quality office furniture for modern workplaces.`;
      
      // Open Graph tags
      addOrUpdateMetaTag('og:title', product.name);
      addOrUpdateMetaTag('og:description', productDescription);
      addOrUpdateMetaTag('og:image', productImage);
      addOrUpdateMetaTag('og:url', window.location.href);
      addOrUpdateMetaTag('og:type', 'product');
      addOrUpdateMetaTag('og:site_name', 'Design Excellence');
      
      // Twitter Card tags
      addOrUpdateTwitterMeta('twitter:card', 'summary_large_image');
      addOrUpdateTwitterMeta('twitter:title', product.name);
      addOrUpdateTwitterMeta('twitter:description', productDescription);
      addOrUpdateTwitterMeta('twitter:image', productImage);
      addOrUpdateTwitterMeta('twitter:site', '@DesignExcellence');
    }
  }, [product]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(slug);
        console.log('Product data loaded:', response.product);
        console.log('Product thumbnails:', response.product.thumbnails);
        console.log('Product images:', response.product.images);
        
        // Check if thumbnails are available
        if (!response.product.thumbnails || response.product.thumbnails.length === 0) {
            console.log('No thumbnails found. To add thumbnails:');
            console.log('1. Go to Admin Panel > Products');
            console.log('2. Edit the product');
            console.log('3. Upload thumbnail images');
            console.log('4. Save the product');
        }
        setProduct(response.product);
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Load variations when product loads
  useEffect(() => {
    if (product) {
      loadVariations();
    }
  }, [product]);

  // Load variations function
  const loadVariations = async () => {
    try {
        const response = await getProductVariations(slug);
      setVariations(response.variations || []);
    } catch (error) {
      console.error('Error loading variations:', error);
    }
  };

  // Handle image navigation
  const handleImageNavigation = (direction) => {
    if (!allImages || allImages.length <= 1) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(prev => 
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    } else {
      setSelectedImageIndex(prev => 
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (product && quantity > 0 && !addingToCart) {
      setAddingToCart(true);
      try {
        // Create product object with variation data
        const productWithVariation = {
          ...product,
          useOriginalProduct,
          selectedVariation
        };
        
        // Check if we can add this item
        if (!canAddItem(productWithVariation, quantity)) {
          return;
        }
        
        addToCart(productWithVariation, quantity);
        setShowCartSuccessModal(true);
      } finally {
        setAddingToCart(false);
      }
    }
  };

  // Handle 3D Products
  const handle3DProducts = () => {
    navigate(`/3d-products/${slug}`);
  };

  // Loading state
  if (loading) {
    return (
      <PageLoader isLoading={true} text="Loading product details..." />
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="pdp-container">
          <div className="error-message">
            <h2>Oops! Product not found</h2>
            <p>{error || 'The product you requested could not be found.'}</p>
            <Link to="/products" className="btn-primary">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare images array - main image + thumbnails
  const mainImage = product.image || (product.images && product.images[0]) || null;
  const thumbnails = product.thumbnails || (product.images && product.images.slice(1)) || [];
  
  // Create array with main image first, then thumbnails
  const allImages = [mainImage, ...thumbnails].filter(Boolean);
  
  const currentImage = allImages[selectedImageIndex] || '/logo192.png';
  const imageUrl = getImageUrl(currentImage);

  // Calculate pricing
  const hasDiscount = product.hasDiscount && product.discountInfo;
  const displayPrice = hasDiscount ? product.discountInfo.discountedPrice : product.price;
  const originalPrice = hasDiscount ? product.price : null;
  const discountPercentage = hasDiscount && product.discountInfo.discountType === 'percentage' 
    ? product.discountInfo.discountValue 
    : null;

  // Stock status - use variation stock if selected, otherwise product stock
  const stockQuantity = selectedVariation ? selectedVariation.quantity : (product.stockQuantity || 0);
  const isInStock = stockQuantity > 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 10;

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: product.name }
  ];

  // Variation selection logic with unselect functionality
  const handleVariationSelect = (variation) => {
    // If clicking on the already selected variation, unselect it
    if (!useOriginalProduct && selectedVariation?.id === variation.id) {
      setUseOriginalProduct(true);
      setSelectedVariation(null);
    } else {
      // Select the new variation
      setUseOriginalProduct(false);
      setSelectedVariation(variation);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product?.name,
    "description": product?.description,
    "sku": product?.sku || "FRNC87654ABC",
    "category": product?.categoryName,
    "brand": {
      "@type": "Brand",
      "name": "DesignXcel"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "PHP",
      "price": displayPrice,
      "availability": isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "DesignXcel"
      }
    },
    "aggregateRating": product?.rating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews || 0
    } : undefined,
    "image": allImages.map(img => img.startsWith('/') ? `${window.location.origin}${img}` : img)
  };

  return (
    <div className="product-detail-page">
      {/* Structured Data for SEO */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="pdp-container">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="pdp">
          {/* Gallery Section */}
          <div className="pdp-gallery">
            <div className="pdp-gallery-main">
              <img 
                src={imageUrl} 
                alt={product.name}
                loading="eager"
                fetchpriority="high"
                width={1200}
                height={500}
                sizes="(max-width: 768px) 100vw, 600px"
                onError={(e) => {
                  e.target.src = '/logo192.png';
                }}
              />
              
              {/* Navigation arrows - Always show for 4 thumbnails */}
              <button 
                className="nav-arrow nav-arrow-left"
                onClick={() => handleImageNavigation('prev')}
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
              </button>
              <button 
                className="nav-arrow nav-arrow-right"
                onClick={() => handleImageNavigation('next')}
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>

            {/* Thumbnails - Show exactly 4 thumbnails */}
            <div className="pdp-thumbs">
              {Array.from({ length: 4 }, (_, index) => {
                const image = allImages[index + 1] || null; // Skip main image (index 0)
                const thumbUrl = image ? getImageUrl(image) : null;
                const isActive = (index + 1) === selectedImageIndex;
                const hasImage = !!image;
                
                return (
                  <div 
                    key={index}
                    className={`pdp-thumb ${isActive ? 'active' : ''} ${!hasImage ? 'placeholder' : ''}`}
                    onClick={() => setSelectedImageIndex(index + 1)}
                  >
                    {hasImage ? (
                      <img 
                        src={thumbUrl} 
                        alt={`${product.name} thumbnail ${index + 1}`}
                        loading="lazy"
                        fetchpriority="low"
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>Thumbnail {index + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="pdp-info">
            {/* Category */}
            <div className="pdp-category">{product.categoryName}</div>
            
            {/* Title with Stock Status */}
            <div className="pdp-title-row">
              <h1 className="pdp-title">{product.name}</h1>
              {stockQuantity > 0 ? (
                <span className={`stock-badge ${isLowStock ? 'low-stock' : 'in-stock'}`}>
                  {isLowStock ? `Only ${stockQuantity} available` : `${stockQuantity} in stock`}
                </span>
              ) : (
                <span className="stock-badge out-of-stock">Out of Stock</span>
              )}
            </div>
            
            {/* Rating */}
            {product.rating > 0 && (
              <div className="pdp-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i}
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill={i < Math.floor(product.rating) ? "#F4B400" : "#E0E0E0"}
                    >
                      <path d="M12 2l2.9 6.1 6.7.9-4.8 4.6 1.2 6.6L12 17.8 6 20.2l1.2-6.6L2.4 9l6.7-.9L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="rating-text">
                  {product.rating.toFixed(1)} ({product.reviews || 245} Review)
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="pdp-pricing">
              <div className="price-main">
                <span className="price-current">{formatPrice(displayPrice)}</span>
                {originalPrice && (
                  <span className="price-original">{formatPrice(originalPrice)}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="pdp-description">
              <p>{product.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna'}</p>
            </div>

            {/* Product Variations */}
            {variations.length > 0 && (
              <div className="variation-cards-container">
                {variations.map((variation) => (
                  <div
                    key={variation.id}
                    className={`variation-card ${!useOriginalProduct && selectedVariation?.id === variation.id ? 'selected' : ''}`}
                    onClick={() => handleVariationSelect(variation)}
                    title={!useOriginalProduct && selectedVariation?.id === variation.id ? 'Click to unselect' : 'Click to select'}
                  >
                    {variation.imageUrl && (
                      <div className="variation-image">
                        <img src={getImageUrl(variation.imageUrl)} alt={variation.name} />
                      </div>
                    )}
                    <div className="variation-info">
                      <h4>{variation.name}</h4>
                      {variation.color && (
                        <div className="variation-color">
                          <span className="color-label">Color:</span>
                          <span className="color-value">{variation.color}</span>
                        </div>
                      )}
                      <div className="variation-quantity">
                        <span className="quantity-label">Available:</span>
                        <span className={`quantity-value ${variation.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {variation.quantity > 0 ? variation.quantity : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* Quantity and Action Buttons */}
            <div className="pdp-actions">
              <div className="quantity-selector">
                <button 
                  className="qty-btn qty-minus"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  className="qty-btn qty-plus"
                  onClick={() => {
                    const productWithVariation = {
                      ...product,
                      useOriginalProduct,
                      selectedVariation
                    };
                    const maxAllowed = Math.min(
                      stockQuantity,
                      getMaxQuantityForProduct(productWithVariation)
                    );
                    setQuantity(Math.min(maxAllowed, quantity + 1));
                  }}
                  disabled={quantity >= Math.min(stockQuantity, getMaxQuantityForProduct({
                    ...product,
                    useOriginalProduct,
                    selectedVariation
                  }))}
                >
                  +
                </button>
              </div>
              
              {/* Stock Quantity Info */}
              <div className="stock-quantity-info">
                <span className="stock-label">Available: </span>
                <span className={`stock-value ${isLowStock ? 'low-stock' : stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {stockQuantity > 0 ? `${stockQuantity} items` : 'Out of Stock'}
                </span>
              </div>
              
              <button 
                className="btn-add-cart"
                onClick={handleAddToCart}
                disabled={!isInStock || addingToCart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: window.innerWidth < 768 ? '6px' : '8px',
                  padding: window.innerWidth < 768 ? '12px 16px' : '12px 20px',
                  fontSize: window.innerWidth < 768 ? '14px' : '16px',
                  minHeight: window.innerWidth < 768 ? '44px' : '48px',
                  transition: 'all 0.2s ease'
                }}
              >
                {addingToCart ? (
                  <>
                    <AudioLoader size="small" color="#ffffff" />
                    Adding...
                  </>
                ) : (
                  'Add To Cart'
                )}
              </button>

              {/* Only show 3D Products button if product has a 3D model */}
              {(product.model3d || product.model3DURL || product.has3dModel || product.has3DModel) && (
                <button 
                  className="btn-buy-now" 
                  onClick={handle3DProducts}
                  disabled={!isInStock}
                >
                  3D Products
                </button>
              )}
              
              <button 
                className="wishlist-btn"
                onClick={handleWishlistToggle}
                aria-label={isInWishlist(product?.id) ? "Remove from wishlist" : "Add to wishlist"}
                title={isInWishlist(product?.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={isInWishlist(product?.id) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Product Details */}
            <div className="pdp-details">
              <div>Category : {product.categoryName}</div>
            </div>

            {/* Share Options */}
            <div className="share-section">
              <span className="share-label">Share :</span>
              <div className="social-icons">
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`Check out this amazing ${product.name} from Design Excellence! ${product.description ? product.description.substring(0, 100) + '...' : ''} #DesignExcellence #OfficeFurniture`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn facebook" 
                  aria-label="Share on Facebook"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`🏢 Check out this amazing ${product.name} from @DesignExcellence! ${product.description ? product.description.substring(0, 80) + '...' : ''} #OfficeFurniture #DesignExcellence`)}&hashtags=OfficeFurniture,DesignExcellence`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn twitter" 
                  aria-label="Share on Twitter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a 
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(getImageUrl(product.images?.[0] || product.thumbnails?.[0] || ''))}&description=${encodeURIComponent(`${product.name} - ${product.description ? product.description.substring(0, 200) : 'Premium office furniture from Design Excellence'} #DesignExcellence #OfficeFurniture`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn pinterest" 
                  aria-label="Share on Pinterest"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out this amazing ${product.name} from Design Excellence! ${window.location.href} #DesignExcellence #OfficeFurniture`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn whatsapp" 
                  aria-label="Share on WhatsApp"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn linkedin" 
                  aria-label="Share on LinkedIn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/designexcellence01/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn instagram" 
                  aria-label="Follow us on Instagram"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <button 
                  onClick={handleCopyLink}
                  className="social-btn copy-link" 
                  aria-label="Copy product link"
                  title={linkCopied ? "Link copied!" : "Copy link"}
                >
                  {linkCopied ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="additional-info-section">
        <div className="info-tabs">
          <button 
            className={`info-tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`info-tab ${activeTab === 'additional-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('additional-info')}
          >
            Additional Information
          </button>
          <button 
            className={`info-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
          </button>
        </div>
        
        <div className="info-content">
          {activeTab === 'description' && (
            <div className="description-content">
              <div className="description-text">
                {product?.description || product?.longDescription || (
                  <div>
                    <p>Experience the perfect blend of comfort and style with our premium furniture collection. This exceptional piece combines modern design with superior craftsmanship to create a timeless addition to your space.</p>
                    
                    <h4>Key Features:</h4>
                    <ul>
                      <li>Premium quality materials for lasting durability</li>
                      <li>Ergonomic design for maximum comfort</li>
                      <li>Modern aesthetic that complements any decor</li>
                      <li>Easy assembly with detailed instructions</li>
                      <li>Professional finish with attention to detail</li>
                    </ul>
                    
                    <h4>Perfect For:</h4>
                    <p>Whether you're furnishing your home office, living room, or bedroom, this piece offers versatile functionality and timeless appeal. Its neutral design ensures it will remain stylish for years to come.</p>
                    
                    <h4>Care Instructions:</h4>
                    <p>Clean with a soft, dry cloth. Avoid harsh chemicals and direct sunlight to maintain the finish. Regular dusting will keep your furniture looking its best.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'additional-info' && (
            <div className="info-table-container">
              <table className="info-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Product Name</td>
                    <td>{product?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Category</td>
                    <td>{product?.categoryName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Brand</td>
                    <td>{product?.brand || 'DesignXcel'}</td>
                  </tr>
                  <tr>
                    <td>SKU</td>
                    <td>{product?.sku || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Dimensions</td>
                    <td>
                      {(() => {
                        try {
                          const dimensions = product?.specifications;
                          if (dimensions && (dimensions.length || dimensions.width || dimensions.height || dimensions.weight)) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {dimensions.length && <div><strong>Length:</strong> {dimensions.length} cm</div>}
                                {dimensions.width && <div><strong>Width:</strong> {dimensions.width} cm</div>}
                                {dimensions.height && <div><strong>Height:</strong> {dimensions.height} cm</div>}
                                {dimensions.weight && <div><strong>Weight:</strong> {dimensions.weight} kg</div>}
                                {dimensions.notes && <div><strong>Notes:</strong> {dimensions.notes}</div>}
                              </div>
                            );
                          }
                          return 'N/A';
                        } catch (e) {
                          return 'N/A';
                        }
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td>Material</td>
                    <td>{product?.material || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Color Options</td>
                    <td>{product?.colors ? product.colors.join(', ') : (product?.color || 'N/A')}</td>
                  </tr>
                  <tr>
                    <td>Stock Status</td>
                    <td>{product?.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}</td>
                  </tr>
                  <tr>
                    <td>Price</td>
                    <td>{product ? formatPrice(product.price) : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'review' && (
            <div className="review-content">
              <div className="review-tab-header">
                <div className="tab-header-content">
                  <div className="header-info">
                    <h3>Customer Reviews & Ratings</h3>
                    <p>Real feedback from verified customers who purchased {product?.name}</p>
                  </div>
                  <div className="product-review-summary">
                    <div className="summary-item">
                      <span className="summary-label">Product</span>
                      <span className="summary-value">{product?.name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Category</span>
                      <span className="summary-value">{product?.categoryName || 'Furniture'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">ID Number</span>
                      <span className="summary-value">{product?.sku || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ReviewSection 
                productId={product?.id} 
                productName={product?.name || 'Product'} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Cart Success Modal */}
      <CartSuccessModal
        isOpen={showCartSuccessModal}
        onClose={() => setShowCartSuccessModal(false)}
        product={product}
        quantity={quantity}
        onContinueShopping={() => setShowCartSuccessModal(false)}
        onViewCart={() => navigate('/cart')}
      />
      
    </div>
  );
};

export default ProductDetail;

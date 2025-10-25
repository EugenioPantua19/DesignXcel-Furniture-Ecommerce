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
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
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

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
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

    if (id) {
      loadProduct();
    }
  }, [id]);

  // Load variations when product loads
  useEffect(() => {
    if (product) {
      loadVariations();
    }
  }, [product]);

  // Load variations function
  const loadVariations = async () => {
    try {
      const response = await getProductVariations(id);
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
        addToCart(productWithVariation, quantity);
        setShowCartSuccessModal(true);
      } finally {
        setAddingToCart(false);
      }
    }
  };

  // Handle 3D Products
  const handle3DProducts = () => {
    navigate(`/3d-products/${id}`);
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
              <span className="stock-badge in-stock">In Stock</span>
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
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  disabled={quantity >= stockQuantity}
                >
                  +
                </button>
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

              <button 
                className="btn-buy-now" 
                onClick={handle3DProducts}
                disabled={!isInStock}
              >
                3D Products
              </button>
              
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
              <div>ID : {product.id}</div>
              <div>Category : {product.categoryName}</div>
            </div>

            {/* Share Options */}
            <div className="share-section">
              <span className="share-label">Share :</span>
              <div className="social-icons">
                <button className="social-btn facebook" aria-label="Share on Facebook">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="social-btn twitter" aria-label="Share on Twitter">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button className="social-btn pinterest" aria-label="Share on Pinterest">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </button>
                <button className="social-btn instagram" aria-label="Share on Instagram">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
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
                    <td>Product ID</td>
                    <td>{product?.id || 'N/A'}</td>
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
                      <span className="summary-value">{product?.id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ReviewSection 
                productId={id} 
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

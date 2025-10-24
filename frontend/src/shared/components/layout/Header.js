import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProductSearch } from '../../../features/products/hooks/useProductSearch';
import { useCart } from '../../../shared/contexts/CartContext';
import { useWishlist } from '../../../shared/contexts/WishlistContext';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaSearch, FaUser, FaShoppingCart, FaListAlt, FaBars, FaHeart } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUtils';
import ModernThemeSwitcher from '../theme/ModernThemeSwitcher';
import { ChristmasIcons } from '../christmas';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { searchProducts, searchResults, isSearching, clearSearch } = useProductSearch();
  const { getItemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [offerBarData, setOfferBarData] = useState(null);
  const [showOfferBar, setShowOfferBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [bannerColors, setBannerColors] = useState({
    contactBgColor: '#f8f9fa',
    contactTextColor: '#6c757d',
    contactIconColor: '#F0B21B',
    mainBgColor: '#ffffff',
    navBgColor: '#F0B21B',
    navTextColor: '#333333',
    navHoverColor: '#d69e16',
    searchBorderColor: '#ffc107',
    iconColor: '#F0B21B',
    contactEmail: 'designexcellence1@gmail.com',
    contactPhone: '(02) 413-6682',
    contactAddress: '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City',
    searchPlaceholder: 'Search',
    contactFontSize: '0.6rem',
    contactSpacing: '0.8rem',
    contactShowIcons: true,
    logoUrl: null
  });
  const mainRowRef = useRef(null);
  const searchRef = useRef(null);
  // Removed isScrolled state - contact row always visible

  // Fetch header banner settings
  useEffect(() => {
    const fetchHeaderBannerSettings = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBase}/api/header-banner`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.banner) {
            setBannerColors(prev => ({
              ...prev,
              ...data.banner
            }));
          }
        }
      } catch (error) {
        // Failed to fetch header banner settings, using defaults
      }
    };

    fetchHeaderBannerSettings();
    
    // Refetch settings every 30 seconds to catch updates from CMS
    const interval = setInterval(fetchHeaderBannerSettings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Detect current theme from body class
  useEffect(() => {
    const detectTheme = () => {
      const bodyClasses = document.body.className;
      if (bodyClasses.includes('theme-christmas')) {
        setCurrentTheme('christmas');
      } else if (bodyClasses.includes('theme-dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('default');
      }
    };

    // Initial detection
    detectTheme();

    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Fetch offer bar data from backend
  const fetchOfferBarData = async () => {
    try {
      const apiBase2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase2}/api/header-offer-bar`);
      const data = await response.json();
      
      if (data.isActive) {
        setOfferBarData(data);
        setShowOfferBar(true);
      } else if (data.showInactive) {
        // Show bar with background but no content when inactive
        setOfferBarData({
          ...data,
          offerText: '',
          buttonText: '',
          showContent: false
        });
        setShowOfferBar(true);
      } else {
        setShowOfferBar(false);
      }
    } catch (error) {
      // Error fetching offer bar data
      setShowOfferBar(false);
    }
  };

  // Fetch offer bar data on component mount
  useEffect(() => {
    fetchOfferBarData();
    
    // Refresh offer bar data every 5 minutes
    const interval = setInterval(fetchOfferBarData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle sticky offsets (contact row always visible)
  useEffect(() => {
    const updateMainHeightVar = () => {
      const height = mainRowRef.current ? mainRowRef.current.offsetHeight : 70;
      document.documentElement.style.setProperty('--header-main-height', height + 'px');
    };
    updateMainHeightVar();
    window.addEventListener('resize', updateMainHeightVar);

    // Keep contact row always visible - removed scroll hide functionality
    return () => {
      window.removeEventListener('resize', updateMainHeightVar);
    };
  }, []);


  // Search functionality
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await searchProducts(searchQuery.trim());
      setShowSearchResults(true);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      clearSearch();
    }
  };

  const handleSearchResultClick = (product) => {
    setShowSearchResults(false);
    setSearchQuery('');
    clearSearch();
    navigate(`/products/${product.id}`);
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Search popup toggle
  const toggleSearchPopup = () => {
    setShowSearchPopup(!showSearchPopup);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  return (
    <>
      <style>
        {`
          .header-nav-link {
            color: #fff !important;
            font-weight: 700 !important;
          }
          .header-nav-link:hover {
            color: #fff !important;
            font-weight: 700 !important;
            text-decoration: underline;
            text-decoration-color: white;
            text-underline-offset: 4px;
            transition: text-decoration 0.3s ease;
          }
          ${offerBarData && offerBarData.textColor ? `
            .header-offer-bar .offer-text {
              color: ${offerBarData.textColor} !important;
            }
          ` : ''}
        `}
      </style>
      <header className="header-main" style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Special Offer Bar - Dynamic from backend */}
      {showOfferBar && offerBarData && (
        <div 
          className="header-offer-bar"
          style={{
            backgroundColor: offerBarData.backgroundColor,
            color: offerBarData.textColor,
            minHeight: '40px', // Ensure bar has height even when empty
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginTop: 0,
            paddingTop: (() => {
              const width = window.innerWidth;
              if (width <= 480) return '4px';
              if (width <= 768) return '8px';
              if (width <= 1024) return '0.5rem';
              return '0.5rem';
            })()
          }}
        >
          {offerBarData.showContent !== false && offerBarData.offerText && (
            <>
              <span 
                className="offer-text"
                style={{ color: offerBarData.textColor }}
              >
                <b>⚡  {offerBarData.offerText}</b>
              </span>
              {offerBarData.buttonText && (
                <button 
                  className="offer-shop-btn"
                  onClick={() => navigate(offerBarData.offerLink || '/products')}
                  style={{
                    background: 'white',
                    color: offerBarData.backgroundColor,
                    border: `1px solid white`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginLeft: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {offerBarData.buttonText}
                </button>
              )}
              
              {/* Theme Switcher positioned after offer button */}
              <div 
                className="offer-bar-theme-switcher"
                style={{
                  marginLeft: '1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ModernThemeSwitcher size="small" />
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Theme Switcher fallback when offer bar is not active */}
      {(!showOfferBar || !offerBarData) && (
        <div 
          className="header-theme-switcher-fallback"
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '1rem',
            zIndex: 1000
          }}
        >
          <ModernThemeSwitcher size="small" />
        </div>
      )}
      
      {/* Main Logo/Search/User/Cart/Mail Row */}
      <div 
        ref={mainRowRef}
        className="header-main-row"
        style={{
          backgroundColor: bannerColors.mainBgColor
        }}
      >
        {/* Mobile Hamburger Menu Button */}
        <div className="header-mobile-menu-btn">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <FaBars style={{color: bannerColors.iconColor, fontSize: '1.2rem'}} />
          </button>
        </div>

        <div className="header-main-left">
          <div className="header-contact-info">
            <span className="header-contact-item">
              <FaEnvelope className="header-icon" style={{color: bannerColors.contactIconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactEmail}
            </span>
            <span className="header-contact-item">
              <FaPhone className="header-icon" style={{color: bannerColors.contactIconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactPhone}
            </span>
            <span className="header-contact-item">
              <FaMapMarkerAlt className="header-icon" style={{color: bannerColors.contactIconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactAddress}
            </span>
          </div>
        </div>
        <div className="header-main-center">
          <Link to="/" className="header-logo">
            {bannerColors.logoUrl ? (
              <img 
                src={(bannerColors.logoUrl && bannerColors.logoUrl.startsWith('/')) 
                  ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${bannerColors.logoUrl}` 
                  : bannerColors.logoUrl} 
                alt="Design Excellence Logo" 
                style={{ 
                  height: '40px', 
                  width: 'auto',
                  maxWidth: '200px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <div 
              style={{
                fontWeight: 'bold',
                fontSize: '1.5rem',
                color: '#333333',
                letterSpacing: '1px',
                display: bannerColors.logoUrl ? 'none' : 'block'
              }}
            >
              DESIGN EXCELLENCE
            </div>
          </Link>
        </div>
        <div className="header-main-right" ref={searchRef}>
          <Link to="/account" className="header-icon-btn desktop-user-btn" title="Account">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaUser style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </Link>
          <Link to="/wishlist" className="header-icon-btn desktop-wishlist-btn" title="Wishlist">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <FaHeart style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
              {wishlistCount > 0 && (
                <span className="wishlist-count" style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#F0B21B',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  boxShadow: '0 2px 4px rgba(240, 178, 27, 0.3)'
                }}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>
          </Link>
          <Link to="/cart" className="header-icon-btn" title="Cart">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <FaShoppingCart style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
              {getItemCount() > 0 && (
                <span className="cart-count" style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#F0B21B',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  boxShadow: '0 2px 4px rgba(240, 178, 27, 0.3)'
                }}>
                  {getItemCount() > 99 ? '99+' : getItemCount()}
                </span>
              )}
            </div>
          </Link>
          <Link to="/orders" className="header-icon-btn" title="Orders">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaListAlt style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </Link>

          {/* Mobile Search Button */}
          <button 
            className="header-icon-btn mobile-search-btn" 
            title="Search"
            onClick={toggleSearchPopup}
          >
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaSearch style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </button>
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <div 
              className="header-search-container"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: `2px solid ${bannerColors.searchBorderColor}`,
                borderRadius: '20px',
                padding: '6px 12px',
                width: '200px',
                height: '36px'
              }}
            >
              <FaSearch 
                className="search-icon" 
                style={{
                  color: bannerColors.iconColor, 
                  fontSize: '0.9rem', 
                  marginRight: '6px',
                  flexShrink: 0
                }}
              />
              <input 
                type="text" 
                placeholder={bannerColors.searchPlaceholder} 
                className="header-search-input" 
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                style={{ 
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.85rem',
                  color: '#333333',
                  flex: 1,
                  padding: '2px 0',
                  height: '100%'
                }}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="header-search-results">
                <div className="search-results-header">
                  <span>Search Results ({searchResults.length})</span>
                  <button 
                    type="button" 
                    className="close-search-btn"
                    onClick={() => setShowSearchResults(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="search-results-list">
                  {searchResults.map((product) => (
                    <div 
                      key={product.id}
                      className="search-result-item"
                      onClick={() => handleSearchResultClick(product)}
                    >
                      <div className="search-result-image">
                        <img 
                          src={getImageUrl(product.images?.[0])} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/logo192.png';
                          }}
                        />
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-name">{product.name}</div>
                        <div className="search-result-category">{product.categoryName}</div>
                        <div className="search-result-price">
                          {product.hasDiscount && product.discountInfo ? (
                            <>
                              <span className="original-price">₱{product.price.toLocaleString()}</span>
                              <span className="discount-price">₱{product.discountInfo.discountedPrice.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="price">₱{product.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="search-results-footer">
                  <button 
                    type="button" 
                    className="view-all-results-btn"
                    onClick={() => {
                      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                      setShowSearchResults(false);
                      setSearchQuery('');
                      clearSearch();
                    }}
                  >
                    View All Results
                  </button>
                </div>
              </div>
            )}
            
            {/* No Results Message */}
            {showSearchResults && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
              <div className="header-search-results no-results">
                <div className="search-results-header">
                  <span>No Results Found</span>
                  <button 
                    type="button" 
                    className="close-search-btn"
                    onClick={() => setShowSearchResults(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="search-no-results">
                  <p>No products found for "{searchQuery}"</p>
                  <p>Try different keywords or browse our categories</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Search Popup */}
      {showSearchPopup && (
        <div className="mobile-search-popup">
          <div className="mobile-search-content">
            <form onSubmit={handleSearchSubmit}>
              <div className="mobile-search-container">
                <FaSearch style={{color: bannerColors.iconColor, fontSize: '1rem', marginRight: '10px'}} />
                <input 
                  type="text" 
                  placeholder={bannerColors.searchPlaceholder} 
                  className="mobile-search-input" 
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  autoFocus
                />
                <button 
                  type="button" 
                  className="close-search-popup"
                  onClick={toggleSearchPopup}
                >
                  ×
                </button>
              </div>
            </form>
            
            {/* Mobile Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mobile-search-results">
                {searchResults.slice(0, 5).map((product) => (
                  <div 
                    key={product.id}
                    className="mobile-search-result-item"
                    onClick={() => handleSearchResultClick(product)}
                  >
                    <div className="mobile-search-result-image">
                      <img 
                        src={getImageUrl(product.images?.[0])} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                    </div>
                    <div className="mobile-search-result-info">
                      <div className="mobile-search-result-name">{product.name}</div>
                      <div className="mobile-search-result-price">
                        {product.hasDiscount && product.discountInfo ? (
                          <>
                            <span className="original-price">₱{product.price.toLocaleString()}</span>
                            <span className="discount-price">₱{product.discountInfo.discountedPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="price">₱{product.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="mobile-nav-menu">
          <div className="mobile-nav-content">
            <button 
              className="close-mobile-menu"
              onClick={toggleMobileMenu}
            >
              ×
            </button>
            <nav className="mobile-nav-links">
              <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>HOME</Link>
              <Link to="/products" className="mobile-nav-link" onClick={toggleMobileMenu}>Products</Link>
              <Link to="/projects" className="mobile-nav-link" onClick={toggleMobileMenu}>Projects</Link>
              <Link to="/3d-products-furniture" className="mobile-nav-link" onClick={toggleMobileMenu}>3D Products</Link>
              <Link to="/about" className="mobile-nav-link" onClick={toggleMobileMenu}>About Us</Link>
              <Link to="/contact" className="mobile-nav-link" onClick={toggleMobileMenu}>Contact Us</Link>
              
              {/* Wishlist Link */}
              <Link to="/wishlist" className="mobile-nav-link" onClick={toggleMobileMenu}>
                <FaHeart style={{marginRight: '8px', fontSize: '1rem'}} />
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              
              {/* Cart Link */}
              <Link to="/cart" className="mobile-nav-link" onClick={toggleMobileMenu}>
                <FaShoppingCart style={{marginRight: '8px', fontSize: '1rem'}} />
                Cart {getItemCount() > 0 && `(${getItemCount()})`}
              </Link>
              
              {/* Login Button */}
              <Link to="/account" className="mobile-nav-link mobile-login-btn" onClick={toggleMobileMenu}>
                <FaUser style={{marginRight: '8px', fontSize: '1rem'}} />
                Login / Account
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav 
        className="header-nav-bar"
        style={{
          backgroundColor: bannerColors.navBgColor,
          color: bannerColors.navTextColor
        }}
      >
        {currentTheme === 'christmas' && (
          <div className="christmas-nav-decoration">
            <ChristmasIcons.Tree size={16} />
          </div>
        )}
        <Link to="/" className="header-nav-link">HOME</Link>
        <Link to="/products" className="header-nav-link">Products</Link>
        <Link to="/projects" className="header-nav-link">Projects</Link>
        <Link to="/3d-products-furniture" className="header-nav-link">3D Products</Link>
        <Link to="/about" className="header-nav-link">About Us</Link>
        <Link to="/contact" className="header-nav-link">Contact Us</Link>
        {currentTheme === 'christmas' && (
          <div className="christmas-nav-decoration">
            <ChristmasIcons.Star size={16} />
          </div>
        )}
      </nav>
      </header>
    </>
  );
};

export default Header; 
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProductSearch } from '../../../features/products/hooks/useProductSearch';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaSearch, FaUser, FaShoppingCart, FaEnvelope as FaMail } from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();
  const { searchProducts, searchResults, isSearching, clearSearch } = useProductSearch();
  const [offerBarData, setOfferBarData] = useState(null);
  const [showOfferBar, setShowOfferBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [bannerColors, setBannerColors] = useState({
    contactBgColor: '#f8f9fa',
    contactTextColor: '#6c757d',
    mainBgColor: '#ffffff',
    mainTextColor: '#333333',
    navBgColor: '#F0B21B',
    navTextColor: '#333333',
    navHoverColor: '#d69e16',
    searchBorderColor: '#ffc107',
    searchBtnColor: '#ffc107',
    iconColor: '#F0B21B',
    contactEmail: 'designexcellence1@gmail.com',
    contactPhone: '(02) 413-6682',
    contactAddress: '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City',
    searchPlaceholder: 'Search'
  });
  const contactRowRef = useRef(null);
  const mainRowRef = useRef(null);
  const searchRef = useRef(null);
  // Removed isScrolled state - contact row always visible


  // Fetch offer bar data from backend
  const fetchOfferBarData = async () => {
    try {
      const response = await fetch('/api/header-offer-bar');
      const data = await response.json();
      
      if (data.isActive) {
        setOfferBarData(data);
        setShowOfferBar(true);
      } else {
        setShowOfferBar(false);
      }
    } catch (error) {
      console.error('Error fetching offer bar data:', error);
      setShowOfferBar(false);
    }
  };

  // Fetch banner color settings from backend
  const fetchBannerColors = async () => {
    try {
      console.log('Fetching banner colors from backend...');
      const response = await fetch('/api/header-banner');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Banner colors received:', data);
      
      if (data) {
        setBannerColors({
          contactBgColor: data.contactBgColor || '#f8f9fa',
          contactTextColor: data.contactTextColor || '#6c757d',
          mainBgColor: data.mainBgColor || '#ffffff',
          mainTextColor: data.mainTextColor || '#333333',
          navBgColor: data.navBgColor || '#F0B21B',
          navTextColor: data.navTextColor || '#333333',
          navHoverColor: data.navHoverColor || '#d69e16',
          searchBorderColor: data.searchBorderColor || '#ffc107',
          searchBtnColor: data.searchBtnColor || '#ffc107',
          iconColor: data.iconColor || '#F0B21B',
          contactEmail: data.contactEmail || 'designexcellence1@gmail.com',
          contactPhone: data.contactPhone || '(02) 413-6682',
          contactAddress: data.contactAddress || '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City',
          searchPlaceholder: data.searchPlaceholder || 'Search'
        });
        console.log('Banner colors applied successfully');
      }
    } catch (error) {
      console.error('Error fetching banner colors:', error);
      // Keep default colors on error
    }
  };

  // Fetch offer bar data on component mount
  useEffect(() => {
    fetchOfferBarData();
    fetchBannerColors();
    
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
          .header-nav-link:hover {
            color: ${bannerColors.navHoverColor} !important;
            transition: color 0.3s ease;
          }
        `}
      </style>
      <header className="header-main">
      {/* Special Offer Bar - Dynamic from backend */}
      {showOfferBar && offerBarData && (
        <div 
          className="header-offer-bar"
          style={{
            backgroundColor: offerBarData.backgroundColor,
            color: offerBarData.textColor
          }}
        >
          <span className="offer-text">
            <b>⚡  {offerBarData.offerText}</b>
          </span>
          <button 
            className="offer-shop-btn"
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
        </div>
      )}
      {/* Main Logo/Search/User/Cart/Mail Row */}
      <div 
        ref={mainRowRef}
        className="header-main-row"
        style={{
          backgroundColor: bannerColors.mainBgColor,
          color: bannerColors.mainTextColor
        }}
      >
        <div className="header-main-left">
          <div className="header-contact-info">
            <span className="header-contact-item">
              <FaEnvelope className="header-icon orange-icon" style={{color: bannerColors.iconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactEmail}
            </span>
            <span className="header-contact-item">
              <FaPhone className="header-icon orange-icon" style={{color: bannerColors.iconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactPhone}
            </span>
            <span className="header-contact-item">
              <FaMapMarkerAlt className="header-icon orange-icon" style={{color: bannerColors.iconColor, fontSize: '0.8rem', display: 'inline-block'}} />
              {bannerColors.contactAddress}
            </span>
          </div>
        </div>
        <div className="header-main-center">
          <Link to="/" className="header-logo">
            <img 
              src="/design-excellence-logo.png" 
              alt="Design Excellence Logo" 
              className="header-logo-img"
              style={{
                height: '1000px',
                width: 'auto',
                maxWidth: '1000px',
                objectFit: 'contain'
              }}
            />
          </Link>
        </div>
        <div className="header-main-right" ref={searchRef}>
          <Link to="/account" className="header-icon-btn" title="Account">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaUser style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </Link>
          <Link to="/cart" className="header-icon-btn" title="Cart">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaShoppingCart style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </Link>
          <Link to="/contact" className="header-icon-btn" title="Contact">
            <div className="icon-circle" style={{backgroundColor: '#f0f0f0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <FaMail style={{color: bannerColors.iconColor, fontSize: '1rem'}} />
            </div>
          </Link>
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
                          src={product.images?.[0] || '/logo192.png'} 
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
      {/* Navigation Bar */}
      <nav 
        className="header-nav-bar"
        style={{
          backgroundColor: bannerColors.navBgColor,
          color: bannerColors.navTextColor
        }}
      >
        <Link to="/" className="header-nav-link">HOME</Link>
        <Link to="/products" className="header-nav-link">Products</Link>
        <Link to="/projects" className="header-nav-link">Projects</Link>
        <Link to="/custom-furniture" className="header-nav-link">Custom Furniture</Link>
        <Link to="/about" className="header-nav-link">About Us</Link>
        <Link to="/contact" className="header-nav-link">Contact Us</Link>
      </nav>
      </header>
    </>
  );
};

export default Header; 
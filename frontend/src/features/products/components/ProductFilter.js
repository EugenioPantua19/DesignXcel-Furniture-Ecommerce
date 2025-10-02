import React, { useState, useEffect } from "react";
import apiClient from "../../../shared/services/api/apiClient";

const ProductFilter = ({ categories, products, filters, onFilterChange, onClearFilters }) => {
  const [priceRange, setPriceRange] = useState([25, 125]);
  const [realCategories, setRealCategories] = useState([]);
  const [realMaterials, setRealMaterials] = useState([]);
  const [priceRangeData, setPriceRangeData] = useState({ min: 25, max: 500 });
  const [stockStatus, setStockStatus] = useState({ inStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  
  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  const handleCheckboxChange = (filterType, checked) => {
    onFilterChange({ [filterType]: checked });
  };

  const handleCategoryChange = (category) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    onFilterChange({ categories: newCategories });
  };


  const handleMaterialChange = (material) => {
    const currentMaterials = filters.materials || [];
    const newMaterials = currentMaterials.includes(material)
      ? currentMaterials.filter(m => m !== material)
      : [...currentMaterials, material];
    onFilterChange({ materials: newMaterials });
  };

  const handlePriceRangeChange = (newRange) => {
    setPriceRange(newRange);
    onFilterChange({ priceRange: `${newRange[0]}-${newRange[1]}` });
  };

  const handleMinPriceChange = (value) => {
    const newMin = Math.min(parseInt(value), priceRange[1] - 1);
    handlePriceRangeChange([newMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (value) => {
    const newMax = Math.max(parseInt(value), priceRange[0] + 1);
    handlePriceRangeChange([priceRange[0], newMax]);
  };

  // Use props data first, then fetch from API if needed
  useEffect(() => {
    // If categories are provided as props, use them
    if (categories && categories.length > 0) {
      const processedCategories = categories.map(cat => 
        typeof cat === 'object' && cat.name ? cat.name : String(cat || '').trim()
      ).filter(cat => cat.length > 0);
      setRealCategories(processedCategories);
    }
    
    // If products are provided, extract categories from them
    if (products && products.length > 0) {
      const uniqueCategories = [...new Set(
        products
          .map(product => product.categoryName)
          .filter(Boolean)
          .map(category => String(category).trim())
          .filter(category => category.length > 0)
      )];
      
      if (uniqueCategories.length > 0) {
        setRealCategories(uniqueCategories);
      }
    }
    
    // Fetch additional data from API (price range, stock status, materials)
    const fetchAdditionalData = async () => {
      try {
        setLoading(true);
        
        const [materialsResponse, priceRangeResponse, stockStatusResponse] = await Promise.all([
          apiClient.get('/api/public/materials'),
          apiClient.get('/api/public/price-range'),
          apiClient.get('/api/public/stock-status')
        ]);
        
        // Set materials
        if (materialsResponse.success && materialsResponse.materials) {
          setRealMaterials(materialsResponse.materials.map(mat => 
            typeof mat === 'object' && mat.name ? mat.name : String(mat || '').trim()
          ).filter(mat => mat.length > 0));
        }
        
        // Set price range
        if (priceRangeResponse.success && priceRangeResponse.priceRange) {
          const { min, max } = priceRangeResponse.priceRange;
          setPriceRangeData({ min, max });
          setPriceRange([min, max]);
        }
        
        // Set stock status
        if (stockStatusResponse.success && stockStatusResponse.stockStatus) {
          setStockStatus(stockStatusResponse.stockStatus);
        }
        
      } catch (error) {
        console.error('Error fetching additional filter data:', error);
        
        // Fallback materials
        setRealMaterials(['Metal', 'Wood', 'Upholstered', 'Glass', 'Plastic', 'Fabric', 'Leather', 'Steel', 'Aluminum']);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdditionalData();
  }, [products, categories]);

  // Use extracted data or fallback to props/empty arrays
  const categoryOptions = realCategories.length > 0 ? realCategories : (categories || []).map(cat => 
    typeof cat === 'object' && cat.name ? cat.name : String(cat || '').trim()
  ).filter(cat => cat.length > 0);
  const materials = realMaterials;


  return (
    <div className="filter-sidebar-new">
      <h3 className="filter-title">Filter Options</h3>
      
      {/* Category */}
      <div className="filter-section-new">
        <h4>Category</h4>
        <div className="category-options">
          {categoryOptions.map(category => {
            // Handle both string and object formats
            const categoryName = typeof category === 'object' && category.name ? category.name : String(category || '').trim();
            const categoryLower = categoryName.toLowerCase();
            return (
              <label key={categoryName} className="category-option">
                <input
                  type="checkbox"
                  checked={(filters.categories || []).includes(categoryLower)}
                  onChange={() => handleCategoryChange(categoryLower)}
                />
                <span className="category-checkbox"></span>
                <span className="category-name">{categoryName}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div className="filter-section-new">
        <h4>Price</h4>
        {loading ? (
          <div className="loading-text">Loading price range...</div>
        ) : (
          <>
            <div className="price-range-display">
              ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
            </div>
            <div className="price-slider-container">
              <input
                type="range"
                min={priceRangeData.min}
                max={priceRangeData.max}
                value={priceRange[0]}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="price-slider price-slider-min"
              />
              <input
                type="range"
                min={priceRangeData.min}
                max={priceRangeData.max}
                value={priceRange[1]}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="price-slider price-slider-max"
              />
            </div>
          </>
        )}
      </div>


      {/* Material */}
      <div className="filter-section-new">
        <h4>Material</h4>
        <div className="material-options">
          {materials.map(material => {
            // Handle both string and object formats
            const materialName = typeof material === 'object' && material.name ? material.name : String(material || '').trim();
            const materialLower = materialName.toLowerCase();
            return (
              <label key={materialName} className="material-option">
                <input
                  type="checkbox"
                  checked={(filters.materials || []).includes(materialLower)}
                  onChange={() => handleMaterialChange(materialLower)}
                />
                <span className="material-checkbox"></span>
                <span className="material-name">{materialName}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Availability */}
      <div className="filter-section-new">
        <h4>Availability</h4>
        {loading ? (
          <div className="loading-text">Loading stock status...</div>
        ) : (
          <div className="availability-options">
            <label className="availability-option">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleCheckboxChange("inStock", e.target.checked)}
              />
              <span className="availability-checkbox"></span>
              <span className="availability-name">
                In Stock ({stockStatus.inStock || 0})
              </span>
            </label>
            <label className="availability-option">
              <input
                type="checkbox"
                checked={filters.outOfStock}
                onChange={(e) => handleCheckboxChange("outOfStock", e.target.checked)}
              />
              <span className="availability-checkbox"></span>
              <span className="availability-name">
                Out of Stock ({stockStatus.outOfStock || 0})
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;

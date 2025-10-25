import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ThreeDProductsFurnitureCard from '../components/3dProductsFurnitureCard';
import ProductFilter from '../../products/components/ProductFilter';
import PageHeader from '../../../shared/components/layout/PageHeader';
import { getAllProducts, getCategories } from '../../products/services/productService';
import '../../../app/pages.css';

const ThreeDProductsFurniture = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        categories: [],
        priceRange: '',
        search: '',
        sortBy: 'name',
        featured: false,
        inStock: false,
        customizable: false,
        colors: [],
        materials: [],
        outOfStock: false
    });
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');

    // Parse URL parameters
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const categoryParam = searchParams.get('category');
        const searchParam = searchParams.get('search');

        setFilters(prev => ({
            ...prev,
            categories: categoryParam ? [categoryParam] : [],
            search: searchParam || ''
        }));

        if (categoryParam) {
            setSelectedCategoryName(categoryParam);
        }
    }, [location.search]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [products, filters]);

    const loadData = async () => {
        try {
            const [productsResponse, categoriesResponse] = await Promise.all([
                getAllProducts(),
                getCategories()
            ]);
            const productsData = productsResponse.products || [];
            
            // Filter products to only include those with 3D models (check Has3DModel field)
            const customFurnitureProducts = productsData.filter(product => 
                product.Has3DModel || product.model3d || product.has3dModel
            );
            
            const categoriesData = categoriesResponse.categories || [];
            
            // Filter categories to only include those that have products with 3D models
            // Handle both string and object formats from API
            const customFurnitureCategories = categoriesData.filter(category => {
                const categoryName = typeof category === 'object' && category.name ? category.name : String(category || '').trim();
                return customFurnitureProducts.some(product => 
                    product.categoryName === categoryName
                );
            });
            
            setProducts(customFurnitureProducts);
            setCategories([
                { id: '', name: 'All 3D Products Furniture', count: customFurnitureProducts.length },
                ...customFurnitureCategories.map(cat => {
                    const categoryName = typeof cat === 'object' && cat.name ? cat.name : String(cat || '').trim();
                    return {
                        id: categoryName,
                        name: categoryName,
                        count: customFurnitureProducts.filter(p => p.categoryName === categoryName).length
                    };
                })
            ]);
        } catch (error) {
            console.error('Error loading custom furniture data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        // Category filter
        if (filters.categories && filters.categories.length > 0) {
            filtered = filtered.filter(product =>
                filters.categories.some(category =>
                    product.categoryId?.toString() === category ||
                    product.categoryName === category ||
                    product.categoryName?.toLowerCase() === category
                )
            );
        }

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                product.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Price range filter
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(product => {
                const price = (product.hasDiscount && product.discountInfo) ? product.discountInfo.discountedPrice : product.price;
                if (max === 999999) {
                    // For "Over " option
                    return price >= min;
                }
                return price >= min && price <= max;
            });
        }

        // Quick filters
        if (filters.featured) {
            filtered = filtered.filter(product => product.featured);
        }

        if (filters.inStock) {
            filtered = filtered.filter(product => {
                const stock = product.StockQuantity ?? product.stock ?? product.quantity ?? product.stockQuantity ?? 0;
                return stock > 0;
            });
        }

        if (filters.outOfStock) {
            filtered = filtered.filter(product => {
                const stock = product.StockQuantity ?? product.stock ?? product.quantity ?? product.stockQuantity ?? 0;
                return stock === 0;
            });
        }

        if (filters.customizable) {
            filtered = filtered.filter(product => product.customizable);
        }

        // Material filter
        if (filters.materials && filters.materials.length > 0) {
            filtered = filtered.filter(product => 
                filters.materials.some(material => 
                    product.material && product.material.toLowerCase().includes(material)
                )
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const priceA = (a.hasDiscount && a.discountInfo) ? a.discountInfo.discountedPrice : a.price;
            const priceB = (b.hasDiscount && b.discountInfo) ? b.discountInfo.discountedPrice : b.price;

            switch (filters.sortBy) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        setFilteredProducts(filtered);
    };

    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters });
    };

    const clearAllFilters = () => {
        setFilters({
            category: '',
            priceRange: '',
            search: '',
            sortBy: 'name',
            featured: false,
            inStock: false,
            customizable: false,
            colors: [],
            materials: [],
            outOfStock: false
        });
    };

    const removeFilter = (filterType, value = null) => {
        if (filterType === 'materials' && value) {
            setFilters(prev => ({
                ...prev,
                materials: prev.materials.filter(m => m !== value)
            }));
        } else {
            setFilters(prev => ({
                ...prev,
                [filterType]: filterType === 'sortBy' ? 'name' : (Array.isArray(prev[filterType]) ? [] : false)
            }));
        }
    };

    const getActiveFilters = () => {
        const activeFilters = [];
        
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-');
            activeFilters.push({
                type: 'priceRange',
                label: `Price: $${min}.00 - $${max}.00`,
                value: filters.priceRange
            });
        }
        
        
        if (filters.inStock) {
            activeFilters.push({
                type: 'inStock',
                label: 'In Stock',
                value: true
            });
        }
        
        return activeFilters;
    };

    if (loading) {
        return (
            <div className="catalog-page">
                <div className="container">
                    <div className="loading">
                        <p>Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="container">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: '3D Products Furniture', href: '/3d-products-furniture' },
                        ...(selectedCategoryName ? [{ label: selectedCategoryName }] : [])
                    ]}
                    title={selectedCategoryName ? `${selectedCategoryName} Collection` : '3D Products Furniture'}
                    subtitle={selectedCategoryName
                        ? `Explore our premium ${selectedCategoryName} collection with 3D customization`
                        : 'Design and customize your perfect furniture with our interactive 3D configurator'}
                />
                <div className="catalog-header">
                    {selectedCategoryName && (
                        <div className="category-actions">
                            <Link to="/3d-products-furniture" className="clear-filter-btn">
                                View All 3D Products Furniture
                            </Link>
                        </div>
                    )}
                </div>

                <div className="catalog-content">
                    <aside className="catalog-sidebar">
                        <ProductFilter
                            categories={categories}
                            products={products}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearAllFilters}
                        />
                    </aside>

                    <main className="catalog-main">
                        <div className="catalog-controls">
                            <div className="results-info">
                                <span>Showing 1-12 of {filteredProducts.length} results</span>
                            </div>

                            <div className="catalog-actions">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                                    className="sort-select"
                                >
                                    <option value="name">Sort by: Default Sorting</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {getActiveFilters().length > 0 && (
                            <div className="active-filters">
                                {getActiveFilters().map((filter, index) => (
                                    <div key={index} className="filter-tag">
                                        <span>{filter.label}</span>
                                        <button 
                                            onClick={() => removeFilter(filter.type, filter.value)}
                                            className="remove-filter"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={clearAllFilters}
                                    className="clear-all-filters"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

                        <div className="products-grid">
                            {filteredProducts.map(product => (
                                <ThreeDProductsFurnitureCard key={product.id} product={product} />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="no-products">
                                <h3>No products found</h3>
                                <p>Try adjusting your filters or search terms</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ThreeDProductsFurniture;

import { useState, useCallback } from 'react';
import { productService } from '../services/productService';

export const useProductSearch = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const searchProducts = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchQuery(query);

        try {
            const results = await productService.searchProducts(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setSearchQuery('');
        setIsSearching(false);
    }, []);

    return {
        searchProducts,
        searchResults,
        isSearching,
        searchQuery,
        clearSearch
    };
};
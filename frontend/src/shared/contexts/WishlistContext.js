import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children, userId }) => {
  const [wishlist, setWishlist] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previousUserId, setPreviousUserId] = useState(userId);

  // Load wishlist from localStorage on mount or when userId changes
  useEffect(() => {
    // Skip loading if userId is still loading
    if (userId === 'loading') {
      setIsLoading(true);
      return;
    }
    
    // Set loading to false when we start loading wishlist data
    setIsLoading(false);
    
    const savedWishlist = localStorage.getItem(`wishlist-${userId}`);
    const guestWishlist = localStorage.getItem('wishlist-guest');
    
    // Check if this is a login transition (guest -> user)
    const isLoginTransition = previousUserId === 'guest' && userId !== 'guest';
    
    if (savedWishlist) {
      try {
        const wishlistData = JSON.parse(savedWishlist);
        
        // If this is a login transition and we have guest wishlist, merge them
        if (isLoginTransition && guestWishlist) {
          try {
            const guestWishlistData = JSON.parse(guestWishlist);
            if (guestWishlistData && guestWishlistData.length > 0) {
              const mergedWishlist = [...wishlistData];
              
              guestWishlistData.forEach(guestItem => {
                const existingItemIndex = mergedWishlist.findIndex(item => item.id === guestItem.id);
                
                if (existingItemIndex === -1) {
                  mergedWishlist.push(guestItem);
                }
              });
              
              setWishlist(mergedWishlist);
              localStorage.removeItem('wishlist-guest');
              setPreviousUserId(userId);
              return;
            }
          } catch (error) {
            console.error('Error merging wishlists during login transition:', error);
          }
        }
        
        // Only load wishlist data if it has items or if current state is empty
        if (wishlistData && wishlistData.length > 0) {
          setWishlist(wishlistData);
        } else if (wishlist.length === 0) {
          setWishlist(wishlistData);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
        setWishlist([]);
      }
    } else if (guestWishlist && userId !== 'guest') {
      // If user just logged in and has no saved wishlist, but has guest wishlist items
      try {
        const guestWishlistData = JSON.parse(guestWishlist);
        
        if (guestWishlistData && guestWishlistData.length > 0) {
          // Merge guest wishlist with user wishlist
          setWishlist(guestWishlistData);
          // Clear guest wishlist after merging
          localStorage.removeItem('wishlist-guest');
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error('Error merging guest wishlist:', error);
        setWishlist([]);
      }
    } else if (savedWishlist && guestWishlist && userId !== 'guest') {
      // If user has both saved wishlist and guest wishlist, merge them
      try {
        const savedWishlistData = JSON.parse(savedWishlist);
        const guestWishlistData = JSON.parse(guestWishlist);
        
        if (guestWishlistData && guestWishlistData.length > 0) {
          // Merge guest wishlist items with saved wishlist
          const mergedWishlist = [...savedWishlistData];
          
          guestWishlistData.forEach(guestItem => {
            // Check if item already exists in saved wishlist
            const existingItemIndex = mergedWishlist.findIndex(item => item.id === guestItem.id);
            
            if (existingItemIndex === -1) {
              // Add new item
              mergedWishlist.push(guestItem);
            }
          });
          
          setWishlist(mergedWishlist);
          // Clear guest wishlist after merging
          localStorage.removeItem('wishlist-guest');
        } else {
          setWishlist(savedWishlistData);
        }
      } catch (error) {
        console.error('Error merging wishlists:', error);
        setWishlist([]);
      }
    } else {
      setWishlist([]);
    }
    
    // Update previous userId
    setPreviousUserId(userId);
  }, [userId, previousUserId]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    // Skip saving if userId is still loading
    if (userId === 'loading') {
      return;
    }
    localStorage.setItem(`wishlist-${userId}`, JSON.stringify(wishlist));
  }, [wishlist, userId]);

  // Listen for login success events to refresh wishlist
  useEffect(() => {
    const handleLoginSuccess = () => {
      // Small delay to ensure user state is updated
      setTimeout(() => {
        // Force refresh by updating previousUserId to trigger useEffect
        setPreviousUserId('guest');
      }, 200);
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [userId]);

  const addToWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (!exists) {
        const newWishlist = [...prev, { ...product, addedAt: new Date().toISOString() }];
        return newWishlist;
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const openWishlist = () => {
    setIsWishlistOpen(true);
  };

  const closeWishlist = () => {
    setIsWishlistOpen(false);
  };


  const value = {
    wishlist,
    isWishlistOpen,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    openWishlist,
    closeWishlist,
    wishlistCount: wishlist.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

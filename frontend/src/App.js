import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Global styles
import './styles/base/globals.css';
import './styles/themes/custom.css';
import './styles/themes/christmas-theme.css';
import './shared/components/ui/components.css';

// Shared contexts and providers
import { AuthProvider, useAuth } from './shared/hooks/useAuth';
import { CartProvider } from './shared/contexts/CartContext';
import { CurrencyProvider } from './shared/contexts/CurrencyContext';
import { LanguageProvider } from './shared/contexts/LanguageContext';
import { WishlistProvider } from './shared/contexts/WishlistContext';

// Shared layout components
import { Header, Footer } from './shared/components/layout';
import { MessageFloatingIcon } from './shared/components/feedback';
import ScrollUpButton from './shared/components/ui/ScrollUpButton';
import WishlistPopup from './shared/components/ui/WishlistPopup';

// App routes
import AppRoutes from './app/routes';

// Theme management
import { getImageUrl } from './shared/utils/imageUtils';
import './shared/utils/themeManager';
import ChristmasSnowfall from './shared/components/ChristmasSnowfall';
import { ChristmasPageDecoration } from './shared/components/christmas';

// Import Stripe debug utilities in development
if (process.env.NODE_ENV === 'development') {
    import('./shared/utils/stripeDebug');
}

// Background Image Handler Component
function BackgroundImageHandler() {
    useEffect(() => {
        const applyBackgroundImage = async (backgroundImageData = null) => {
            try {
                let imageData = backgroundImageData;
                
                if (!imageData) {
                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/theme/public`);
                    if (response.ok) {
                        const themeData = await response.json();
                        if (themeData.success && themeData.backgroundImage) {
                            imageData = { imageUrl: themeData.backgroundImage };
                        }
                    }
                }
                
                if (imageData && imageData.imageUrl) {
                    const fullImageUrl = getImageUrl(imageData.imageUrl);
                    document.body.style.backgroundImage = `url(${fullImageUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundRepeat = 'no-repeat';
                    document.body.style.backgroundAttachment = 'fixed';
                }
            } catch (error) {
                // Background image not available, using default styling
            }
        };

        applyBackgroundImage();
    }, []);

    return null;
}

// Theme Handler Component
function ThemeHandler() {
    const [currentTheme, setCurrentTheme] = useState('default');

    useEffect(() => {
        // Initialize theme manager
        if (window.themeManager) {
            window.themeManager.setupThemeListeners();
            // Ensure theme is loaded and applied
            window.themeManager.init();
            
            // Get current theme
            setCurrentTheme(window.themeManager.getCurrentTheme());
        }

        // Listen for theme changes
        const handleThemeChange = () => {
            if (window.themeManager) {
                setCurrentTheme(window.themeManager.getCurrentTheme());
            }
        };

        // Add event listener for theme changes
        document.addEventListener('themeChanged', handleThemeChange);
        
        return () => {
            document.removeEventListener('themeChanged', handleThemeChange);
        };
    }, []);

    return (
        <>
            <ChristmasSnowfall isActive={currentTheme === 'christmas'} />
            {currentTheme === 'christmas' && (
                <>
                    <ChristmasPageDecoration position="top-left" icon="tree" size={28} />
                    <ChristmasPageDecoration position="top-right" icon="star" size={24} />
                    <ChristmasPageDecoration position="bottom-left" icon="gift" size={26} />
                    <ChristmasPageDecoration position="bottom-right" icon="bell" size={24} />
                </>
            )}
        </>
    );
}

// Layout component
const Layout = ({ children }) => {
    return (
        <div className="app">
            <BackgroundImageHandler />
            <ThemeHandler />
            <Header />
            <main className="main-content">
                {children}
            </main>
            <Footer />
            <MessageFloatingIcon />
            <ScrollUpButton />
            <WishlistPopup />
        </div>
    );
};

// Cart Provider with User ID
function CartProviderWithUserId({ children }) {
    const { user, loading } = useAuth();
    // Use 'guest' as default userId for non-logged in users
    // Wait for auth to finish loading before initializing cart
    const userId = loading ? 'loading' : (user?.id || 'guest');
    return <CartProvider userId={userId}>{children}</CartProvider>;
}

// Wishlist Provider with User ID
function WishlistProviderWithUserId({ children }) {
    const { user, loading } = useAuth();
    // Use 'guest' as default userId for non-logged in users
    // Wait for auth to finish loading before initializing wishlist
    const userId = loading ? 'loading' : (user?.id || 'guest');
    return <WishlistProvider userId={userId}>{children}</WishlistProvider>;
}

function App() {
    return (
        <AuthProvider>
            <CurrencyProvider>
                <LanguageProvider>
                    <WishlistProviderWithUserId>
                        <CartProviderWithUserId>
                            <Router>
                                <Layout>
                                    <AppRoutes />
                                </Layout>
                            </Router>
                        </CartProviderWithUserId>
                    </WishlistProviderWithUserId>
                </LanguageProvider>
            </CurrencyProvider>
        </AuthProvider>
    );
}

export default App;

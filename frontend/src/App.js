import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Shared contexts and providers
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth';
import { CartProvider } from './shared/contexts/CartContext';
import { CurrencyProvider } from './shared/contexts/CurrencyContext';
import { LanguageProvider } from './shared/contexts/LanguageContext';

// Shared layout components
import { Header, Footer } from './shared/components/layout';
import { MessageFloatingIcon } from './shared/components/feedback';

// App routes
import AppRoutes from './app/routes';

// Import Stripe debug utilities in development
if (process.env.NODE_ENV === 'development') {
    import('./shared/utils/stripeDebug');
}

// Global styles
import './styles/base/globals.css';
import './styles/themes/custom.css';
import './shared/components/ui/components.css';

// Background Image Handler Component
function BackgroundImageHandler() {
    useEffect(() => {
        const applyBackgroundImage = async (backgroundImageData = null) => {
            try {
                let imageData = backgroundImageData;
                
                if (!imageData) {
                    const response = await fetch('/api/background-image');
                    if (response.ok) {
                        imageData = await response.json();
                    }
                }
                
                if (imageData && imageData.imageUrl) {
                    document.body.style.backgroundImage = `url(${imageData.imageUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundRepeat = 'no-repeat';
                    document.body.style.backgroundAttachment = 'fixed';
                }
            } catch (error) {
                console.log('Background image not available, using default styling');
            }
        };

        applyBackgroundImage();
    }, []);

    return null;
}

// Layout component
const Layout = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="app">
            <BackgroundImageHandler />
            <Header />
            <main className="main-content">
                {children}
            </main>
            <Footer />
            <MessageFloatingIcon />
        </div>
    );
};

// Cart Provider with User ID
function CartProviderWithUserId({ children }) {
    const { user } = useAuth();
    const userId = user?.id || null;
    return <CartProvider userId={userId}>{children}</CartProvider>;
}

function App() {
    return (
        <AuthProvider>
            <CurrencyProvider>
                <LanguageProvider>
                    <CartProviderWithUserId>
                        <Router>
                            <Layout>
                                <AppRoutes />
                            </Layout>
                        </Router>
                    </CartProviderWithUserId>
                </LanguageProvider>
            </CurrencyProvider>
        </AuthProvider>
    );
}

export default App;

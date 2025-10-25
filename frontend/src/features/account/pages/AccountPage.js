import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import ProfileManagement from '../components/ProfileManagement';
import AddressManagement from '../components/AddressManagement';
import OrderHistory from '../components/OrderHistory';
// import AccountPreferences from '../components/AccountPreferences'; // Unused
import SecuritySettings from '../components/SecuritySettings';
import apiClient from '../../../shared/services/api/apiClient';
import { 
  DashboardIcon, 
  UserIcon, 
  PackageIcon, 
  CreditCardIcon, 
  LockIcon,
  MenuIcon,
  // OrdersIcon, // Unused
  // DollarIcon, // Unused
  ClockIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  LogoutIcon,
  ArrowRightIcon,
  EyeIcon,
  TruckIcon
} from '../../../shared/components/ui/SvgIcons';
import { PageLoader } from '../../../shared/components/ui';
import '../components/account.css';

const Account = () => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [accountStats, setAccountStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle URL parameter changes for tab switching
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['dashboard', 'profile', 'orders', 'addresses', 'payment', 'security'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Redirect if not authenticated and fetch account statistics
    useEffect(() => {
        const fetchAccountData = async () => {
            if (!loading && !isAuthenticated) {
                navigate('/login');
                return;
            }
            
            if (!isAuthenticated) return;
                
                try {
                    setStatsLoading(true);
                    const [ordersResponse] = await Promise.all([
                    apiClient.get('/api/customer/orders-with-items'),
                    apiClient.get('/api/customer/addresses')
                ]);

                if (ordersResponse.success && ordersResponse.orders) {
                    const orders = ordersResponse.orders;
                    const totalOrders = orders.length;
                    
                    // Fix total spent calculation - ensure we're getting numeric values
                    const totalSpent = orders.reduce((sum, order) => {
                        const amount = parseFloat(order.totalAmount) || 0;
                        return sum + amount;
                    }, 0);
                    
                    const pendingOrders = orders.filter(order => 
                        order.status === 'pending' || order.status === 'processing'
                    ).length;
                    const completedOrders = orders.filter(order => 
                        order.status === 'delivered' || order.status === 'completed'
                    ).length;

                    setAccountStats({
                        totalOrders,
                        totalSpent,
                        pendingOrders,
                        completedOrders
                    });

                    // Set recent orders (last 3) - sort by date descending
                    const sortedOrders = orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                    setRecentOrders(sortedOrders.slice(0, 3));
                }
            } catch (error) {
                // Failed to fetch account stats
            } finally {
                setStatsLoading(false);
            }
        };

        fetchAccountData();
    }, [isAuthenticated, loading, navigate]);

    // Show loading while authentication is being checked
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '50vh',
                gap: '1rem'
            }}>
                <AudioLoader size="large" color="#F0B21B" />
                <p>Loading your account...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = () => {
        logout();
        // logout() function already handles redirect to /login
    };

    const tabs = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <DashboardIcon size={20} />,
            component: () => <DashboardTab 
                stats={accountStats} 
                recentOrders={recentOrders} 
                loading={statsLoading} 
                formatPrice={formatPrice}
                onLogout={handleLogout}
            />
        },
        {
            id: 'profile',
            label: 'Personal Information',
            icon: <UserIcon size={20} />,
            component: ProfileManagement
        },
        {
            id: 'orders',
            label: 'My Orders',
            icon: <PackageIcon size={20} />,
            component: OrderHistory
        },
        {
            id: 'addresses',
            label: 'Addresses',
            icon: <TruckIcon size={20} />,
            component: AddressManagement
        },
        {
            id: 'payment',
            label: 'Payment Method',
            icon: <CreditCardIcon size={20} />,
            component: () => <div className="coming-soon">Payment Method - Coming Soon</div>
        },
        {
            id: 'security',
            label: 'Password Manager',
            icon: <LockIcon size={20} />,
            component: SecuritySettings
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="account-page">
            <div className="account-container">
                {/* Header Section */}
                <div className="account-header">
                    <div className="welcome-section">
                        <h1 className="welcome-title">
                            Welcome back, {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}!
                        </h1>
                        <p className="welcome-subtitle">
                            Manage your account, track orders, and update your preferences
                        </p>
                    </div>
                </div>

                {/* Mobile Menu Toggle - Centered */}
                <div className="mobile-menu-toggle-container">
                    <button 
                        className="mobile-menu-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <MenuIcon size={24} color="#374151" />
                    </button>
                </div>

                <div className="account-layout">
                    <div className={`account-sidebar ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
                        {/* Mobile Close Button */}
                        <div className="mobile-close-button">
                            <button 
                                className="close-btn"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                ×
                            </button>
                        </div>
                        <nav className="account-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        navigate(`/account?tab=${tab.id}`);
                                        setIsMobileMenuOpen(false); // Close mobile menu when item is selected
                                    }}
                                >
                                    <span className="nav-icon">{tab.icon}</span>
                                    <span className="nav-label">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="account-main">
                        {/* Mobile Menu Overlay */}
                        {isMobileMenuOpen && (
                            <div 
                                className="mobile-menu-overlay"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}
                        <div className="account-content">
                            {ActiveComponent && <ActiveComponent />}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

// Dashboard Tab Component
const DashboardTab = ({ stats, recentOrders, loading, formatPrice, onLogout }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                minHeight: '300px',
                textAlign: 'center',
                gap: '1rem'
            }}>
                <AudioLoader size="medium" color="#F0B21B" />
                <div style={{ 
                    fontSize: window.innerWidth < 768 ? '14px' : '16px', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    maxWidth: '280px',
                    lineHeight: '1.5'
                }}>
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-tab">
            {/* Statistics Cards - Simplified */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalOrders}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{formatPrice(stats.totalSpent || 0)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Recent Orders</h2>
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/account?tab=orders')}
                    >
                        <ArrowRightIcon size={16} />
                        View All Orders
                    </button>
                </div>
                
                {recentOrders.length > 0 ? (
                    <div className="recent-orders">
                        {recentOrders.map((order) => (
                            <div key={order.orderID} className="recent-order-card">
                                <div className="order-info">
                                    <div className="order-number">Order #{order.orderID}</div>
                                    <div className="order-date">
                                        {new Date(order.orderDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="order-items-count">
                                        {order.items ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}` : '1 item'}
                                    </div>
                                </div>
                                <div className="order-status">
                                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </span>
                                </div>
                                <div className="order-total">
                                    {formatPrice(parseFloat(order.totalAmount) || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No orders yet. Start shopping to see your orders here.</p>
                        <button 
                            className="btn-primary"
                            onClick={() => navigate('/products')}
                        >
                            Browse Products
                        </button>
                    </div>
                )}
            </div>

            {/* Dashboard Actions */}
            <div className="dashboard-actions">
                <button className="btn-secondary" onClick={() => navigate('/products')}>
                    <ShoppingBagIcon size={16} />
                    Continue Shopping
                </button>
                <button className="btn-danger" onClick={onLogout}>
                    <LogoutIcon size={16} />
                    Logout
                </button>
            </div>

        </div>
    );
};

// Helper function to get status icon
const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return <ClockIcon size={14} />;
        case 'processing':
            return <ClockIcon size={14} />;
        case 'shipped':
            return <TruckIcon size={14} />;
        case 'delivered':
        case 'completed':
            return <CheckCircleIcon size={14} />;
        default:
            return <PackageIcon size={14} />;
    }
};


export default Account;
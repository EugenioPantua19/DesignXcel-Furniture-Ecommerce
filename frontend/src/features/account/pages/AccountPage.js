import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import ProfileManagement from '../components/ProfileManagement';
import AddressManagement from '../components/AddressManagement';
import OrderHistory from '../components/OrderHistory';
import PaymentMethod from '../components/PaymentMethod';
import SecuritySettings from '../components/SecuritySettings';
import DeleteAccountModal from '../components/DeleteAccountModal';
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
    
    // Delete account modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1); // 1: OTP, 2: Confirmation
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Get returnTo parameter for navigation back to checkout
    const returnTo = searchParams.get('returnTo');

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
                    
                    // Fix total spent calculation - use correct field names from API
                    const totalSpent = orders.reduce((sum, order) => {
                        const amount = parseFloat(order.TotalAmount) || 0;
                        return sum + amount;
                    }, 0);
                    
                    // Use correct field names for status filtering
                    const pendingOrders = orders.filter(order => 
                        order.Status === 'Pending' || order.Status === 'Processing'
                    ).length;
                    const completedOrders = orders.filter(order => 
                        order.Status === 'Delivered' || order.Status === 'Completed'
                    ).length;

                    setAccountStats({
                        totalOrders,
                        totalSpent,
                        pendingOrders,
                        completedOrders
                    });

                    // Set recent orders (last 3) - sort by date descending using correct field name
                    const sortedOrders = orders.sort((a, b) => new Date(b.OrderDate) - new Date(a.OrderDate));
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
                user={user}
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
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
            component: () => <AddressManagement returnTo={returnTo} />
        },
        {
            id: 'payment',
            label: 'Payment Method',
            icon: <CreditCardIcon size={20} />,
            component: PaymentMethod
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
const DashboardTab = ({ stats, recentOrders, loading, formatPrice, onLogout, user, showDeleteModal, setShowDeleteModal }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="dashboard-loading">
                <AudioLoader size="medium" color="#F0B21B" />
                <div className="loading-text">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Welcome Header */}
            <div className="dashboard-header">
                <div className="welcome-content">
                    <div className="welcome-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F0B21B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="#F0B21B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="welcome-text">
                        <h1 className="welcome-title">Welcome back, {user?.fullName || 'Customer'}!</h1>
                        <p className="welcome-subtitle">Here's an overview of your account activity</p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <PackageIcon size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalOrders}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" stroke="#F0B21B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatPrice(stats.totalSpent || 0)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <ClockIcon size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pendingOrders}</div>
                        <div className="stat-label">Pending Orders</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <CheckCircleIcon size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.completedOrders}</div>
                        <div className="stat-label">Completed Orders</div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="dashboard-section">
                <div className="section-header">
                    <div className="section-title-wrapper">
                        <div className="section-icon">
                            <PackageIcon size={20} />
                        </div>
                        <h2 className="section-title">Recent Orders</h2>
                    </div>
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
                            <div key={order.OrderID} className="recent-order-card">
                                <div className="order-info">
                                    <div className="order-number">Order #{order.OrderID}</div>
                                    <div className="order-date">
                                        {new Date(order.OrderDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="order-items-count">
                                        {order.items ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}` : '1 item'}
                                    </div>
                                    <div className="order-payment-method">
                                        {order.PaymentMethod === 'Bank Transfer' && !order.StripeSessionID && order.PaymentStatus === 'Pending' 
                                            ? 'Cash On Delivery' 
                                            : order.PaymentMethod}
                                    </div>
                                </div>
                                <div className="order-status">
                                    <span className={`status-badge ${order.Status?.toLowerCase()}`}>
                                        {getStatusIcon(order.Status)}
                                        {order.Status}
                                    </span>
                                </div>
                                <div className="order-total">
                                    {formatPrice(parseFloat(order.TotalAmount) || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <PackageIcon size={48} />
                        </div>
                        <h3>No orders yet</h3>
                        <p>Start shopping to see your orders here.</p>
                        <button 
                            className="btn-primary"
                            onClick={() => navigate('/products')}
                        >
                            <ShoppingBagIcon size={16} />
                            Browse Products
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <div className="section-header">
                    <div className="section-title-wrapper">
                        <div className="section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#F0B21B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className="section-title">Quick Actions</h2>
                    </div>
                </div>
                <div className="quick-actions-grid">
                    <button className="quick-action-card" onClick={() => navigate('/products')}>
                        <div className="action-icon">
                            <ShoppingBagIcon size={24} />
                        </div>
                        <div className="action-content">
                            <h3>Browse Products</h3>
                            <p>Discover our latest collection</p>
                        </div>
                    </button>
                    <button className="quick-action-card" onClick={() => navigate('/account?tab=profile')}>
                        <div className="action-icon">
                            <UserIcon size={24} />
                        </div>
                        <div className="action-content">
                            <h3>Update Profile</h3>
                            <p>Manage your personal information</p>
                        </div>
                    </button>
                    <button className="quick-action-card" onClick={() => navigate('/account?tab=addresses')}>
                        <div className="action-icon">
                            <TruckIcon size={24} />
                        </div>
                        <div className="action-content">
                            <h3>Manage Addresses</h3>
                            <p>Add or update delivery addresses</p>
                        </div>
                    </button>
                    <button className="quick-action-card" onClick={onLogout}>
                        <div className="action-icon">
                            <LogoutIcon size={24} />
                        </div>
                        <div className="action-content">
                            <h3>Logout</h3>
                            <p>Sign out of your account</p>
                        </div>
                    </button>
                    <button className="quick-action-card delete-account-card" onClick={() => setShowDeleteModal(true)}>
                        <div className="action-icon delete-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="action-content">
                            <h3>Delete Account</h3>
                            <p>Permanently delete your account</p>
                        </div>
                    </button>
                </div>
            </div>
            
            {/* Delete Account Modal */}
            <DeleteAccountModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                user={user}
            />
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
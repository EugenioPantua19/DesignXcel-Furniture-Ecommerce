import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import ProfileManagement from '../components/ProfileManagement';
import AddressManagement from '../components/AddressManagement';
import OrderHistory from '../components/OrderHistory';
import AccountPreferences from '../components/AccountPreferences';
import SecuritySettings from '../components/SecuritySettings';
import apiClient from '../../../shared/services/api/apiClient';
import { 
  DashboardIcon, 
  UserIcon, 
  PackageIcon, 
  CreditCardIcon, 
  LockIcon,
  OrdersIcon,
  DollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  LogoutIcon,
  ArrowRightIcon,
  EyeIcon,
  TruckIcon,
  SpinnerIcon
} from '../../../shared/components/ui/SvgIcons';
import { PageLoader, LoadingSpinner } from '../../../shared/components/ui';
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
    const [orderDetailsModal, setOrderDetailsModal] = useState({ open: false, order: null });

    // Show loading while authentication is being checked
    if (loading) {
        return (
            <PageLoader isLoading={true} text="Loading your account..." />
        );
    }

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
                    const [ordersResponse, addressesResponse] = await Promise.all([
                    apiClient.get('/api/customer/orders-with-items'),
                    apiClient.get('/api/customer/addresses')
                ]);

                if (ordersResponse.success && ordersResponse.orders) {
                    const orders = ordersResponse.orders;
                    const totalOrders = orders.length;
                    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
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

                    // Set recent orders (last 3)
                    setRecentOrders(orders.slice(0, 3));
                }
            } catch (error) {
                console.error('Failed to fetch account stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchAccountData();
    }, [isAuthenticated]);

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
                onViewOrderDetails={(order) => setOrderDetailsModal({ open: true, order })}
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
                    <div className="account-actions">
                        <button className="btn-secondary" onClick={() => navigate('/products')}>
                            <ShoppingBagIcon size={16} />
                            Continue Shopping
                        </button>
                        <button className="btn-danger" onClick={handleLogout}>
                            <LogoutIcon size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                <div className="account-layout">
                    <div className="account-sidebar">
                        <nav className="account-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        navigate(`/account?tab=${tab.id}`);
                                    }}
                                >
                                    <span className="nav-icon">{tab.icon}</span>
                                    <span className="nav-label">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="account-main">
                        <div className="account-content">
                            {ActiveComponent && <ActiveComponent />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {orderDetailsModal.open && (
                <OrderDetailsModal 
                    order={orderDetailsModal.order}
                    onClose={() => setOrderDetailsModal({ open: false, order: null })}
                    formatPrice={formatPrice}
                />
            )}
        </div>
    );
};

// Dashboard Tab Component
const DashboardTab = ({ stats, recentOrders, loading, formatPrice, onViewOrderDetails }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner size="large" text="Loading dashboard..." color="#F0B21B" />
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
                        {recentOrders.slice(0, 3).map((order) => (
                            <div key={order.orderID} className="recent-order-card">
                                <div className="order-info">
                                    <div className="order-number">Order #{order.orderID}</div>
                                    <div className="order-date">
                                        {new Date(order.orderDate).toLocaleDateString()}
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
                                    {formatPrice(order.totalAmount || 0)}
                                </div>
                                <div className="order-actions">
                                    <button 
                                        className="order-action-btn"
                                        onClick={() => onViewOrderDetails(order)}
                                        title="View Order Details"
                                    >
                                        <EyeIcon size={16} />
                                    </button>
                                    {order.status?.toLowerCase() === 'delivered' && (
                                        <button 
                                            className="order-action-btn"
                                            onClick={() => navigate('/products')}
                                            title="Reorder Items"
                                        >
                                            <SpinnerIcon size={16} />
                                        </button>
                                    )}
                                    {order.status?.toLowerCase() === 'shipped' && (
                                        <button 
                                            className="order-action-btn"
                                            onClick={() => navigate('/tracking')}
                                            title="Track Package"
                                        >
                                            <TruckIcon size={16} />
                                        </button>
                                    )}
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

        </div>
    );
};

// Helper function to get status icon
const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return <ClockIcon size={14} />;
        case 'processing':
            return <SpinnerIcon size={14} />;
        case 'shipped':
            return <TruckIcon size={14} />;
        case 'delivered':
        case 'completed':
            return <CheckCircleIcon size={14} />;
        default:
            return <PackageIcon size={14} />;
    }
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, formatPrice }) => {
    if (!order) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Order Details - #{order.orderID}</h3>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>
                
                <div className="modal-body">
                    <div className="order-details-grid">
                        <div className="detail-section">
                            <h4>Order Information</h4>
                            <div className="detail-item">
                                <span className="detail-label">Order Date:</span>
                                <span className="detail-value">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status:</span>
                                <span className={`status-badge ${order.status?.toLowerCase()}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Total Amount:</span>
                                <span className="detail-value total-amount">
                                    {formatPrice(order.totalAmount || 0)}
                                </span>
                            </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                            <div className="detail-section">
                                <h4>Order Items</h4>
                                <div className="order-items-list">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item-detail">
                                            <div className="item-info">
                                                <div className="item-name">{item.productName || item.name}</div>
                                                <div className="item-quantity">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="item-price">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.shippingAddress && (
                            <div className="detail-section">
                                <h4>Shipping Address</h4>
                                <div className="address-details">
                                    <p>{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.address}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    {order.status?.toLowerCase() === 'delivered' && (
                        <button 
                            className="btn-primary"
                            onClick={() => {
                                onClose();
                                window.location.href = '/products';
                            }}
                        >
                            <SpinnerIcon size={16} />
                            Reorder Items
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Account;
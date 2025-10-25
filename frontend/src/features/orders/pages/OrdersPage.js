import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import apiClient from '../../../shared/services/api/apiClient';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import PageHeader from '../../../shared/components/layout/PageHeader';
import { getImageUrl } from '../../../shared/utils/imageUtils';
import './orders.css';

const Orders = () => {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [cancelling, setCancelling] = useState({});
    const [receiving, setReceiving] = useState({});
    const [showCancelModal, setShowCancelModal] = useState({ open: false, orderId: null });
    const [showDetailsModal, setShowDetailsModal] = useState({ open: false, order: null });
    const [showSuccessModal, setShowSuccessModal] = useState({ open: false, message: '' });

    // Fetch orders on component mount
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.get('/api/customer/orders-with-items');
                if (res.success && Array.isArray(res.orders)) {
                    setOrders(res.orders);
                } else {
                    setOrders([]);
                }
            } catch (err) {
                setError('Failed to load orders. Please try again.');
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    // Filter orders based on active tab
    const getFilteredOrders = () => {
        let filtered = orders;

        // Filter by status
        if (activeTab === 'pending') {
            filtered = filtered.filter(order => order.Status === 'Pending' || order.Status === 'Processing');
        } else if (activeTab === 'shipped') {
            filtered = filtered.filter(order => order.Status === 'Shipping' || order.Status === 'Delivering');
        } else if (activeTab === 'completed') {
            filtered = filtered.filter(order => order.Status === 'Completed' || order.Status === 'Delivered');
        } else if (activeTab === 'cancelled') {
            filtered = filtered.filter(order => order.Status === 'Cancelled');
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(order => 
                order.OrderID.toString().includes(searchTerm) ||
                order.items?.some(item => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Sort orders
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.OrderDate);
                    bValue = new Date(b.OrderDate);
                    break;
                case 'amount':
                    aValue = parseFloat(a.TotalAmount);
                    bValue = parseFloat(b.TotalAmount);
                    break;
                case 'status':
                    aValue = a.Status;
                    bValue = b.Status;
                    break;
                default:
                    aValue = new Date(a.OrderDate);
                    bValue = new Date(b.OrderDate);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    // Handle order cancellation
    const handleCancelOrder = async (orderId) => {
        setCancelling(prev => ({ ...prev, [orderId]: true }));
        setShowCancelModal({ open: false, orderId: null });
        
        try {
            const res = await apiClient.put(`/api/customer/orders/${orderId}/cancel`);
            if (res.success) {
                setOrders(prev => prev.map(order => 
                    order.OrderID === orderId 
                        ? { ...order, Status: 'Cancelled' }
                        : order
                ));
                setShowSuccessModal({ open: true, message: 'Order cancelled successfully' });
            } else {
                setShowSuccessModal({ open: true, message: 'Failed to cancel order' });
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            setShowSuccessModal({ open: true, message: 'Failed to cancel order' });
        } finally {
            setCancelling(prev => ({ ...prev, [orderId]: false }));
        }
    };

    // Handle order received
    const handleReceiveOrder = async (orderId) => {
        setReceiving(prev => ({ ...prev, [orderId]: true }));
        
        try {
            const res = await apiClient.put(`/api/customer/orders/${orderId}/receive`);
            if (res.success) {
                setOrders(prev => prev.map(order => 
                    order.OrderID === orderId 
                        ? { ...order, Status: 'Delivered' }
                        : order
                ));
                setShowSuccessModal({ open: true, message: 'Order marked as received' });
            } else {
                setShowSuccessModal({ open: true, message: 'Failed to mark order as received' });
            }
        } catch (err) {
            console.error('Error receiving order:', err);
            setShowSuccessModal({ open: true, message: 'Failed to mark order as received' });
        } finally {
            setReceiving(prev => ({ ...prev, [orderId]: false }));
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pending':
            case 'Processing':
                return 'status-badge status-pending';
            case 'Shipping':
            case 'Delivering':
                return 'status-badge status-shipping';
            case 'Completed':
            case 'Delivered':
                return 'status-badge status-completed';
            case 'Cancelled':
                return 'status-badge status-cancelled';
            default:
                return 'status-badge';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending':
            case 'Processing':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            case 'Shipping':
            case 'Delivering':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="3" width="15" height="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 8H20L23 11V16H16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
            case 'Completed':
            case 'Delivered':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            case 'Cancelled':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            default:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
        }
    };

    const filteredOrders = getFilteredOrders();

    if (loading) {
        return (
            <div className="orders-page">
                <div className="loading-state">
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-page">
                <div className="error-state">
                    <h2>Error Loading Orders</h2>
                    <p>{error}</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'Account', href: '/account' },
                    { label: 'My Orders' }
                ]}
                title="My Orders"
                subtitle={`${orders.length} orders`}
            />

            <div className="orders-container">
                {/* Simple Search and Filter */}
                <div className="orders-controls">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-tabs">
                        <button
                            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All ({orders.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending ({orders.filter(o => o.Status === 'Pending' || o.Status === 'Processing').length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'shipped' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shipped')}
                        >
                            Shipped ({orders.filter(o => o.Status === 'Shipping' || o.Status === 'Delivering').length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed ({orders.filter(o => o.Status === 'Completed' || o.Status === 'Delivered').length})
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                <div className="orders-list">
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h3>No orders found</h3>
                            <p>
                                {searchTerm 
                                    ? 'No orders match your search criteria.' 
                                    : 'You haven\'t placed any orders yet.'
                                }
                            </p>
                            {!searchTerm && (
                                <Link to="/products" className="btn btn-primary">
                                    Start Shopping
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.OrderID} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3>Order #{order.OrderID}</h3>
                                        <p className="order-date">
                                            {new Date(order.OrderDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className={`${getStatusBadgeClass(order.Status)}`}>
                                        {getStatusIcon(order.Status)}
                                        <span>{order.Status}</span>
                                    </div>
                                </div>

                                <div className="order-items">
                                    {order.items?.slice(0, 3).map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="item-image">
                                                <img 
                                                    src={getImageUrl(item.image)} 
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.target.src = '/logo192.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="item-details">
                                                <h4>{item.name}</h4>
                                                <p>Qty: {item.quantity}</p>
                                                <p className="item-price">₱{item.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {order.items?.length > 3 && (
                                        <div className="more-items">
                                            +{order.items.length - 3} more items
                                        </div>
                                    )}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        <span>Total: ₱{parseFloat(order.TotalAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="order-actions">
                                        <button 
                                            className="btn btn-outline"
                                            onClick={() => setShowDetailsModal({ open: true, order })}
                                        >
                                            View Details
                                        </button>
                                        {order.Status === 'Pending' && (
                                            <button 
                                                className="btn btn-danger"
                                                onClick={() => setShowCancelModal({ open: true, orderId: order.OrderID })}
                                                disabled={cancelling[order.OrderID]}
                                            >
                                                {cancelling[order.OrderID] ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                        {(order.Status === 'Shipping' || order.Status === 'Delivering') && (
                                            <button 
                                                className="btn btn-success"
                                                onClick={() => handleReceiveOrder(order.OrderID)}
                                                disabled={receiving[order.OrderID]}
                                            >
                                                {receiving[order.OrderID] ? 'Processing...' : 'Mark as Received'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={showCancelModal.open}
                onClose={() => setShowCancelModal({ open: false, orderId: null })}
                onConfirm={() => handleCancelOrder(showCancelModal.orderId)}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                confirmText="Yes, Cancel Order"
                cancelText="Keep Order"
            />

            <ConfirmationModal
                isOpen={showDetailsModal.open}
                onClose={() => setShowDetailsModal({ open: false, order: null })}
                onConfirm={() => setShowDetailsModal({ open: false, order: null })}
                title={`Order #${showDetailsModal.order?.OrderID} Details`}
                message={
                    showDetailsModal.order ? (
                        <div className="order-details-modal">
                            {/* Order Summary */}
                            <div className="order-summary-section">
                                <h4>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V9H13V5H7V19H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Order Summary
                                </h4>
                                <div className="summary-grid">
                                    <div className="summary-item">
                                        <span className="label">Order Date:</span>
                                        <span className="value">{new Date(showDetailsModal.order.OrderDate).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="label">Status:</span>
                                        <span className={`value status ${getStatusBadgeClass(showDetailsModal.order.Status).split(' ')[1]}`}>
                                            {getStatusIcon(showDetailsModal.order.Status)}
                                            {showDetailsModal.order.Status}
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="label">Total Amount:</span>
                                        <span className="value total">₱{parseFloat(showDetailsModal.order.TotalAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="order-items-section">
                                <h4>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 7L4 7M10 11H6M14 15H6M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Order Items ({showDetailsModal.order.items?.length} items)
                                </h4>
                                <div className="items-list">
                                    {showDetailsModal.order.items?.map((item, index) => (
                                        <div key={index} className="item-row">
                                            <div className="item-image">
                                                <img 
                                                    src={getImageUrl(item.image)} 
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.target.src = '/logo192.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="item-info">
                                                <h5>{item.name}</h5>
                                                <div className="item-meta">
                                                    <span className="quantity">Qty: {item.quantity}</span>
                                                    <span className="price">₱{item.price?.toLocaleString()}</span>
                                                </div>
                                                <div className="item-total">
                                                    ₱{(item.price * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : ''
                }
                confirmText="Close"
                cancelText=""
                showCancel={false}
            />

            <ConfirmationModal
                isOpen={showSuccessModal.open}
                onClose={() => setShowSuccessModal({ open: false, message: '' })}
                onConfirm={() => setShowSuccessModal({ open: false, message: '' })}
                title="Success"
                message={showSuccessModal.message}
                confirmText="OK"
                cancelText=""
                showCancel={false}
            />
        </div>
    );
};

export default Orders;
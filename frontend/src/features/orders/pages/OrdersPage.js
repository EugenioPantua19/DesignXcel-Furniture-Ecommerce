import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import apiClient from '../../../shared/services/api/apiClient';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
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
                    order.OrderID === orderId ? { ...order, Status: 'Cancelled' } : order
                ));
            } else {
                alert(res.message || 'Failed to cancel order.');
            }
        } catch (err) {
            alert('Failed to cancel order. Please try again.');
            console.error('Error cancelling order:', err);
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
                    order.OrderID === orderId ? { ...order, Status: 'Completed' } : order
                ));
                setShowSuccessModal({ open: true, message: 'Order marked as completed successfully!' });
            } else {
                alert(res.message || 'Failed to mark order as received.');
            }
        } catch (err) {
            alert('Failed to mark order as received. Please try again.');
            console.error('Error receiving order:', err);
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
                    <div className="loading-spinner"></div>
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
            {/* Simple Header */}
            <div className="orders-header">
                <h1>My Orders</h1>
                <p>Track and manage your orders</p>
            </div>

            {/* Simple Filters */}
            <div className="orders-filters">
                <div className="search-input">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <div className="sort-controls">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date">Order Date</option>
                        <option value="amount">Total Amount</option>
                        <option value="status">Status</option>
                    </select>
                    <button 
                        className="sort-btn"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* Simple Tabs */}
            <div className="orders-tabs">
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
                <button
                    className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cancelled')}
                >
                    Cancelled ({orders.filter(o => o.Status === 'Cancelled').length})
                </button>
            </div>

            {/* Simple Orders List */}
            <div className="orders-list">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="order-status">
                                    <span className={getStatusBadgeClass(order.Status)}>
                                        {getStatusIcon(order.Status)} {order.Status}
                                    </span>
                                </div>
                            </div>

                            <div className="order-content">
                                <div className="order-items">
                                    {order.items && order.items.slice(0, 3).map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="item-image">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} />
                                                ) : (
                                                    <div className="placeholder-image">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#9ca3af" strokeWidth="2"/>
                                                            <circle cx="8.5" cy="8.5" r="1.5" stroke="#9ca3af" strokeWidth="2"/>
                                                            <polyline points="21,15 16,10 5,21" stroke="#9ca3af" strokeWidth="2"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="item-details">
                                                <h4>{item.name}</h4>
                                                <p>Quantity: {item.quantity}</p>
                                            </div>
                                            <div className="item-price">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                    {order.items && order.items.length > 3 && (
                                        <div className="more-items">
                                            +{order.items.length - 3} more items
                                        </div>
                                    )}
                                </div>

                                <div className="order-actions">
                                    <button
                                        className="btn btn-secondary"
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
                                            {cancelling[order.OrderID] ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    )}

                                    {order.Status === 'Delivering' && (
                                        <button
                                            className="btn btn-primary"
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

            {/* Simple Summary */}
            <div className="orders-summary">
                <div className="summary-stats">
                    <div className="stat-item">
                        <div className="stat-number">{orders.length}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">
                            {orders.filter(o => o.Status === 'Pending' || o.Status === 'Processing').length}
                        </div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">
                            {orders.filter(o => o.Status === 'Completed' || o.Status === 'Delivered').length}
                        </div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                
                <div className="quick-actions">
                    <Link to="/products" className="btn btn-primary">
                        Continue Shopping
                    </Link>
                    <Link to="/account" className="btn btn-secondary">
                        Account Settings
                    </Link>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            <ConfirmationModal
                isOpen={showCancelModal.open}
                onClose={() => setShowCancelModal({ open: false, orderId: null })}
                onConfirm={() => handleCancelOrder(showCancelModal.orderId)}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                confirmText="Yes, Cancel Order"
                cancelText="Keep Order"
                type="danger"
            />

            {/* Order Details Modal */}
            {showDetailsModal.open && showDetailsModal.order && (
                <OrderDetailsModal
                    order={showDetailsModal.order}
                    onClose={() => setShowDetailsModal({ open: false, order: null })}
                    formatPrice={formatPrice}
                />
            )}

            {/* Success Modal */}
            <ConfirmationModal
                isOpen={showSuccessModal.open}
                onClose={() => setShowSuccessModal({ open: false, message: '' })}
                onConfirm={() => setShowSuccessModal({ open: false, message: '' })}
                title="Success"
                message={showSuccessModal.message}
                confirmText="OK"
                type="success"
                showCancel={false}
            />
        </div>
    );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, formatPrice }) => {
    if (!order) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Order #{order.OrderID} Details</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="order-details-section">
                        <h3>Order Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Order Date:</span>
                                <span className="detail-value">
                                    {new Date(order.OrderDate).toLocaleString('en-US')}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{order.Status}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Payment Method:</span>
                                <span className="detail-value">{order.PaymentMethod || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Total Amount:</span>
                                <span className="detail-value total-amount">
                                    {formatPrice(order.TotalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {order.user && (
                        <div className="order-details-section">
                            <h3>Customer Information</h3>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Name:</span>
                                    <span className="detail-value">{order.user.fullName || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{order.user.email || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone:</span>
                                    <span className="detail-value">{order.user.phoneNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.address && (
                        <div className="order-details-section">
                            <h3>Shipping Address</h3>
                            <div className="address-details">
                                <p>
                                    {order.address.Label ? `${order.address.Label}: ` : ''}
                                    {[
                                        order.address.HouseNumber,
                                        order.address.Street,
                                        order.address.Barangay,
                                        order.address.City,
                                        order.address.Province,
                                        order.address.Region,
                                        order.address.PostalCode,
                                        order.address.Country
                                    ].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {order.items && order.items.length > 0 && (
                        <div className="order-details-section">
                            <h3>Order Items</h3>
                            <div className="items-list">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item-detail">
                                        <div className="item-image">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} />
                                            ) : (
                                                <div className="placeholder-image">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#9ca3af" strokeWidth="2"/>
                                                        <circle cx="8.5" cy="8.5" r="1.5" stroke="#9ca3af" strokeWidth="2"/>
                                                        <polyline points="21,15 16,10 5,21" stroke="#9ca3af" strokeWidth="2"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-info">
                                            <h4>{item.name}</h4>
                                            <p>Quantity: {item.quantity}</p>
                                            <p>Price: {formatPrice(item.price)} each</p>
                                        </div>
                                        <div className="item-total">
                                            {formatPrice(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Orders;

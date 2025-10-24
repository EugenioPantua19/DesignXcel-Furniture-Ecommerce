import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../shared/services/api/apiClient';
import { Bars } from 'react-loader-spinner';
import { 
  PackageIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XIcon,
  EyeIcon,
  TruckIcon,
  CreditCardIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  UserIcon,
  StarIcon
} from '../../../shared/components/ui/SvgIcons';
// LoadingSpinner and InlineLoader removed as requested
import { getImageUrl } from '../../../shared/utils/imageUtils';
import './account.css';

const statusBadgeClass = (status) => {
  if (status === 'Cancelled') return 'status-badge status-cancelled';
  if (status === 'Pending') return 'status-badge status-pending';
  if (status === 'Completed' || status === 'Delivered') return 'status-badge status-completed';
  if (status === 'Receive' || status === 'Received') return 'status-badge status-received';
  return 'status-badge';
};

const statusIcon = (status) => {
  const iconStyle = { width: '16px', height: '16px', marginRight: '8px' };
  
  if (status === 'Cancelled') return <XIcon size={16} color="#ef4444" style={iconStyle} />;
  if (status === 'Pending') return <ClockIcon size={16} color="#f59e0b" style={iconStyle} />;
  if (status === 'Processing') return <PackageIcon size={16} color="#3b82f6" style={iconStyle} />;
  if (status === 'Shipping' || status === 'Delivering') return <TruckIcon size={16} color="#8b5cf6" style={iconStyle} />;
  if (status === 'Completed' || status === 'Delivered') return <CheckCircleIcon size={16} color="#10b981" style={iconStyle} />;
  if (status === 'Receive' || status === 'Received') return <PackageIcon size={16} color="#f59e0b" style={iconStyle} />;
  return <PackageIcon size={16} color="#6b7280" style={iconStyle} />;
};

const statusBorderColor = (status) => {
  if (status === 'Cancelled') return '#ef4444';
  if (status === 'Pending') return '#f59e0b';
  if (status === 'Processing') return '#3b82f6';
  if (status === 'Shipping' || status === 'Delivering') return '#8b5cf6';
  if (status === 'Completed' || status === 'Delivered') return '#10b981';
  if (status === 'Receive' || status === 'Received') return '#f59e0b';
  return '#6b7280';
};

const orderFlow = [
  { key: 'Pending', label: 'Pending' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Shipping', label: 'Shipping' },
  { key: 'Delivering', label: 'Delivering' },
  { key: 'To Receive', label: 'To Receive' },
];

const ConfirmModal = ({ open, onClose, onConfirm, countdown }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-header">
          <h3>Cancel Order?</h3>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Are you sure you want to cancel this order? <br/>This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>No, go back</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={countdown > 0}>
            {countdown > 0 ? `OK (${countdown})` : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailsModal = ({ open, onClose, order }) => {
  if (!open || !order) return null;
  const { user, address, items, Status, OrderID, OrderDate, PaymentMethod, TotalAmount, DeliveryType, DeliveryCost, DeliveryTypeName } = order;
  // Find the current step in the flow
  const statusIndex = orderFlow.findIndex(s => s.key.toLowerCase() === Status.toLowerCase());
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <PackageIcon size={24} color="#ffffff" />
            </div>
            <div>
              <h3>Order #{OrderID}</h3>
              <p className="modal-subtitle">Order Details</p>
            </div>
          </div>
          <button 
            className="btn btn-secondary modal-close-btn" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-section-header">
              <CalendarIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Order Date</span>
            </div>
            <div className="detail-section-content">
              {new Date(OrderDate).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div className="detail-section">
            <div className="detail-section-header">
              <UserIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Customer Information</span>
            </div>
            <div className="detail-section-content customer-info">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{user?.fullName || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user?.email || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{user?.phoneNumber || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <div className="detail-section-header">
              <MapPinIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Shipping Address</span>
            </div>
            <div className="detail-section-content">
              {address ? (
                <div className="address-details">
                  {address.Label && <div className="address-label">{address.Label}</div>}
                  <div className="address-text">
                    {[address.HouseNumber, address.Street, address.Barangay, address.City, address.Province, address.Region, address.PostalCode, address.Country].filter(Boolean).join(', ')}
                  </div>
                </div>
              ) : <div className="no-address">No shipping address provided</div>}
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-header">
              <ShoppingBagIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Products ({items?.length || 0})</span>
            </div>
            <div className="order-items-list">
              {items && items.length > 0 ? items.map((item, idx) => (
                <div key={idx} className="order-item-detail">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="item-image" />
                  ) : (
                    <div className="item-image-placeholder">
                      <PackageIcon size={24} color="#9ca3af" />
                    </div>
                  )}
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-details">
                      <div className="item-quantity">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="item-price">
                    ₱{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )) : (
                <div className="no-items">
                  <PackageIcon size={32} color="#9ca3af" />
                  <div>No products found</div>
                </div>
              )}
            </div>
          </div>
        
          <div className="detail-section">
            <div className="detail-section-header">
              <CreditCardIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Payment & Delivery Details</span>
            </div>
            
            <div className="payment-delivery-grid">
              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{PaymentMethod || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Delivery Method</span>
                <span className="detail-value">{DeliveryTypeName || 'Pick up'}</span>
              </div>
            </div>
            
            <div className="order-totals">
              <div className="detail-item">
                <span className="detail-label">Delivery Cost</span>
                <span className="detail-value">₱{Number(DeliveryCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order Total</span>
                <span className="detail-value total-amount">₱{Number(TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-header">
              <ArrowRightIcon size={16} color="#6b7280" />
              <span className="detail-section-title">Order Status Flow</span>
            </div>
            <div className="status-flow">
              {orderFlow.map((step, idx) => (
                <React.Fragment key={step.key}>
                  <div className="status-step">
                    <div className={`status-icon ${idx <= statusIndex ? 'completed' : ''} ${idx === statusIndex ? 'current' : ''}`}>
                      {idx < statusIndex ? (
                        <CheckCircleIcon size={16} color="#ffffff" />
                      ) : idx === statusIndex ? (
                        <ClockIcon size={16} color="#ffffff" />
                      ) : (
                        <div className="status-dot" />
                      )}
                    </div>
                    <div className={`status-label ${idx === statusIndex ? 'current' : ''}`}>
                      {step.label}
                    </div>
                  </div>
                  {idx < orderFlow.length-1 && (
                    <div className={`status-connector ${idx < statusIndex ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SuccessModal = ({ open, onClose, message }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content success-modal">
        <div className="modal-header">
          <h3>Order Received!</h3>
        </div>
        <div className="modal-body">
          <p className="success-message">{message || 'You have successfully received your order.'}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState({});
  const [modal, setModal] = useState({ open: false, orderId: null });
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ open: false, order: null });
  const [receiving, setReceiving] = useState({});
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

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
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Countdown effect for modal
  useEffect(() => {
    let timer;
    if (modal.open && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [modal.open, countdown]);

  const openModal = (orderId) => {
    setModal({ open: true, orderId });
    setCountdown(5);
  };

  const closeModal = () => {
    setModal({ open: false, orderId: null });
    setCountdown(5);
  };

  const confirmCancel = async () => {
    const orderId = modal.orderId;
    setCancelling((prev) => ({ ...prev, [orderId]: true }));
    closeModal();
    try {
      const res = await apiClient.put(`/api/customer/orders/${orderId}/cancel`);
      if (res.success) {
        setOrders((prev) => prev.map(order => order.OrderID === orderId ? { ...order, Status: 'Cancelled' } : order));
      } else {
        alert(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      alert('Failed to cancel order.');
    } finally {
      setCancelling((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Add handler for receiving order
  const handleReceiveOrder = async (orderId) => {
    setReceiving((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await apiClient.put(`/api/customer/orders/${orderId}/receive`);
      if (res.success) {
        setOrders((prev) => prev.map(order => order.OrderID === orderId ? { ...order, Status: 'Completed' } : order));
        setSuccessModal({ open: true, message: 'Order has been marked as completed. Thank you for confirming receipt!' });
      } else {
        alert(res.message || 'Failed to mark order as received.');
      }
    } catch (err) {
      alert('Failed to mark order as received.');
    } finally {
      setReceiving((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  let filteredOrders = orders;
  if (activeTab === 'completed') {
    filteredOrders = orders.filter(order => order.Status === 'Completed' || order.Status === 'Delivered');
  } else if (activeTab === 'cancelled') {
    filteredOrders = orders.filter(order => order.Status === 'Cancelled');
  } else if (activeTab === 'all') {
    filteredOrders = orders.filter(order => order.Status !== 'Cancelled');
  }

  if (loading) return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      minHeight: '400px',
      textAlign: 'center'
    }}>
      <Bars 
        color="#F0B21B" 
        height={window.innerWidth < 768 ? 32 : 40} 
        width={window.innerWidth < 768 ? 32 : 40} 
      />
      <div style={{ 
        fontSize: window.innerWidth < 768 ? '14px' : '16px', 
        color: '#6b7280', 
        marginTop: '16px',
        fontWeight: '500',
        maxWidth: '280px',
        lineHeight: '1.5'
      }}>
        Loading your orders...
      </div>
    </div>
  );
  
  if (error) return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      borderRadius: '12px',
      border: '1px solid #fecaca',
      color: '#dc2626'
    }}>
      <XIcon size={32} color="#dc2626" style={{ marginBottom: '12px' }} />
      <div style={{ fontSize: '16px', fontWeight: '600' }}>Error Loading Orders</div>
      <div style={{ fontSize: '14px', marginTop: '4px' }}>{error}</div>
    </div>
  );
  
  if (!orders.length) return (
    <div style={{
      padding: '60px 40px',
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <PackageIcon size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No Orders Yet</div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Start shopping to see your orders here</div>
      <button 
        className="btn btn-primary"
        onClick={() => window.location.href = '/products'}
        style={{
          padding: '12px 24px',
          backgroundColor: '#F0B21B',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Browse Products
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3 className="section-title" style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1f2937', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <PackageIcon size={24} color="#F0B21B" />
          Order History
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Track and manage all your orders
        </p>
      </div>
      
      <div className="order-history-tabs" style={{
        display:'flex',
        gap:8,
        marginBottom:32,
        backgroundColor:'#f9fafb',
        padding:'4px',
        borderRadius:'12px',
        border:'1px solid #e5e7eb'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-secondary${activeTab === tab.key ? ' active-tab' : ''}`}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? '#F0B21B' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#6b7280',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.key === 'all' && <PackageIcon size={16} color={activeTab === tab.key ? '#fff' : '#6b7280'} />}
            {tab.key === 'completed' && <CheckCircleIcon size={16} color={activeTab === tab.key ? '#fff' : '#6b7280'} />}
            {tab.key === 'cancelled' && <XIcon size={16} color={activeTab === tab.key ? '#fff' : '#6b7280'} />}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            padding: '60px 40px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <PackageIcon size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              No Orders Found
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              No orders match the current filter
            </div>
          </div>
        ) : filteredOrders.map(order => (
          <div
            key={order.OrderID}
            className="order-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: `1px solid #e5e7eb`,
              borderLeft: `6px solid ${statusBorderColor(order.Status)}`,
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Order Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#F0B21B',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PackageIcon size={20} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1f2937'
                    }}>
                      Order #{order.OrderID}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CalendarIcon size={14} color="#6b7280" />
                      {new Date(order.OrderDate).toLocaleDateString('en-US', { 
                        timeZone: 'Asia/Manila',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  backgroundColor: statusBorderColor(order.Status) + '15',
                  color: statusBorderColor(order.Status),
                  fontWeight: '600',
                  fontSize: '14px',
                  border: `1px solid ${statusBorderColor(order.Status)}40`
                }}>
                  {statusIcon(order.Status)}
                  {order.Status}
                </span>
              </div>
            </div>

            {/* Order Items Preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShoppingBagIcon size={16} color="#6b7280" />
                Items ({order.items?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items && order.items.length > 0 ? order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        background: '#e5e7eb'
                      }} />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PackageIcon size={16} color="#9ca3af" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        Quantity: {item.quantity}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      ₱{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )) : (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    No products found
                  </div>
                )}
                {order.items && order.items.length > 3 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center',
                    padding: '8px',
                    fontStyle: 'italic'
                  }}>
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {/* Order Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CreditCardIcon size={16} color="#6b7280" />
                Total: ₱{Number(order.TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setDetailsModal({ open: true, order })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <EyeIcon size={16} color="#374151" />
                  View Details
                </button>
                
                {order.Status !== 'Cancelled' && order.Status !== 'Completed' && order.Status !== 'Delivered' && order.Status !== 'Shipping' && order.Status !== 'Delivering' && (
                  <button
                    className="btn btn-primary"
                    disabled={cancelling[order.OrderID]}
                    onClick={() => openModal(order.OrderID)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <XIcon size={16} color="#ffffff" style={{ marginRight: '6px' }} />
                    {cancelling[order.OrderID] ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
                
                {(order.Status === 'Shipping' || order.Status === 'Delivering') && (
                  <span style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <TruckIcon size={16} color="#0369a1" />
                    Cannot Cancel - Order is Shipping
                  </span>
                )}
                
                {(order.Status === 'Receive' || order.Status === 'Received') && (
                  <button
                    className="btn btn-success"
                    disabled={receiving[order.OrderID]}
                    onClick={() => handleReceiveOrder(order.OrderID)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CheckCircleIcon size={16} color="#ffffff" style={{ marginRight: '6px' }} />
                    {receiving[order.OrderID] ? 'Processing...' : 'Receive Order'}
                  </button>
                )}
                
                {(order.Status === 'Completed' || order.Status === 'Delivered') && order.items && order.items.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/product/${order.items[0].ProductID}`)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#F0B21B',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <StarIcon size={16} color="#ffffff" />
                    Review Product
                  </button>
                )}
                
                {order.Status === 'Cancelled' && (
                  <span style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#9ca3af',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <XIcon size={16} color="#9ca3af" />
                    Cancelled
                  </span>
                )}
                
                {(order.Status === 'Completed' || order.Status === 'Delivered') && (
                  <span style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #10b981',
                    background: '#10b98115',
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={modal.open}
        onClose={closeModal}
        onConfirm={confirmCancel}
        countdown={countdown}
      />
      <DetailsModal
        open={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, order: null })}
        order={detailsModal.order}
      />
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        message={successModal.message}
      />
    </div>
  );
};

export default OrderHistory; 
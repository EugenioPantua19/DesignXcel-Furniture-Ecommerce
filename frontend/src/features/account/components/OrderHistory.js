import React, { useEffect, useState } from 'react';
import apiClient from '../../../shared/services/api/apiClient';
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
  UserIcon
} from '../../../shared/components/ui/SvgIcons';
import { LoadingSpinner, InlineLoader } from '../../../shared/components/ui';
import './account.css';

const statusBadgeClass = (status) => {
  if (status === 'Cancelled') return 'status-badge status-cancelled';
  if (status === 'Pending') return 'status-badge status-pending';
  if (status === 'Completed' || status === 'Delivered') return 'status-badge status-completed';
  return 'status-badge';
};

const statusIcon = (status) => {
  const iconStyle = { width: '16px', height: '16px', marginRight: '8px' };
  
  if (status === 'Cancelled') return <XIcon size={16} color="#ef4444" style={iconStyle} />;
  if (status === 'Pending') return <ClockIcon size={16} color="#f59e0b" style={iconStyle} />;
  if (status === 'Processing') return <PackageIcon size={16} color="#3b82f6" style={iconStyle} />;
  if (status === 'Shipping' || status === 'Delivering') return <TruckIcon size={16} color="#8b5cf6" style={iconStyle} />;
  if (status === 'Completed' || status === 'Delivered') return <CheckCircleIcon size={16} color="#10b981" style={iconStyle} />;
  if (status === 'Receive') return <PackageIcon size={16} color="#f59e0b" style={iconStyle} />;
  return <PackageIcon size={16} color="#6b7280" style={iconStyle} />;
};

const statusBorderColor = (status) => {
  if (status === 'Cancelled') return '#ef4444';
  if (status === 'Pending') return '#f59e0b';
  if (status === 'Processing') return '#3b82f6';
  if (status === 'Shipping' || status === 'Delivering') return '#8b5cf6';
  if (status === 'Completed' || status === 'Delivered') return '#10b981';
  if (status === 'Receive') return '#f59e0b';
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
    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="modal-content" style={{background:'#fff',padding:'2rem',borderRadius:12,minWidth:320,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',textAlign:'center'}}>
        <h4 style={{marginBottom:16}}>Cancel Order?</h4>
        <p style={{marginBottom:24}}>Are you sure you want to cancel this order? <br/>This action cannot be undone.</p>
        <div style={{display:'flex',justifyContent:'center',gap:16}}>
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
    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div className="modal-content" style={{background:'#fff',padding:'2rem',borderRadius:16,minWidth:380,maxWidth:600,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',textAlign:'left',overflowY:'auto',maxHeight:'90vh',marginTop:'60px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#F0B21B',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PackageIcon size={24} color="#ffffff" />
            </div>
            <div>
              <h4 style={{margin:0, fontSize:'20px', fontWeight:'700'}}>Order #{OrderID}</h4>
              <p style={{margin:0, fontSize:'14px', color:'#6b7280'}}>Order Details</p>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
        
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
            <CalendarIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Order Date</span>
          </div>
          <div style={{paddingLeft:'24px', color:'#6b7280'}}>
            {new Date(OrderDate).toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
            <UserIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Customer Information</span>
          </div>
          <div style={{paddingLeft:'24px', color:'#6b7280', display:'flex', flexDirection:'column', gap:'4px'}}>
            <div><strong>Name:</strong> {user?.fullName || '-'}</div>
            <div><strong>Email:</strong> {user?.email || '-'}</div>
            <div><strong>Phone:</strong> {user?.phoneNumber || '-'}</div>
          </div>
        </div>
        
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
            <MapPinIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Shipping Address</span>
          </div>
          <div style={{paddingLeft:'24px', color:'#6b7280'}}>
            {address ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {address.Label && <div style={{fontWeight:'600', color:'#374151', marginBottom:'4px'}}>{address.Label}</div>}
                <div>{[address.HouseNumber, address.Street, address.Barangay, address.City, address.Province, address.Region, address.PostalCode, address.Country].filter(Boolean).join(', ')}</div>
              </div>
            ) : <div style={{color:'#9ca3af'}}>No shipping address provided</div>}
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
            <ShoppingBagIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Products ({items?.length || 0})</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {items && items.length > 0 ? items.map((item, idx) => (
              <div key={idx} style={{
                display:'flex',
                alignItems:'center',
                gap:16,
                background:'#ffffff',
                borderRadius:12,
                padding:'16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{
                    width:64,
                    height:64,
                    objectFit:'cover',
                    borderRadius:8,
                    background:'#f3f4f6'
                  }} />
                ) : (
                  <div style={{
                    width:64,
                    height:64,
                    background:'#f3f4f6',
                    borderRadius:8,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    color:'#9ca3af'
                  }}>
                    <PackageIcon size={24} color="#9ca3af" />
                  </div>
                )}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, color:'#374151', marginBottom:'4px'}}>{item.name}</div>
                  <div style={{fontSize:14,color:'#6b7280', display:'flex', alignItems:'center', gap:'4px'}}>
                    <span>Quantity:</span>
                    <span style={{fontWeight:'600', color:'#374151'}}>{item.quantity}</span>
                  </div>
                </div>
                <div style={{
                  fontWeight:700,
                  color:'#374151',
                  fontSize:'16px',
                  padding:'8px 12px',
                  backgroundColor:'#f9fafb',
                  borderRadius:'8px',
                  border:'1px solid #e5e7eb'
                }}>
                  ₱{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            )) : (
              <div style={{
                padding:'24px',
                textAlign:'center',
                color:'#9ca3af',
                backgroundColor:'#f9fafb',
                borderRadius:'8px',
                border:'1px solid #e5e7eb'
              }}>
                <PackageIcon size={32} color="#9ca3af" style={{marginBottom:'8px'}} />
                <div>No products found</div>
              </div>
            )}
          </div>
        </div>
        
        <div style={{
          backgroundColor:'#f9fafb',
          borderRadius:'12px',
          padding:'20px',
          border:'1px solid #e5e7eb',
          marginBottom:'24px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
            <CreditCardIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Payment & Delivery Details</span>
          </div>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div>
              <div style={{fontSize:'14px', color:'#6b7280', marginBottom:'4px'}}>Payment Method</div>
              <div style={{fontWeight:600, color:'#374151'}}>{PaymentMethod || 'Not specified'}</div>
            </div>
            <div>
              <div style={{fontSize:'14px', color:'#6b7280', marginBottom:'4px'}}>Delivery Method</div>
              <div style={{fontWeight:600, color:'#374151'}}>{DeliveryTypeName || 'Pick up'}</div>
            </div>
          </div>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #e5e7eb'}}>
            <div>
              <div style={{fontSize:'14px', color:'#6b7280', marginBottom:'4px'}}>Delivery Cost</div>
              <div style={{fontWeight:600, color:'#374151'}}>₱{Number(DeliveryCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'14px', color:'#6b7280', marginBottom:'4px'}}>Order Total</div>
              <div style={{fontWeight:700, color:'#374151', fontSize:'18px'}}>₱{Number(TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
            <ArrowRightIcon size={16} color="#6b7280" />
            <span style={{fontWeight:600, color:'#374151'}}>Order Status Flow</span>
          </div>
          <div style={{
            display:'flex',
            alignItems:'center',
            gap:12,
            flexWrap:'wrap',
            padding:'16px',
            backgroundColor:'#ffffff',
            borderRadius:'12px',
            border:'1px solid #e5e7eb',
            boxShadow:'0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {orderFlow.map((step, idx) => (
              <React.Fragment key={step.key}>
                <div style={{
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  gap:'8px',
                  minWidth:'80px'
                }}>
                  <div style={{
                    width:'32px',
                    height:'32px',
                    borderRadius:'50%',
                    backgroundColor: idx <= statusIndex ? '#F0B21B' : '#e5e7eb',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    border: idx === statusIndex ? '3px solid #F0B21B' : '2px solid #e5e7eb',
                    boxShadow: idx === statusIndex ? '0 2px 8px rgba(240, 178, 27, 0.3)' : 'none',
                    transition:'all 0.3s ease'
                  }}>
                    {idx < statusIndex ? (
                      <CheckCircleIcon size={16} color="#ffffff" />
                    ) : idx === statusIndex ? (
                      <ClockIcon size={16} color="#ffffff" />
                    ) : (
                      <div style={{width:'8px', height:'8px', backgroundColor:'#9ca3af', borderRadius:'50%'}} />
                    )}
                  </div>
                  <div style={{
                    fontSize:'12px',
                    fontWeight: idx === statusIndex ? 700 : 500,
                    color: idx === statusIndex ? '#F0B21B' : '#6b7280',
                    textAlign:'center',
                    transition:'all 0.3s ease'
                  }}>
                    {step.label}
                  </div>
                </div>
                {idx < orderFlow.length-1 && (
                  <div style={{
                    width:'20px',
                    height:'2px',
                    backgroundColor: idx < statusIndex ? '#F0B21B' : '#e5e7eb',
                    borderRadius:'1px',
                    transition:'all 0.3s ease'
                  }} />
                )}
              </React.Fragment>
            ))}
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
    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="modal-content" style={{background:'#fff',padding:'2rem',borderRadius:12,minWidth:320,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',textAlign:'center'}}>
        <h4 style={{marginBottom:16}}>Order Received!</h4>
        <p style={{marginBottom:24}}>{message || 'You have successfully received your order.'}</p>
        <button className="btn btn-primary" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const OrderHistory = () => {
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
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <LoadingSpinner size="large" text="Loading your orders..." color="#F0B21B" />
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
                      <img src={item.image} alt={item.name} style={{
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
                
                {order.Status !== 'Cancelled' && order.Status !== 'Completed' && order.Status !== 'Delivered' && (
                  <InlineLoader 
                    isLoading={cancelling[order.OrderID]} 
                    text="Cancelling..."
                    size="small"
                  >
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
                      Cancel
                    </button>
                  </InlineLoader>
                )}
                
                {order.Status === 'Receive' && (
                  <InlineLoader 
                    isLoading={receiving[order.OrderID]} 
                    text="Processing..."
                    size="small"
                  >
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
                      Receive Order
                    </button>
                  </InlineLoader>
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
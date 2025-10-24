import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../../../shared/hooks/useAuth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    recentOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch stats and recent orders in parallel
      const [statsResponse, ordersResponse] = await Promise.all([
        adminService.getOrderStats(),
        adminService.getOrders({ limit: 5 })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.orders);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-yellow-600',
      'Processing': 'text-blue-600',
      'Shipped': 'text-purple-600',
      'Delivered': 'text-green-600',
      'Cancelled': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    // logout() function already handles redirect to /login
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.firstName || user?.fullName || 'Admin'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
          <p className="text-sm text-gray-600">Last 30 days</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-600">Last 30 days</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          <p className="text-sm text-gray-600">Awaiting processing</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Recent Orders</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.recentOrders}</p>
          <p className="text-sm text-gray-600">Last 7 days</p>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.processingOrders}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.OrderID} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="text-gray-600">Order #{order.OrderID}</span>
                    <div className="text-xs text-gray-500">{formatDate(order.OrderDate)}</div>
                    <div className={`text-xs ${getStatusColor(order.Status)}`}>{order.Status}</div>
                  </div>
                  <span className="text-green-600 font-medium">{formatCurrency(order.TotalAmount)}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No recent orders</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/orders')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              View All Orders
            </button>
            <button 
              onClick={() => navigate('/admin/orders?status=Pending')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
            >
              Process Pending Orders
            </button>
            <button 
              onClick={() => navigate('/admin/products')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Manage Products
            </button>
            <button 
              onClick={() => navigate('/admin/customers')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              View Customers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
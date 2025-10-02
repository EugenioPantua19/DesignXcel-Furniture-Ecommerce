import { useState, useEffect, useCallback } from 'react';
import websocketService from '../../services/websocket/websocketService';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (token && user && (user.role === 'Admin' || user.role === 'Employee')) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [token, user]);

  const connectWebSocket = async () => {
    try {
      setConnectionStatus('connecting');
      await websocketService.connect(token);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Subscribe to relevant updates based on user role
      if (user.role === 'Admin' || user.role === 'Employee') {
        websocketService.subscribeToInventory();
        websocketService.subscribeToOrders();
        websocketService.subscribeToDashboard();
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  };

  const disconnectWebSocket = () => {
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  // Add notification to the list
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || Date.now(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after 5 seconds for non-error types
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  }, []);

  // Remove notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleNotification = (data) => {
      addNotification(data);
    };

    const handleInventoryUpdate = (data) => {
      addNotification({
        title: 'Inventory Updated',
        message: `${data.item.name} stock updated to ${data.item.currentStock}`,
        type: 'info'
      });
    };

    const handleLowStockAlert = (data) => {
      addNotification({
        title: 'Low Stock Alert',
        message: `${data.item.name} is running low (${data.item.currentStock} remaining)`,
        type: 'warning'
      });
    };

    const handleOrderUpdate = (data) => {
      addNotification({
        title: 'Order Update',
        message: `Order #${data.orderId} status: ${data.status}`,
        type: 'info'
      });
    };

    const handleDashboardUpdate = (data) => {
      // Dashboard updates are usually silent, just trigger re-renders
      console.log('Dashboard updated:', data);
    };

    // Register event listeners
    websocketService.on('notification', handleNotification);
    websocketService.on('inventoryUpdated', handleInventoryUpdate);
    websocketService.on('lowStockAlert', handleLowStockAlert);
    websocketService.on('orderUpdated', handleOrderUpdate);
    websocketService.on('dashboardUpdated', handleDashboardUpdate);

    return () => {
      // Cleanup event listeners
      websocketService.off('notification', handleNotification);
      websocketService.off('inventoryUpdated', handleInventoryUpdate);
      websocketService.off('lowStockAlert', handleLowStockAlert);
      websocketService.off('orderUpdated', handleOrderUpdate);
      websocketService.off('dashboardUpdated', handleDashboardUpdate);
    };
  }, [addNotification]);

  // Monitor connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    };

    const interval = setInterval(checkConnectionStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send event to server
  const sendEvent = useCallback((event, data) => {
    websocketService.sendEvent(event, data);
  }, []);

  // Show notification helper
  const showNotification = useCallback((title, message, type = 'info') => {
    websocketService.showNotification(title, message, type);
  }, []);

  return {
    isConnected,
    connectionStatus,
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    sendEvent,
    showNotification,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket
  };
};

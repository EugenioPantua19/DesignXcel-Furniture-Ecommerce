// WebSocket service for real-time communication
import { io } from 'socket.io-client';
import apiConfig from '../api/apiConfig.js';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    try {
      // Check if real-time updates are enabled
      if (!apiConfig.isFeatureEnabled('realTimeUpdates')) {
        console.warn('⚠️ Real-time updates are disabled');
        return Promise.reject(new Error('Real-time updates are disabled'));
      }

      const serverUrl = apiConfig.getWebSocketUrl();

      if (apiConfig.debugMode) {
        console.log('🔌 Connecting to WebSocket:', serverUrl);
      }

      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connected', (data) => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected:', data);
          resolve(data);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.attemptReconnect();
    });

    // Listen for real-time events
    this.socket.on('inventoryUpdated', (data) => {
      this.emit('inventoryUpdated', data);
    });

    this.socket.on('lowStockAlert', (data) => {
      this.emit('lowStockAlert', data);
    });

    this.socket.on('orderUpdated', (data) => {
      this.emit('orderUpdated', data);
    });

    this.socket.on('dashboardUpdated', (data) => {
      this.emit('dashboardUpdated', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  subscribeToInventory() {
    if (this.socket) {
      this.socket.emit('subscribe', 'inventory');
    }
  }

  subscribeToOrders() {
    if (this.socket) {
      this.socket.emit('subscribe', 'orders');
    }
  }

  subscribeToDashboard() {
    if (this.socket) {
      this.socket.emit('subscribe', 'dashboard');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  sendEvent(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  showNotification(title, message, type = 'info') {
    this.emit('notification', {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    if (this.isConnected) return 'connected';
    if (this.socket.connecting) return 'connecting';
    return 'error';
  }
}

const websocketService = new WebSocketService();
export default websocketService;

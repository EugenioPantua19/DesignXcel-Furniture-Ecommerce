import apiClient from '../../../shared/services/api/apiClient';

export const adminService = {
    // Get all orders for admin dashboard
    async getOrders(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.offset) queryParams.append('offset', params.offset);
            
            const response = await apiClient.get(`/api/admin/orders?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching admin orders:', error);
            throw error;
        }
    },

    // Get order statistics for dashboard
    async getOrderStats() {
        try {
            const response = await apiClient.get('/api/admin/order-stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching order stats:', error);
            throw error;
        }
    },

    // Update order status
    async updateOrderStatus(orderId, status) {
        try {
            const response = await apiClient.put(`/api/admin/orders/${orderId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    // Get order details
    async getOrderDetails(orderId) {
        try {
            const response = await apiClient.get(`/api/admin/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw error;
        }
    }
};

export default adminService;

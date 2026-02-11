// @ts-ignore - api.js doesn't have type definitions
import { API_URL } from '../config/api';
// @ts-ignore - adminAuth.js doesn't have type definitions
import { fetchWithAdminAuth } from '@/utils/adminAuth';

export const analyticsService = {
  // Real-time dashboard
  getRealTimeAnalytics: async () => {
    const response = await fetchWithAdminAuth(`${API_URL}/order/admin/analytics/real-time`);
    if (!response.ok) throw new Error('Failed to fetch real-time analytics');
    return response.json();
  },

  // Revenue breakdown
  getRevenueBreakdown: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetchWithAdminAuth(
      `${API_URL}/order/admin/analytics/revenue-breakdown?${params}`
    );
    if (!response.ok) throw new Error('Failed to fetch revenue breakdown');
    return response.json();
  },

  // Order metrics
  getOrderMetrics: async (period: string = 'week') => {
    const response = await fetchWithAdminAuth(
      `${API_URL}/order/admin/analytics/order-metrics?period=${period}`
    );
    if (!response.ok) throw new Error('Failed to fetch order metrics');
    return response.json();
  },

  // Top items
  getTopItems: async (limit: number = 10, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetchWithAdminAuth(
      `${API_URL}/order/admin/analytics/top-items?${params}`
    );
    if (!response.ok) throw new Error('Failed to fetch top items');
    return response.json();
  },

  // Customer insights
  getCustomerInsights: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetchWithAdminAuth(
      `${API_URL}/order/admin/analytics/customer-insights?${params}`
    );
    if (!response.ok) throw new Error('Failed to fetch customer insights');
    return response.json();
  },

  // Delivery stats
  getDeliveryStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetchWithAdminAuth(
      `${API_URL}/order/admin/analytics/delivery-stats?${params}`
    );
    if (!response.ok) throw new Error('Failed to fetch delivery stats');
    return response.json();
  },
};

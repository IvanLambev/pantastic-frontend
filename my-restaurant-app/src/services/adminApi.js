import { fetchWithAdminAuth } from '@/utils/adminAuth';
import { API_URL } from '@/config/api';

/**
 * Fetch data availability for admin analytics
 * @returns {Promise<Object>} Data availability information
 */
export async function fetchDataAvailability() {
    try {
        console.log('📊 [ANALYTICS DEBUG] fetchDataAvailability called');
        console.log('📊 [ANALYTICS DEBUG] URL:', `${API_URL}/restaurant/admin/data-availability`);

        const response = await fetchWithAdminAuth(
            `${API_URL}/restaurant/admin/data-availability`
        );

        console.log('📡 [ANALYTICS DEBUG] Data availability response status:', response.status, response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [ANALYTICS DEBUG] Failed to fetch data availability. Status:', response.status);
            console.error('❌ [ANALYTICS DEBUG] Error response:', errorText);
            throw new Error(`Failed to fetch data availability: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [ANALYTICS DEBUG] Data availability received:', data);
        return data;
    } catch (error) {
        console.error('❌ [ANALYTICS DEBUG] Error fetching data availability:', error);
        console.error('❌ [ANALYTICS DEBUG] Error stack:', error.stack);
        throw error;
    }
}

/**
 * Fetch all restaurants
 * @returns {Promise<Array>} List of all restaurants
 */
export async function fetchRestaurants() {
    try {
        console.log('🏪 [ANALYTICS DEBUG] fetchRestaurants called');
        console.log('🏪 [ANALYTICS DEBUG] URL:', `${API_URL}/restaurant/restaurants`);

        const response = await fetchWithAdminAuth(
            `${API_URL}/restaurant/restaurants`
        );

        console.log('📡 [ANALYTICS DEBUG] Restaurants response status:', response.status, response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [ANALYTICS DEBUG] Failed to fetch restaurants. Status:', response.status);
            console.error('❌ [ANALYTICS DEBUG] Error response:', errorText);
            throw new Error(`Failed to fetch restaurants: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [ANALYTICS DEBUG] Restaurants received:', data);
        return data;
    } catch (error) {
        console.error('❌ [ANALYTICS DEBUG] Error fetching restaurants:', error);
        console.error('❌ [ANALYTICS DEBUG] Error stack:', error.stack);
        throw error;
    }
}

/**
 * Fetch revenue data for a specific time period
 * @param {string} timePeriod - 'week' or 'month'
 * @param {string} restaurantId - Optional restaurant UUID to filter by
 * @returns {Promise<Object>} Revenue data
 */
export async function fetchRevenueByPeriod(timePeriod = 'week', restaurantId = null) {
    try {
        console.log('📊 [ANALYTICS DEBUG] fetchRevenueByPeriod called with timePeriod:', timePeriod, 'restaurantId:', restaurantId);

        let url = `${API_URL}/restaurant/admin/revenue?time_period=${timePeriod}`;
        if (restaurantId) {
            url += `&restaurant_id=${restaurantId}`;
        }

        console.log('📊 [ANALYTICS DEBUG] URL:', url);

        const response = await fetchWithAdminAuth(url);

        console.log('📡 [ANALYTICS DEBUG] Revenue response status:', response.status, response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [ANALYTICS DEBUG] Failed to fetch revenue data. Status:', response.status);
            console.error('❌ [ANALYTICS DEBUG] Error response:', errorText);
            throw new Error(`Failed to fetch revenue data: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [ANALYTICS DEBUG] Revenue data received:', data);
        console.log('📊 [ANALYTICS DEBUG] Revenue data type:', typeof data, 'Has restaurants:', !!data?.restaurants);
        return data;
    } catch (error) {
        console.error('❌ [ANALYTICS DEBUG] Error fetching revenue data:', error);
        console.error('❌ [ANALYTICS DEBUG] Error stack:', error.stack);
        throw error;
    }
}

/**
 * Fetch revenue data for a custom date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} restaurantId - Optional restaurant UUID to filter by
 * @returns {Promise<Object>} Revenue data
 */
export async function fetchRevenueByDateRange(startDate, endDate, restaurantId = null) {
    try {
        console.log('📊 [ANALYTICS DEBUG] fetchRevenueByDateRange called');
        console.log('📊 [ANALYTICS DEBUG] Date range:', startDate, 'to', endDate, 'restaurantId:', restaurantId);

        let url = `${API_URL}/restaurant/admin/revenue?start_date=${startDate}&end_date=${endDate}`;
        if (restaurantId) {
            url += `&restaurant_id=${restaurantId}`;
        }

        console.log('📊 [ANALYTICS DEBUG] URL:', url);

        const response = await fetchWithAdminAuth(url);

        console.log('📡 [ANALYTICS DEBUG] Revenue (date range) response status:', response.status, response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [ANALYTICS DEBUG] Failed to fetch revenue data. Status:', response.status);
            console.error('❌ [ANALYTICS DEBUG] Error response:', errorText);
            throw new Error(`Failed to fetch revenue data: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [ANALYTICS DEBUG] Revenue data (date range) received:', data);
        return data;
    } catch (error) {
        console.error('❌ [ANALYTICS DEBUG] Error fetching revenue data:', error);
        console.error('❌ [ANALYTICS DEBUG] Error stack:', error.stack);
        throw error;
    }
}

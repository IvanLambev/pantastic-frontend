import { fetchWithAdminAuth } from '@/utils/adminAuth';
import { API_URL } from '@/config/api';

/**
 * Fetch data availability for admin analytics
 * @returns {Promise<Object>} Data availability information
 */
export async function fetchDataAvailability() {
    try {
        const response = await fetchWithAdminAuth(
            `${API_URL}/restaurant/admin/data-availability`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch data availability: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data availability:', error);
        throw error;
    }
}

/**
 * Fetch revenue data for a specific time period
 * @param {string} timePeriod - 'week' or 'month'
 * @returns {Promise<Object>} Revenue data
 */
export async function fetchRevenueByPeriod(timePeriod = 'week') {
    try {
        const response = await fetchWithAdminAuth(
            `${API_URL}/restaurant/admin/revenue?time_period=${timePeriod}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch revenue data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        throw error;
    }
}

/**
 * Fetch revenue data for a custom date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Revenue data
 */
export async function fetchRevenueByDateRange(startDate, endDate) {
    try {
        const response = await fetchWithAdminAuth(
            `${API_URL}/restaurant/admin/revenue?start_date=${startDate}&end_date=${endDate}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch revenue data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        throw error;
    }
}

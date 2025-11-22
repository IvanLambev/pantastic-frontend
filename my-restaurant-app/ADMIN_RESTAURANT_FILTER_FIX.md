# Admin Dashboard Restaurant Filtering - Fix Summary

## Issues Fixed

### 1. **API Parameter Mismatch** ✅
**Problem**: The frontend was using `&restaurant=` as the query parameter, but the API expects `&restaurant_id=`

**Files Changed**:
- `src/services/adminApi.js`

**Changes**:
- Line 80: Changed `&restaurant=${restaurantId}` to `&restaurant_id=${restaurantId}` in `fetchRevenueByPeriod()`
- Line 121: Changed `&restaurant=${restaurantId}` to `&restaurant_id=${restaurantId}` in `fetchRevenueByDateRange()`

### 2. **Active Restaurants Count** ✅
**Problem**: The "Active Restaurants" stat was hardcoded to "1" instead of showing the actual count

**Files Changed**:
- `src/components/admin/AdminStats.jsx`

**Changes**:
- Added dynamic calculation of active restaurants count from the API response
- Now reads from `data.total_restaurants`, `data.restaurants_count`, or falls back to `data.restaurants.length`
- Also improved the revenue change percentage formatting to show 2 decimal places

### 3. **Stats Data Aggregation** ✅
**Problem**: The Dashboard wasn't passing the restaurant count information to the stats component

**Files Changed**:
- `src/pages/admin/Dashboard.jsx`

**Changes**:
- Updated `statsData` calculation to include `total_restaurants` field
- Now properly passes the restaurant count from the API response to the AdminStats component

### 4. **Revenue Chart Aggregation** ✅
**Problem**: The chart was only showing data for the first restaurant when multiple restaurants were in the response

**Files Changed**:
- `src/components/admin/RevenueChart.jsx`

**Changes**:
- Changed from displaying only the first restaurant's revenue to aggregating all restaurants' revenue
- Now uses `reduce()` to sum up total revenue from all restaurants in the response

## How It Works Now

### Restaurant Selection Flow:
1. **All Restaurants** (default):
   - Fetches data without `restaurant_id` parameter
   - API returns data for all 3 restaurants
   - Stats show aggregated totals
   - Active Restaurants count shows "3"

2. **Specific Restaurant** (e.g., "Студентски град"):
   - Fetches data with `restaurant_id=8511b497-1275-4325-b723-5848c2b6f9d8`
   - API returns data for only that restaurant
   - Stats show data for that specific restaurant
   - Active Restaurants count shows "1"

### API Endpoints Used:
- `GET /restaurant/restaurants` - Fetches list of all restaurants for the dropdown
- `GET /restaurant/admin/revenue?time_period={week|month}&restaurant_id={uuid}` - Fetches revenue data

### Expected Behavior:
- When you select "All Restaurants" + "This Week", you should see:
  - Total Revenue: €1071.00 (650.4 + 226.5 + 194.1)
  - Total Orders: 22 (14 + 4 + 4)
  - Avg Order Value: €48.87
  - Active Restaurants: 3

- When you select a specific restaurant, you'll see data only for that restaurant

## Testing
To verify the fix is working:
1. Navigate to the admin dashboard
2. Check that "Active Restaurants" shows the correct count (3 for all, 1 for specific)
3. Switch between "All Restaurants" and individual restaurants
4. Verify the stats update correctly
5. Check the browser console for the API URLs being called - they should now use `restaurant_id=` parameter

# Admin Tables Debug Logging

## Overview
Added comprehensive console logging to help debug data loading issues in admin tables.

## Files Modified

### 1. RestaurantDetailsAdminComponent.jsx
**Location:** `src/components/admin/RestaurantDetailsAdminComponent.jsx`

**Debug Logs Added:**
- 🔄 Starting fetchRestaurant process
- 📡 API response status for all endpoints
- 📊 Data type validation (checking if data is array, object, etc.)
- 📊 Data counts (number of items, templates, etc.)
- ✅ Successful data retrieval
- 🎯 State updates
- ❌ Error details with stack traces

**What to Look For:**
- Check if restaurants API returns data correctly
- Verify restaurant ID is found
- Check if items, delivery people, addon templates, and removable templates are fetched
- Look for any 404, 403, or 500 errors
- Verify data is in expected format (arrays vs objects)

### 2. OrderManagementComponent.jsx
**Location:** `src/components/admin/OrderManagementComponent.jsx`

**Debug Logs Added:**
- 🔄 Starting fetchOrders process
- 👤 Admin user authentication status
- 🔑 Access token availability
- 📡 API response status
- 📊 Orders data validation
- 🔍 Restaurant ID lookup
- 🏪 Menu items fetching
- 🎯 State updates
- ❌ Error details with stack traces

**What to Look For:**
- Check if admin token is present in sessionStorage
- Verify orders API returns data
- Check if orders are in array format
- Look for restaurant_id in orders
- Verify menu items are fetched for the restaurant

## How to Use These Logs

### Step 1: Open Browser Console
1. Navigate to the admin page where tables aren't loading
2. Open Developer Tools (F12)
3. Go to the Console tab

### Step 2: Look for Debug Messages
All debug messages are prefixed with emojis for easy identification:
- 🔄 = Process starting
- 📡 = API response
- 📊 = Data validation
- ✅ = Success
- 🎯 = State update
- ❌ = Error
- ⚠️ = Warning
- 🔍 = Search/lookup
- 🏪 = Restaurant related
- 👤 = User related
- 🔑 = Authentication related

### Step 3: Common Issues to Check

#### Issue: No data appears in tables
**Look for:**
```
❌ [ADMIN DEBUG] Failed to fetch restaurants. Status: XXX
❌ [ORDER DEBUG] Failed to fetch orders. Status: XXX
```
This indicates an API error. Check the status code and error response.

#### Issue: Empty arrays
**Look for:**
```
📊 [ADMIN DEBUG] Items count: 0
📊 [ORDER DEBUG] Orders count: 0
```
This means the API returned successfully but with no data.

#### Issue: Wrong data format
**Look for:**
```
📊 [ADMIN DEBUG] Items type: object Is Array: false
❌ [ORDER DEBUG] Orders data is not an array
```
This means the API returned data in an unexpected format.

#### Issue: Authentication problems
**Look for:**
```
⚠️ [ORDER DEBUG] No admin token available
❌ [ADMIN DEBUG] Failed to fetch restaurants. Status: 403
```
This indicates authentication issues.

### Step 4: Share Debug Output
If you need help, copy the console output and share it. The logs include:
- All API endpoints being called
- Response status codes
- Data structures received
- Any errors with stack traces

## Example Debug Output

### Successful Load:
```
🔄 [ADMIN DEBUG] Starting fetchRestaurant...
📡 [ADMIN DEBUG] Restaurants response status: 200 true
✅ [ADMIN DEBUG] Restaurants data received: [...]
📊 [ADMIN DEBUG] Restaurants count: 1
🎯 [ADMIN DEBUG] Setting state - menuItems: [...]
✅ [ADMIN DEBUG] All state updated successfully
```

### Failed Load:
```
🔄 [ADMIN DEBUG] Starting fetchRestaurant...
📡 [ADMIN DEBUG] Restaurants response status: 404 false
❌ [ADMIN DEBUG] Failed to fetch restaurants. Status: 404
❌ [ADMIN DEBUG] Error response: Not Found
```

## Next Steps
1. Open the admin page
2. Check the browser console
3. Look for the debug messages
4. Identify where the data flow breaks
5. Share the relevant console output for further debugging

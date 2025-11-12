# Guest Authentication Implementation Guide

## Overview

The backend team has implemented a guest authentication flow that **must be completed before placing an order**. This ensures that guest users are properly authenticated via HTTP-only cookies before order creation.

## Backend API Endpoint

```javascript
POST https://api2.palachinki.store/order/auth/guest
```

### Request Format

```javascript
{
  method: "POST",
  credentials: "include", // CRITICAL: Enables cookie handling
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "+359888123456"
  })
}
```

### Key Points

1. **`credentials: "include"`** is **REQUIRED** - This ensures that:
   - The browser sends any existing cookies with the request
   - The browser stores the HTTP-only authentication cookies returned by the server

2. **Phone Format**: Must be Bulgarian format `+359XXXXXXXXX` (e.g., `+359888123456`)

3. **Email**: Standard email validation

## Implementation Flow

### Step 1: Guest Data Collection & Authentication (CheckoutLogin.jsx)

When a user chooses guest checkout and clicks "Continue as Guest":

```javascript
const handleGuestCheckout = async (e) => {
  e.preventDefault()
  
  // Validate guest data (email, phone, etc.)
  // ...
  
  setGuestLoading(true)
  
  try {
    console.log('🔐 Authenticating guest user...')
    
    // STEP 1: Authenticate with backend IMMEDIATELY
    const guestAuthResponse = await fetch(`${API_URL}/order/auth/guest`, {
      method: 'POST',
      credentials: 'include', // IMPORTANT!
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone
      })
    })

    if (!guestAuthResponse.ok) {
      const errorData = await guestAuthResponse.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.detail || 'Failed to authenticate')
    }

    const guestAuthData = await guestAuthResponse.json()
    console.log('✅ Guest authentication successful:', guestAuthData)
    
    // STEP 2: Store customer_id in localStorage (like a regular user)
    if (guestAuthData.customer_id) {
      localStorage.setItem('user', JSON.stringify({
        customer_id: guestAuthData.customer_id,
        is_guest: true, // Mark as guest user
        email: guestData.email,
        first_name: guestData.first_name,
        last_name: guestData.last_name
      }))
    }
    
    // Also store in sessionStorage for reference
    sessionStorage.setItem('guest_checkout_data', JSON.stringify(guestData))
    
    // STEP 3: Navigate to checkout
    navigate('/checkout-v2')
  } catch (error) {
    console.error('❌ Guest authentication failed:', error)
    setGuestError(error.message)
  }
}
```

**Key Changes from Original Implementation:**
- ✅ Guest authentication happens **during login**, not during order placement
- ✅ Backend response includes `customer_id` which is stored in localStorage
- ✅ Guest user now has same structure as regular user (with `is_guest: true` flag)
- ✅ This allows the API client to work correctly for both guest and registered users

### Step 2: Order Placement (CheckoutV2.jsx)

The order placement is now **simplified** - no guest-specific logic needed:

```javascript
const handleOrderConfirm = async () => {
  setIsProcessing(true)
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Check authentication (works for both regular AND guest users)
    if (!user?.customer_id) {
      throw new Error('User not logged in. Please restart checkout process.')
    }

    // ... rest of order creation logic
    const data = await api.post('/order/orders', orderData)
    
    // Clean up guest data after successful order
    if (user.is_guest) {
      sessionStorage.removeItem('guest_checkout_data')
    }
    
    // ... navigate to order tracking
  } catch (error) {
    // ... error handling
  }
}
```

**Why This Works:**
- Guest users now have `customer_id` in localStorage (set during CheckoutLogin)
- HTTP-only cookies are already set (from guest auth in CheckoutLogin)
- API client's `makeAuthenticatedRequest()` checks for `customer_id` ✓
- Order creation request automatically includes cookies ✓

## Files Modified

### 1. CheckoutLogin.jsx

**Location**: `src/pages/CheckoutLogin.jsx`

**Changes**:
- Added **immediate** guest authentication when user clicks "Continue as Guest"
- Calls `/order/auth/guest` endpoint with `credentials: 'include'`
- Stores `customer_id` from backend response in localStorage
- Marks user as guest with `is_guest: true` flag
- Sets HTTP-only authentication cookies before navigating to checkout

**Key Code Section** (lines ~135-175):

```javascript
const handleGuestCheckout = async (e) => {
  // ... validation
  
  try {
    console.log('🔐 Authenticating guest user...')
    
    // Authenticate guest with backend
    const guestAuthResponse = await fetch(`${API_URL}/order/auth/guest`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone
      })
    })

    const guestAuthData = await guestAuthResponse.json()
    
    // Store customer_id (backend provides this)
    if (guestAuthData.customer_id) {
      localStorage.setItem('user', JSON.stringify({
        customer_id: guestAuthData.customer_id,
        is_guest: true,
        email: guestData.email,
        first_name: guestData.first_name,
        last_name: guestData.last_name
      }))
    }
    
    navigate('/checkout-v2')
  }
}
```

### 2. CheckoutV2.jsx

**Location**: `src/pages/CheckoutV2.jsx`

**Changes**:
- **Simplified** order confirmation logic
- Removed duplicate guest authentication (now handled in CheckoutLogin)
- Same authentication check works for both guest and registered users
- Added cleanup of guest session data after successful order

**Key Code Section** (lines ~359-380):

```javascript
const handleOrderConfirm = async () => {
  setIsProcessing(true)
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Check authentication (works for both regular AND guest users)
    if (!user?.customer_id) {
      throw new Error('User not logged in. Please restart checkout process.')
    }

    // Check restaurant selection
    if (!selectedRestaurant || selectedRestaurant.length === 0) {
      throw new Error('No restaurant selected')
    }

    // ... format order data and create order
    const data = await api.post('/order/orders', orderData)
    
    // Clean up guest data after successful order
    if (user.is_guest) {
      sessionStorage.removeItem('guest_checkout_data')
    }
    
    // ... navigate to tracking
  }
}
```

## Authentication Flow Diagram

```
┌─────────────────┐
│  User selects   │
│ "Guest Checkout"│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   CheckoutLogin.jsx             │
│  1. Collect guest info          │
│  2. Validate phone/email        │
│  3. Call POST /order/auth/guest │
│     with credentials: 'include' │
│  4. Backend sets cookies        │
│  5. Store customer_id in        │
│     localStorage                │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Navigate to           │
│   CheckoutV2.jsx        │
│  (Guest is now          │
│   authenticated!)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User reviews order     │
│  and clicks "Confirm"   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  handleOrderConfirm()           │
│  1. Check customer_id exists ✓  │
│     (works for guest & regular) │
│  2. Place order directly        │
│     POST /order/orders          │
│     (cookies sent automatically)│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Order Created!         │
│  Navigate to tracking   │
└─────────────────────────┘
```

## Testing Checklist

### Guest Checkout Flow

1. **Navigate to checkout without logging in**
   - [ ] Should redirect to `/checkout-login`

2. **Fill in guest checkout form**
   - [ ] First Name: John
   - [ ] Last Name: Doe
   - [ ] Email: john@example.com
   - [ ] Phone: +359888123456
   - [ ] Click "Continue as Guest"

3. **In Checkout Page**
   - [ ] Review order details
   - [ ] Select payment method
   - [ ] Click "Place Order"

4. **Check Browser Console**
   - [ ] Should see: "🔐 Authenticating guest user before order creation..."
   - [ ] Should see: "✅ Guest authentication successful"
   - [ ] No authentication errors

5. **Check Browser DevTools → Application → Cookies**
   - [ ] Should see HTTP-only cookies set by the backend
   - [ ] Cookies should be for domain: `api2.palachinki.store`

6. **Order Creation**
   - [ ] Order should be created successfully
   - [ ] Should navigate to order tracking page
   - [ ] Should see order details

### Registered User Flow

1. **Login with existing account**
   - [ ] Should skip guest authentication
   - [ ] Should use existing customer_id
   - [ ] Order should be created successfully

## Important Notes

### Cookie Security

- **HTTP-only cookies**: Cannot be accessed via JavaScript (secure against XSS)
- **Secure flag**: Should only be sent over HTTPS in production
- **SameSite**: Prevents CSRF attacks

### Error Handling

The implementation includes comprehensive error handling:

```javascript
if (!guestAuthResponse.ok) {
  const errorData = await guestAuthResponse.json().catch(() => ({}))
  throw new Error(errorData.message || 'Failed to authenticate guest user')
}
```

### Session Persistence

- Guest data is stored in **sessionStorage** (cleared when tab closes)
- Registered user data is stored in **localStorage** (persists across tabs)
- Authentication cookies are handled by the browser automatically

## Troubleshooting

### Issue: "Failed to authenticate guest user"

**Possible Causes**:
1. Missing `credentials: 'include'` in fetch request
2. Invalid phone format (must be `+359XXXXXXXXX`)
3. Invalid email format
4. Backend API is down or unreachable
5. Backend returns 400 error with validation details

**Solution**:
- Check browser console for detailed error messages
- Verify phone format matches `+359` followed by 9 digits
- Ensure backend API is accessible
- Check Network tab for the actual error response body

**Example Console Error:**
```
❌ Guest authentication failed: Error: Failed to authenticate guest user
```

**How to Debug:**
1. Open DevTools → Network tab
2. Look for the `/order/auth/guest` request
3. Click on it → Preview/Response tab
4. Check the error message and details

### Issue: "No authentication found" or "No customer_id found in sessionStorage"

**Root Cause:**
- Guest authentication succeeded but `customer_id` was not stored in localStorage
- Backend did not return `customer_id` in the response

**Solution:**
```javascript
// In browser console, check:
const user = JSON.parse(localStorage.getItem('user') || '{}')
console.log('User data:', user)
// Should show: { customer_id: "...", is_guest: true, email: "...", ... }

// If missing customer_id, check backend response
// The guest auth response should include customer_id
```

**Fix:**
- Ensure backend `/order/auth/guest` returns `customer_id` in response
- Verify CheckoutLogin.jsx stores the customer_id correctly

### Issue: Order creation fails after guest auth succeeds

**Possible Causes**:
1. Cookies not being sent with order request
2. `credentials: 'include'` missing in apiClient
3. Customer_id not in localStorage

**Solution:**
- Check that `api.post()` uses `credentials: 'include'` ✓ (already configured)
- Verify cookies are present in DevTools before order creation
- Check localStorage has user with customer_id

### Issue: Guest user sees "Please restart checkout process"

**Root Cause:**
- User navigated to `/checkout-v2` directly without going through `/checkout-login`
- `customer_id` not in localStorage

**Solution:**
- This is the expected behavior for security
- User must complete the guest authentication flow in CheckoutLogin
- Redirect user back to `/checkout-login` to restart the process

### Issue: CORS errors

**Possible Causes**:
1. Backend not allowing credentials from frontend domain
2. Backend not setting proper CORS headers

**Solution**:
- Backend must include:
  ```
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Origin: https://your-frontend-domain.com
  ```

## API Client Configuration

Ensure your API client (`src/utils/apiClient.js`) includes credentials:

```javascript
export const api = {
  post: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // REQUIRED for cookie authentication
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Request failed')
    }
    
    return response.json()
  }
}
```

## Summary

The guest authentication implementation ensures that:

1. ✅ Guest users are properly authenticated before placing orders
2. ✅ Authentication uses secure HTTP-only cookies
3. ✅ The flow is seamless for users (happens in the background)
4. ✅ Error handling provides clear feedback
5. ✅ Registered users are unaffected by the change

**Key Requirement**: Always call `/order/auth/guest` **BEFORE** `/order/orders` for guest users.

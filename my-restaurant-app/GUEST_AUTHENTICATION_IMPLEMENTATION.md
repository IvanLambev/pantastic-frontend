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

### Step 1: Guest Data Collection (CheckoutLogin.jsx)

When a user chooses guest checkout:

```javascript
// Store guest data in sessionStorage
sessionStorage.setItem('guest_checkout_data', JSON.stringify({
  first_name: "John",
  last_name: "Doe", 
  email: "john@example.com",
  phone: "+359888123456"
}))

// Navigate to checkout
navigate('/checkout-v2')
```

### Step 2: Guest Authentication (CheckoutV2.jsx)

**BEFORE** placing the order, authenticate the guest:

```javascript
const handleOrderConfirm = async () => {
  setIsProcessing(true)
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const guestCheckoutData = sessionStorage.getItem('guest_checkout_data')
    const isGuest = !!guestCheckoutData && !user?.customer_id

    // 🔐 STEP 1: Authenticate guest user if needed
    if (isGuest) {
      const guestData = JSON.parse(guestCheckoutData)
      
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
        throw new Error('Failed to authenticate guest user')
      }

      // Guest is now authenticated via cookies
      console.log('✅ Guest authenticated')
    }

    // 📦 STEP 2: Place the order (cookies sent automatically)
    const data = await api.post('/order/orders', orderData)
    
    // ... rest of order handling
  } catch (error) {
    // ... error handling
  }
}
```

### Step 3: Order Placement

After guest authentication, the order creation request will **automatically** include the authentication cookies:

```javascript
// The api.post() call will automatically include credentials: 'include'
// which sends the HTTP-only cookies set by the guest auth endpoint
const data = await api.post('/order/orders', orderData)
```

## Files Modified

### 1. CheckoutV2.jsx

**Location**: `src/pages/CheckoutV2.jsx`

**Changes**:
- Added guest authentication call **before** order creation
- Detects guest checkout via `sessionStorage.getItem('guest_checkout_data')`
- Calls `/order/auth/guest` endpoint with `credentials: 'include'`
- Only proceeds with order creation after successful guest authentication

**Key Code Section** (lines ~355-395):

```javascript
const handleOrderConfirm = async () => {
  setIsProcessing(true)
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const guestCheckoutData = sessionStorage.getItem('guest_checkout_data')
    const isGuest = !!guestCheckoutData && !user?.customer_id

    // If this is a guest checkout, authenticate with the backend first
    if (isGuest) {
      try {
        const guestData = JSON.parse(guestCheckoutData)
        
        console.log('🔐 Authenticating guest user before order creation...')
        const guestAuthResponse = await fetch(`${API_URL}/order/auth/guest`, {
          method: 'POST',
          credentials: 'include', // IMPORTANT: Enable cookie handling
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
          throw new Error(errorData.message || 'Failed to authenticate guest user')
        }

        const guestAuthData = await guestAuthResponse.json()
        console.log('✅ Guest authentication successful:', guestAuthData)
        
        // Guest is now authenticated via cookies, proceed with order
      } catch (guestAuthError) {
        console.error('❌ Guest authentication failed:', guestAuthError)
        throw new Error('Failed to authenticate guest user: ' + guestAuthError.message)
      }
    } else {
      // Regular user authentication check
      if (!user?.customer_id || selectedRestaurant.length === 0) {
        throw new Error('User not logged in or no restaurant selected')
      }
    }

    // Now proceed with order creation...
    // ... rest of order creation code
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
┌─────────────────────────┐
│   CheckoutLogin.jsx     │
│  - Collect guest info   │
│  - Validate phone/email │
│  - Store in sessionStorage
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Navigate to           │
│   CheckoutV2.jsx        │
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
│  1. Check if guest checkout     │
│  2. If yes, call:               │
│     POST /order/auth/guest      │
│     with credentials: 'include' │
│  3. Backend sets cookies        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Place Order                    │
│  POST /order/orders             │
│  (cookies sent automatically)   │
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

**Solution**:
- Check browser console for detailed error messages
- Verify phone format matches `+359` followed by 9 digits
- Ensure backend API is accessible

### Issue: Order creation fails after guest auth

**Possible Causes**:
1. Cookies not being sent with order request
2. `credentials: 'include'` missing in apiClient

**Solution**:
- Check that `api.post()` uses `credentials: 'include'`
- Verify cookies are present in DevTools before order creation

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

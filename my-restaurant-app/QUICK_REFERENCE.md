# Quick Reference: Cookie Auth Migration

## Import Statements

```jsx
// Authentication
import { login, logout, validateSession, validateAdmin, authenticateWithGoogle, cookieApi } from '@/utils/cookieAuth'

// Session Storage
import {
  getDeliveryAddress, setDeliveryAddress,
  getDeliveryCoordinates, setDeliveryCoordinates,
  getDeliveryMethod, setDeliveryMethod,
  getSelectedRestaurant, setSelectedRestaurant,
  getCart, setCart,
  getOrderId, setOrderId,
  getScheduledOrder, setScheduledOrder,
  clearCartData, clearDeliveryData, clearAllSessionData
} from '@/utils/sessionStorage'

// Auth Context
import { useAuth } from '@/context/AuthContext'
```

---

## Before & After Comparison

### Login
```jsx
// ❌ BEFORE
const response = await fetch(`${API_URL}/user/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const data = await response.json()
sessionStorage.setItem('user', JSON.stringify(data))

// ✅ AFTER
import { login } from '@/utils/cookieAuth'
await login(email, password)
```

### Logout
```jsx
// ❌ BEFORE
sessionStorage.removeItem('user')
sessionStorage.removeItem('selectedRestaurant')

// ✅ AFTER
import { logout } from '@/utils/cookieAuth'
await logout()
```

### Check Auth Status
```jsx
// ❌ BEFORE
const user = sessionStorage.getItem('user')
const isLoggedIn = !!user

// ✅ AFTER
import { validateSession } from '@/utils/cookieAuth'
const { isValid, user } = await validateSession()
```

### API Requests
```jsx
// ❌ BEFORE
const user = JSON.parse(sessionStorage.getItem('user'))
const response = await fetch(`${API_URL}/orders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
})
const data = await response.json()

// ✅ AFTER
import { cookieApi } from '@/utils/cookieAuth'
const data = await cookieApi.post('/orders', orderData)
```

### Delivery Address
```jsx
// ❌ BEFORE
sessionStorage.setItem('delivery_address', address)
const address = sessionStorage.getItem('delivery_address')

// ✅ AFTER
import { setDeliveryAddress, getDeliveryAddress } from '@/utils/sessionStorage'
setDeliveryAddress(address)
const address = getDeliveryAddress()
```

### Selected Restaurant
```jsx
// ❌ BEFORE
sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant))
const restaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')

// ✅ AFTER
import { setSelectedRestaurant, getSelectedRestaurant } from '@/utils/sessionStorage'
setSelectedRestaurant(restaurant)
const restaurant = getSelectedRestaurant()
```

### Cart
```jsx
// ❌ BEFORE
sessionStorage.setItem('cart', JSON.stringify(cartItems))
const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
sessionStorage.removeItem('cart')

// ✅ AFTER
import { setCart, getCart, clearCartData } from '@/utils/sessionStorage'
setCart(cartItems) // Automatically strips images/descriptions
const cart = getCart()
clearCartData()
```

---

## Common Patterns

### Component with Auth
```jsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { isLoggedIn, user, isAdmin, handleLogout } = useAuth()
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />
  }
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      {isAdmin && <AdminPanel />}
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

### Making API Calls
```jsx
import { cookieApi } from '@/utils/cookieAuth'

async function fetchOrders() {
  try {
    const orders = await cookieApi.get('/orders')
    return orders
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    throw error
  }
}

async function createOrder(orderData) {
  try {
    const order = await cookieApi.post('/orders', orderData)
    return order
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}
```

### Using Session Storage
```jsx
import { 
  getSelectedRestaurant, 
  getCart, 
  getDeliveryMethod 
} from '@/utils/sessionStorage'

function CheckoutComponent() {
  const restaurant = getSelectedRestaurant()
  const cart = getCart()
  const method = getDeliveryMethod()
  
  return (
    <div>
      <h2>{restaurant?.name}</h2>
      <p>Items: {cart.length}</p>
      <p>Method: {method}</p>
    </div>
  )
}
```

---

## cookieApi Methods

```jsx
import { cookieApi } from '@/utils/cookieAuth'

// GET request
const data = await cookieApi.get('/endpoint')

// POST request
const result = await cookieApi.post('/endpoint', { key: 'value' })

// PUT request
const updated = await cookieApi.put('/endpoint', { key: 'value' })

// DELETE request
const deleted = await cookieApi.delete('/endpoint')

// PATCH request
const patched = await cookieApi.patch('/endpoint', { key: 'value' })

// All methods automatically:
// - Include cookies (credentials: 'include')
// - Handle 401 errors (redirect to login)
// - Return parsed JSON
// - Throw errors for non-OK responses
```

---

## Session Storage Methods

```jsx
import {
  // Delivery
  getDeliveryAddress,      // Returns string or ''
  setDeliveryAddress,      // (address: string) => void
  getDeliveryCoordinates,  // Returns {latitude, longitude} or null
  setDeliveryCoordinates,  // (coords: {latitude, longitude}) => void
  getDeliveryMethod,       // Returns 'pickup' | 'delivery'
  setDeliveryMethod,       // (method: string) => void
  
  // Restaurant
  getSelectedRestaurant,   // Returns restaurant object or null
  setSelectedRestaurant,   // (restaurant: object) => void
  
  // Cart
  getCart,                 // Returns array of items
  setCart,                 // (items: array) => void (strips images/descriptions)
  
  // Order
  getOrderId,              // Returns string or null
  setOrderId,              // (id: string) => void
  
  // Scheduling
  getScheduledOrder,       // Returns boolean
  setScheduledOrder,       // (isScheduled: boolean) => void
  getOrderSchedulingReason, // Returns string
  setOrderSchedulingReason, // (reason: string) => void
  getOrderScheduledDelivery, // Returns string or null
  setOrderScheduledDelivery, // (time: string) => void
  
  // Cleanup
  clearCartData,           // Clears cart & orderId
  clearDeliveryData,       // Clears delivery info
  clearScheduledOrderData, // Clears scheduling info
  clearAllSessionData      // Clears ALL localStorage
} from '@/utils/sessionStorage'
```

---

## Error Handling

```jsx
import { login, cookieApi } from '@/utils/cookieAuth'

// Login with error handling
async function handleLogin(email, password) {
  try {
    await login(email, password)
    navigate('/dashboard')
  } catch (error) {
    if (error.message.includes('Invalid credentials')) {
      setError('Wrong email or password')
    } else {
      setError('Login failed. Please try again.')
    }
  }
}

// API call with error handling
async function fetchData() {
  try {
    const data = await cookieApi.get('/endpoint')
    return data
  } catch (error) {
    if (error.message.includes('401')) {
      // User not authenticated - redirect handled automatically
      console.log('Session expired')
    } else {
      console.error('API error:', error)
    }
    throw error
  }
}
```

---

## Testing

```jsx
// Check if cookies are set (DevTools > Application > Cookies)
// Should see:
// - access_token (HttpOnly, Secure, SameSite)
// - refresh_token (HttpOnly, Secure, SameSite)

// Check localStorage (DevTools > Application > Local Storage)
// Should see:
localStorage.getItem('cart')
localStorage.getItem('selectedRestaurant')
localStorage.getItem('delivery_address')
// Should NOT see:
localStorage.getItem('user') // ❌ Should be null
sessionStorage.getItem('user') // ❌ Should be null
```

---

## Migration Checklist

For each file:

- [ ] Remove `sessionStorage.getItem('user')`
- [ ] Remove `sessionStorage.setItem('user', ...)`
- [ ] Remove `JSON.parse(sessionStorage.getItem('user'))`
- [ ] Replace fetch with `cookieApi.get/post/put/delete/patch`
- [ ] Replace `sessionStorage` with utils from `sessionStorage.js`
- [ ] Remove manual `Authorization` headers
- [ ] Add `import { cookieApi } from '@/utils/cookieAuth'`
- [ ] Add imports from `@/utils/sessionStorage`
- [ ] Test in browser
- [ ] Verify cookies in DevTools

---

## Key Rules

1. **NEVER** access tokens in frontend code
2. **ALWAYS** use `credentials: 'include'` in fetch calls
3. **ALWAYS** use cookieApi for authenticated requests
4. **NEVER** store sensitive data in localStorage
5. **ALWAYS** use sessionStorage utils for session data
6. **NEVER** manually set Authorization headers (cookies handle it)
7. **ALWAYS** call `updateLoginState()` after successful login

---

## Files Created

- ✅ `src/utils/cookieAuth.js` - Authentication utilities
- ✅ `src/utils/sessionStorage.js` - Session storage utilities
- ✅ `src/context/AuthContext.NEW.jsx` - Updated auth context
- ✅ `src/context/CartContext.NEW.jsx` - Updated cart context
- ✅ `COOKIE_AUTH_MIGRATION.md` - Detailed migration guide
- ✅ `IMPLEMENTATION_GUIDE.md` - Step-by-step instructions
- ✅ `QUICK_REFERENCE.md` - This file
- ✅ `EXAMPLES/` - Code examples

---

## Need Help?

1. Check `IMPLEMENTATION_GUIDE.md` for step-by-step instructions
2. Check `COOKIE_AUTH_MIGRATION.md` for detailed explanation
3. Check `EXAMPLES/` for code samples
4. Search codebase for existing usage patterns

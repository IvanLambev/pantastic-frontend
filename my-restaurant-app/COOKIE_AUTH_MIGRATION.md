# Migration to HttpOnly Cookie Authentication

## Overview

This document outlines the migration from sessionStorage-based JWT authentication to secure HttpOnly cookie authentication.

## Key Changes

### 1. Authentication Storage

**Before:**

- `access_token` and `refresh_token` stored in `sessionStorage`
- Tokens manually attached to API requests via `Authorization` header
- Vulnerable to XSS attacks

**After:**

- `access_token` and `refresh_token` stored in **HttpOnly, Secure cookies** by backend
- Frontend **CANNOT** access tokens directly (enhanced security)
- Cookies automatically sent with requests (`credentials: 'include'`)
- Protected from XSS attacks

### 2. Session Data Storage

**Before:**

- All data (including tokens) in `sessionStorage`
- Data lost when tab is closed

**After:**

- Non-sensitive data in `localStorage` (persists across tabs/sessions)
- Minimal cart data (no images/descriptions)
- Delivery information persisted

### 3. Cart Optimization

**Before:**

```json
{
  "id": "...",
  "name": "...",
  "price": 12,
  "quantity": 1,
  "image": "data:image/png;base64...", // LARGE
  "description": "Long description..." // UNNECESSARY
}
```

**After:**

```json
{
  "id": "fcf3385e-fb47-44ba-a967-4f2be5cf434d",
  "name": "Палачинка Буено с пресни ягоди (290г)",
  "price": 12,
  "quantity": 1
}
```

## New Utility Files

### 1. `src/utils/cookieAuth.js`

Handles all authentication operations:

- `login(email, password)` - Login and set HttpOnly cookies
- `logout()` - Clear cookies and local session
- `validateSession()` - Check if user is authenticated
- `validateAdmin()` - Check admin privileges
- `authenticateWithGoogle(token)` - Google OAuth
- `fetchWithCookies(url, options)` - Make authenticated requests
- `cookieApi.get/post/put/delete/patch()` - Convenience API methods

### 2. `src/utils/sessionStorage.js`

Manages non-sensitive session data in localStorage:

- Delivery address, coordinates, method
- Selected restaurant (minimal data)
- Cart (optimized, no images)
- Order scheduling data

## Migration Steps

### Step 1: Update AuthContext

Replace token-based auth with cookie-based validation:

```jsx
// OLD
const [token, setToken] = useState(null);
const user = JSON.parse(sessionStorage.getItem("user"));

// NEW
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);

useEffect(() => {
  validateSession().then(({ isValid, user }) => {
    setIsAuthenticated(isValid);
    setUser(user);
  });
}, []);
```

### Step 2: Update Login Flow

```jsx
// OLD
const response = await fetch('/user/login', {...})
const data = await response.json()
sessionStorage.setItem('user', JSON.stringify(data))

// NEW
import { login } from '@/utils/cookieAuth'
await login(email, password)
// Cookies are set automatically by backend
```

### Step 3: Update Logout Flow

```jsx
// OLD
sessionStorage.removeItem("user");
sessionStorage.removeItem("selectedRestaurant");

// NEW
import { logout } from "@/utils/cookieAuth";
await logout();
// Backend clears cookies, we clear localStorage
```

### Step 4: Update API Requests

```jsx
// OLD
const user = JSON.parse(sessionStorage.getItem("user"));
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${user.access_token}`,
  },
});

// NEW
import { cookieApi } from "@/utils/cookieAuth";
const data = await cookieApi.get("/endpoint");
// Cookies sent automatically
```

### Step 5: Update Session Data Storage

```jsx
// OLD
sessionStorage.setItem("delivery_address", address);
const address = sessionStorage.getItem("delivery_address");

// NEW
import { setDeliveryAddress, getDeliveryAddress } from "@/utils/sessionStorage";
setDeliveryAddress(address);
const address = getDeliveryAddress();
```

### Step 6: Update Cart Storage

```jsx
// OLD
sessionStorage.setItem("cart", JSON.stringify(cartItems));

// NEW
import { setCart, getCart } from "@/utils/sessionStorage";
setCart(cartItems); // Automatically strips images/descriptions
```

## Backend Requirements

The backend must implement the following:

### 1. Cookie Configuration

```python
# Set cookies with proper security flags
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,      # Cannot be accessed via JavaScript
    secure=True,        # Only sent over HTTPS
    samesite="Lax",     # or "Strict" - CSRF protection
    max_age=3600        # 1 hour
)
```

### 2. CORS Configuration

```python
# Allow credentials (cookies) from frontend origin
CORS(
    app,
    origins=["https://www.palachinki.store"],
    supports_credentials=True,  # CRITICAL
    allow_headers=["Content-Type"]
)
```

### 3. New Endpoints

#### POST `/user/logout`

Clears authentication cookies

#### GET `/user/validate-session`

Returns user info if session valid, 401 if not

### 4. Updated Endpoints

All protected endpoints must:

- Read tokens from cookies (not Authorization header)
- Validate token
- Return 401 if invalid/expired

## Security Considerations

### XSS Protection

- HttpOnly cookies prevent JavaScript access
- Implement Content Security Policy (CSP) headers
- Sanitize all user inputs
- Validate and escape data before rendering

### CSRF Protection

- Use `SameSite=Lax` or `SameSite=Strict` on cookies
- Consider CSRF tokens for state-changing operations

### HTTPS Only

- `Secure` flag ensures cookies only sent over HTTPS
- Never use in development without HTTPS (or use separate config)

### Cookie Expiration

- Short-lived access tokens (15-30 minutes)
- Longer refresh tokens (7-30 days)
- Automatic refresh before expiration

## Testing Checklist

- [ ] Login sets HttpOnly cookies
- [ ] Logout clears cookies
- [ ] API requests include cookies automatically
- [ ] 401 responses redirect to login
- [ ] Session persists across page refreshes
- [ ] Cart data persists across tabs
- [ ] Delivery info persists across sessions
- [ ] No tokens in localStorage/sessionStorage
- [ ] No tokens in browser DevTools > Application > Storage
- [ ] Cookies have HttpOnly, Secure, SameSite flags
- [ ] Google OAuth sets cookies properly
- [ ] Admin validation works with cookies

## Rollback Plan

If issues arise:

1. Keep old sessionStorage code in comments
2. Feature flag to switch between old/new auth
3. Gradual rollout to subset of users
4. Monitor error rates and authentication failures

## Common Issues & Solutions

### Issue: Cookies not being sent

**Solution:** Ensure `credentials: 'include'` in all fetch calls

### Issue: CORS errors

**Solution:** Backend must set `Access-Control-Allow-Credentials: true`

### Issue: Cookies not set in development

**Solution:** Use HTTPS in dev or configure `Secure: false` for dev environment

### Issue: Session lost on page refresh

**Solution:** Call `validateSession()` on app initialization

## Files to Update

1. **Context:**

   - `src/context/AuthContext.jsx` - Use cookie auth
   - `src/context/CartContext.jsx` - Use localStorage utils

2. **Components:**

   - `src/components/login-form.jsx` - Use `login()` from cookieAuth
   - `src/components/GoogleLoginButton.jsx` - Use `authenticateWithGoogle()`

3. **Pages:**

   - `src/pages/CheckoutV2.jsx` - Use sessionStorage utils
   - `src/pages/Login.jsx` - Use cookie auth
   - All pages using auth

4. **Utils:**
   - Replace `src/utils/apiClient.js` usage with `cookieApi`
   - Update all fetch calls to use `fetchWithCookies`

## Example Usage

### Complete Login Flow

```jsx
import { login } from "@/utils/cookieAuth";
import { setSelectedRestaurant } from "@/utils/sessionStorage";

async function handleLogin(email, password) {
  try {
    const userData = await login(email, password);

    // Store non-sensitive session data
    if (restaurant) {
      setSelectedRestaurant(restaurant);
    }

    // Redirect to dashboard
    navigate("/dashboard");
  } catch (error) {
    console.error("Login failed:", error);
  }
}
```

### Complete API Request

```jsx
import { cookieApi } from "@/utils/cookieAuth";
import { getSelectedRestaurant, getCart } from "@/utils/sessionStorage";

async function createOrder() {
  const restaurant = getSelectedRestaurant();
  const cart = getCart();

  const order = await cookieApi.post("/order/orders", {
    restaurant_id: restaurant.restaurant_id,
    products: cart.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {}),
  });

  return order;
}
```

## Migration Timeline

1. **Week 1:** Backend implements cookie auth
2. **Week 2:** Frontend creates new utils (cookieAuth, sessionStorage)
3. **Week 3:** Update AuthContext and CartContext
4. **Week 4:** Update all components and pages
5. **Week 5:** Testing and bug fixes
6. **Week 6:** Production deployment with monitoring

## Support

For questions or issues, contact the development team.

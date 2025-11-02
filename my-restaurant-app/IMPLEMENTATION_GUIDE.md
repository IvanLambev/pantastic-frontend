# Step-by-Step Implementation Guide

## Migration to HttpOnly Cookie Authentication

This guide provides practical, copy-paste ready code for migrating your existing codebase to the new cookie-based authentication system.

---

## Prerequisites

Ensure you have created the following new utility files:

- ✅ `src/utils/cookieAuth.js` - Cookie authentication utilities
- ✅ `src/utils/sessionStorage.js` - Session data management

---

## Step 1: Update AuthContext.jsx

**File:** `src/context/AuthContext.jsx`

### Option A: Complete Replacement

Replace the entire file with `src/context/AuthContext.NEW.jsx`

```bash
# Backup old file
cp src/context/AuthContext.jsx src/context/AuthContext.OLD.jsx

# Use new implementation
cp src/context/AuthContext.NEW.jsx src/context/AuthContext.jsx
```

### Option B: Manual Updates

If you have custom logic, make these specific changes:

1. **Update imports:**

```jsx
// ADD these imports at the top
import {
  validateSession,
  validateAdmin,
  logout as logoutUser,
} from "@/utils/cookieAuth";
```

2. **Remove token state, add user state:**

```jsx
// REMOVE:
const [token, setToken] = useState(null);

// ADD:
const [user, setUser] = useState(null);
const [isLoading, setIsLoading] = useState(true);
```

3. **Replace checkLoginStatus with checkAuthStatus:**

```jsx
const checkAuthStatus = async () => {
  try {
    setIsLoading(true);
    const { isValid, user: userData } = await validateSession();

    if (isValid && userData) {
      setIsLoggedIn(true);
      setUser(userData);

      const adminStatus = await validateAdmin();
      setIsAdmin(adminStatus);
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setIsAdmin(false);
    }
  } catch (error) {
    console.error("Error checking auth status:", error);
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
  } finally {
    setIsLoading(false);
  }
};
```

4. **Update handleLogout:**

```jsx
const handleLogout = async () => {
  try {
    await logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    window.location.href = "/login";
  } catch (error) {
    console.error("Error during logout:", error);
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    window.location.href = "/login";
  }
};
```

5. **Remove ALL sessionStorage references:**

```jsx
// DELETE all lines like:
sessionStorage.getItem("user")
sessionStorage.setItem("user", ...)
sessionStorage.removeItem("user")
JSON.parse(sessionStorage.getItem("user"))
```

---

## Step 2: Update CartContext.jsx

**File:** `src/context/CartContext.jsx`

### Complete replacement recommended:

```bash
# Backup old file
cp src/context/CartContext.jsx src/context/CartContext.OLD.jsx

# Use new implementation
cp src/context/CartContext.NEW.jsx src/context/CartContext.jsx
```

### Key changes if updating manually:

1. **Update imports:**

```jsx
import { cookieApi } from "@/utils/cookieAuth";
import {
  getCart,
  setCart as saveCart,
  getOrderId,
  setOrderId as saveOrderId,
  clearCartData,
  getSelectedRestaurant,
} from "@/utils/sessionStorage";
```

2. **Update useEffect:**

```jsx
useEffect(() => {
  const savedCart = getCart();
  if (savedCart && savedCart.length > 0) {
    setCartItems(savedCart);
  }

  const savedOrderId = getOrderId();
  if (savedOrderId) {
    setOrderIdState(savedOrderId);
  }
}, []);
```

3. **Update all cart operations to use sessionStorage utils:**

```jsx
// REPLACE: sessionStorage.setItem('cart', JSON.stringify(newItems))
// WITH:
saveCart(newItems);

// REPLACE: sessionStorage.removeItem('cart')
// WITH:
clearCartData();
```

4. **Update API calls to use cookieApi:**

```jsx
// REPLACE fetch calls with:
const data = await cookieApi.post('/order/orders', {...})
```

---

## Step 3: Update login-form.jsx

**File:** `src/components/login-form.jsx`

**Find this code:**

```jsx
const response = await fetch(`${API_URL}/user/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

if (!response.ok) {
  throw new Error("Login failed");
}

const data = await response.json();
sessionStorage.setItem("user", JSON.stringify(data));
```

**Replace with:**

```jsx
import { login } from "@/utils/cookieAuth";

// In handleSubmit:
try {
  await login(email, password);

  // Update auth context
  if (updateLoginState) {
    await updateLoginState();
  }

  navigate("/dashboard");
} catch (err) {
  console.error("Login failed:", err);
  setError(err.message || "Login failed");
}
```

---

## Step 4: Update GoogleLoginButton.jsx

**File:** `src/components/GoogleLoginButton.jsx`

**Find this code:**

```jsx
const response = await fetch(`${API_URL}/auth/google`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ access_token: googleAccessToken }),
});

const authData = await response.json();
sessionStorage.setItem("user", JSON.stringify(authData));
```

**Replace with:**

```jsx
import { authenticateWithGoogle } from "@/utils/cookieAuth";

// In success handler:
try {
  await authenticateWithGoogle(googleAccessToken);

  if (updateLoginState) {
    await updateLoginState();
  }

  navigate("/dashboard");
} catch (error) {
  console.error("Google auth failed:", error);
}
```

---

## Step 5: Update CheckoutV2.jsx

**File:** `src/pages/CheckoutV2.jsx`

This file has many sessionStorage references. Update them systematically:

### 5.1 Update imports:

```jsx
import { cookieApi } from "@/utils/cookieAuth";
import {
  getDeliveryAddress,
  setDeliveryAddress,
  getDeliveryCoordinates,
  setDeliveryCoordinates,
  getDeliveryMethod,
  setDeliveryMethod,
  getSelectedRestaurant,
  getScheduledOrder,
  getOrderScheduledDelivery,
  setOrderScheduledDelivery,
  clearScheduledOrderData,
} from "@/utils/sessionStorage";
```

### 5.2 Replace sessionStorage calls:

**Line ~177-180:**

```jsx
// REPLACE:
const deliveryAddress = sessionStorage.getItem("delivery_address");
const deliveryMethod = sessionStorage.getItem("delivery_method") || "pickup";
const selectedRestaurant = JSON.parse(
  sessionStorage.getItem("selectedRestaurant") || "[]"
);

// WITH:
const deliveryAddress = getDeliveryAddress();
const deliveryMethod = getDeliveryMethod();
const selectedRestaurant = getSelectedRestaurant();
```

**Line ~192:**

```jsx
// REPLACE:
const coordinates = sessionStorage.getItem("delivery_coordinates");
if (coordinates) {
  return JSON.parse(coordinates);
}

// WITH:
return getDeliveryCoordinates();
```

**Line ~233:**

```jsx
// REPLACE:
sessionStorage.setItem("delivery_address", normalizedAddress);

// WITH:
setDeliveryAddress(normalizedAddress);
```

**Line ~237:**

```jsx
// REPLACE:
sessionStorage.removeItem("delivery_coordinates");

// WITH:
setDeliveryCoordinates(null);
```

**Line ~156-171 (scheduled delivery):**

```jsx
// REPLACE:
const currentSchedule = sessionStorage.getItem("order_scheduled_delivery");
// ...
sessionStorage.setItem("order_scheduled_delivery", newScheduleString);
sessionStorage.removeItem("order_scheduled_delivery");

// WITH:
const currentSchedule = getOrderScheduledDelivery();
// ...
setOrderScheduledDelivery(newScheduleString);
setOrderScheduledDelivery(null);
```

**Line ~568-570:**

```jsx
// REPLACE:
sessionStorage.removeItem("scheduled_order");
sessionStorage.removeItem("order_scheduling_reason");
sessionStorage.removeItem("order_scheduled_delivery");

// WITH:
clearScheduledOrderData();
```

### 5.3 Update API calls:

**Line ~275 onwards (all fetch calls):**

```jsx
// REPLACE:
const user = JSON.parse(sessionStorage.getItem("user") || "{}");
const response = await fetch(`${API_URL}/some/endpoint`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${user.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

// WITH:
const response = await cookieApi.post("/some/endpoint", data);
```

---

## Step 6: Update Other Components

Search for all sessionStorage and update:

### Find and Replace Pattern:

```bash
# In VS Code, use Find & Replace (Ctrl+H) with regex:

# Pattern 1: Get delivery address
FIND: sessionStorage\.getItem\(['"]delivery_address['"]\)
REPLACE: getDeliveryAddress()

# Pattern 2: Set delivery address
FIND: sessionStorage\.setItem\(['"]delivery_address['"],\s*(.+?)\)
REPLACE: setDeliveryAddress($1)

# Pattern 3: Get restaurant
FIND: JSON\.parse\(sessionStorage\.getItem\(['"]selectedRestaurant['"]\)\s*\|\|\s*['"]\[\]['"]\)
REPLACE: getSelectedRestaurant()

# Pattern 4: Get user (should be removed!)
FIND: JSON\.parse\(sessionStorage\.getItem\(['"]user['"]\).*?\)
REPLACE: // MIGRATION TODO: Remove this - use cookie auth instead
```

---

## Step 7: Update All API Calls

### Pattern to find:

```jsx
const user = JSON.parse(sessionStorage.getItem("user") || "{}");
const response = await fetch(`${API_URL}/endpoint`, {
  headers: {
    Authorization: `Bearer ${user.access_token}`,
  },
});
```

### Replace with:

```jsx
import { cookieApi } from "@/utils/cookieAuth";

const data = await cookieApi.get("/endpoint");
// or .post(), .put(), .delete(), .patch()
```

---

## Step 8: Remove Old Utilities

After migration is complete and tested:

1. **Deprecate old apiClient.js:**

```bash
mv src/utils/apiClient.js src/utils/apiClient.OLD.js
```

2. **Update imports:**

```bash
# Find all imports of old apiClient
grep -r "from '@/utils/apiClient'" src/

# Replace with cookieApi imports
```

---

## Step 9: Testing Checklist

After implementation, verify:

- [ ] Login works and sets cookies (check DevTools > Application > Cookies)
- [ ] Cookies have `HttpOnly`, `Secure`, `SameSite` flags
- [ ] No tokens in localStorage (check DevTools > Application > Local Storage)
- [ ] API calls work without manual Authorization header
- [ ] Logout clears cookies
- [ ] Cart persists across page refreshes
- [ ] Cart persists across tabs
- [ ] Delivery info persists across sessions
- [ ] 401 responses redirect to login
- [ ] Google OAuth works
- [ ] Admin validation works

---

## Step 10: Cleanup

Once everything works:

1. Remove `.OLD.jsx` backup files
2. Remove old utility files
3. Remove this guide from repository (optional)
4. Update team documentation

---

## Common Issues

### Issue: "Cookies not being sent"

**Solution:** Add `credentials: 'include'` to all fetch calls

- Check: `src/utils/cookieAuth.js` - all fetch calls have `credentials: 'include'`

### Issue: "Cart not persisting"

**Solution:** Using sessionStorage instead of localStorage

- Check: `src/utils/sessionStorage.js` uses `localStorage`

### Issue: "401 errors everywhere"

**Solution:** Backend not reading cookies correctly

- Check backend CORS settings: `supports_credentials=True`
- Check backend reads from cookies, not Authorization header

---

## Rollback Procedure

If you need to rollback:

```bash
# Restore old files
cp src/context/AuthContext.OLD.jsx src/context/AuthContext.jsx
cp src/context/CartContext.OLD.jsx src/context/CartContext.jsx

# Revert git changes
git checkout src/
```

---

## Support

If you encounter issues, check:

1. `COOKIE_AUTH_MIGRATION.md` for detailed explanation
2. `EXAMPLES/` folder for code examples
3. Browser console for error messages
4. Network tab to verify cookies are being sent

---

## Summary

**What changed:**

- ✅ Tokens now in HttpOnly cookies (secure)
- ✅ Session data in localStorage (persistent)
- ✅ Cart optimized (no images)
- ✅ Clean separation of concerns

**What to update:**

- AuthContext and CartContext
- All login/logout logic
- All API calls
- All sessionStorage usage

**Files created:**

- `src/utils/cookieAuth.js` - New auth system
- `src/utils/sessionStorage.js` - Session management
- `COOKIE_AUTH_MIGRATION.md` - Documentation
- `EXAMPLES/` - Code examples

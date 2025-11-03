# 📝 SessionStorage → localStorage Migration Plan

## Problem
`sessionStorage` is **tab-specific** - when you open a new tab, all data (cart, user session, restaurant selection) is lost, even though HttpOnly cookies persist.

## Solution
Use `localStorage` instead of `sessionStorage` for persistent data that should survive across tabs.

## ✅ Already Migrated
- ✅ src/context/AuthContext.jsx
- ✅ src/context/CartContext.jsx  
- ✅ src/components/login-form.jsx

## 🔧 Backend Requirement

**CRITICAL:** Backend needs to provide a `/user/me` endpoint:

```python
@router.get("/user/me")
async def get_current_user(request: Request):
    """
    Get current user from HttpOnly cookie.
    Returns user data if cookie is valid, 401 if not.
    """
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Validate token and get user
        user = validate_token(access_token)
        
        return {
            "customer_id": user.customer_id,
            "email": user.email,
            "is_admin": user.is_admin  # or however you check admin status
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

This endpoint allows the frontend to restore user session from cookies when opening a new tab.

## 📋 Files Needing Manual Updates

### Core API Utils (CRITICAL)
- ⚠️ src/utils/apiClient.js - Change `sessionStorage` → `localStorage` (3 occurrences)

### User Pages (HIGH PRIORITY - 13 files)
- src/pages/PaymentSuccess.jsx - 1 occurrence
- src/pages/CheckoutV2.jsx - 5 occurrences  
- src/components/user-dashboard.jsx - 4 occurrences
- src/pages/OrderTrackingV2.jsx - 1 occurrence
- src/pages/Food.jsx - 4 occurrences
- src/pages/ItemDetails.jsx - 2 occurrences
- src/pages/RestaurantDetails.jsx - 2 occurrences
- src/pages/Cart.jsx - 1 occurrence
- src/pages/Home.jsx - 2 occurrences
- src/components/OrderConfirmation.jsx - 1 occurrence
- src/components/sign-up-form.jsx - 1 occurrence
- src/components/ui/RestaurantSelector.jsx - 1 occurrence

### Admin Pages (MEDIUM PRIORITY)
- src/components/restaurant-manager.jsx - 2 occurrences
- src/components/admin/OrderManagementComponent.jsx - 1 occurrence

## 🔍 Find & Replace Pattern

**Find:**
```javascript
sessionStorage.getItem('user')
sessionStorage.setItem('user'
sessionStorage.removeItem('user')
sessionStorage.getItem('selectedRestaurant')
sessionStorage.setItem('selectedRestaurant'
sessionStorage.removeItem('selectedRestaurant')
sessionStorage.getItem('cart')
sessionStorage.setItem('cart'
sessionStorage.removeItem('cart')
```

**Replace with:**
```javascript
localStorage.getItem('user')
localStorage.setItem('user'
localStorage.removeItem('user')
localStorage.getItem('selectedRestaurant')
localStorage.setItem('selectedRestaurant'
localStorage.removeItem('selectedRestaurant')
localStorage.getItem('cart')
localStorage.setItem('cart'
localStorage.removeItem('cart')
```

## ⚠️ Important Notes

### What to Keep in sessionStorage
- Temporary order data (pending_order_id, pending_payment_id)
- One-time flags
- Per-tab specific state

### What Moved to localStorage
- ✅ user (customer_id, email)
- ✅ selectedRestaurant
- ✅ cart items
- ✅ isAdmin flag

## 🧪 Testing Checklist

After migration:
1. [ ] Login → User stays logged in across new tabs
2. [ ] Add items to cart → Cart persists in new tabs
3. [ ] Select restaurant → Selection persists in new tabs
4. [ ] Close all tabs → Reopen browser → Still logged in (cookies valid for 15min)
5. [ ] Logout → All data cleared from localStorage

---

**Status:** 🔄 In Progress - Core files migrated, ~25 files remaining

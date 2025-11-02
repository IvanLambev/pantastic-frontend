# 🔧 Cookie Authentication Fix Guide

## The Problem

The backend is using **HttpOnly cookies** correctly, but the frontend is trying to:
1. Read HttpOnly cookies from JavaScript (impossible - they're HttpOnly!)
2. Send `Authorization: Bearer undefined` headers (because cookies can't be read)

## The Solution

**REMOVE all Authorization headers and rely purely on cookies.**

## ✅ Fixed Files

- ✅ `src/utils/apiClient.js` - Removed Authorization header logic
- ✅ `src/components/login-form.jsx` - Simplified to store only customer_id
- ✅ `src/pages/CheckoutV2.jsx` - All validations check customer_id
- ✅ `src/pages/PaymentSuccess.jsx` - Uses credentials: 'include', no Auth header
- ✅ `src/pages/OrderTrackingV2.jsx` - Removed Authorization headers
- ✅ `src/context/CartContext.jsx` - Uses credentials: 'include'

## ⚠️ Files Still Need Fixing

These files still have `Authorization: Bearer` headers that need to be removed:

### User-Facing Pages
- `src/components/user-dashboard.jsx` (4 occurrences)
- `src/pages/RestaurantDetails.jsx` (3 occurrences)
- `src/pages/ItemDetails.jsx` (3 occurrences)
- `src/pages/Food.jsx` (3 occurrences)
- `src/components/restaurant-manager.jsx` (4 occurrences)

### Admin/Context Files
- `src/context/AuthContext.jsx` (3 occurrences)
- `src/context/AdminContext.jsx` (1 occurrence)
- `src/utils/adminAuth.js` (2 occurrences)

## 🔨 How to Fix Each File

For each file, replace this pattern:

### ❌ BEFORE (Wrong):
```javascript
const user = JSON.parse(sessionStorage.getItem('user') || '{}')
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.access_token}`, // ❌ REMOVE THIS
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
```

### ✅ AFTER (Correct):
```javascript
const response = await fetch(url, {
  method: 'POST',
  credentials: 'include', // ✅ This sends HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
    // NO Authorization header!
  },
  body: JSON.stringify(data)
})
```

## 🎯 Key Principles

1. **Never read `user.access_token`** - It doesn't exist in cookie mode
2. **Always add `credentials: 'include'`** - This sends cookies
3. **Never add Authorization header** - Cookies handle auth automatically
4. **Only check `customer_id`** - For verifying user is logged in (client-side)

## 🧪 Testing

After fixing all files:

1. **Login** - Should see: `🍪 Backend set HttpOnly cookies`
2. **Check console** - Should see: `✅ customer_id found: ...`
3. **Place order** - Should work without 401 errors
4. **No "Authorization: Bearer undefined"** errors

## 📋 Next Steps

1. Fix the remaining files listed above
2. Test complete user flow (login → browse → add to cart → checkout)
3. Remove all `access_token` references from codebase
4. Update admin authentication to use cookies too

---

**Remember:** HttpOnly cookies are handled by the browser automatically. You don't need to (and can't!) read or manipulate them in JavaScript. Just send `credentials: 'include'` and the browser does the rest! 🚀

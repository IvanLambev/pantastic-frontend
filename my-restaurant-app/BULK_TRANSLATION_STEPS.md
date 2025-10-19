# Bulk Translation Instructions

## Quick Start

1. All translations are ready in `src/utils/translations.js`
2. Import at top of each file: `import { t } from '@/utils/translations';`
3. Replace English text with `t('key.subkey')`

## Files Already Translated ✅

- ✅ src/utils/translations.js
- ✅ src/components/Navbar.jsx  
- ✅ src/pages/Login.jsx
- ✅ src/pages/SignUp.jsx

## Quick Translation Steps

### For Each File:

1. **Add import** at the top:
```javascript
import { t } from '@/utils/translations';
```

2. **Replace text patterns** using VS Code Find & Replace:

**Find:** `"Your Cart is Empty"`
**Replace:** `{t('cart.empty')}`

**Find:** `>Continue Shopping<`
**Replace:** `>{t('cart.continueShopping')}<`

**Find:** `>Add to Cart<`
**Replace:** `>{t('menu.addToCart')}<`

## Priority Files (Do These First)

### 1. Cart.jsx - CRITICAL
Find & Replace patterns:
- `"Your Cart is Empty"` → `{t('cart.empty')}`
- `"Continue Shopping"` → `{t('cart.continueShopping')}`
- `"Checkout"` → `{t('cart.checkout')}`
- `"Subtotal"` → `{t('cart.subtotal')}`
- `"Total"` → `{t('cart.total')}`
- `"Remove"` → `{t('cart.remove')}`

### 2. CheckoutV2.jsx - CRITICAL  
Find & Replace patterns:
- `"Checkout"` → `{t('checkout.title')}`
- `"Complete your order"` → `{t('checkout.completeOrder')}`
- `"Account Required"` → `{t('checkout.accountRequired')}`
- `"Sign In"` → `{t('checkout.signIn')}`
- `"Sign Up"` → `{t('checkout.signUp')}`
- `"First Name"` → `{t('checkout.firstName')}`
- `"Last Name"` → `{t('checkout.lastName')}`
- `"Email"` → `{t('checkout.email')}`
- `"Phone"` → `{t('checkout.phone')}`
- `"City"` → `{t('checkout.city')}`
- `"Password"` → `{t('checkout.password')}`
- `"Payment Method"` → `{t('checkout.paymentMethod')}`
- `"Discount Code"` → `{t('checkout.discountCode')}`
- `"Review Order"` → `{t('checkout.reviewOrder')}`

### 3. OrderTrackingV2.jsx - CRITICAL
Find & Replace patterns:
- `"Order Tracking"` → `{t('tracking.title')}`
- `"Order ID"` → `{t('tracking.orderId')}`
- `"Status"` → `{t('tracking.status')}`
- `"Pending"` → `{t('tracking.pending')}`
- `"Confirmed"` → `{t('tracking.confirmed')}`
- `"Preparing"` → `{t('tracking.preparing')}`
- `"Ready"` → `{t('tracking.ready')}`
- `"Delivered"` → `{t('tracking.delivered')}`

### 4. Food.jsx - CRITICAL
Find & Replace patterns:
- `"Our Menu"` → `{t('menu.title')}`
- `"Add to Cart"` → `{t('menu.addToCart')}`
- `"View Details"` → `{t('menu.viewDetails')}`
- `"Loading..."` → `{t('menu.loading')}`

### 5. RestaurantSelector.jsx - CRITICAL
Find & Replace patterns:
- `"How would you like to get your food?"` → `{t('restaurantSelector.howToGetFood')}`
- `"Pickup"` → `{t('restaurantSelector.pickup')}`
- `"Delivery"` → `{t('restaurantSelector.delivery')}`
- `"Where are you located?"` → `{t('restaurantSelector.whereLocated')}`
- `"Select a City"` → `{t('restaurantSelector.selectCity')}`

## Component Files

### login-form.jsx
- `"Email"` → `{t('login.emailLabel')}`
- `"Password"` → `{t('login.passwordLabel')}`
- `"Login"` → `{t('login.loginButton')}`
- `"Logging in..."` → `{t('login.loggingIn')}`
- `"Don't have an account?"` → `{t('login.noAccount')}`

### sign-up-form.jsx
- `"First Name"` → `{t('signup.firstNameLabel')}`
- `"Last Name"` → `{t('signup.lastNameLabel')}`
- `"Email"` → `{t('signup.emailLabel')}`
- `"Phone"` → `{t('signup.phoneLabel')}`
- `"City"` → `{t('signup.cityLabel')}`
- `"Password"` → `{t('signup.passwordLabel')}`
- `"Sign Up"` → `{t('signup.signUpButton')}`

## Toast Messages

Replace all toast messages:
```javascript
// Before
toast.success("Order placed successfully!")
toast.error("Failed to place order")

// After  
toast.success(t('notifications.orderPlaced'))
toast.error(t('notifications.orderFailed'))
```

## Common Toast Translations
- `toast.success("Added to cart")` → `toast.success(t('notifications.addedToCart'))`
- `toast.success("Removed from cart")` → `toast.success(t('notifications.removedFromCart'))`
- `toast.success("Order placed successfully!")` → `toast.success(t('notifications.orderPlaced'))`
- `toast.error("Failed to place order")` → `toast.error(t('notifications.orderFailed'))`
- `toast.success("Login successful!")` → `toast.success(t('notifications.loginSuccess'))`
- `toast.error("Login failed")` → `toast.error(t('notifications.loginFailed'))`

## Testing After Translation

1. Test login flow
2. Test signup flow
3. Add items to cart
4. Go through checkout
5. Track an order
6. Check all pages display Bulgarian text

## Notes

- Item names stay in English (they come from API)
- Restaurant names stay as-is
- Keep all `className`, `onClick`, etc. attributes unchanged
- Only translate user-visible text

## Example Full File Translation

**Before:**
```jsx
export default function Cart() {
  return (
    <div>
      <h1>Your Cart</h1>
      <button>Checkout</button>
    </div>
  )
}
```

**After:**
```jsx
import { t } from '@/utils/translations';

export default function Cart() {
  return (
    <div>
      <h1>{t('cart.title')}</h1>
      <button>{t('cart.checkout')}</button>
    </div>
  )
}
```

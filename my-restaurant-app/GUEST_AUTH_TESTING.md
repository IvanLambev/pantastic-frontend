# Guest Authentication Testing Guide

## Quick Test Steps

### Prerequisites

- Clear browser cookies and localStorage
- Make sure you're logged out
- Have at least one item in cart

### Test Scenario 1: Guest Checkout Flow

1. **Add items to cart**

   ```
   Navigate to /food → Add items → View Cart
   ```

2. **Proceed to checkout**

   ```
   Click "Checkout" → Should redirect to /checkout-login
   ```

3. **Fill guest checkout form**

   ```
   First Name: Test
   Last Name: User
   Email: test@example.com
   Phone: +359888123456
   City: Sofia
   Click "Continue as Guest"
   ```

4. **Review order and place**

   ```
   Should navigate to /checkout-v2
   Select delivery/pickup method
   Select payment method
   Click "Place Order"
   ```

5. **Check console logs** (Browser DevTools → Console)

   ```
   Expected logs:
   ✓ "🔐 Authenticating guest user before order creation..."
   ✓ "✅ Guest authentication successful"
   ✓ No errors about authentication
   ```

6. **Check cookies** (Browser DevTools → Application → Cookies)

   ```
   Should see cookies for domain: api2.palachinki.store
   - access_token (HTTP-only)
   - refresh_token (HTTP-only)
   ```

7. **Verify order creation**
   ```
   ✓ Order should be created successfully
   ✓ Should redirect to /order-tracking-v2/{order_id}
   ✓ Should see order details
   ```

### Test Scenario 2: Registered User Flow (Should be unaffected)

1. **Login with existing account**

   ```
   Navigate to /login
   Enter credentials
   Login
   ```

2. **Add items and checkout**

   ```
   Add items to cart
   Click "Checkout" → Should go directly to /checkout-v2
   ```

3. **Check console logs**
   ```
   Should NOT see guest authentication logs
   Should use existing customer_id
   Order should be created successfully
   ```

### Test Scenario 3: Error Handling

#### Test 3A: Invalid Phone Format

```
Phone: 0888123456 (missing +359)
Expected: Error message about invalid phone format
```

#### Test 3B: Invalid Email

```
Email: invalid-email
Expected: Error message about invalid email
```

#### Test 3C: Missing Fields

```
Leave any field empty
Expected: Error message "All fields are required"
```

## Common Issues & Solutions

### Issue: "Failed to authenticate guest user"

**Check:**

1. Browser console for detailed error
2. Network tab for the `/order/auth/guest` request
3. Request payload matches expected format
4. Backend API is accessible

**Solution:**

```javascript
// Verify in console:
sessionStorage.getItem("guest_checkout_data");
// Should return valid JSON with first_name, last_name, email, phone
```

### Issue: Order creation fails silently

**Check:**

1. Console logs for authentication step
2. Whether cookies were set after guest auth
3. Network tab for `/order/orders` request

**Solution:**

- Ensure `credentials: 'include'` is set in both requests
- Check if cookies are being sent with order request

### Issue: "User not logged in" error for guest

**Root Cause:**

- Guest authentication failed but error was not caught
- sessionStorage doesn't have guest_checkout_data

**Solution:**

```javascript
// In browser console, check:
console.log(sessionStorage.getItem("guest_checkout_data"));
// Should show guest data

console.log(localStorage.getItem("user"));
// Should NOT have customer_id for guest users
```

## Network Request Inspection

### 1. Guest Authentication Request

```http
POST https://api2.palachinki.store/order/auth/guest
Content-Type: application/json
Credentials: include

{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@example.com",
  "phone": "+359888123456"
}
```

**Expected Response:**

```json
{
  "message": "Guest authenticated successfully",
  "customer_id": "some-uuid"
}
```

**Expected Headers:**

```
Set-Cookie: access_token=...; HttpOnly; Secure; Path=/
Set-Cookie: refresh_token=...; HttpOnly; Secure; Path=/
```

### 2. Order Creation Request

```http
POST https://api2.palachinki.store/order/orders
Content-Type: application/json
Credentials: include
Cookie: access_token=...; refresh_token=...

{
  "restaurant_id": "...",
  "order_items": [...],
  "payment_method": "cash",
  "delivery_method": "delivery",
  "address": "...",
  ...
}
```

**Expected Response:**

```json
{
  "order_id": "some-uuid",
  "total_price": 25.50,
  ...
}
```

## Code Validation

### Checkpoint 1: CheckoutLogin.jsx

Verify guest data is stored:

```javascript
// After clicking "Continue as Guest"
const guestData = sessionStorage.getItem("guest_checkout_data");
console.log("Guest data:", JSON.parse(guestData));
// Should show: { first_name, last_name, email, phone, city }
```

### Checkpoint 2: CheckoutV2.jsx - Before Order

Verify detection:

```javascript
// In handleOrderConfirm(), add:
const guestCheckoutData = sessionStorage.getItem("guest_checkout_data");
const isGuest = !!guestCheckoutData && !user?.customer_id;
console.log("Is guest checkout?", isGuest);
console.log("Guest data:", guestCheckoutData);
```

### Checkpoint 3: After Guest Auth

Verify cookies:

```javascript
// After guest authentication succeeds
console.log("Cookies:", document.cookie); // Won't show HTTP-only cookies
// Check DevTools → Application → Cookies instead
```

## Testing Matrix

| Scenario                            | Expected Result                  | Status |
| ----------------------------------- | -------------------------------- | ------ |
| Guest checkout with valid data      | ✅ Order created                 | [ ]    |
| Guest checkout with invalid phone   | ❌ Error shown                   | [ ]    |
| Guest checkout with invalid email   | ❌ Error shown                   | [ ]    |
| Guest checkout with missing fields  | ❌ Error shown                   | [ ]    |
| Registered user checkout            | ✅ Order created (no guest auth) | [ ]    |
| Guest checkout → Backend down       | ❌ Clear error message           | [ ]    |
| Guest auth succeeds but order fails | ❌ Clear error message           | [ ]    |

## Performance Checks

- [ ] Guest auth request completes in < 2s
- [ ] Order creation completes in < 3s
- [ ] Total checkout time < 5s
- [ ] No unnecessary re-renders
- [ ] No memory leaks in console

## Browser Compatibility

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Security Checks

- [ ] HTTP-only cookies are set (can't access via JavaScript)
- [ ] Cookies have Secure flag in production
- [ ] Guest data is cleared after order
- [ ] No sensitive data in localStorage
- [ ] CORS configured correctly

## Final Checklist

Before deploying:

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Success notifications appear
- [ ] Order tracking page loads correctly
- [ ] Guest can't access authenticated-only features
- [ ] Multiple guest checkouts work in different tabs

## Debugging Commands

```javascript
// Check guest checkout status
const isGuestCheckout = !!sessionStorage.getItem("guest_checkout_data");
console.log("Guest checkout:", isGuestCheckout);

// Check user status
const user = JSON.parse(localStorage.getItem("user") || "{}");
console.log("Has customer_id:", !!user.customer_id);

// Check restaurant selection
const restaurant = JSON.parse(
  localStorage.getItem("selectedRestaurant") || "[]"
);
console.log("Restaurant selected:", restaurant.length > 0);

// Check cart items
const cartData = localStorage.getItem("cart");
const cart = cartData ? JSON.parse(cartData) : [];
console.log("Cart items:", cart.length);
```

## Success Criteria

✅ **Guest checkout works end-to-end**
✅ **Registered users unaffected**
✅ **Clear error messages**
✅ **Cookies handled securely**
✅ **No console errors**
✅ **Order tracking works**

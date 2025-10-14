# Pantastic Restaurant App

A React + Vite application for restaurant management with customer ordering and admin functionality.

## Features

- Customer ordering system
- Restaurant management
- Admin panel with authentication
- Order tracking
- Payment integration

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```env
# Admin functionality toggle
VITE_ADMIN_ENABLED=true
```

### Vercel Environment Variables

For production deployment on Vercel, set the following environment variable:

- `VITE_ADMIN_ENABLED`: Set to `true` to enable admin functionality, `false` to disable

## Admin Access

The admin panel is accessible at `/admin` and requires separate authentication:

- Admin login endpoint: `https://api.palachinki.store/restaurant/admin/login`
- Default credentials: `admin1@pantastic.com` / `admin123`
- Admin functionality is controlled by the `VITE_ADMIN_ENABLED` environment variable

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

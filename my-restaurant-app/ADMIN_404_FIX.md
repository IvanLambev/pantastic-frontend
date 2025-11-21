# Fix for Silent 404 Error on Admin Pages

## Problem
When accessing admin pages, the console shows a 404 error:
```
GET https://api2.palachinki.store/user/me 404 (Not Found)
❌ No valid cookie session found
```

This happens because the `AuthContext` (for regular users) runs on every page load, including admin pages. It tries to call `/user/me` to check for user sessions, but admin users don't have access to this endpoint - they use `/restaurant/admin/verify` instead.

## Root Cause
In `src/context/AuthContext.jsx`, the `useEffect` hook runs `checkLoginStatus()` on every page load, regardless of whether the user is on an admin route or a regular user route.

## Solution
Add a check at the beginning of `checkLoginStatus()` to skip execution when on admin routes:

### File: `src/context/AuthContext.jsx`

**Find this code (around line 22-24):**
```javascript
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log("🔍 Checking login status on app load...")
```

**Replace with:**
```javascript
  useEffect(() => {
    const checkLoginStatus = async () => {
      // Skip user auth check if we're on admin routes - AdminContext handles admin auth
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        console.log("🔍 Skipping user auth check - on admin route");
        return;
      }
      
      console.log("🔍 Checking login status on app load...")
```

## Why This Works
- Admin routes (`/admin/*`) use `AdminContext` for authentication
- Regular user routes use `AuthContext` for authentication
- By skipping the `AuthContext` check on admin routes, we prevent the unnecessary `/user/me` call
- This eliminates the 404 error and allows admin authentication to work properly

## Testing
After applying this fix:
1. Navigate to `/admin/login`
2. Log in as admin
3. Check the browser console
4. You should NO LONGER see the 404 error for `/user/me`
5. Admin tables should load correctly

## Files Affected
- `src/context/AuthContext.jsx` - Add admin route check

## Related Files
- `src/context/AdminContext.jsx` - Handles admin authentication
- `src/components/AdminProtectedRoute.jsx` - Protects admin routes

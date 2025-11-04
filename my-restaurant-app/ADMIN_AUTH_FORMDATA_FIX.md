# Admin Authentication FormData Fix

## Problem

The `/restaurant/items/template-based` endpoint was failing with authentication errors when creating new menu items with file uploads.

### Root Cause

The `fetchWithAdminAuth` utility function was setting `Content-Type: application/json` for **all** requests, including those with `FormData` payloads. When sending `FormData` (multipart/form-data), the browser needs to set the `Content-Type` header automatically to include the proper boundary parameter.

### Incorrect Behavior (Before)

```javascript
// This was setting Content-Type: application/json for ALL requests
options.headers = {
  "Content-Type": "application/json",
  ...(options.headers || {}),
};
```

Result when sending FormData:

- Header: `Content-Type: application/json` ❌
- Server receives malformed multipart data
- Authentication fails

## Solution

Modified `src/utils/adminAuth.js` to detect `FormData` and handle headers appropriately:

### Fixed Behavior (After)

```javascript
const isFormData = options.body instanceof FormData;

if (!isFormData) {
  // For JSON requests, set Content-Type
  options.headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
} else {
  // For FormData, let browser set Content-Type with boundary
  options.headers = {
    ...(options.headers || {}),
  };
  // Remove Content-Type if it was set
  if (options.headers["Content-Type"]) {
    delete options.headers["Content-Type"];
  }
}
```

Result when sending FormData:

- Header: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...` ✅
- Server correctly parses multipart data
- Authentication works with cookies

## Authentication Method

The application uses **cookie-based authentication** with the following flow:

1. Admin logs in via `/user/admin/login`
2. Server sets HTTP-only cookies
3. All subsequent requests include `credentials: 'include'`
4. Server validates admin role via cookies

### Token Refresh Flow

- Access tokens are stored in `sessionStorage` for display/debugging
- Refresh tokens are used when access token expires (401 response)
- Cookie-based authentication is the primary authentication mechanism

## Testing

To test the fix:

1. Log in as admin
2. Navigate to restaurant details
3. Click "Add Menu Item"
4. Fill in the form with:
   - Name, description, price
   - Select addon/removable templates
   - Upload an image
5. Submit the form

Expected result:

- Item creates successfully ✅
- Toast notification shows success message ✅
- Item appears in the menu list ✅

## Files Modified

- `src/utils/adminAuth.js` - Fixed FormData header handling

## Related Endpoints

The following endpoints benefit from this fix:

- `POST /restaurant/items/template-based` - Create item with templates
- `PUT /restaurant/items` - Update item
- Any other endpoint that accepts file uploads with admin authentication

## Notes

- The fix maintains backward compatibility with JSON requests
- Cookie-based authentication (`credentials: 'include'`) is used for all requests
- The browser automatically sets the correct `Content-Type` header for `FormData`
- Access tokens in `sessionStorage` are kept for compatibility but cookies are the primary auth mechanism

# Google OAuth Implementation Guide

This document explains how to set up and use Google OAuth login in the Pantastic frontend application.

## ✅ Already Completed

1. **Dependencies Installed**

   - `@react-oauth/google` ✅ (already in package.json)
   - `jwt-decode` ✅ (just installed)

2. **Google OAuth Provider Setup** ✅

   - Configured in `main.jsx` with conditional rendering
   - Falls back gracefully if Google Client ID is not configured

3. **Google Login Button Component** ✅

   - Created `GoogleLoginButton.jsx` with full functionality
   - Includes loading states, error handling, and success flow
   - Integrated into both login and signup forms

4. **Authentication Flow** ✅
   - Obtains access token from Google
   - Sends to backend at `/auth/google` endpoint
   - Stores backend JWT in sessionStorage
   - Updates global auth context
   - Redirects to `/food` page

## 🔧 Configuration Required

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API and People API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application Type to "Web application"
6. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://www.palachinki.store` (for production)
7. Add Authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - `https://www.palachinki.store` (for production)
8. Copy the Client ID

### 2. Environment Variables

Update your `.env` file with the actual Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here.apps.googleusercontent.com
```

Replace `your_actual_google_client_id_here` with the Client ID from Google Cloud Console.

## 🔄 Backend Integration Required

Your backend needs to handle the Google OAuth flow. The frontend will send a POST request to `/auth/google` with this payload:

```json
{
  "access_token": "google_access_token_here"
}
```

### Expected Backend Response

The backend should return the same format as regular login:

```json
{
  "access_token": "your_backend_jwt_token",
  "refresh_token": "your_backend_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Backend Implementation Notes

1. Use the Google access token to fetch user information from Google's API
2. Check if user exists in your database (by email)
3. If user exists, log them in
4. If user doesn't exist, create a new account with Google data
5. Return your own JWT tokens

## 🎯 Features Implemented

### Loading States

- Shows spinner and "Влизане..." text while processing
- Disables button during loading

### Error Handling

- Shows toast notifications for errors
- Handles OAuth errors and API errors separately
- Graceful fallback if Google OAuth is not configured

### Success Flow

- Shows success toast message
- Updates global authentication state
- Redirects to food page
- Stores session data properly

### Bulgarian Localization

- All UI text is in Bulgarian
- Error messages are translated
- Success messages are translated

## 🔧 Files Modified/Created

1. **Created**: `src/components/GoogleLoginButton.jsx`
2. **Modified**: `src/main.jsx` - Added GoogleOAuthProvider
3. **Modified**: `src/components/login-form.jsx` - Integrated GoogleLoginButton
4. **Modified**: `src/components/sign-up-form.jsx` - Integrated GoogleLoginButton
5. **Modified**: `src/utils/translations.js` - Added Google login translations
6. **Modified**: `.env` - Added Google Client ID placeholder
7. **Created**: `.env.example` - Example environment file

## 🧪 Testing

1. Set the correct Google Client ID in `.env`
2. Ensure backend `/auth/google` endpoint is implemented
3. Test in development: `npm run dev`
4. Click "Вход с Google" button
5. Complete Google OAuth flow
6. Verify successful login and redirect

## 🚀 Production Deployment

1. Add production domain to Google Cloud Console authorized origins
2. Set production `VITE_GOOGLE_CLIENT_ID` in deployment environment
3. Ensure backend handles CORS for your frontend domain
4. Test the complete flow in production

## 📝 Additional Scopes

The implementation requests these Google API scopes:

- `https://www.googleapis.com/auth/userinfo.email` - User email address
- `https://www.googleapis.com/auth/userinfo.profile` - User profile information (name, picture)
- `https://www.googleapis.com/auth/user.phonenumbers.read` - Phone numbers (optional for People API fallback)
- `https://www.googleapis.com/auth/user.addresses.read` - Address information (optional for People API fallback)

The last two scopes are optional and used as fallback if the People API fails to provide phone and city information.

These can be adjusted in `GoogleLoginButton.jsx` if needed.

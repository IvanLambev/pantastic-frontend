# Backend Requirements for HttpOnly Cookie Authentication

## Overview

Frontend is migrating from sessionStorage-based JWT to HttpOnly cookie authentication. This document outlines the required backend changes.

---

## Critical Changes Required

### 1. Cookie-Based Token Storage

**Current:** Backend returns tokens in response body
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Required:** Backend sets tokens as HttpOnly cookies AND returns in body

```python
from fastapi import Response

@app.post("/user/login")
def login(credentials: LoginCredentials, response: Response):
    # Validate credentials
    user = authenticate_user(credentials.email, credentials.password)
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Set HttpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,      # Cannot be accessed via JavaScript
        secure=True,        # Only sent over HTTPS
        samesite="lax",     # CSRF protection ("strict" or "lax")
        max_age=1800,       # 30 minutes (in seconds)
        path="/",           # Available on all paths
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=2592000,    # 30 days
        path="/",
    )
    
    # Also return in body (for compatibility during migration)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }
```

---

### 2. CORS Configuration

**CRITICAL:** Must allow credentials (cookies) from frontend origin

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.palachinki.store",
        "http://localhost:5173",  # Dev environment
    ],
    allow_credentials=True,  # ⚠️ CRITICAL - allows cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],  # Keep Authorization for backward compatibility
    expose_headers=["Set-Cookie"],
)
```

---

### 3. Token Extraction from Cookies

**Current:** Extract from Authorization header
```python
token = request.headers.get("Authorization").replace("Bearer ", "")
```

**Required:** Extract from cookies (with fallback to header for backward compatibility)

```python
from fastapi import Cookie, Header, HTTPException
from typing import Optional

def get_current_user(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    # Try cookie first
    token = access_token
    
    # Fallback to Authorization header (for backward compatibility)
    if not token and authorization:
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        user = get_user_by_id(user_id)
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

### 4. New Endpoints

#### POST `/user/logout`

Clears authentication cookies

```python
@app.post("/user/logout")
def logout(response: Response):
    # Clear cookies by setting max_age=0
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,  # Expires immediately
        path="/",
    )
    
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        path="/",
    )
    
    return {"message": "Logged out successfully"}
```

#### GET `/user/validate-session`

Validates current session and returns user info

```python
@app.get("/user/validate-session")
def validate_session(
    current_user = Depends(get_current_user)
):
    """
    Validates the current session by checking the access_token cookie.
    Returns user info if valid, 401 if not.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": current_user.is_admin
    }
```

---

### 5. Update Existing Endpoints

All protected endpoints must:

1. Accept tokens from cookies (not just Authorization header)
2. Use the updated `get_current_user` dependency
3. Return 401 if token is invalid/expired

**Example:**

```python
@app.get("/orders")
def get_orders(current_user = Depends(get_current_user)):
    # Token validation handled by get_current_user
    orders = fetch_user_orders(current_user.id)
    return orders
```

---

### 6. Google OAuth Update

Must set cookies after successful OAuth:

```python
@app.post("/auth/google")
def google_auth(google_token: GoogleToken, response: Response):
    # Validate Google token
    google_user = verify_google_token(google_token.access_token)
    
    # Get or create user
    user = get_or_create_user_from_google(google_user)
    
    # Generate our backend tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Set HttpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=1800,
        path="/",
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=2592000,
        path="/",
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }
```

---

### 7. Token Refresh

Update refresh token endpoint to use cookies:

```python
@app.post("/user/refresh-token")
def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    token_data: Optional[dict] = None  # Fallback for backward compatibility
):
    # Try cookie first
    token = refresh_token
    
    # Fallback to request body (for backward compatibility)
    if not token and token_data:
        token = token_data.get("refresh_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token provided")
    
    try:
        # Validate refresh token
        payload = verify_refresh_token(token)
        user_id = payload.get("sub")
        
        # Generate new access token
        new_access_token = create_access_token(user_id)
        new_refresh_token = create_refresh_token(user_id)
        
        # Set new cookies
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=1800,
            path="/",
        )
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=2592000,
            path="/",
        )
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

---

## Environment-Specific Settings

### Production
```python
COOKIE_SECURE = True   # Only HTTPS
COOKIE_SAMESITE = "lax"  # or "strict"
ALLOWED_ORIGINS = ["https://www.palachinki.store"]
```

### Development
```python
COOKIE_SECURE = False  # Allow HTTP
COOKIE_SAMESITE = "lax"
ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
```

**Recommended config:**

```python
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

COOKIE_SETTINGS = {
    "httponly": True,
    "secure": IS_PRODUCTION,  # HTTPS only in production
    "samesite": "lax",
    "path": "/",
}

CORS_ORIGINS = [
    "https://www.palachinki.store",
] if IS_PRODUCTION else [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

---

## Security Checklist

- [ ] HttpOnly flag on all auth cookies
- [ ] Secure flag on cookies (production only)
- [ ] SameSite flag set to 'lax' or 'strict'
- [ ] CORS configured with `allow_credentials=True`
- [ ] CORS origins whitelist (not wildcard `*`)
- [ ] Token expiration times reasonable (30min access, 30days refresh)
- [ ] HTTPS enforced in production
- [ ] Content Security Policy headers set
- [ ] Input validation on all endpoints
- [ ] Rate limiting on login/refresh endpoints

---

## Testing Backend Changes

### 1. Test Cookie Setting

```bash
curl -X POST https://api2.palachinki.store/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt \
  -v
```

Check response headers for `Set-Cookie`:
```
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=1800; Path=/
Set-Cookie: refresh_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
```

### 2. Test Cookie Authentication

```bash
curl -X GET https://api2.palachinki.store/user/validate-session \
  -b cookies.txt \
  -v
```

Should return user info if cookies valid.

### 3. Test Logout

```bash
curl -X POST https://api2.palachinki.store/user/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

Check that cookies are cleared (Max-Age=0).

### 4. Test CORS

```bash
curl -X OPTIONS https://api2.palachinki.store/user/validate-session \
  -H "Origin: https://www.palachinki.store" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Should return:
```
Access-Control-Allow-Origin: https://www.palachinki.store
Access-Control-Allow-Credentials: true
```

---

## Migration Strategy

### Phase 1: Backward Compatibility (Week 1-2)

- Add cookie support to all endpoints
- Keep Authorization header support
- Accept tokens from both cookies AND headers

### Phase 2: Frontend Migration (Week 3-4)

- Frontend updates to use cookie auth
- Monitor for issues
- Keep both methods active

### Phase 3: Deprecation (Week 5+)

- Log warnings for Authorization header usage
- Eventually remove Authorization header support
- Cookies only

---

## Common Issues

### Issue: "CORS error - credentials not allowed"
**Solution:** 
```python
allow_credentials=True  # In CORS config
```

### Issue: "Cookies not being set"
**Solution:**
- Check `Secure` flag (must be `False` in dev without HTTPS)
- Check domain matches
- Check `SameSite` setting

### Issue: "Cookie too large"
**Solution:**
- JWT tokens can be large
- Consider shorter token expiration
- Use token ID reference instead of full payload

### Issue: "Token not found in cookies"
**Solution:**
- Frontend must send `credentials: 'include'`
- Check cookie name matches exactly
- Check cookie path is '/'

---

## Example Complete Implementation

```python
from fastapi import FastAPI, Response, Cookie, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os

app = FastAPI()

# Environment config
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.palachinki.store" if IS_PRODUCTION else "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cookie settings
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": IS_PRODUCTION,
    "samesite": "lax",
    "path": "/",
}

# Dependency
def get_current_user(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    token = access_token or (authorization.replace("Bearer ", "") if authorization else None)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = verify_and_get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user

# Login
@app.post("/user/login")
def login(credentials: LoginCredentials, response: Response):
    user = authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    response.set_cookie(key="access_token", value=access_token, max_age=1800, **COOKIE_SETTINGS)
    response.set_cookie(key="refresh_token", value=refresh_token, max_age=2592000, **COOKIE_SETTINGS)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }

# Logout
@app.post("/user/logout")
def logout(response: Response):
    response.set_cookie(key="access_token", value="", max_age=0, **COOKIE_SETTINGS)
    response.set_cookie(key="refresh_token", value="", max_age=0, **COOKIE_SETTINGS)
    return {"message": "Logged out"}

# Validate session
@app.get("/user/validate-session")
def validate_session(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }

# Protected endpoint example
@app.get("/orders")
def get_orders(current_user = Depends(get_current_user)):
    return fetch_orders(current_user.id)
```

---

## Timeline

1. **Week 1:** Implement cookie auth with backward compatibility
2. **Week 2:** Test and deploy to staging
3. **Week 3:** Frontend migration begins
4. **Week 4:** Monitor and fix issues
5. **Week 5+:** Deprecate Authorization header (optional)

---

## Questions?

Contact frontend team for coordination and testing.

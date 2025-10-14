# Admin API Endpoints Configuration

Based on the provided API documentation, here are the correct endpoints for the admin panel:

## Base URL
- Production: `https://api.palachinki.store/restaurant`
- All endpoints are prefixed with `/restaurant`

## Authentication Endpoints
- **Login**: `POST /restaurant/admin/login`
- **Verify**: `GET /restaurant/admin/verify`

## Restaurant Management
- **Get All**: `GET /restaurant/restaurants` 
- **Get By ID**: `GET /restaurant/restaurants/{restaurant_id}`
- **Create**: `POST /restaurant/restaurants`
- **Update**: `PUT /restaurant/restaurants`
- **Delete**: `DELETE /restaurant/restaurants`

## Menu Item Management
- **Get Items**: `GET /restaurant/{restaurant_id}/items`
- **Get Specific Item**: `GET /restaurant/{restaurant_id}/items/{item_id}`
- **Create Items**: `POST /restaurant/items`
- **Create Bulk**: `POST /restaurant/items/bulk`
- **Update Item**: `PUT /restaurant/items`
- **Delete Item**: `DELETE /restaurant/items`

## Addon Template Management
- **Get Templates**: `GET /restaurant/addon-templates/{restaurant_id}`
- **Get Specific**: `GET /restaurant/addon-templates/{restaurant_id}/{template_id}`
- **Create**: `POST /restaurant/addon-templates`
- **Update**: `PUT /restaurant/addon-templates`
- **Delete**: `DELETE /restaurant/addon-templates`

## Delivery Personnel Management
- **Get All**: `GET /restaurant/delivery-people`
- **Create**: `POST /restaurant/delivery-people`
- **Update**: `PUT /restaurant/delivery-people`
- **Delete**: `DELETE /restaurant/delivery-people`

## API Key Management
- **Get All**: `GET /restaurant/api-keys`
- **Get By Restaurant**: `GET /restaurant/api-keys/{restaurant_id}`
- **Create**: `POST /restaurant/api-keys`
- **Update**: `PUT /restaurant/api-keys`
- **Delete**: `DELETE /restaurant/api-keys`
- **Regenerate**: `POST /restaurant/api-keys/{restaurant_id}/regenerate`

## Worker Management
- **Get Workers**: `GET /restaurant/workers/{restaurant_id}`
- **Create**: `POST /restaurant/workers`
- **Update**: `PUT /restaurant/workers`
- **Delete**: `DELETE /restaurant/workers`

## Order Management
Note: Order endpoints may require worker authentication or API keys
- **Worker Orders**: `GET /order/orders/worker` (might need worker token)
- **Update Status**: `PUT /order/orders/status`

## Implementation Notes

1. All endpoints require admin JWT token in Authorization header:
   ```
   Authorization: Bearer <admin_jwt_token>
   ```

2. Request content type should be:
   ```
   Content-Type: application/json
   ```

3. The admin authentication flow:
   - Login with admin credentials
   - Store JWT token
   - Use token for all subsequent requests
   - Verify token periodically

4. Error handling:
   - 401: Token expired/invalid - redirect to login
   - 403: Insufficient permissions - show error message
   - 404: Resource not found
   - 500: Server error

## Current Implementation Status

✅ **Implemented and Working:**
- Admin login/logout
- Admin token verification
- Restaurant management endpoints
- Menu item CRUD operations (updated)
- Addon template management
- Delivery people management
- Responsive mobile/desktop layouts

⚠️ **Needs Verification:**
- Order management (may need different auth)
- API key management (not yet implemented in UI)
- Worker management (not yet implemented in UI)

🔧 **Recommended Next Steps:**
1. Test order endpoints with worker authentication
2. Add API key management UI
3. Add worker management UI
4. Implement proper error boundary for 403 errors
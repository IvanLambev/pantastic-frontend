# Delivery Rates Manager Implementation

## Summary

Successfully implemented a delivery rates management system for the restaurant admin panel.

## Features Implemented

### 1. DeliveryRatesManager Component

**Location:** `src/components/admin/DeliveryRatesManager.jsx`

#### Features:

- **Interactive Map Visualization**
  - Displays restaurant location with a marker
  - Shows delivery zones as concentric circles
  - Each zone has a unique color (5 colors cycling)
  - Radius corresponds to delivery distance in kilometers

- **Delivery Zones Configuration**
  - Add/remove delivery zones dynamically
  - Configure distance (km) and price ($) for each zone
  - Zones automatically sorted by distance
  - Color-coded legend showing all zones

- **Multi-Restaurant Support**
  - Select multiple restaurants to apply rates
  - Shows restaurant name and address
  - Scrollable list with checkboxes
  - Displays count of selected restaurants

- **API Integration**
  - Endpoint: `POST /restaurant/restaurants/delivery-rates`
  - Sends rates in the format: `{"1": 1.69, "2.5": 3.0, "5": 5.0}`
  - Updates multiple restaurants in parallel
  - Shows success/error toasts
  - Auto-refreshes page after successful update

### 2. Integration with RestaurantDetailsAdminComponent

**Location:** `src/components/admin/RestaurantDetailsAdminComponent.jsx`

#### Changes:

- Added "Delivery Rates" button next to "Working Hours" button
- Button uses MapPin icon for visual consistency
- Opens modal dialog with delivery rates manager
- Passes current restaurant and all restaurants list to the component

## Usage

1. Navigate to Restaurant Management page
2. Click the "Delivery Rates" button (with map pin icon)
3. The map shows the restaurant location and current delivery zones
4. Modify zones:
   - Adjust distance and price for each zone
   - Click "Add Zone" to add a new zone
   - Click trash icon to remove a zone
5. Select restaurants to apply rates to (multiple selection supported)
6. Click "Save Delivery Rates" to update

## Technical Details

### Map Components Used

- `Map` - Main map container
- `MapTileLayer` - OpenStreetMap tiles
- `MapMarker` - Restaurant location marker
- `MapCircle` - Delivery zone circles

### Default Values

- Default center: Sofia, Bulgaria [42.6977, 23.3219]
- Centers on restaurant coordinates if available
- Default zoom: 13
- Default rates: 1km/$1.69, 2.5km/$3.0, 5km/$5.0

### Styling

- Responsive dialog (max-width: 6xl)
- Scrollable restaurant selection list
- Color-coded zones for easy identification
- Professional card-based layout

## API Format

**Request:**

```json
{
  "restaurant_id": "uuid",
  "delivery_rates": {
    "1": 1.69,
    "2.5": 3.0,
    "5": 5.0
  }
}
```

**Response:**

```json
{
  "message": "Delivery rates updated successfully",
  "restaurant_id": "uuid",
  "delivery_rates": {
    "1": 1.69,
    "2.5": 3.0,
    "5": 5.0
  }
}
```

## Dependencies

All required dependencies are already installed:

- @shadcn-map/map (installed via `npx shadcn@latest add @shadcn-map/map`)
- leaflet
- react-leaflet
- UI components: Dialog, Button, Card, Input, Checkbox, ScrollArea

## Future Enhancements (Optional)

- Fetch existing delivery rates when loading
- Show delivery area on a real map with actual restaurant address
- Add validation for overlapping zones
- Export/import delivery rates configuration
- Bulk update all restaurants with same rates
- Visual distance calculator on map

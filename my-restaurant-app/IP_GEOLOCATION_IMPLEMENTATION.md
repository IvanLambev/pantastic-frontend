# IP Geolocation & Restaurant Fallback Implementation

## Overview

This implementation allows users to close the restaurant selector modal without selecting a restaurant, while ensuring a restaurant is always selected through intelligent fallback logic.

## Features Implemented

### 1. IP-Based City Detection

- **Service**: Uses `ipapi.co` free API (1000 requests/day limit)
- **Caching**: Results cached in localStorage for 24 hours
- **Fallback**: Graceful degradation if API fails

### 2. Smart Restaurant Selection Fallback

The system follows this priority order:

1. **User Previously Selected Restaurant**

   - Check localStorage for `selectedRestaurant`
   - If found, use it immediately

2. **IP-Based City Matching**

   - Get user's city from IP geolocation
   - Normalize city names (handles Bulgarian/English variations)
   - Find first restaurant in user's city
   - Auto-select silently

3. **Default Fallback Restaurant**
   - If no city match found, use default restaurant ID: `001a5b8a-e149-48da-83e6-ffb5772b144c`
   - If default ID not found, use first available restaurant

### 3. City Name Normalization

Handles various city name formats:

- **Bulgarian to English mapping**: София → Sofia, Пловдив → Plovdiv, etc.
- **Case insensitive matching**
- **Diacritic removal**
- **Special character handling**

## Files Modified

### New Files Created

#### `src/utils/ipGeolocation.js`

Utility functions for IP geolocation and restaurant selection:

- `getUserCityFromIP()` - Fetches user location from IP
- `normalizeCityName()` - Normalizes city names for comparison
- `findRestaurantInCity()` - Finds restaurant matching user's city
- `getDefaultRestaurant()` - Gets fallback restaurant by ID
- `selectRestaurantWithFallback()` - Main fallback logic orchestrator

### Modified Files

#### `src/components/ui/RestaurantSelector.jsx`

- **Removed** `requireSelection` prop
- **Updated** `handleClose()` to allow closing without selection
- Users can now close modal at any time

#### `src/pages/Food.jsx`

- **Added** import for `selectRestaurantWithFallback`
- **Added** `restaurants` state to store all available restaurants
- **Modified** initialization logic in `useEffect`:
  - Fetches all restaurants on mount
  - Applies fallback selection logic automatically
  - Only shows modal if auto-selection fails
- **Added** `handleModalClose()` handler:
  - Applies fallback logic when modal closed without selection
  - Shows toast notification for auto-selected restaurants

## How It Works

### On Page Load (Food.jsx)

```javascript
1. Component mounts
2. Fetch all restaurants from API
3. Call selectRestaurantWithFallback(restaurants)
   ├─ Check localStorage for saved restaurant → Use it
   ├─ Get user city from IP → Find matching restaurant
   └─ Fall back to default ID → Use default or first restaurant
4. Auto-select restaurant silently
5. Fetch menu items for selected restaurant
6. Only show modal if everything fails
```

### When User Closes Modal Without Selection

```javascript
1. User clicks close/ESC on restaurant selector
2. handleModalClose() is triggered
3. Check if restaurant is selected
   └─ If not: Apply fallback logic again
4. Auto-select restaurant with toast notification
5. Fetch menu items for selected restaurant
```

## City Mapping

The system currently supports these Bulgarian cities (both Bulgarian and English names):

- София / Sofia
- Пловдив / Plovdiv
- Варна / Varna
- Бургас / Burgas
- Русе / Ruse
- Стара Загора / Stara Zagora
- Плевен / Pleven
- Сливен / Sliven
- Добрич / Dobrich
- Шумен / Shumen
- Перник / Pernik
- Хасково / Haskovo
- Ямбол / Yambol
- Пазарджик / Pazardzhik
- Благоевград / Blagoevgrad
- Велико Търново / Veliko Tarnovo
- Враца / Vratsa
- Габрово / Gabrovo
- Видин / Vidin
- Казанлък / Kazanlak
- Асеновград / Asenovgrad

**Note**: Easy to extend with more cities by adding to `cityMappings` object in `ipGeolocation.js`

## API Rate Limits

### ipapi.co Free Tier

- **Limit**: 1,000 requests per day
- **Mitigation**:
  - Results cached for 24 hours in localStorage
  - Each user typically makes 1 request per day max
  - ~1000 unique users per day supported
- **Upgrade Path**: If needed, paid tiers available or can switch to alternative service

## Testing Considerations

### Test Cases

1. ✅ User with saved restaurant → Should use saved
2. ✅ New user in Sofia → Should auto-select Sofia restaurant
3. ✅ New user in city without restaurant → Should use default ID
4. ✅ IP API fails → Should fall back to default ID
5. ✅ User closes modal without selecting → Should apply fallback
6. ✅ Default ID not found → Should use first restaurant

### Manual Testing

```javascript
// Clear saved restaurant and test fallback
localStorage.removeItem("selectedRestaurant");
localStorage.removeItem("ip_geolocation");
// Reload page - should auto-select based on IP

// Test specific city
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: { city: "Sofia", country: "Bulgaria" },
    timestamp: Date.now(),
  })
);
// Reload page - should select Sofia restaurant
```

## Future Enhancements

### Potential Improvements

1. **Multiple Restaurants in Same City**

   - Currently selects first match
   - Could add distance-based sorting
   - Could show city-specific modal with restaurant list

2. **IP Service Redundancy**

   - Add fallback to alternative IP services
   - Try multiple services if one fails

3. **User Preference Learning**

   - Track which restaurants user selects
   - Use ML to predict preferred restaurant

4. **Geographic Boundaries**
   - Use lat/lng for more precise matching
   - Calculate actual distance to restaurants

## Configuration

### Default Restaurant ID

Located in: `src/utils/ipGeolocation.js`

```javascript
const DEFAULT_RESTAURANT_ID = "001a5b8a-e149-48da-83e6-ffb5772b144c";
```

To change default restaurant, update this constant.

### IP Geolocation Cache Duration

Located in: `src/utils/ipGeolocation.js`

```javascript
if (age < 24 * 60 * 60 * 1000) { // 24 hours
```

To change cache duration, modify the milliseconds value.

## Troubleshooting

### Common Issues

**Issue**: Restaurant not auto-selecting

- Check browser console for errors
- Verify restaurants API returns data
- Check if IP geolocation request succeeds
- Verify default restaurant ID exists in database

**Issue**: Wrong city detected

- IP geolocation based on ISP location
- May not match user's actual location
- User can always manually select restaurant

**Issue**: Rate limit exceeded on ipapi.co

- Check localStorage for cached data
- Consider upgrading API plan
- Switch to alternative IP service

## Dependencies

### New Dependencies

None - uses native Fetch API

### External Services

- **ipapi.co**: Free IP geolocation service

### Browser Compatibility

- Requires localStorage support (all modern browsers)
- Requires Fetch API (all modern browsers)
- Fallback gracefully if API fails

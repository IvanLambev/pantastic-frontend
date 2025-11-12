# Testing Guide - IP Geolocation & Restaurant Fallback

## Quick Test Commands

### Test 1: Clear Everything and Reload

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.removeItem("ip_geolocation");
location.reload();
```

**Expected**: Page should auto-select a restaurant based on your IP location or use the default fallback.

### Test 2: Simulate Sofia User

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "Sofia",
      country: "Bulgaria",
      countryCode: "BG",
      latitude: 42.6977,
      longitude: 23.3219,
    },
    timestamp: Date.now(),
  })
);
location.reload();
```

**Expected**: Should auto-select a restaurant in Sofia (if available).

### Test 3: Simulate Plovdiv User

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "Plovdiv",
      country: "Bulgaria",
      countryCode: "BG",
      latitude: 42.1354,
      longitude: 24.7453,
    },
    timestamp: Date.now(),
  })
);
location.reload();
```

**Expected**: Should auto-select a restaurant in Plovdiv (if available).

### Test 4: Simulate User in City Without Restaurants

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "Kyustendil",
      country: "Bulgaria",
      countryCode: "BG",
      latitude: 42.2833,
      longitude: 22.6833,
    },
    timestamp: Date.now(),
  })
);
location.reload();
```

**Expected**: Should fall back to default restaurant ID `001a5b8a-e149-48da-83e6-ffb5772b144c`.

### Test 5: Simulate Non-Bulgarian User

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      latitude: 51.5074,
      longitude: -0.1278,
    },
    timestamp: Date.now(),
  })
);
location.reload();
```

**Expected**: Should fall back to default restaurant ID (no matching city).

### Test 6: Close Modal Without Selection

```javascript
// 1. Clear saved restaurant:
localStorage.removeItem("selectedRestaurant");
// 2. Reload page
location.reload();
// 3. Click outside modal or press ESC to close
// 4. Check console for auto-selection message
```

**Expected**: Modal closes, restaurant auto-selected via fallback logic, toast notification shown.

### Test 7: API Failure Simulation

```javascript
// Block ipapi.co in browser DevTools Network tab
// OR run this before loading page:
localStorage.removeItem("selectedRestaurant");
localStorage.removeItem("ip_geolocation");
// Then block network request to ipapi.co
location.reload();
```

**Expected**: Should gracefully fall back to default restaurant (API failure handled).

### Test 8: Bulgarian City Name (Cyrillic)

```javascript
// Open browser console and run:
localStorage.removeItem("selectedRestaurant");
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "София", // Sofia in Cyrillic
      country: "Bulgaria",
      countryCode: "BG",
      latitude: 42.6977,
      longitude: 23.3219,
    },
    timestamp: Date.now(),
  })
);
location.reload();
```

**Expected**: Should normalize "София" to "sofia" and match Sofia restaurant.

## Browser Console Debugging

### Check Current Restaurant Selection

```javascript
console.log(
  "Selected Restaurant:",
  JSON.parse(localStorage.getItem("selectedRestaurant") || "{}")
);
```

### Check Cached IP Location

```javascript
console.log(
  "Cached IP Location:",
  JSON.parse(localStorage.getItem("ip_geolocation") || "{}")
);
```

### Check All Available Restaurants

```javascript
// In Food.jsx component, check the restaurants state
// Look for console logs: '[IP Geolocation] ...'
```

### Manual IP Geolocation Fetch

```javascript
fetch("https://ipapi.co/json/")
  .then((r) => r.json())
  .then((d) => console.log("Your IP Location:", d));
```

## Verification Checklist

- [ ] Restaurant auto-selected on first visit
- [ ] Modal can be closed without selecting (ESC or outside click)
- [ ] Auto-selection shows toast notification
- [ ] City matching works for both Bulgarian and English names
- [ ] Default fallback works when no city match
- [ ] Cache works (second load uses cached IP data)
- [ ] Works when API fails (graceful degradation)
- [ ] Menu items load after auto-selection
- [ ] User can manually change restaurant selection
- [ ] Selected restaurant persists across page reloads

## Common Console Messages

### Success Messages

```
[IP Geolocation] Using cached location: { city: 'Sofia', ... }
[IP Geolocation] Fetched location: { city: 'Sofia', ... }
[IP Geolocation] Looking for restaurants in: sofia
[IP Geolocation] Found matching restaurant: Restaurant Name
[IP Geolocation] Auto-selected restaurant from user city
```

### Fallback Messages

```
[IP Geolocation] Using default fallback restaurant: Restaurant Name
[IP Geolocation] Using fallback restaurant selection
[IP Geolocation] Default restaurant ID not found, using first restaurant
```

### Error Messages

```
[IP Geolocation] Error: IP geolocation service unavailable
[IP Geolocation] No restaurants available
Error initializing restaurant: Failed to fetch restaurants
```

## Performance Checks

### Network Tab

- First load: 1 request to ipapi.co (~200-500ms)
- Subsequent loads: No IP API request (cache used)
- Restaurant API: 1 request to fetch all restaurants

### LocalStorage Size

Check storage usage:

```javascript
console.log(
  "LocalStorage:",
  Object.keys(localStorage).map((key) => ({
    key,
    size: localStorage[key].length + " bytes",
  }))
);
```

## Edge Cases to Test

1. **No restaurants in database**

   - Should show error or modal

2. **Default restaurant ID doesn't exist**

   - Should use first available restaurant

3. **Multiple restaurants in same city**

   - Should select first one found

4. **User changes restaurant manually**

   - Should save new selection
   - Should not override on next load

5. **Cache expired (>24 hours)**
   - Should fetch fresh IP data
   - Should auto-select based on new data

## Rollback Instructions

If issues occur, rollback by:

1. **Restore previous RestaurantSelector.jsx**

   - Re-add `requireSelection` prop
   - Restore old `handleClose` logic

2. **Restore previous Food.jsx**

   - Remove IP geolocation logic
   - Restore simple check for saved restaurant

3. **Delete ipGeolocation.js utility**

4. **Clear user localStorage**
   ```javascript
   localStorage.removeItem("ip_geolocation");
   ```

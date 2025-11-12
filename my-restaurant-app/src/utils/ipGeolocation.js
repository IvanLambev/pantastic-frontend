/**
 * IP Geolocation utilities for automatic city detection
 */

const DEFAULT_RESTAURANT_ID = "001a5b8a-e149-48da-83e6-ffb5772b144c";

/**
 * Get user's city from IP address using ipapi.co
 * Falls back to localStorage cache if available
 * @returns {Promise<{city: string, country: string, latitude: number, longitude: number} | null>}
 */
export async function getUserCityFromIP() {
  try {
    // Check cache first (valid for 24 hours)
    const cached = localStorage.getItem('ip_geolocation');
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      if (age < 24 * 60 * 60 * 1000) { // 24 hours
        console.log('[IP Geolocation] Using cached location:', data.location);
        return data.location;
      }
    }

    // Fetch from ipapi.co (free tier: 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error('IP geolocation service unavailable');
    }

    const data = await response.json();
    
    const location = {
      city: data.city || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    // Cache the result
    localStorage.setItem('ip_geolocation', JSON.stringify({
      location,
      timestamp: Date.now()
    }));

    console.log('[IP Geolocation] Fetched location:', location);
    return location;
  } catch (error) {
    console.error('[IP Geolocation] Error:', error);
    return null;
  }
}

/**
 * Normalize city name for comparison
 * Handles Bulgarian/English variations and common transliterations
 */
export function normalizeCityName(city) {
  if (!city) return '';
  
  // Convert to lowercase and trim
  let normalized = city.toLowerCase().trim();
  
  // Remove diacritics and special characters
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .trim();
  
  // Common Bulgarian to English city mappings
  // Maps both Bulgarian (Cyrillic) and English names to a common normalized form
  const cityMappings = {
    'sofia': 'sofia',
    'софия': 'sofia',
    'софиа': 'sofia',
    'plovdiv': 'plovdiv',
    'пловдив': 'plovdiv',
    'varna': 'varna',
    'варна': 'varna',
    'burgas': 'burgas',
    'бургас': 'burgas',
    'bourgas': 'burgas',  // Alternative spelling
    'ruse': 'ruse',
    'русе': 'ruse',
    'rousse': 'ruse',  // Alternative spelling
    'stara zagora': 'starazagora',
    'стара загора': 'starazagora',
    'starazagora': 'starazagora',
    'pleven': 'pleven',
    'плевен': 'pleven',
    'sliven': 'sliven',
    'сливен': 'sliven',
    'dobrich': 'dobrich',
    'добрич': 'dobrich',
    'dobric': 'dobrich',  // Alternative spelling
    'shumen': 'shumen',
    'шумен': 'shumen',
    'pernik': 'pernik',
    'перник': 'pernik',
    'haskovo': 'haskovo',
    'хасково': 'haskovo',
    'yambol': 'yambol',
    'ямбол': 'yambol',
    'pazardzhik': 'pazardzhik',
    'пазарджик': 'pazardzhik',
    'pazardjik': 'pazardzhik',  // Alternative spelling
    'blagoevgrad': 'blagoevgrad',
    'благоевград': 'blagoevgrad',
    'veliko tarnovo': 'velikotarnovo',
    'велико търново': 'velikotarnovo',
    'veliko turnovo': 'velikotarnovo',  // Alternative spelling
    'velikotarnovo': 'velikotarnovo',
    'vratsa': 'vratsa',
    'враца': 'vratsa',
    'vraca': 'vratsa',  // Alternative spelling
    'gabrovo': 'gabrovo',
    'габрово': 'gabrovo',
    'vidin': 'vidin',
    'видин': 'vidin',
    'kazanlak': 'kazanlak',
    'казанлък': 'kazanlak',
    'kazanluk': 'kazanlak',  // Alternative spelling
    'asenovgrad': 'asenovgrad',
    'асеновград': 'asenovgrad',
    'kyustendil': 'kyustendil',
    'кюстендил': 'kyustendil',
    'montana': 'montana',
    'монтана': 'montana',
    'lovech': 'lovech',
    'ловеч': 'lovech',
    'kardzhali': 'kardzhali',
    'кърджали': 'kardzhali',
    'kardshali': 'kardzhali',  // Alternative spelling
    'smolyan': 'smolyan',
    'смолян': 'smolyan',
    'targovishte': 'targovishte',
    'търговище': 'targovishte',
    'razgrad': 'razgrad',
    'разград': 'razgrad',
    'silistra': 'silistra',
    'силистра': 'silistra',
  };
  
  // Check if we have a direct mapping
  if (cityMappings[normalized]) {
    return cityMappings[normalized];
  }
  
  // If no direct mapping, return the normalized value (lowercase, no special chars)
  return normalized;
}

/**
 * Find a restaurant in the user's city
 * @param {Array} restaurants - Array of restaurant objects
 * @param {string} userCity - User's city from IP geolocation
 * @returns {Object | null} - Matching restaurant or null
 */
export function findRestaurantInCity(restaurants, userCity) {
  if (!restaurants || !restaurants.length || !userCity) {
    return null;
  }

  const normalizedUserCity = normalizeCityName(userCity);
  console.log('[IP Geolocation] Looking for restaurants in user city:', userCity, '→ normalized:', normalizedUserCity);

  // Find first restaurant matching the city
  const matchingRestaurant = restaurants.find(restaurant => {
    const restaurantCity = restaurant.city || restaurant[3]; // Handle both object and array formats
    const normalizedRestCity = normalizeCityName(restaurantCity);
    
    console.log('[IP Geolocation] Comparing:', restaurantCity, '→', normalizedRestCity, 'with', normalizedUserCity);
    
    const matches = normalizedRestCity === normalizedUserCity;
    
    if (matches) {
      console.log('[IP Geolocation] ✓ MATCH! Found restaurant:', restaurant.name || restaurant[8], 'in', restaurantCity);
    }
    
    return matches;
  });

  if (!matchingRestaurant) {
    console.log('[IP Geolocation] ✗ No restaurant found for city:', userCity);
    console.log('[IP Geolocation] Available cities in restaurants:', 
      [...new Set(restaurants.map(r => r.city || r[3]))].join(', ')
    );
  }

  return matchingRestaurant || null;
}

/**
 * Get the default fallback restaurant by ID (LAST RESORT ONLY)
 * This should rarely be used - only when all other methods fail
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Object | null} - Default restaurant or null
 */
export function getDefaultRestaurant(restaurants) {
  if (!restaurants || !restaurants.length) {
    console.error('[IP Geolocation] ❌ No restaurants available at all!');
    return null;
  }

  const defaultRestaurant = restaurants.find(restaurant => {
    const restaurantId = restaurant.restaurant_id || restaurant[0]; // Handle both formats
    return restaurantId === DEFAULT_RESTAURANT_ID;
  });

  if (defaultRestaurant) {
    console.warn('[IP Geolocation] ⚠️ Using UUID fallback (LAST RESORT):', defaultRestaurant.name || defaultRestaurant[8]);
    console.warn('[IP Geolocation] This should only happen if IP detection completely failed');
  } else {
    console.error('[IP Geolocation] ❌ UUID fallback restaurant not found! Using first restaurant');
  }

  return defaultRestaurant || restaurants[0]; // Return first restaurant if default not found
}

/**
 * Select restaurant with fallback logic:
 * 1. Check if user already selected a restaurant
 * 2. Try to get user's city from IP and find closest restaurant in that city
 * 3. Fall back to default restaurant ID (LAST RESORT - should rarely be used)
 * 
 * @param {Array} restaurants - Array of available restaurants
 * @returns {Promise<Object | null>} - Selected restaurant or null
 */
export async function selectRestaurantWithFallback(restaurants) {
  // 1. Check if restaurant already selected
  const savedRestaurant = localStorage.getItem('selectedRestaurant');
  if (savedRestaurant) {
    try {
      const parsed = JSON.parse(savedRestaurant);
      console.log('[IP Geolocation] Using saved restaurant:', parsed.name || parsed[8]);
      return parsed;
    } catch (error) {
      console.error('[IP Geolocation] Error parsing saved restaurant:', error);
      localStorage.removeItem('selectedRestaurant');
    }
  }

  if (!restaurants || !restaurants.length) {
    console.warn('[IP Geolocation] No restaurants available');
    return null;
  }

  // 2. Try IP-based city detection - find CLOSEST restaurant in user's city
  const userLocation = await getUserCityFromIP();
  if (userLocation && userLocation.city && userLocation.latitude && userLocation.longitude) {
    const cityRestaurants = restaurants.filter(r => {
      const restaurantCity = r.city || r[3];
      const normalizedRestCity = normalizeCityName(restaurantCity);
      const normalizedUserCity = normalizeCityName(userLocation.city);
      return normalizedRestCity === normalizedUserCity;
    });

    if (cityRestaurants.length > 0) {
      // Find the CLOSEST restaurant in the city based on coordinates
      let closestRestaurant = cityRestaurants[0];
      let minDistance = Infinity;

      cityRestaurants.forEach(restaurant => {
        const restLat = restaurant.latitude || restaurant[4];
        const restLng = restaurant.longitude || restaurant[5];
        
        if (typeof restLat === 'number' && typeof restLng === 'number') {
          const distance = getDistance(userLocation.latitude, userLocation.longitude, restLat, restLng);
          if (distance < minDistance) {
            minDistance = distance;
            closestRestaurant = restaurant;
          }
        }
      });

      console.log('[IP Geolocation] Auto-selected CLOSEST restaurant from user city:', closestRestaurant.name || closestRestaurant[8], `(${minDistance.toFixed(2)} km away)`);
      return closestRestaurant;
    }
  }

  // 3. Fall back to default restaurant UUID (LAST RESORT - only when IP detection fails completely)
  console.warn('[IP Geolocation] ⚠️ Using UUID fallback (last resort) - IP detection failed or no city match');
  const defaultRestaurant = getDefaultRestaurant(restaurants);
  return defaultRestaurant;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

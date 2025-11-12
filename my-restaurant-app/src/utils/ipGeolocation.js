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
 * Get the default fallback restaurant by ID
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Object | null} - Default restaurant or null
 */
export function getDefaultRestaurant(restaurants) {
  if (!restaurants || !restaurants.length) {
    return null;
  }

  const defaultRestaurant = restaurants.find(restaurant => {
    const restaurantId = restaurant.restaurant_id || restaurant[0]; // Handle both formats
    return restaurantId === DEFAULT_RESTAURANT_ID;
  });

  if (defaultRestaurant) {
    console.log('[IP Geolocation] Using default fallback restaurant:', defaultRestaurant.name || defaultRestaurant[8]);
  } else {
    console.warn('[IP Geolocation] Default restaurant ID not found, using first restaurant');
  }

  return defaultRestaurant || restaurants[0]; // Return first restaurant if default not found
}

/**
 * Select restaurant with fallback logic:
 * 1. Check if user already selected a restaurant
 * 2. Try to get user's city from IP and find matching restaurant
 * 3. Fall back to default restaurant ID
 * 
 * @param {Array} restaurants - Array of available restaurants
 * @returns {Promise<Object | null>} - Selected restaurant or null
 */
export async function selectRestaurantWithFallback(restaurants) {
  // 1. Check if restaurant already selected
  const savedRestaurant = localStorage.getItem('selectedRestaurant');
  if (savedRestaurant) {
    try {
      return JSON.parse(savedRestaurant);
    } catch (error) {
      console.error('[IP Geolocation] Error parsing saved restaurant:', error);
      localStorage.removeItem('selectedRestaurant');
    }
  }

  if (!restaurants || !restaurants.length) {
    console.warn('[IP Geolocation] No restaurants available');
    return null;
  }

  // 2. Try IP-based city detection
  const userLocation = await getUserCityFromIP();
  if (userLocation && userLocation.city) {
    const cityRestaurant = findRestaurantInCity(restaurants, userLocation.city);
    if (cityRestaurant) {
      console.log('[IP Geolocation] Auto-selected restaurant from user city');
      return cityRestaurant;
    }
  }

  // 3. Fall back to default restaurant
  const defaultRestaurant = getDefaultRestaurant(restaurants);
  console.log('[IP Geolocation] Using fallback restaurant selection');
  return defaultRestaurant;
}

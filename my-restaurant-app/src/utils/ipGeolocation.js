/**
 * IP Geolocation utilities for automatic city detection
 */

const DEFAULT_RESTAURANT_ID = "001a5b8a-e149-48da-83e6-ffb5772b144c";

/**
 * Helper function to parse opening hours from string format
 */
export function parseOpeningHours(openingHoursData) {
  if (!openingHoursData) return {};
  
  if (typeof openingHoursData === 'object' && !Array.isArray(openingHoursData)) {
    return openingHoursData;
  }
  
  if (typeof openingHoursData === 'string') {
    try {
      const jsonStr = openingHoursData
        .replace(/'/g, '"')
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('[Opening Hours] Error parsing:', error);
      return {};
    }
  }
  
  return {};
}

/**
 * Check if restaurant is currently open
 */
export function isRestaurantOpen(restaurant) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[gmt3.getDay()];
  
  const hours = parseOpeningHours(restaurant.opening_hours || restaurant[6]);
  const todayHours = hours[currentDay];
  
  if (!todayHours) return false;
  
  try {
    const [openTime, closeTime] = todayHours.split('-');
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const currentMinutes = gmt3.getHours() * 60 + gmt3.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    let closeMinutes = closeHour * 60 + closeMin;
    
    if (closeMinutes < openMinutes) {
      closeMinutes += 24 * 60;
      if (currentMinutes < openMinutes) {
        return currentMinutes >= 0 && currentMinutes < closeMinutes - 24 * 60;
      }
    }
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch (error) {
    console.error('[Opening Hours] Error checking status:', error);
    return false;
  }
}

/**
 * Get next opening time for restaurants
 */
export function getNextOpenTime(restaurants) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysInBulgarian = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(gmt3.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const checkDay = days[checkDate.getDay()];
    const checkDayBulgarian = daysInBulgarian[checkDate.getDay()];
    
    for (const restaurant of restaurants) {
      const hours = parseOpeningHours(restaurant.opening_hours || restaurant[6]);
      const dayHours = hours[checkDay];
      
      if (dayHours) {
        const [openTime] = dayHours.split('-');
        if (dayOffset === 0) {
          const [openHour, openMin] = openTime.split(':').map(Number);
          const openMinutes = openHour * 60 + openMin;
          const currentMinutes = gmt3.getHours() * 60 + gmt3.getMinutes();
          if (openMinutes > currentMinutes) {
            return `${checkDayBulgarian} в ${openTime}`;
          }
        } else {
          return `${checkDayBulgarian} в ${openTime}`;
        }
      }
    }
  }
  return null;
}

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

  // Helper function to normalize city name for comparison
  const normalizeCityName = (city) => {
    if (!city) return '';
    return city
      .toLowerCase()
      .replace(/[\s-]+/g, '') // Remove spaces and hyphens
      .replace(/^(city of|grad|г\.|гр\.)/i, '') // Remove common prefixes
      .trim();
  };

  // 2. Try IP-based city detection - find CLOSEST OPEN restaurant within 20 km radius
  const MAX_RADIUS_KM = 20;
  const SAME_CITY_ASSUMED_DISTANCE = 3; // Assume restaurants in same city without coords are ~3km away
  const userLocation = await getUserCityFromIP();
  
  if (userLocation && userLocation.city && userLocation.latitude && userLocation.longitude) {
    const userCity = userLocation.city;
    console.log('[IP Geolocation] User city detected:', userCity);
    
    // First, try to find CLOSEST OPEN restaurant (considering both coords and same-city restaurants)
    const openRestaurants = restaurants.filter(r => isRestaurantOpen(r));
    
    // Build a list of all open restaurants with their distances
    const restaurantsWithDistance = [];
    
    openRestaurants.forEach(restaurant => {
      const restLat = parseFloat(restaurant.latitude || restaurant[4]);
      const restLng = parseFloat(restaurant.longitude || restaurant[5]);
      const hasCoords = !isNaN(restLat) && !isNaN(restLng);
      const restaurantCity = restaurant.city || restaurant[3];
      const isSameCity = userCity && restaurantCity && 
        normalizeCityName(userCity) === normalizeCityName(restaurantCity);
      
      if (hasCoords) {
        const distance = getDistance(userLocation.latitude, userLocation.longitude, restLat, restLng);
        restaurantsWithDistance.push({ restaurant, distance, hasCoords: true, isSameCity });
      } else if (isSameCity) {
        // Restaurant is in the same city but no coordinates - assume it could be close
        restaurantsWithDistance.push({ 
          restaurant, 
          distance: SAME_CITY_ASSUMED_DISTANCE, 
          hasCoords: false, 
          isSameCity: true,
          estimatedDistance: true 
        });
        console.log(`[IP Geolocation] Same-city restaurant without coords: ${restaurant.name || restaurant[8]} - estimated at ${SAME_CITY_ASSUMED_DISTANCE}km`);
      }
    });
    
    // Sort by distance (closest first)
    restaurantsWithDistance.sort((a, b) => a.distance - b.distance);
    
    console.log('[IP Geolocation] Open restaurants with distance:', 
      restaurantsWithDistance.map(r => `${r.restaurant.name || r.restaurant[8]}: ${r.distance.toFixed(2)}km (coords: ${r.hasCoords}, sameCity: ${r.isSameCity})`));
    
    // Find the closest open restaurant
    if (restaurantsWithDistance.length > 0) {
      const closest = restaurantsWithDistance[0];
      
      // Check if there's a same-city restaurant that might be closer than the one with coords
      if (closest.hasCoords && closest.distance > 5) {
        const sameCityRestaurant = restaurantsWithDistance.find(r => r.isSameCity && !r.hasCoords);
        if (sameCityRestaurant) {
          console.log('[IP Geolocation] Found same-city restaurant without coords that might be closer:', 
            sameCityRestaurant.restaurant.name || sameCityRestaurant.restaurant[8]);
          return sameCityRestaurant.restaurant;
        }
      }
      
      if (closest.distance <= MAX_RADIUS_KM) {
        console.log('[IP Geolocation] Auto-selected CLOSEST OPEN restaurant:', 
          closest.restaurant.name || closest.restaurant[8], 
          `(${closest.distance.toFixed(2)} km away, coords: ${closest.hasCoords}) ✓ OPEN`);
        return closest.restaurant;
      }
    }

    // No open restaurants within range - Find CLOSEST restaurant (open or closed)
    const allRestaurantsWithDistance = [];
    
    restaurants.forEach(restaurant => {
      const restLat = parseFloat(restaurant.latitude || restaurant[4]);
      const restLng = parseFloat(restaurant.longitude || restaurant[5]);
      const hasCoords = !isNaN(restLat) && !isNaN(restLng);
      const restaurantCity = restaurant.city || restaurant[3];
      const isSameCity = userCity && restaurantCity && 
        normalizeCityName(userCity) === normalizeCityName(restaurantCity);
      
      if (hasCoords) {
        const distance = getDistance(userLocation.latitude, userLocation.longitude, restLat, restLng);
        if (distance <= MAX_RADIUS_KM) {
          allRestaurantsWithDistance.push({ restaurant, distance, hasCoords: true, isSameCity });
        }
      } else if (isSameCity) {
        allRestaurantsWithDistance.push({ 
          restaurant, 
          distance: SAME_CITY_ASSUMED_DISTANCE, 
          hasCoords: false, 
          isSameCity: true,
          estimatedDistance: true 
        });
      }
    });
    
    // Sort by distance
    allRestaurantsWithDistance.sort((a, b) => a.distance - b.distance);
    
    if (allRestaurantsWithDistance.length > 0) {
      const closest = allRestaurantsWithDistance[0];
      console.log('[IP Geolocation] Auto-selected CLOSEST restaurant (currently closed):', 
        closest.restaurant.name || closest.restaurant[8], 
        `(${closest.distance.toFixed(2)} km away) ✗ CLOSED`);
      return closest.restaurant;
    }

    console.warn('[IP Geolocation] No restaurants found within 20km radius of user location');
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

import { useState, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker as GoogleMarker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Navigation, Store, Truck, ArrowLeft } from "lucide-react";
import { API_URL } from '@/config/api';
import { fetchWithAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { t } from "@/utils/translations";
import { openInMaps } from "@/utils/mapsHelper";

// Google Maps Autocomplete Component
function GoogleMapsAutocomplete({ onLocationSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
    language: "bg", // Force Bulgarian language
    region: "BG", // Prefer Bulgarian results
  });

  if (!isLoaded) return <div className="p-4 text-center">{t('common.loading')}</div>;
  return <GoogleMap_Component onLocationSelect={onLocationSelect} />;
}

function GoogleMap_Component({ onLocationSelect }) {
  const center = { lat: 42.6977, lng: 23.3219 }; // Sofia, Bulgaria
  const [selected, setSelected] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [showPickButton, setShowPickButton] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect if device is desktop (has mouse/keyboard)
  useEffect(() => {
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    setIsDesktop(hasHover && hasPointer);
  }, []);

  // Function to normalize address by removing special characters except commas
  const normalizeAddress = (address) => {
    if (!address) return "";
    // Remove quotes and special brackets, but preserve Unicode letters (including Cyrillic), numbers, spaces, commas, dots, hyphens
    // Note: \p{L} matches any Unicode letter, \p{N} matches any Unicode number
    return address
      .replace(/['"„"«»]/g, '')  // Remove various types of quotes
      .replace(/[^\p{L}\p{N}\s,.\-–—/]/gu, '')  // Keep Unicode letters, numbers, spaces, commas, dots, hyphens, slashes
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .trim();
  };

  // Function to save location to session storage and trigger parent callback
  const saveLocationToSession = (locationData) => {
    const normalizedLocation = {
      address: normalizeAddress(locationData.address),
      latitude: locationData.lat,
      longitude: locationData.lng
    };

    console.log("Saving normalized location:", normalizedLocation);

    // Save to session storage
    sessionStorage.setItem('delivery_address', normalizedLocation.address);
    sessionStorage.setItem('delivery_coordinates', JSON.stringify({
      latitude: normalizedLocation.latitude,
      longitude: normalizedLocation.longitude
    }));

    // Trigger parent callback with coordinates for restaurant finding
    onLocationSelect([normalizedLocation.latitude, normalizedLocation.longitude]);

    return normalizedLocation;
  };

  // Handle picking the current address
  const handlePickAddress = () => {
    if (pendingLocation) {
      saveLocationToSession(pendingLocation);
      setShowPickButton(false);
    } else {
      // If no pending location but there's text in the input, try to geocode it
      if (inputValue?.trim()) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: inputValue }, (results, status) => {
          if (status === "OK" && results[0]) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();

            const locationData = {
              lat,
              lng,
              address: inputValue
            };

            saveLocationToSession(locationData);
            setSelected({ lat, lng, address: inputValue });
            setShowPickButton(false);
          } else {
            console.error("Geocoder failed due to:", status);
          }
        });
      }
    }
  };

  // Handle map clicks
  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    console.log("Dropped pin at:", { lat, lng });

    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const rawAddress = results[0].formatted_address;
        console.log("Raw address for dropped pin:", rawAddress);

        const locationData = {
          lat,
          lng,
          address: rawAddress
        };

        // Set pending location and show pick button instead of saving immediately
        setPendingLocation(locationData);
        setSelected({ lat, lng, address: rawAddress });
        setInputValue(rawAddress);
        setShowPickButton(true);
      } else {
        console.error("Geocoder failed due to:", status);
      }
    });
  };

  // Handle scroll on map to show hint
  const handleMapScroll = (e) => {
    if (!isDesktop) return;

    // Check if Ctrl key is pressed
    if (e.ctrlKey || e.metaKey) {
      // User is zooming correctly, hide hint
      setShowScrollHint(false);
    } else {
      // User is scrolling without Ctrl, show hint
      setShowScrollHint(true);
      // Auto-hide after 2 seconds
      setTimeout(() => setShowScrollHint(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="places-container relative w-full max-w-full">
        <PlacesAutocomplete
          setSelected={setSelected}
          setPendingLocation={setPendingLocation}
          setShowPickButton={setShowPickButton}
          pendingLocation={pendingLocation}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
        {/* Pick Address Button with fade animation */}
        <div className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-10 ${showPickButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}>
          <Button
            onClick={handlePickAddress}
            size="default"
            className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium shadow-lg whitespace-nowrap"
          >
            {t('common.select') || 'Избери'}
          </Button>
        </div>
      </div>

      <div
        className="w-full max-w-full overflow-hidden border border-t-0 relative"
        onWheel={handleMapScroll}
      >
        <GoogleMap
          zoom={12}
          center={selected || center}
          mapContainerClassName="w-full max-w-full h-[250px] sm:h-[400px] touch-pan-y"
          onClick={handleMapClick}
          options={{
            gestureHandling: 'cooperative', // Enable Ctrl+scroll zoom with tooltip
            scrollwheel: true, // Allow scrolling when Ctrl is held
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            keyboardShortcuts: false,
            language: "bg", // Bulgarian language for map labels
            region: "BG", // Bulgarian region preference
            restriction: {
              latLngBounds: {
                north: 44.5, // Northern Bulgaria border
                south: 41.2, // Southern Bulgaria border  
                west: 22.3, // Western Bulgaria border
                east: 28.6, // Eastern Bulgaria border
              },
              strictBounds: false, // Allow some flexibility
            }
          }}
        >
          {selected && <GoogleMarker position={selected} />}
        </GoogleMap>
        {/* Map scroll hint - only on desktop when scrolling without Ctrl */}
        {isDesktop && showScrollHint && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-md pointer-events-none animate-in fade-in duration-200 z-10">
            Задръжте Ctrl + скролване за увеличаване
          </div>
        )}
      </div>
    </div>
  );
}

const PlacesAutocomplete = ({ setSelected, setPendingLocation, setShowPickButton, pendingLocation, inputValue, setInputValue }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    defaultValue: "",
    requestOptions: {
      componentRestrictions: { country: "bg" }, // Restrict to Bulgaria
      language: "bg", // Request results in Bulgarian
    },
  });

  // Sync internal value with external inputValue state
  useEffect(() => {
    if (inputValue !== value) {
      setValue(inputValue, false);
    }
  }, [inputValue, setValue, value]);

  // Update input value when pendingLocation changes (from map clicks)
  useEffect(() => {
    if (pendingLocation?.address && inputValue !== pendingLocation.address) {
      setInputValue(pendingLocation.address);
    }
  }, [pendingLocation, setInputValue, inputValue]);

  const handleSelect = async (address) => {
    setValue(address, false);
    setInputValue(address);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      console.log("Raw selected address:", address);

      const locationData = {
        lat,
        lng,
        address
      };

      // Set pending location and show pick button instead of saving immediately
      setPendingLocation(locationData);
      setSelected({ lat, lng, address });
      setShowPickButton(true);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Handle manual typing in the input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setInputValue(newValue);

    // Show pick button if there's text
    if (newValue.trim()) {
      setShowPickButton(true);
      // Clear pending location if user is typing something different
      if (pendingLocation && newValue !== pendingLocation.address) {
        setPendingLocation(null);
      }
    } else {
      setShowPickButton(false);
      setPendingLocation(null);
    }
  };

  return (
    <Combobox onSelect={handleSelect} className="relative w-full max-w-full">
      <ComboboxInput
        value={value}
        onChange={handleInputChange}
        disabled={!ready}
        className="w-full max-w-full p-2 sm:p-4 pr-16 sm:pr-24 text-sm sm:text-lg border border-gray-300 rounded-t-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent bg-white shadow-sm overflow-x-auto whitespace-nowrap box-border"
        placeholder={t('restaurantSelector.searchAddress') || 'Търсете адрес в България...'}
      />
      <ComboboxPopover
        className="absolute z-50 w-full max-w-full bg-white 
                   border border-gray-300 rounded-lg shadow-lg mt-2"
        portal={false}
      >
        <ComboboxList
          className="max-h-64 overflow-auto"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption
                key={place_id}
                value={description}
                className="p-4 text-base cursor-pointer hover:bg-gray-100 
                           border-b border-gray-100 last:border-b-0 transition-colors"
              />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};

export default function RestaurantSelector({
  open,
  onClose,
  onSelect,
}) {
  // Restaurant data state
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main flow states
  const [currentStep, setCurrentStep] = useState('delivery-method'); // 'delivery-method', 'address-input', 'city-selection', 'restaurant-selection'
  const [deliveryMethod, setDeliveryMethod] = useState(''); // 'pickup' or 'delivery'
  const [selectedCity, setSelectedCity] = useState(null);

  // Address and location states
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

  // Confirmation dialog state for distance warning
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);
  const [pendingRestaurantSelection, setPendingRestaurantSelection] = useState(null);
  const [pendingDistance, setPendingDistance] = useState(null);

  // Location permission pre-prompt
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Fetch restaurants when component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`)
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        const data = await response.json()
        setRestaurants(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching restaurants:', err)
      } finally {
        setLoading(false)
      }
    }

    // Check if restaurant is already selected
    const selectedRestaurant = localStorage.getItem('selectedRestaurant')
    if (!selectedRestaurant && open) {
      fetchRestaurants()
    } else if (selectedRestaurant) {
      setLoading(false)
    }
  }, [open])

  // Get unique cities from restaurants
  const cities = [...new Set(restaurants.map(restaurant => restaurant.city))].sort();
  // Filter restaurants by selected city
  const filteredRestaurants = selectedCity
    ? restaurants.filter(restaurant => restaurant.city === selectedCity)
    : restaurants;

  // Reset states when modal closes
  const handleClose = () => {
    // Allow closing without selection now
    setCurrentStep('delivery-method');
    setDeliveryMethod('');
    setAddressError('');
    setSelectedCity(null);
    setShowDistanceWarning(false);
    setPendingRestaurantSelection(null);
    setPendingDistance(null);
    onClose();
  };

  // Helper to calculate distance between two coordinates (Haversine formula)
  function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
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

  // Helper function to parse opening hours from string format
  function parseOpeningHours(openingHoursData) {
    if (!openingHoursData) return {};

    // If it's already an object, return it
    if (typeof openingHoursData === 'object' && !Array.isArray(openingHoursData)) {
      return openingHoursData;
    }

    // If it's a string, parse it (handles Python dict format like "{'Friday': '10:00-03:00'}")
    if (typeof openingHoursData === 'string') {
      try {
        // Replace single quotes with double quotes for valid JSON
        const jsonString = openingHoursData
          .replace(/'/g, '"')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        return JSON.parse(jsonString);
      } catch (error) {
        console.error("Error parsing opening hours string:", error, openingHoursData);
        return {};
      }
    }

    return {};
  }

  // Check if restaurant is currently open
  function isRestaurantOpen(restaurant) {
    // Get current time in GMT+3
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const gmt3 = new Date(utc + 3 * 3600000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[gmt3.getDay()];

    // Parse opening hours (handles both object and string formats)
    const hours = parseOpeningHours(restaurant.opening_hours);
    const todayHours = hours[currentDay];

    console.log(`[isRestaurantOpen] Restaurant: ${restaurant.name}, Day: ${currentDay}, Hours: ${todayHours}`);

    if (!todayHours) return false;

    try {
      // Format: "09:00-18:00" or "10:00-03:00" (crosses midnight)
      const [open, close] = todayHours.split("-");
      const [openH, openM] = open.split(":").map(Number);
      const [closeH, closeM] = close.split(":").map(Number);

      const currentTime = gmt3.getHours() * 60 + gmt3.getMinutes(); // Current time in minutes
      const openTime = openH * 60 + openM; // Opening time in minutes
      const closeTime = closeH * 60 + closeM; // Closing time in minutes

      // Check if the restaurant closes the next day (e.g., 10:00-03:00)
      if (closeTime < openTime) {
        // Restaurant is open if current time is after opening OR before closing (next day)
        return currentTime >= openTime || currentTime <= closeTime;
      } else {
        // Normal case: restaurant opens and closes on the same day
        return currentTime >= openTime && currentTime <= closeTime;
      }
    } catch (error) {
      console.error("Error parsing restaurant hours:", error);
      return false;
    }
  }

  // Helper function to normalize city name for comparison
  function normalizeCityName(city) {
    if (!city) return '';
    return city
      .toLowerCase()
      .replace(/[\s-]+/g, '') // Remove spaces and hyphens
      .replace(/^(city of|grad|г\.|гр\.)/i, '') // Remove common prefixes
      .trim();
  }

  // Find closest restaurant (open or closed) by coordinates
  // userCity parameter is optional - when provided, prioritizes restaurants in the same city
  function findClosestRestaurant(lat, lng, userCity = null) {
    if (!restaurants.length) return { restaurant: null, distance: null, message: null, isOpen: false };

    const MAX_RADIUS_KM = 7.5; // Maximum radius to search for restaurants
    const SAME_CITY_ASSUMED_DISTANCE = 3; // Assume restaurants in same city without coords are ~3km away

    // First, try to find CLOSEST open restaurant within MAX_RADIUS_KM radius
    const openRestaurants = restaurants.filter(r => isRestaurantOpen(r));

    console.log(`[findClosestRestaurant] Found ${openRestaurants.length} open restaurants out of ${restaurants.length} total`);
    console.log(`[findClosestRestaurant] User city detected: ${userCity || 'unknown'}`);

    // Build a list of all open restaurants with their distances
    // For restaurants without coordinates but in the same city, estimate distance
    const restaurantsWithDistance = [];

    for (const r of openRestaurants) {
      const rLat = parseFloat(r.latitude);
      const rLng = parseFloat(r.longitude);
      const hasCoords = !isNaN(rLat) && !isNaN(rLng);
      const isSameCity = userCity && r.city && 
        normalizeCityName(userCity) === normalizeCityName(r.city);

      if (hasCoords) {
        const dist = getDistance(lat, lng, rLat, rLng);
        restaurantsWithDistance.push({ restaurant: r, distance: dist, hasCoords: true, isSameCity });
      } else if (isSameCity) {
        // Restaurant is in the same city but no coordinates - assume it could be close
        restaurantsWithDistance.push({ 
          restaurant: r, 
          distance: SAME_CITY_ASSUMED_DISTANCE, 
          hasCoords: false, 
          isSameCity: true,
          estimatedDistance: true 
        });
        console.log(`[findClosestRestaurant] Same-city restaurant without coords: ${r.name} (${r.city}) - estimated at ${SAME_CITY_ASSUMED_DISTANCE}km`);
      }
    }

    // Sort by distance (closest first)
    restaurantsWithDistance.sort((a, b) => a.distance - b.distance);

    console.log(`[findClosestRestaurant] Restaurants with distance:`, 
      restaurantsWithDistance.map(r => `${r.restaurant.name}: ${r.distance.toFixed(2)}km (coords: ${r.hasCoords}, sameCity: ${r.isSameCity})`));

    // Find the closest open restaurant
    if (restaurantsWithDistance.length > 0) {
      const closest = restaurantsWithDistance[0];

      // Check if there's a same-city restaurant that might be closer than the one with coords
      // If the closest restaurant with coords is far (>5km) but there's a same-city restaurant without coords,
      // prefer the same-city one as it's likely closer
      if (closest.hasCoords && closest.distance > 5 && userCity) {
        const sameCityRestaurant = restaurantsWithDistance.find(r => r.isSameCity && !r.hasCoords);
        if (sameCityRestaurant) {
          console.log(`[Restaurant Selection] Found same-city restaurant without coords that might be closer: ${sameCityRestaurant.restaurant.name}`);
          return { 
            restaurant: sameCityRestaurant.restaurant, 
            distance: sameCityRestaurant.distance, 
            message: null, 
            isOpen: true,
            estimatedDistance: true
          };
        }
      }

      // If closest is within MAX_RADIUS_KM, select it
      if (closest.distance <= MAX_RADIUS_KM) {
        console.log(`[Restaurant Selection] Selected CLOSEST open restaurant within ${MAX_RADIUS_KM}km: ${closest.restaurant.name} at ${closest.distance.toFixed(2)} km (coords: ${closest.hasCoords})`);
        return { restaurant: closest.restaurant, distance: closest.distance, message: null, isOpen: true, estimatedDistance: closest.estimatedDistance };
      } else if (closest.distance > MAX_RADIUS_KM && closest.distance <= 15) {
        // Warn about distant restaurant (between MAX_RADIUS_KM and 15 km)
        console.log(`[Restaurant Selection] CLOSEST open restaurant is DISTANT: ${closest.restaurant.name} at ${closest.distance.toFixed(2)} km`);
        return {
          restaurant: closest.restaurant,
          distance: closest.distance,
          isOpen: true,
          message: t('restaurantSelector.distanceWarningMessage', { name: closest.restaurant.name, distance: closest.distance.toFixed(1) })
        };
      } else {
        // Closest open restaurant is too far (> 15 km)
        console.log(`[Restaurant Selection] CLOSEST open restaurant is TOO FAR: ${closest.restaurant.name} at ${closest.distance.toFixed(2)} km`);
      }
    }

    // No open restaurants within reasonable distance - Find the CLOSEST restaurant within MAX_RADIUS_KM (regardless of status) for menu browsing
    const allRestaurantsWithDistance = [];

    for (const r of restaurants) {
      const rLat = parseFloat(r.latitude);
      const rLng = parseFloat(r.longitude);
      const hasCoords = !isNaN(rLat) && !isNaN(rLng);
      const isSameCity = userCity && r.city && 
        normalizeCityName(userCity) === normalizeCityName(r.city);

      if (hasCoords) {
        const dist = getDistance(lat, lng, rLat, rLng);
        if (dist <= MAX_RADIUS_KM) {
          allRestaurantsWithDistance.push({ restaurant: r, distance: dist, hasCoords: true, isSameCity });
        }
      } else if (isSameCity) {
        // Same city without coords - include as potential option
        allRestaurantsWithDistance.push({ 
          restaurant: r, 
          distance: SAME_CITY_ASSUMED_DISTANCE, 
          hasCoords: false, 
          isSameCity: true,
          estimatedDistance: true 
        });
      }
    }

    // Sort by distance
    allRestaurantsWithDistance.sort((a, b) => a.distance - b.distance);

    // If we found a restaurant within range, return it for menu browsing
    if (allRestaurantsWithDistance.length > 0) {
      const closest = allRestaurantsWithDistance[0];
      const nextOpenTime = getNextOpenTime();
      console.log(`[Restaurant Selection] All restaurants closed. Selected CLOSEST: ${closest.restaurant.name} at ${closest.distance.toFixed(2)} km`);
      return {
        restaurant: closest.restaurant,
        distance: closest.distance,
        isOpen: false,
        message: t('restaurantSelector.noRestaurantsOpenInRadius', { radius: MAX_RADIUS_KM }) + ' ' + (nextOpenTime ? `${t('restaurantSelector.nextOpening')} ${nextOpenTime}` : t('restaurantSelector.checkBackLater')),
        allowBrowsing: true,
        estimatedDistance: closest.estimatedDistance
      };
    }

    // No restaurants found within MAX_RADIUS_KM radius - this is now the last resort
    console.log(`[Restaurant Selection] No restaurants found within ${MAX_RADIUS_KM}km radius`);
    return {
      restaurant: null,
      distance: null,
      isOpen: false,
      message: `No restaurants found within ${MAX_RADIUS_KM}km of your location. Please try a different address or manually select a restaurant.`,
      allowBrowsing: false
    };
  }

  // Helper function to get next opening time
  function getNextOpenTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const gmt3 = new Date(utc + 3 * 3600000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Check today and next few days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(gmt3);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dayName = days[checkDate.getDay()];

      for (const restaurant of restaurants) {
        // Parse opening hours using the helper function
        const hours = parseOpeningHours(restaurant.opening_hours);
        const dayHours = hours[dayName];

        if (dayHours) {
          try {
            const [open] = dayHours.split("-");
            const [openH, openM] = open.split(":").map(Number);
            const openTime = new Date(checkDate);
            openTime.setHours(openH, openM, 0, 0);

            // If it's today, make sure the opening time is in the future
            if (dayOffset === 0 && openTime <= gmt3) continue;

            if (dayOffset === 0) {
              return t('restaurantSelector.todayAt', { time: open });
            } else if (dayOffset === 1) {
              return t('restaurantSelector.tomorrowAt', { time: open });
            } else {
              return t('restaurantSelector.dayAt', { day: dayName, time: open });
            }
          } catch {
            continue;
          }
        }
      }
    }
    return null;
  }



  async function handleDeviceLocation() {
    // Show the pre-prompt first
    setShowLocationPrompt(true);
  }

  async function requestDeviceLocation() {
    setShowLocationPrompt(false);
    setAddressError("");
    setAddressLoading(true);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setAddressError("Геолокацията не се поддържа от вашия браузър.");
      setAddressLoading(false);
      return;
    }

    // Check if we're on HTTPS or localhost (required for iOS)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      setAddressError("Геолокацията изисква сигурна връзка (HTTPS).");
      setAddressLoading(false);
      return;
    }

    // Options for better iOS compatibility
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0 // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("Got device location:", { latitude, longitude });

        // Save location in sessionStorage if delivery
        let userCity = null;
        if (deliveryMethod === 'delivery') {
          // Try to reverse geocode if possible, else save as 'Device Location'
          let deviceAddress = 'Device Location';
          try {
            if (window && window.fetch) {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=bg`);
              const data = await res.json();
              if (data && data.display_name) deviceAddress = data.display_name;
              // Extract city from reverse geocoding response
              if (data && data.address) {
                userCity = data.address.city || data.address.town || data.address.village || data.address.municipality;
                console.log("[Device Location] Detected user city:", userCity);
              }
            }
          } catch (error) {
            console.log('Error reverse geocoding:', error);
          }
          sessionStorage.setItem('delivery_address', deviceAddress);
          sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: latitude, lng: longitude }));
          sessionStorage.setItem('delivery_method', 'delivery');
          if (userCity) {
            sessionStorage.setItem('user_city', userCity);
          }
        } else {
          sessionStorage.setItem('delivery_method', 'pickup');
          // For pickup, also try to get user city for better restaurant suggestions
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=bg`);
            const data = await res.json();
            if (data && data.address) {
              userCity = data.address.city || data.address.town || data.address.village || data.address.municipality;
              console.log("[Device Location - Pickup] Detected user city:", userCity);
              if (userCity) {
                sessionStorage.setItem('user_city', userCity);
              }
            }
          } catch (error) {
            console.log('Error reverse geocoding for pickup:', error);
          }
        }
        const result = findClosestRestaurant(latitude, longitude, userCity);
        if (result.restaurant) {
          if (result.message) {
            setPendingRestaurantSelection(result.restaurant);
            setPendingDistance(result.distance);

            // Differentiate between open-but-far vs closed restaurants
            if (result.isOpen) {
              // Open but far away - show distance warning
              setShowDistanceWarning(true);
              setAddressError(result.message);
            } else {
              // Closed restaurant - show browse menu option
              setShowDistanceWarning(false);
              setAddressError(result.message);
            }
          } else {
            onSelect(result.restaurant);
            handleClose();
          }
        } else {
          setAddressError(result.message || "No restaurants found near your location.");
        }
        setAddressLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Не успяхме да получим локацията ви.";
        let detailedInstructions = "";

        switch (error.code) {
          case error.PERMISSION_DENIED: {
            // Detect iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
              errorMessage = "Достъпът до локацията е отказан.";
              detailedInstructions = `
За да активирате локацията на iPhone/iPad:
1. Отворете Настройки → Safari (или Chrome)
2. Натиснете "Местоположение"
3. Изберете "Питай следващия път" или "При използване на приложението"
4. Опреснете страницата и опитайте отново
              `.trim();
            } else {
              errorMessage = "Моля, разрешете достъп до локацията във вашите настройки на браузъра.";
            }
            break;
          }
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Информацията за локацията не е налична.";
            break;
          case error.TIMEOUT:
            errorMessage = "Заявката за локация изтече. Моля, опитайте отново.";
            break;
        }

        setAddressError(errorMessage + (detailedInstructions ? '\n\n' + detailedInstructions : ''));
        setAddressLoading(false);
      },
      options
    );
  }

  async function handleGoogleMapLocationSelect(coords) {
    // Google Maps callback - coordinates are already saved by the Google Maps component
    // Just set the method and find closest restaurant
    if (deliveryMethod === 'delivery') {
      sessionStorage.setItem('delivery_method', 'delivery');
    } else {
      sessionStorage.setItem('delivery_method', 'pickup');
    }

    setAddressError(""); // Clear any previous errors
    
    // Try to get the user's city from reverse geocoding for better restaurant matching
    let userCity = sessionStorage.getItem('user_city');
    if (!userCity) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&accept-language=bg`);
        const data = await res.json();
        if (data && data.address) {
          userCity = data.address.city || data.address.town || data.address.village || data.address.municipality;
          console.log("[Google Maps Location] Detected user city:", userCity);
          if (userCity) {
            sessionStorage.setItem('user_city', userCity);
          }
        }
      } catch (error) {
        console.log('Error getting user city from coords:', error);
      }
    }
    
    const result = findClosestRestaurant(coords[0], coords[1], userCity);
    if (result.restaurant) {
      if (result.message) {
        setPendingRestaurantSelection(result.restaurant);
        setPendingDistance(result.distance);

        // Differentiate between open-but-far vs closed restaurants
        if (result.isOpen) {
          // Open but far away - show distance warning
          setShowDistanceWarning(true);
          setAddressError(result.message);
        } else {
          // Closed restaurant - show browse menu option
          setShowDistanceWarning(false);
          setAddressError(result.message);
        }
      } else {
        onSelect(result.restaurant);
        handleClose();
      }
    } else {
      setAddressError(result.message || "No restaurants found near this location.");
    }
  }

  function handleDeliveryMethodSelect(method) {
    setDeliveryMethod(method);
    setCurrentStep('address-input');
  }

  function handleBackToDeliveryMethod() {
    setCurrentStep('delivery-method');
    setDeliveryMethod('');
    setAddressError('');
    setShowDistanceWarning(false);
    setPendingRestaurantSelection(null);
    setPendingDistance(null);
  }

  function handleManualRestaurantSelect() {
    setCurrentStep('city-selection');
  }

  function handleConfirmDistantRestaurant() {
    if (pendingRestaurantSelection) {
      onSelect(pendingRestaurantSelection);
      setShowDistanceWarning(false);
      setPendingRestaurantSelection(null);
      setPendingDistance(null);
      setAddressError("");
      handleClose();
    }
  }

  function handleCancelDistantRestaurant() {
    setShowDistanceWarning(false);
    setPendingRestaurantSelection(null);
    setPendingDistance(null);
    setAddressError("Please try a different location or manually select a restaurant.");
  }

  return (
    <>
      {/* Delivery Method Selection Modal */}
      <Dialog open={open && currentStep === 'delivery-method'} onOpenChange={handleClose}>
        <DialogContent className="w-[85vw] sm:w-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">{t('restaurantSelector.howToGetFood')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 sm:gap-8 py-6 sm:py-8">
            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-gray-300"
              onClick={() => handleDeliveryMethodSelect('pickup')}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-blue-100 rounded-full">
                    <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">{t('restaurantSelector.pickup')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">{t('restaurantSelector.pickupDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-gray-300"
              onClick={() => handleDeliveryMethodSelect('delivery')}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-green-100 rounded-full">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">{t('restaurantSelector.delivery')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">{t('restaurantSelector.deliveryDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Input Modal */}
      <Dialog open={open && currentStep === 'address-input'} onOpenChange={handleClose}>
        <DialogContent className="w-[85vw] sm:w-auto sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToDeliveryMethod}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-lg sm:text-2xl md:text-3xl font-bold">
                {deliveryMethod === 'pickup' ? t('restaurantSelector.whereLocated') : t('restaurantSelector.whereDeliver')}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-6 px-4 sm:px-6 md:px-8 pb-4 sm:pb-8 w-full max-w-full overflow-y-auto flex-1">
            {/* Google Maps Container - Always Visible */}
            <div className="w-full max-w-full overflow-hidden">
              <p className="text-xs sm:text-base text-gray-600 text-center font-medium mb-2 sm:mb-4">
                {t('restaurantSelector.searchAddress') || 'Търсете адрес или кликнете на картата'}
              </p>
              <div className="w-full max-w-full overflow-hidden">
                <GoogleMapsAutocomplete onLocationSelect={handleGoogleMapLocationSelect} />
              </div>
            </div>

            {/* Device Location Button */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleDeviceLocation}
              disabled={addressLoading}
              className="w-full py-2 sm:py-4 px-3 sm:px-4 text-xs sm:text-xl flex items-center justify-center gap-2 sm:gap-3 font-medium shadow-sm whitespace-normal sm:whitespace-nowrap text-center"
            >
              <Navigation className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">{t('restaurantSelector.useCurrentLocation') || 'Използай текущата ми локация'}</span>
            </Button>

            {/* Error Message */}
            {addressError && (
              <div className="text-center">
                <div className={`p-2 sm:p-4 rounded-lg mb-2 sm:mb-4 ${showDistanceWarning ? 'text-orange-700 bg-orange-50 border border-orange-200' : 'text-red-500 bg-red-50'
                  }`}>
                  {showDistanceWarning && pendingRestaurantSelection ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="font-semibold text-base sm:text-lg text-orange-800">
                        Предупреждение за разстояние
                      </div>
                      <div className="text-xs sm:text-sm text-orange-700">
                        <p className="mb-2">
                          Най-близкият работещ ресторант <span className="font-semibold">"{pendingRestaurantSelection.name}"</span> е на <span className="font-semibold">{pendingDistance?.toFixed(1)} км</span> от вашето местоположение.
                        </p>
                        <p>
                          Поради разстоянието, таксите за доставка може да бъдат по-високи от обичайното. Искате ли да продължите с този ресторант?
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p>{addressError}</p>
                  )}
                </div>

                {/* Distance Warning Confirmation */}
                {showDistanceWarning && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleCancelDistantRestaurant}
                      className="flex-1 sm:flex-none"
                    >
                      {t('restaurantSelector.tryDifferent') || 'Опитай друго място'}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleConfirmDistantRestaurant}
                      className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                    >
                      {t('restaurantSelector.yesSelect') || 'Да, избери този ресторант'}
                    </Button>
                  </div>
                )}

                {/* No Open Restaurants - Show nearest restaurant for menu browsing */}
                {addressError.includes("No restaurants are currently open") && !showDistanceWarning && (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('restaurantSelector.noRestaurantsOpenDesc')}
                    </p>
                    {pendingRestaurantSelection && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center justify-center gap-2">
                          <Store className="h-5 w-5" />
                          {t('restaurantSelector.nearestRestaurant')}
                        </h4>
                        <p className="text-sm text-blue-800 mb-1">{pendingRestaurantSelection.name}</p>
                        <p className="text-xs text-blue-600 mb-3">
                          {pendingRestaurantSelection.address || 'Address not available'}
                          {pendingDistance && ` - ${pendingDistance.toFixed(1)} km ${t('restaurantSelector.away')}`}
                        </p>
                        <Button
                          variant="default"
                          onClick={() => {
                            onSelect(pendingRestaurantSelection);
                            handleClose();
                            toast.info(t('restaurantSelector.closedRestaurantWarning'));
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {t('restaurantSelector.browseMenu')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Restaurant Selection */}
            {deliveryMethod === 'pickup' && (
              <div className="border-t pt-4 sm:pt-8">
                <p className="text-center text-gray-600 mb-3 sm:mb-6 text-sm sm:text-lg">{t('restaurantSelector.or') || 'или'}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualRestaurantSelect}
                  className="w-full py-2 sm:py-4 text-sm sm:text-xl flex items-center justify-center gap-2 sm:gap-3 font-medium shadow-sm"
                >
                  <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t('restaurantSelector.manuallySelect') || 'Избери ресторант ръчно'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* City Selection Modal */}
      <Dialog open={open && currentStep === 'city-selection'} onOpenChange={handleClose}>
        <DialogContent className="w-[85vw] sm:w-auto sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{t('restaurantSelector.selectCity')}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep('address-input')}
            >
              {t('restaurantSelector.backToAddress')}
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            {loading ? (
              <p className="text-center">{t('common.loading')}</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              cities.map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100"
                  onClick={() => {
                    setSelectedCity(city);
                    setCurrentStep('restaurant-selection');
                  }}
                >
                  <span className="text-lg sm:text-xl font-bold">{city}</span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Restaurant Selection Modal */}
      <Dialog open={open && currentStep === 'restaurant-selection'} onOpenChange={handleClose}>
        <DialogContent className="w-[85vw] sm:w-auto sm:max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pr-10 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold">
              {t('restaurantSelector.selectRestaurant')} {selectedCity}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep('city-selection')}
            >
              {t('restaurantSelector.changeCity')}
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            {loading ? (
              <p className="text-center">{t('common.loading')}</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              filteredRestaurants.map((restaurant) => {
                // Get current time in GMT+3
                const now = new Date();
                const utc = now.getTime() + now.getTimezoneOffset() * 60000;
                const gmt3 = new Date(utc + 3 * 3600000);
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const daysBG = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
                const currentDay = days[gmt3.getDay()];
                const currentDayBG = daysBG[gmt3.getDay()];
                // Parse opening hours properly (handles both string and object formats)
                const hours = parseOpeningHours(restaurant.opening_hours);
                const todayHours = hours[currentDay];
                let isOpen = false;
                let timeText = "Closed";
                let stateBg = "bg-red-100/60 text-red-700";
                if (todayHours) {
                  // Format: "09:00-18:00" or "10:00-03:00" (crosses midnight)
                  const [open, close] = todayHours.split("-");
                  const [openH, openM] = open.split(":").map(Number);
                  const [closeH, closeM] = close.split(":").map(Number);

                  const currentTime = gmt3.getHours() * 60 + gmt3.getMinutes(); // Current time in minutes
                  const openTime = openH * 60 + openM; // Opening time in minutes
                  const closeTime = closeH * 60 + closeM; // Closing time in minutes

                  // Check if the restaurant closes the next day (e.g., 10:00-03:00)
                  if (closeTime < openTime) {
                    // Restaurant is open if current time is after opening OR before closing (next day)
                    isOpen = currentTime >= openTime || currentTime <= closeTime;
                  } else {
                    // Normal case: restaurant opens and closes on the same day
                    isOpen = currentTime >= openTime && currentTime <= closeTime;
                  }

                  if (isOpen) {
                    stateBg = "bg-green-100/60 text-green-700";
                  }
                  timeText = `${open}-${close}`;
                }
                return (
                  <Button
                    key={restaurant.restaurant_id}
                    variant="outline"
                    className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100 relative"
                    onClick={() => {
                      sessionStorage.setItem('delivery_method', 'pickup');
                      onSelect(restaurant);
                      handleClose();
                      const restaurantName = restaurant?.name || 'Unknown Restaurant';
                      toast.success(t('home.restaurantSelected', { name: restaurantName }));
                    }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                      <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                        <span className="text-lg sm:text-xl font-bold text-left">
                          {restaurant.name}
                        </span>
                        <span
                          className="text-sm text-gray-500 text-left hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInMaps(restaurant.address, restaurant.city);
                          }}
                        >
                          {restaurant.address.split(',')[0]}, {restaurant.city}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto">
                        <div className="bg-gray-200/60 rounded-lg px-2 py-1 font-semibold flex items-center gap-2 justify-between sm:justify-end">
                          <span className="whitespace-nowrap">{currentDayBG}: <span className="text-black">{todayHours ? timeText : "Затворено"}</span></span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${stateBg} whitespace-nowrap`}>
                            {isOpen ? t('restaurantSelector.open') : t('restaurantSelector.closed')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Permission Pre-Prompt Dialog */}
      <Dialog open={showLocationPrompt} onOpenChange={setShowLocationPrompt}>
        <DialogContent className="w-[85vw] sm:w-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              Използвай текущата локация
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Navigation className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-center text-gray-700">
              Ще използваме вашата локация, за да намерим най-близките ресторанти до вас.
            </p>
            <p className="text-sm text-center text-gray-600">
              Натиснете <span className="font-semibold">"Разреши"</span> на следващия екран, за да продължите.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={requestDeviceLocation}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Продължи
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLocationPrompt(false)}
                className="w-full"
              >
                Отказ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

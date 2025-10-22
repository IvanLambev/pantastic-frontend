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
import { ShoppingBag, Navigation, Store, Truck } from "lucide-react";
import { API_URL } from '@/config/api';
import { fetchWithAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { t } from "@/utils/translations";

// Google Maps Autocomplete Component
function GoogleMapsAutocomplete({ onLocationSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
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

  // Function to normalize address by removing special characters except commas
  const normalizeAddress = (address) => {
    if (!address) return "";
    return address.replace(/['"„"«»]/g, '').replace(/[^\w\s,.-]/g, '').trim();
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

  return (
    <div className="w-full space-y-4 overflow-hidden">
      <div className="places-container relative">
        <PlacesAutocomplete 
          setSelected={setSelected} 
          setPendingLocation={setPendingLocation}
          setShowPickButton={setShowPickButton}
          pendingLocation={pendingLocation}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
        {/* Pick Address Button with fade animation */}
        <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-10 ${
          showPickButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}>
          <Button
            onClick={handlePickAddress}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm font-medium shadow-lg whitespace-nowrap"
          >
            {t('common.select')}
          </Button>
        </div>
      </div>
      
      <div className="w-full overflow-hidden rounded-lg border relative">
        <GoogleMap
          zoom={12}
          center={selected || center}
          mapContainerClassName="w-full h-96 touch-pan-y"
          onClick={handleMapClick}
          options={{
            gestureHandling: 'cooperative',
            scrollwheel: false,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            keyboardShortcuts: false,
            restriction: {
              latLngBounds: {
                north: 90,
                south: -90,
                west: -180,
                east: 180,
              },
              strictBounds: false,
            }
          }}
        >
          {selected && <GoogleMarker position={selected} />}
        </GoogleMap>
        {/* Mobile scroll hint */}
        <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md md:hidden pointer-events-none">
          {t('restaurantSelector.mapHint') || 'Use two fingers to move the map'}
        </div>
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
    defaultValue: ""
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
    <Combobox onSelect={handleSelect} className="relative">
      <ComboboxInput
        value={value}
        onChange={handleInputChange}
        disabled={!ready}
        className="w-full p-3 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent"
        placeholder={t('restaurantSelector.searchAddress')}
      />
      <ComboboxPopover className="absolute z-50 w-full bg-white 
                                   border border-gray-300 rounded-lg shadow-lg mt-1">
        <ComboboxList className="max-h-60 overflow-auto">
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption 
                key={place_id} 
                value={description}
                className="p-3 cursor-pointer hover:bg-gray-100 
                           border-b border-gray-100 last:border-b-0"
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
    const selectedRestaurant = sessionStorage.getItem('selectedRestaurant')
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

  // Check if restaurant is currently open
  function isRestaurantOpen(restaurant) {
    // Get current time in GMT+3
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const gmt3 = new Date(utc + 3 * 3600000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[gmt3.getDay()];
    const hours = restaurant.opening_hours || {};  // Working hours object
    const todayHours = hours[currentDay];
    
    if (!todayHours) return false;
    
    try {
      // Format: "09:00-18:00"
      const [open, close] = todayHours.split("-");
      const [openH, openM] = open.split(":").map(Number);
      const [closeH, closeM] = close.split(":").map(Number);
      
      const openDate = new Date(gmt3);
      openDate.setHours(openH, openM, 0, 0);
      const closeDate = new Date(gmt3);
      closeDate.setHours(closeH, closeM, 0, 0);
      
      return gmt3 >= openDate && gmt3 <= closeDate;
    } catch (error) {
      console.error("Error parsing restaurant hours:", error);
      return false;
    }
  }

  // Find closest restaurant (open or closed) by coordinates
  function findClosestRestaurant(lat, lng) {
    if (!restaurants.length) return { restaurant: null, distance: null, message: null, isOpen: false };
    
    // First, try to find open restaurants
    const openRestaurants = restaurants.filter(r => isRestaurantOpen(r));

    // If we have open restaurants, find the closest one
    if (openRestaurants.length > 0) {
      let minDist = Infinity;
      let closest = null;
      for (const r of openRestaurants) {
        const rLat = r.latitude;
        const rLng = r.longitude;
        if (typeof rLat === "number" && typeof rLng === "number") {
          const dist = getDistance(lat, lng, rLat, rLng);
          if (dist < minDist) {
            minDist = dist;
            closest = r;
          }
        }
      }
      
      // Check if the closest open restaurant is more than 10km away
      if (minDist > 10) {
        return {
          restaurant: closest,
          distance: minDist,
          isOpen: true,
          message: `The closest working restaurant "${closest.name}" is ${minDist.toFixed(1)} km away from your location. Due to the distance, delivery fees may be higher than usual. Do you want to proceed with this restaurant?`
        };
      }
      
      return { restaurant: closest, distance: minDist, message: null, isOpen: true };
    }
    
    // No open restaurants found - Always find the closest restaurant for menu browsing
    let minDist = Infinity;
    let closest = null;
    for (const r of restaurants) {
      const rLat = r.latitude;
      const rLng = r.longitude;
      if (typeof rLat === "number" && typeof rLng === "number") {
        const dist = getDistance(lat, lng, rLat, rLng);
        if (dist < minDist) {
          minDist = dist;
          closest = r;
        }
      }
    }
    
    // Return the closest restaurant even though it's closed (for menu browsing)
    const nextOpenTime = getNextOpenTime();
    return {
      restaurant: closest,
      distance: minDist,
      isOpen: false,
      message: `No restaurants are currently open in your area. ${nextOpenTime ? `Next opening: ${nextOpenTime}` : 'Check back later for availability.'}`,
      allowBrowsing: true // Flag to indicate user can browse menu but not order
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
        const hours = restaurant.opening_hours || {};
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
              return `Today at ${open}`;
            } else if (dayOffset === 1) {
              return `Tomorrow at ${open}`;
            } else {
              return `${dayName} at ${open}`;
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
    setAddressError("");
    setAddressLoading(true);
    if (!navigator.geolocation) {
      setAddressError("Geolocation is not supported.");
      setAddressLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Save location in sessionStorage if delivery
        if (deliveryMethod === 'delivery') {
          // Try to reverse geocode if possible, else save as 'Device Location'
          let deviceAddress = 'Device Location';
          try {
            if (window && window.fetch) {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              if (data && data.display_name) deviceAddress = data.display_name;
            }
          } catch (error) {
            console.log('Error reverse geocoding:', error);
          }
          sessionStorage.setItem('delivery_address', deviceAddress);
          sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: latitude, lng: longitude }));
          sessionStorage.setItem('delivery_method', 'delivery');
        } else {
          sessionStorage.setItem('delivery_method', 'pickup');
        }
        const result = findClosestRestaurant(latitude, longitude);
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
      () => {
        setAddressError("Failed to get device location.");
        setAddressLoading(false);
      }
    );
  }

  function handleGoogleMapLocationSelect(coords) {
    // Google Maps callback - coordinates are already saved by the Google Maps component
    // Just set the method and find closest restaurant
    if (deliveryMethod === 'delivery') {
      sessionStorage.setItem('delivery_method', 'delivery');
    } else {
      sessionStorage.setItem('delivery_method', 'pickup');
    }
    
    setAddressError(""); // Clear any previous errors
    const result = findClosestRestaurant(coords[0], coords[1]);
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
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">{t('restaurantSelector.howToGetFood')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-6 py-4 sm:py-6">
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
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto overscroll-contain p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold">
              {deliveryMethod === 'pickup' ? t('restaurantSelector.whereLocated') : t('restaurantSelector.whereDeliver')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-6 pb-6">
            {/* Google Maps Container - Always Visible */}
            <div className="space-y-4 w-full overflow-hidden">
              <p className="text-sm text-gray-600 text-center">
                {t('restaurantSelector.searchAddress')}
              </p>
              <div className="w-full overflow-hidden">
                <GoogleMapsAutocomplete onLocationSelect={handleGoogleMapLocationSelect} />
              </div>
            </div>

            {/* Device Location Button */}
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleDeviceLocation} 
              disabled={addressLoading}
              className="w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {t('restaurantSelector.useCurrentLocation')}
            </Button>

            {/* Error Message */}
            {addressError && (
              <div className="text-center">
                <div className={`p-4 rounded-lg mb-4 ${
                  showDistanceWarning ? 'text-orange-700 bg-orange-50 border border-orange-200' : 'text-red-500 bg-red-50'
                }`}>
                  {showDistanceWarning && pendingRestaurantSelection ? (
                    <div className="space-y-2">
                      <div className="font-semibold text-lg text-orange-800">
                        {t('restaurantSelector.distanceWarning')}
                      </div>
                      <p className="text-sm">
                        {t('restaurantSelector.distanceMessage', { distance: pendingDistance?.toFixed(1) })}
                      </p>
                      <p className="text-sm">
                        {t('restaurantSelector.distanceQuestion')}
                      </p>
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
                      {t('restaurantSelector.tryDifferent')}
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleConfirmDistantRestaurant}
                      className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                    >
                      {t('restaurantSelector.yesSelect')}
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
                            toast.info("This restaurant is currently closed. You can browse the menu but cannot place orders until it opens.");
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
              <div className="border-t pt-6">
                <p className="text-center text-gray-600 mb-4">{t('restaurantSelector.or')}</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleManualRestaurantSelect}
                  className="w-full py-3 text-lg flex items-center justify-center gap-2"
                >
                  <Store className="h-4 w-4" />
                  {t('restaurantSelector.manuallySelect')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* City Selection Modal */}
      <Dialog open={open && currentStep === 'city-selection'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold">{t('restaurantSelector.selectCity')}</DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentStep('address-input')}
            >
              {t('restaurantSelector.backToAddress')}
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold">
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
          <div className="grid gap-4 py-4">
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
                const currentDay = days[gmt3.getDay()];
                const hours = restaurant.opening_hours || {};  // Opening hours object
                const todayHours = hours[currentDay];
                let isOpen = false;
                let timeText = "Closed";
                let stateBg = "bg-red-100/60 text-red-700";
                if (todayHours) {
                  // Format: "09:00-18:00"
                  const [open, close] = todayHours.split("-");
                  const [openH, openM] = open.split(":").map(Number);
                  const [closeH, closeM] = close.split(":").map(Number);
                  const openDate = new Date(gmt3);
                  openDate.setHours(openH, openM, 0, 0);
                  const closeDate = new Date(gmt3);
                  closeDate.setHours(closeH, closeM, 0, 0);
                  if (gmt3 >= openDate && gmt3 <= closeDate) {
                    isOpen = true;
                    stateBg = "bg-green-100/60 text-green-700";
                    timeText = `${open}-${close}`;
                  } else {
                    timeText = `${open}-${close}`;
                  }
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
                        <span className="text-lg sm:text-xl font-bold text-left flex items-center gap-2">
                          {restaurant.name}
                          <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold ${stateBg}`}>
                            {isOpen ? t('restaurantSelector.open') : t('restaurantSelector.closed')}
                          </span>
                        </span>
                        <span className="text-sm text-gray-500 text-left">
                          {restaurant.address.split(',')[0]}, {restaurant.city}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto flex flex-col gap-1">
                        {Object.entries(hours).map(([day, h]) => (
                          <div key={day} className={`whitespace-nowrap ${day === currentDay ? 'bg-gray-200/60 rounded-lg px-2 py-1 font-semibold' : ''}`}>
                            {day === currentDay ? (
                              <span>{day}: <span className="text-black">{todayHours ? timeText : "No hours"}</span></span>
                            ) : (
                              <span>{day}: {h}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

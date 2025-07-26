import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCoordinates } from "@/utils/geocode";
import { ShoppingBag, MapPin, Navigation, Store, Truck } from "lucide-react";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks for location selection
function LocationSelector({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function RestaurantSelector({
  open,
  onClose,
  restaurants,
  onSelect,
  loading,
  error,
  selectedCity,
  setSelectedCity,
}) {
  // Main flow states
  const [currentStep, setCurrentStep] = useState('delivery-method'); // 'delivery-method', 'address-input', 'city-selection', 'restaurant-selection'
  const [deliveryMethod, setDeliveryMethod] = useState(''); // 'pickup' or 'delivery'
  
  // Address and location states
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([42.6977, 23.3219]); // Sofia, Bulgaria as default

  // Get unique cities from restaurants
  const cities = [...new Set(restaurants.map(restaurant => restaurant[2]))].sort();
  // Filter restaurants by selected city
  const filteredRestaurants = selectedCity 
    ? restaurants.filter(restaurant => restaurant[2] === selectedCity)
    : restaurants;

  // Reset states when modal closes
  const handleClose = () => {
    setCurrentStep('delivery-method');
    setDeliveryMethod('');
    setAddress('');
    setAddressError('');
    setShowMap(false);
    setSelectedLocation(null);
    setSelectedCity(null);
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

  // Find closest restaurant by coordinates
  function findClosestRestaurant(lat, lng) {
    if (!restaurants.length) return null;
    let minDist = Infinity;
    let closest = null;
    for (const r of restaurants) {
      const rLat = r[5];
      const rLng = r[6];
      if (typeof rLat === "number" && typeof rLng === "number") {
        const dist = getDistance(lat, lng, rLat, rLng);
        if (dist < minDist) {
          minDist = dist;
          closest = r;
        }
      }
    }
    return closest;
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    setAddressError("");
    setAddressLoading(true);
    try {
      const coords = await getCoordinates(address);
      if (!coords) throw new Error("Could not geocode address");
      // Save address and coordinates in sessionStorage if delivery
      if (deliveryMethod === 'delivery') {
        sessionStorage.setItem('delivery_address', address);
        sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: coords.lat, lng: coords.lng }));
        sessionStorage.setItem('delivery_method', 'delivery');
      } else {
        sessionStorage.setItem('delivery_method', 'pickup');
      }
      const closest = findClosestRestaurant(coords.lat, coords.lng);
      if (closest) {
        onSelect(closest);
        handleClose();
      } else {
        setAddressError("No restaurants found near this address.");
      }
    } catch {
      setAddressError("Failed to find restaurant for this address.");
    } finally {
      setAddressLoading(false);
    }
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
        setSelectedLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
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
        const closest = findClosestRestaurant(latitude, longitude);
        if (closest) {
          onSelect(closest);
          handleClose();
        } else {
          setAddressError("No restaurants found near your location.");
        }
        setAddressLoading(false);
      },
      () => {
        setAddressError("Failed to get device location.");
        setAddressLoading(false);
      }
    );
  }

  function handleMapLocationSelect(coords) {
    setSelectedLocation(coords);
    setMapCenter(coords);
    // Save location in sessionStorage if delivery
    if (deliveryMethod === 'delivery') {
      // Try to reverse geocode if possible, else save as 'Map Location'
      let mapAddress = 'Map Location';
      if (window && window.fetch) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              mapAddress = data.display_name;
            }
            sessionStorage.setItem('delivery_address', mapAddress);
            sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: coords[0], lng: coords[1] }));
            sessionStorage.setItem('delivery_method', 'delivery');
          })
          .catch(() => {
            sessionStorage.setItem('delivery_address', mapAddress);
            sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: coords[0], lng: coords[1] }));
            sessionStorage.setItem('delivery_method', 'delivery');
          });
      } else {
        sessionStorage.setItem('delivery_address', mapAddress);
        sessionStorage.setItem('delivery_coords', JSON.stringify({ lat: coords[0], lng: coords[1] }));
        sessionStorage.setItem('delivery_method', 'delivery');
      }
    } else {
      sessionStorage.setItem('delivery_method', 'pickup');
    }
    const closest = findClosestRestaurant(coords[0], coords[1]);
    if (closest) {
      onSelect(closest);
      handleClose();
    } else {
      setAddressError("No restaurants found near this location.");
    }
  }

  function handleDeliveryMethodSelect(method) {
    setDeliveryMethod(method);
    setCurrentStep('address-input');
  }

  function handleManualRestaurantSelect() {
    setCurrentStep('city-selection');
  }

  return (
    <>
      {/* Delivery Method Selection Modal */}
      <Dialog open={open && currentStep === 'delivery-method'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">How would you like to get your food?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-gray-300"
              onClick={() => handleDeliveryMethodSelect('pickup')}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Pickup</h3>
                    <p className="text-gray-600 mt-2">Pick up your order from the restaurant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-gray-300"
              onClick={() => handleDeliveryMethodSelect('delivery')}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Truck className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Delivery</h3>
                    <p className="text-gray-600 mt-2">Get your food delivered to your address</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Input Modal */}
      <Dialog open={open && currentStep === 'address-input'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {deliveryMethod === 'pickup' ? 'Where are you located?' : 'Where should we deliver?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Address Input Form */}
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full border rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your address..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={addressLoading}
                />
              </div>
              <Button 
                type="submit" 
                disabled={addressLoading || !address}
                className="w-full py-3 text-lg"
              >
                {addressLoading ? "Finding Restaurant..." : "Find Closest Restaurant"}
              </Button>
            </form>

            {/* Map Toggle Button */}
            <div className="text-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {showMap ? 'Hide Map' : 'Point on Map'}
              </Button>
            </div>

            {/* Map Container */}
            {showMap && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Click on the map to select your location
                </p>
                <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationSelector onLocationSelect={handleMapLocationSelect} />
                    {selectedLocation && (
                      <Marker position={selectedLocation}>
                        <Popup>
                          Selected Location
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Device Location Button */}
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleDeviceLocation} 
              disabled={addressLoading}
              className="w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use My Current Location
            </Button>

            {/* Error Message */}
            {addressError && (
              <p className="text-red-500 text-center bg-red-50 p-3 rounded-lg">{addressError}</p>
            )}

            {/* Manual Restaurant Selection */}
            {deliveryMethod === 'pickup' && (
              <div className="border-t pt-6">
                <p className="text-center text-gray-600 mb-4">Or</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleManualRestaurantSelect}
                  className="w-full py-3 text-lg flex items-center justify-center gap-2"
                >
                  <Store className="h-4 w-4" />
                  Manually Select Restaurant
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* City Selection Modal */}
      <Dialog open={open && currentStep === 'city-selection'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-2xl font-bold">Select a City</DialogTitle>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('address-input')}
            >
              Back to Address
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loading ? (
              <p className="text-center">Loading cities...</p>
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              Select a Restaurant in {selectedCity}
            </DialogTitle>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('city-selection')}
            >
              Change City
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loading ? (
              <p className="text-center">Loading restaurants...</p>
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
                const hours = restaurant[8] || {};
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
                    key={restaurant[0]}
                    variant="outline"
                    className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100 relative"
                    onClick={() => {
                      sessionStorage.setItem('delivery_method', 'pickup');
                      onSelect(restaurant);
                      handleClose();
                    }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                      <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                        <span className="text-lg sm:text-xl font-bold text-left flex items-center gap-2">
                          {restaurant[7]}
                          <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold ${stateBg}`}>
                            {isOpen ? "We are Open" : "We are Closed"}
                          </span>
                        </span>
                        <span className="text-sm text-gray-500 text-left">{restaurant[1]}</span>
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

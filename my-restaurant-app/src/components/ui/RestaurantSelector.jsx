import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCoordinates } from "@/utils/geocode";
import { MapPin, Truck, Store } from "lucide-react";
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

export default function RestaurantSelector({
  open,
  onClose,
  restaurants,
  onSelect,
  loading,
  error,
  selectedCity,
  setSelectedCity,
  showRestaurantModal,
  setShowRestaurantModal,
}) {
  const [step, setStep] = useState(0); // 0: method, 1: address/map, 2: manual select
  const [deliveryMethod, setDeliveryMethod] = useState(null); // 'pickup' or 'delivery'
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  // Get unique cities from restaurants
  const cities = [...new Set(restaurants.map(restaurant => restaurant[2]))].sort();
  // Filter restaurants by selected city
  const filteredRestaurants = selectedCity 
    ? restaurants.filter(restaurant => restaurant[2] === selectedCity)
    : restaurants;

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
      if (deliveryMethod === "pickup") {
        const closest = findClosestRestaurant(coords.lat, coords.lng);
        if (closest) {
          onSelect(closest);
        } else {
          setAddressError("No restaurants found near this address.");
        }
      } else {
        // For delivery, pass address/coords to parent for order payload
        onSelect({ address, coords });
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
        if (deliveryMethod === "pickup") {
          const closest = findClosestRestaurant(latitude, longitude);
          if (closest) {
            onSelect(closest);
          } else {
            setAddressError("No restaurants found near your location.");
          }
        } else {
          onSelect({ coords: { lat: latitude, lng: longitude } });
        }
        setAddressLoading(false);
      },
      () => {
        setAddressError("Failed to get device location.");
        setAddressLoading(false);
      }
    );
  }

  // --- UI ---
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 0 && "Choose Delivery Method"}
            {step === 1 && (deliveryMethod === "pickup" ? "Pick Up: Enter Address or Select on Map" : "Delivery: Enter Address or Select on Map")}
            {step === 2 && deliveryMethod === "pickup" && "Manual Restaurant Selection"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Step 0: Delivery Method */}
          {step === 0 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant={deliveryMethod === "pickup" ? "default" : "outline"}
                className="flex-1 flex flex-col items-center gap-2 p-6 text-lg"
                onClick={() => { setDeliveryMethod("pickup"); setStep(1); }}
              >
                <Store className="w-10 h-10 mb-2" /> Pick Up
              </Button>
              <Button
                variant={deliveryMethod === "delivery" ? "default" : "outline"}
                className="flex-1 flex flex-col items-center gap-2 p-6 text-lg"
                onClick={() => { setDeliveryMethod("delivery"); setStep(1); }}
              >
                <Truck className="w-10 h-10 mb-2" /> Delivery
              </Button>
            </div>
          )}

          {/* Step 1: Address/Map/Device Location */}
          {step === 1 && (
            <>
              <form onSubmit={handleAddressSubmit} className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  className="border rounded px-4 py-2"
                  placeholder={deliveryMethod === "pickup" ? "Enter address to find closest restaurant..." : "Enter delivery address..."}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={addressLoading}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={addressLoading || !address}>
                    {addressLoading ? "Finding..." : deliveryMethod === "pickup" ? "Find Closest Restaurant" : "Use for Delivery"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleDeviceLocation} disabled={addressLoading}>
                    Use My Location
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setMapModal(true)}>
                    <MapPin className="inline w-5 h-5 mr-1" /> Point on Map
                  </Button>
                </div>
                {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
              </form>
              {/* Map modal (stub, ready for react-leaflet integration) */}
              {mapModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
                    <button className="absolute top-2 right-2 text-gray-500" onClick={() => setMapModal(false)}>&times;</button>
                    <div className="mb-2 font-bold">Select location on map</div>
                    {/* TODO: Integrate react-leaflet here */}
                    <div className="h-72 flex items-center justify-center border rounded bg-gray-100 text-gray-400">
                      Map goes here
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" onClick={() => setMapModal(false)}>Cancel</Button>
                      {/* <Button className="ml-2" onClick={...}>Use This Location</Button> */}
                    </div>
                  </div>
                </div>
              )}
              {/* For pickup, allow manual selection at the bottom */}
              {deliveryMethod === "pickup" && (
                <Button variant="ghost" className="mt-6" onClick={() => setStep(2)}>
                  Or select a restaurant manually
                </Button>
              )}
              {/* For delivery, you could add a continue button if needed */}
            </>
          )}

          {/* Step 2: Manual Restaurant Selection (pickup only) */}
          {step === 2 && deliveryMethod === "pickup" && (
            <>
              <div className="mb-2 text-lg font-semibold">Select a City</div>
              {loading ? (
                <p className="text-center">Loading cities...</p>
              ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : (
                <>
                  {cities.map((city) => (
                    <Button
                      key={city}
                      variant="outline"
                      className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100"
                      onClick={() => {
                        setSelectedCity(city);
                        setShowRestaurantModal(true);
                      }}
                    >
                      <span className="text-lg sm:text-xl font-bold">{city}</span>
                    </Button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

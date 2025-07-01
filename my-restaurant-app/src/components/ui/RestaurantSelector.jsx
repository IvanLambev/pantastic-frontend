import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCoordinates } from "@/utils/geocode";

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
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

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
      const closest = findClosestRestaurant(coords.lat, coords.lng);
      if (closest) {
        onSelect(closest);
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
        const closest = findClosestRestaurant(latitude, longitude);
        if (closest) {
          onSelect(closest);
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

  return (
    <>
      {/* City Selection Modal */}
      <Dialog open={open && !showRestaurantModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select a City</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                <form onSubmit={handleAddressSubmit} className="flex flex-col gap-2 mt-4">
                  <input
                    type="text"
                    className="border rounded px-4 py-2"
                    placeholder="Or type your address..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    disabled={addressLoading}
                  />
                  <Button type="submit" disabled={addressLoading || !address}>
                    {addressLoading ? "Finding..." : "Find Closest Restaurant"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleDeviceLocation} disabled={addressLoading}>
                    Use My Location
                  </Button>
                  {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Restaurant Selection Modal */}
      <Dialog open={open && showRestaurantModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              Select a Restaurant in {selectedCity}
            </DialogTitle>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRestaurantModal(false);
                setSelectedCity(null);
              }}
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
                    onClick={() => onSelect(restaurant)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                      <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                        <span className="text-lg sm:text-xl font-bold text-left flex items-center gap-2">
                          {restaurant[7]}
                          <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold ${stateBg}`}>{isOpen ? "We are Open" : "We are Closed"}</span>
                        </span>
                        <span className="text-sm text-gray-500 text-left">{restaurant[1]}</span>
                      </div>
                      <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto flex flex-col gap-1">
                        {Object.entries(hours).map(([day, h]) => (
                          <div key={day} className={`whitespace-nowrap ${day === currentDay ? 'bg-gray-200/60 rounded-lg px-2 py-1 font-semibold' : ''}`}>{day === currentDay ? <span>{day}: <span className="text-black">{todayHours ? timeText : "No hours"}</span></span> : <span>{day}: {h}</span>}</div>
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

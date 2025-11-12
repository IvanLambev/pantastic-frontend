import { useState, useMemo } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
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

const GoogleMapsAutocomplete = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  if (!isLoaded) return <div className="p-4 text-center">Loading Google Maps...</div>;
  return <Map />;
};

function Map() {
  const center = useMemo(() => ({ lat: 42.6977, lng: 23.3219 }), []); // Sofia, Bulgaria
  const [selected, setSelected] = useState(null);

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

  // Function to save location to session storage
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

    return normalizedLocation;
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

        const normalizedLocation = saveLocationToSession(locationData);
        console.log("Normalized dropped pin location:", normalizedLocation);

        setSelected({
          lat: normalizedLocation.latitude,
          lng: normalizedLocation.longitude,
          address: normalizedLocation.address
        });
      } else {
        console.error("Geocoder failed due to:", status);
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      <div className="places-container">
        {/* pass setSelected and saveLocationToSession down */}
        <PlacesAutocomplete setSelected={setSelected} saveLocation={saveLocationToSession} />
      </div>

      <GoogleMap
        zoom={12}
        center={selected || center}
        mapContainerClassName="w-full h-96 rounded-lg border"
        onClick={handleMapClick}
      >
        {selected && <Marker position={selected} />}
      </GoogleMap>
    </div>
  );
}

const PlacesAutocomplete = ({ setSelected, saveLocation }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (address) => {
    setValue(address, false);
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

      const normalizedLocation = saveLocation(locationData);
      console.log("Normalized selected location:", normalizedLocation);

      setSelected({
        lat: normalizedLocation.latitude,
        lng: normalizedLocation.longitude,
        address: normalizedLocation.address
      });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  return (
    <Combobox onSelect={handleSelect} className="relative">
      <ComboboxInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        className="w-full p-3 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent"
        placeholder="Search for an address..."
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

export default GoogleMapsAutocomplete;

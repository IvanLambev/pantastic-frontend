// Temporary placeholder component until Google Maps API is fully configured
const GoogleMapsAutocomplete = () => {
  return (
    <div className="w-full space-y-4">
      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Google Maps Integration</h3>
        <p className="text-gray-600 mb-4">
          Google Maps with autocomplete will be available here once the API key is configured.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Features to include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Address autocomplete search</li>
            <li>Interactive map with marker placement</li>
            <li>Location selection and saving</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* 
// Uncomment this code when you have the Google Maps API key configured:

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

  return (
    <div className="w-full space-y-4">
      <div className="places-container">
        <PlacesAutocomplete setSelected={setSelected} />
      </div>
      
      <GoogleMap
        zoom={12}
        center={selected || center}
        mapContainerClassName="w-full h-96 rounded-lg border"
      >
        {selected && <Marker position={selected} />}
      </GoogleMap>
    </div>
  );
}

const PlacesAutocomplete = ({ setSelected }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // componentRestrictions: { country: "bg" }, // For Bulgaria only
    },
  });

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setSelected({ lat, lng });
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
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Search for an address..."
      />
      <ComboboxPopover className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
        <ComboboxList className="max-h-60 overflow-auto">
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption 
                key={place_id} 
                value={description}
                className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};
*/

export default GoogleMapsAutocomplete;
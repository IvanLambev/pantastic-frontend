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

export default GoogleMapsAutocomplete;
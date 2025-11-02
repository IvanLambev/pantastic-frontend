/**
 * Opens an address in Google Maps
 * @param {string} address - The address to open in maps
 * @param {string} city - Optional city to append to address
 */
export const openInMaps = (address, city = '') => {
  const fullAddress = city ? `${address}, ${city}` : address;
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  window.open(mapsUrl, '_blank');
};

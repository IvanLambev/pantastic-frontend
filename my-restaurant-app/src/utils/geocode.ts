import axios from 'axios';

const GEOCODE_API_KEY = import.meta.env.VITE_GEOCODING_KEY;

export async function getCoordinates(address) {
  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: GEOCODE_API_KEY,
        q: address,
        limit: 1,
      },
    });

    const result = response.data.results[0];
    if (result) {
      const { lat, lng } = result.geometry;
      return { lat, lng };
    } else {
      throw new Error('No results found.');
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

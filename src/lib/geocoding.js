// File: c:\hackathon\src\lib\geocoding.js

/**
 * Convert an address to coordinates using OpenCage
 * @param {string} address - The address to geocode
 * @returns {Promise<[number, number]|null>} - [longitude, latitude] or null if geocoding fails
 */
export async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        address
      )}&key=${process.env.OPENCAGE_API_KEY}`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return [lng, lat]; // [longitude, latitude]
    }

    console.warn('No geocoding results for:', address);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Convert coordinates to an address using OpenCage
 * @param {[number, number]} coordinates - [longitude, latitude]
 * @returns {Promise<string|null>} - Address or null if reverse geocoding fails
 */
export async function reverseGeocode(coordinates) {
  try {
    const [lng, lat] = coordinates;

    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.OPENCAGE_API_KEY}`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted; // formatted address
    }

    console.warn('No reverse geocoding results for:', coordinates);
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Validates location data
 */
export function isValidLocation(location) {
  if (!location) return false;

  if (
    !location.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return false;
  }

  const [lng, lat] = location.coordinates;

  if (
    typeof lng !== 'number' ||
    typeof lat !== 'number' ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    return false;
  }

  if (!location.address || typeof location.address !== 'string') {
    return false;
  }

  return true;
}

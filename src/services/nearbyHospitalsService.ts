import { NearbyHospital, UserLocation } from '../types/nearbyHospital';
import { Facility } from '../types/medflow';

/**
 * Haversine formula to calculate the great-circle distance between two points in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format distance in meters into human-readable string (e.g. 450 m or 3.2 km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Build Google Maps directions link for a given destination lat, lng and optional name
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lng: number,
  destinationName?: string,
  userLocation?: UserLocation | null
): string {
  const destStr = encodeURIComponent(destinationName ? `${destinationName}, ${lat},${lng}` : `${lat},${lng}`);
  if (userLocation) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destStr}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destStr}`;
}

/**
 * Fetch nearby hospitals using OpenStreetMap Overpass API (Public, CORS-supported, Keyless for GitHub Pages)
 */
async function fetchFromOverpassAPI(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<NearbyHospital[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  // Overpass QL query searching for hospitals, clinics, emergency facilities
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `;

  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API response status: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const results: NearbyHospital[] = [];

    for (const elem of elements) {
      const elemLat = elem.lat || (elem.center && elem.center.lat);
      const elemLng = elem.lon || (elem.center && elem.center.lon);

      if (!elemLat || !elemLng) continue;

      const tags = elem.tags || {};
      const name = tags.name || tags['name:en'] || (tags.amenity === 'clinic' ? 'Community Health Clinic' : 'Medical Center Hospital');
      
      // Construct address from OSM tags
      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const suburb = tags['addr:suburb'] || tags['addr:district'] || tags['addr:city'] || '';
      
      let address = [housenumber, street, suburb].filter(Boolean).join(' ');
      if (!address) {
        address = `Geospatial coordinates: ${elemLat.toFixed(4)}, ${elemLng.toFixed(4)}`;
      }

      const distMeters = calculateHaversineDistance(lat, lng, elemLat, elemLng);

      let facilityType: NearbyHospital['type'] = 'Hospital';
      if (tags.amenity === 'clinic' || tags.healthcare === 'clinic') {
        facilityType = 'Clinic';
      } else if (tags.emergency === 'yes' || tags.description?.toLowerCase().includes('emergency')) {
        facilityType = 'Emergency Hospital';
      }

      results.push({
        id: `osm-${elem.id}`,
        name,
        type: facilityType,
        address,
        lat: elemLat,
        lng: elemLng,
        distanceMeters: distMeters,
        distanceFormatted: formatDistance(distMeters),
        phoneNumber: tags.phone || tags['contact:phone'] || undefined,
        googleMapsUrl: getGoogleMapsDirectionsUrl(elemLat, elemLng, name, { latitude: lat, longitude: lng, accuracy: 0, timestamp: Date.now() }),
        source: 'Overpass OSM',
      });
    }

    return results;
  } catch (error) {
    console.warn('Overpass API fetch failed, using fallback:', error);
    return [];
  }
}

/**
 * Fetch nearby hospitals using Google Places API (if client API key or server proxy is provided)
 */
async function fetchFromGooglePlaces(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<NearbyHospital[]> {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=hospital&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        return data.results.map((place: any) => {
          const placeLat = place.geometry.location.lat;
          const placeLng = place.geometry.location.lng;
          const dist = calculateHaversineDistance(lat, lng, placeLat, placeLng);
          return {
            id: `gplace-${place.place_id}`,
            name: place.name,
            type: (place.types?.includes('hospital') ? 'Hospital' : 'Medical Center') as NearbyHospital['type'],
            address: place.vicinity || place.formatted_address || 'Address available on map',
            lat: placeLat,
            lng: placeLng,
            distanceMeters: dist,
            distanceFormatted: formatDistance(dist),
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            isOpenNow: place.opening_hours?.open_now,
            googleMapsUrl: getGoogleMapsDirectionsUrl(placeLat, placeLng, place.name, { latitude: lat, longitude: lng, accuracy: 0, timestamp: Date.now() }),
            source: 'Google Places'
          };
        });
      }
    } catch (e) {
      console.warn('Direct Google Places API error:', e);
    }
  }

  // Try Express backend endpoint proxy if running locally
  try {
    const serverUrl = `http://localhost:5001/api/nearby-hospitals?lat=${lat}&lng=${lng}&radius=${radiusMeters}`;
    const res = await fetch(serverUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Backend server unavailable or no server key
  }

  return [];
}

/**
 * Main function to retrieve nearby hospitals sorted by distance
 */
export async function getNearbyHospitals(
  userLat: number,
  userLng: number,
  radiusKm: number = 10,
  existingRegionalFacilities: Facility[] = []
): Promise<NearbyHospital[]> {
  const radiusMeters = radiusKm * 1000;

  // 1. Try Google Places (if API key / server is active)
  let googleResults = await fetchFromGooglePlaces(userLat, userLng, radiusMeters);

  // 2. Fetch live data from OpenStreetMap Overpass API
  let osmResults = await fetchFromOverpassAPI(userLat, userLng, radiusMeters);

  // 3. Include regional MedFlow facilities if within radius
  const regionalResults: NearbyHospital[] = existingRegionalFacilities
    .map(fac => {
      const dist = calculateHaversineDistance(userLat, userLng, fac.lat, fac.lng);
      return {
        id: `regional-${fac.id}`,
        name: fac.name,
        type: (fac.type === 'Hospital' ? 'Hospital' : 'Clinic') as NearbyHospital['type'],
        address: fac.location,
        lat: fac.lat,
        lng: fac.lng,
        distanceMeters: dist,
        distanceFormatted: formatDistance(dist),
        phoneNumber: fac.contactPhone,
        googleMapsUrl: getGoogleMapsDirectionsUrl(fac.lat, fac.lng, fac.name, { latitude: userLat, longitude: userLng, accuracy: 0, timestamp: Date.now() }),
        source: 'Regional System' as const,
      };
    })
    .filter(fac => fac.distanceMeters <= radiusMeters);

  // Combine results with deduplication by name & proximity
  const allResultsMap = new Map<string, NearbyHospital>();

  // Helper to add results with deduplication
  const addResult = (hosp: NearbyHospital) => {
    const normalizedKey = hosp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!allResultsMap.has(normalizedKey)) {
      allResultsMap.set(normalizedKey, hosp);
    }
  };

  googleResults.forEach(addResult);
  osmResults.forEach(addResult);
  regionalResults.forEach(addResult);

  // If no external results found (e.g., offline or network restricted), compute distances to all regional facilities regardless of radius so user always sees hospitals
  if (allResultsMap.size === 0 && existingRegionalFacilities.length > 0) {
    existingRegionalFacilities.forEach(fac => {
      const dist = calculateHaversineDistance(userLat, userLng, fac.lat, fac.lng);
      allResultsMap.set(fac.name.toLowerCase(), {
        id: `regional-fallback-${fac.id}`,
        name: fac.name,
        type: fac.type === 'Hospital' ? 'Hospital' : 'Clinic',
        address: fac.location,
        lat: fac.lat,
        lng: fac.lng,
        distanceMeters: dist,
        distanceFormatted: formatDistance(dist),
        phoneNumber: fac.contactPhone,
        googleMapsUrl: getGoogleMapsDirectionsUrl(fac.lat, fac.lng, fac.name, { latitude: userLat, longitude: userLng, accuracy: 0, timestamp: Date.now() }),
        source: 'Regional System',
      });
    });
  }

  const sortedList = Array.from(allResultsMap.values()).sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  );

  return sortedList;
}

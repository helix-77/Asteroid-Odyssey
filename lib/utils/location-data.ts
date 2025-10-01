// Location data utilities for impact simulation
// Provides population density and geographic information

export interface LocationInfo {
  lat: number;
  lng: number;
  populationDensity: number; // people per km²
  totalPopulation: number;
  gdpPerCapita: number;
  infrastructureValue: number;
  isOcean: boolean;
  oceanDepth?: number;
  coastalProximity?: number;
  regionName?: string;
}

// Major cities and their data (simplified dataset)
const MAJOR_CITIES = [
  { name: "New York", lat: 40.7128, lng: -74.006, pop: 8336817, density: 10715 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, pop: 3979576, density: 3276 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, pop: 13960000, density: 6158 },
  { name: "London", lat: 51.5074, lng: -0.1278, pop: 8982000, density: 5701 },
  { name: "Paris", lat: 48.8566, lng: 2.3522, pop: 2161000, density: 20545 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, pop: 21540000, density: 1300 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, pop: 20411000, density: 20694 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, pop: 12325232, density: 7958 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357, pop: 9500000, density: 19376 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173, pop: 12506000, density: 4859 },
];

// Estimate if location is ocean
export function isOceanLocation(lat: number, lng: number): boolean {
  // Simplified ocean detection
  // Major ocean areas (very rough approximation)
  
  // Pacific Ocean
  if (Math.abs(lat) < 60 && ((lng > 120 && lng < 180) || (lng < -100 && lng > -180))) {
    return true;
  }
  
  // Atlantic Ocean
  if (Math.abs(lat) < 60 && lng > -60 && lng < -10) {
    return true;
  }
  
  // Indian Ocean
  if (lat < 30 && lat > -60 && lng > 40 && lng < 120) {
    return true;
  }
  
  return false;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city
function findNearestCity(lat: number, lng: number) {
  let nearest = MAJOR_CITIES[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);
  
  for (const city of MAJOR_CITIES) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }
  
  return { city: nearest, distance: minDistance };
}

// Estimate population density based on location
export function estimatePopulationDensity(lat: number, lng: number): number {
  const isOcean = isOceanLocation(lat, lng);
  if (isOcean) return 0;
  
  const { city, distance } = findNearestCity(lat, lng);
  
  // Population density decreases with distance from major cities
  if (distance < 50) {
    // Within 50km of major city - use city density with falloff
    const falloff = Math.max(0.3, 1 - distance / 100);
    return city.density * falloff;
  } else if (distance < 200) {
    // Suburban/rural area
    return Math.max(50, city.density * 0.1 * (1 - distance / 500));
  } else {
    // Remote area - very low density
    return Math.max(5, 100 * (1 - distance / 2000));
  }
}

// Estimate total population in affected area
export function estimateTotalPopulation(
  lat: number,
  lng: number,
  radiusKm: number
): number {
  const density = estimatePopulationDensity(lat, lng);
  const area = Math.PI * radiusKm * radiusKm;
  return Math.floor(density * area);
}

// Get comprehensive location information
export function getLocationInfo(lat: number, lng: number): LocationInfo {
  const isOcean = isOceanLocation(lat, lng);
  const populationDensity = estimatePopulationDensity(lat, lng);
  const totalPopulation = estimateTotalPopulation(lat, lng, 100); // 100km radius
  
  // Estimate GDP per capita based on region
  let gdpPerCapita = 50000; // Default
  if (Math.abs(lng) < 60 && lat > 35 && lat < 75) {
    gdpPerCapita = 45000; // Europe
  } else if (lng > 100 && lng < 150 && lat > 20 && lat < 50) {
    gdpPerCapita = 40000; // East Asia
  } else if (lat < -10 && lat > -60) {
    gdpPerCapita = 15000; // Southern hemisphere (rough estimate)
  }
  
  // Infrastructure value estimation
  const infrastructureValue = totalPopulation * gdpPerCapita * 2; // Rough estimate
  
  // Ocean depth (average)
  const oceanDepth = isOcean ? 4000 : undefined;
  
  // Coastal proximity
  const coastalProximity = isOcean ? 0 : 100; // Simplified
  
  // Region name
  const { city, distance } = findNearestCity(lat, lng);
  const regionName = distance < 100 ? `Near ${city.name}` : "Remote Area";
  
  return {
    lat,
    lng,
    populationDensity,
    totalPopulation,
    gdpPerCapita,
    infrastructureValue,
    isOcean,
    oceanDepth,
    coastalProximity,
    regionName,
  };
}

// Get region description
export function getRegionDescription(lat: number, lng: number): string {
  const isOcean = isOceanLocation(lat, lng);
  
  if (isOcean) {
    if (lng > 120 || lng < -100) return "Pacific Ocean";
    if (lng > -60 && lng < -10) return "Atlantic Ocean";
    if (lng > 40 && lng < 120) return "Indian Ocean";
    return "Ocean";
  }
  
  const { city, distance } = findNearestCity(lat, lng);
  
  if (distance < 50) {
    return `${city.name} Metropolitan Area`;
  } else if (distance < 200) {
    return `${Math.floor(distance)}km from ${city.name}`;
  } else {
    // Determine continent
    if (lng > -170 && lng < -30 && lat > 15 && lat < 75) return "North America";
    if (lng > -170 && lng < -30 && lat < 15 && lat > -60) return "South America";
    if (lng > -30 && lng < 60 && lat > 35 && lat < 75) return "Europe";
    if (lng > 20 && lng < 60 && lat < 35 && lat > -35) return "Africa";
    if (lng > 60 && lng < 180 && lat > 10 && lat < 75) return "Asia";
    if (lng > 110 && lng < 180 && lat < -10 && lat > -50) return "Australia";
    return "Remote Region";
  }
}

// Utility functions for map rendering and overlays
export function renderMap(geojson: any) {
  // Dummy check for landmass boundaries
  return {
    landmassAccuracy:
      geojson.type === "FeatureCollection" && geojson.features.length > 0,
  };
}

export function overlayCrater(
  location: { lat: number; lon: number },
  crater: { diameter: number; depth: number }
) {
  return {
    position: [location.lat, location.lon],
    size: crater.diameter,
  };
}

export function overlayCasualties(
  location: { lat: number; lon: number },
  casualties: any
) {
  return {
    position: [location.lat, location.lon],
    casualties,
  };
}

export function overlayInfrastructure(
  location: { lat: number; lon: number },
  infrastructure: any
) {
  return {
    position: [location.lat, location.lon],
    infrastructure,
  };
}

export function overlayClimate(
  location: { lat: number; lon: number },
  climate: any
) {
  return {
    position: [location.lat, location.lon],
    climate,
  };
}

export function overlayDisaster(
  location: { lat: number; lon: number },
  disaster: any
) {
  return {
    position: [location.lat, location.lon],
    disaster,
  };
}

module.exports = {
  renderMap,
  overlayCrater,
  overlayCasualties,
  overlayInfrastructure,
  overlayClimate,
  overlayDisaster,
};

# Impact Simulator Implementation Tasklist

## Folder: /copilot-tasks

---

## 1. Project Setup

- [ ] Create `/copilot-tasks` folder in project root for Copilot work, tasklist, and test files.
- [ ] Write this tasklist to `/copilot-tasks/impact-simulator-tasks.md`.

## 2. Data & Context Analysis

- [ ] Review `/components/simulation/` for existing simulation components and structure.
- [ ] Review `/components/dashboard/` for data display, calculation logic, and context.
- [ ] Review `/data/` for:
  - Asteroid data (`neo_sample.json`, `asteroids.json`)
  - Impact scenarios (`impact_scenarios.json`)
  - Population, infrastructure, earth data
  - GeoJSON world map data (`world-geojson-develop/`)

## 3. Data Modeling

- [ ] Define/validate TypeScript interfaces for:
  - Asteroid
  - ImpactScenario
  - InfrastructureDamage
  - ClimateDamage
  - NaturalDisaster
  - MapRegion
- [ ] Ensure all data sources are loaded and parsed correctly.
- [ ] Implement error handling for data loading.

## 4. Map Visualization (2D)

- [ ] Integrate real 2D global map using GeoJSON/topoJSON (accurate landmass boundaries).
- [ ] Implement region selection (Americas, Asia, Europe, Australia, etc.).
- [ ] Render impact location and dynamic crater visualization (size changes over time).
- [ ] Overlay disaster zones, casualties, infrastructure, climate, and natural disaster layers.
- [ ] Ensure map is stable, minimalistic, and responsive.

## 5. Simulation Logic

- [ ] Implement physics-based impact calculations:
  - Crater size, explosion strength
  - Population casualties
  - Infrastructure damage (military, civilian, energy, cultural)
  - Economic, survival, fallout, agricultural effects
  - Climate damage (temperature, habitability)
  - Natural disasters (tsunami, tectonic effects)
- [ ] Timeplapse logic to animate parameter changes over time.
- [ ] Filter controls to toggle map overlays (casualties, infrastructure, disaster zones).
- [ ] Sidebar for numerical data (casualties, economic damage, fallout cost, habitable area loss).
- [ ] Only show impact for selected asteroid.

## 6. UI/UX Implementation

- [ ] Minimalistic layout: map-focused, small sidebar, minimal text.
- [ ] Stable, predictable map behavior (no erratic UI).
- [ ] Responsive and touch-friendly controls.

## 7. Testing & Validation

- [ ] Create test files for:
  - Data loading/parsing
  - Physics calculations
  - Map rendering accuracy (landmass boundaries, overlays)
  - UI/UX behavior
- [ ] Implement unit tests for calculation functions.
- [ ] Implement integration tests for map and UI controls.
- [ ] Manual visual inspection for map accuracy and UI stability.

## 8. Documentation

- [ ] Document all interfaces, calculation logic, and map integration steps in `/copilot-tasks/impact-simulator-tasks.md`.
- [ ] Update tasklist as steps are completed.

---

## Next Steps

- [ ] Create `/copilot-tasks` folder and write this file.
- [ ] Begin with Data & Context Analysis.

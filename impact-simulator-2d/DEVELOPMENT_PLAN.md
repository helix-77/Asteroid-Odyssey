# 2D Asteroid Impact Simulator Development Plan

## Specific Task List

### Phase 1: Setup and Data Preparation
- [ ] 1.1 Create impact-simulator route in Next.js app
- [ ] 1.2 Remove old simulation route and components
- [ ] 1.3 Set up D3.js v7 dependencies
- [ ] 1.4 Prepare GeoJSON world map data with country borders
- [ ] 1.5 Create population density data structure
- [ ] 1.6 Create infrastructure location data (military, energy, cultural, civilian)

### Phase 2: Map Implementation
- [ ] 2.1 Create base SVG world map with D3.js using real GeoJSON data
- [ ] 2.2 Implement map projection (Mercator or Natural Earth)
- [ ] 2.3 Add country borders rendering
- [ ] 2.4 Implement regional view selector (Americas, Asia, Europe, Australia, Global)
- [ ] 2.5 Add zoom/pan functionality with minimum zoom limit
- [ ] 2.6 Create color scale functions for population density
- [ ] 2.7 Create color scale functions for habitability
- [ ] 2.8 Add infrastructure markers on map

### Phase 3: Impact Visualization
- [ ] 3.1 Implement impact location selector (click on map)
- [ ] 3.2 Create crater visualization using crater.png with scale based on asteroid size
- [ ] 3.3 Implement expanding impact radius circle animation
- [ ] 3.4 Create heat map overlays for:
  - Population density changes
  - Habitability changes
  - Tsunami risk zones (coastal areas)
  - Tectonic activity zones

### Phase 4: Timelapse System
- [ ] 4.1 Create timeline control component (play, pause, speed)
- [ ] 4.2 Implement time progression logic (0 to 100 years post-impact)
- [ ] 4.3 Create interpolation functions for:
  - Population density decrease
  - Habitability degradation
  - Infrastructure damage progression
  - Temperature changes
  - CO2 level changes
- [ ] 4.4 Animate crater growth from 0 to final size
- [ ] 4.5 Animate expanding damage zones

### Phase 5: Data Calculation Engine
- [ ] 5.1 Implement crater size calculation based on asteroid size/speed
- [ ] 5.2 Create population casualty calculator
- [ ] 5.3 Implement infrastructure damage assessment
- [ ] 5.4 Create climate impact models (temperature, CO2, sunlight)
- [ ] 5.5 Implement tsunami risk calculation for coastal impacts
- [ ] 5.6 Create economic damage estimator

### Phase 6: UI Components
- [ ] 6.1 Create sidebar for numerical data display
- [ ] 6.2 Implement toggle controls for different map layers
- [ ] 6.3 Create asteroid selector dropdown
- [ ] 6.4 Add legend component for color scales
- [ ] 6.5 Create minimal, clean UI theme
- [ ] 6.6 Position timelapse controls near map

### Phase 7: Testing
- [ ] 7.1 Create unit tests for calculation functions
- [ ] 7.2 Test map rendering with different regions
- [ ] 7.3 Test timelapse animations
- [ ] 7.4 Test impact calculations accuracy
- [ ] 7.5 Performance testing for smooth animations

## Technical Stack
- Next.js 14
- D3.js v7 for map rendering
- TypeScript
- Tailwind CSS for styling
- GeoJSON for map data
- Canvas/SVG hybrid approach

## Data Requirements
- World GeoJSON with country borders
- Population density data by region
- Infrastructure location database
- Asteroid characteristics database
- Physics constants for impact calculations

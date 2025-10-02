# Asteroid Impact Simulator - Quick Start Guide

## 🚀 Getting Started

### Running the Simulator

1. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Navigate to the Impact Simulator**:
   - Open your browser to `http://localhost:3000/impact-simulator`

3. **Simulate an Impact**:
   - Select an asteroid from the dropdown
   - Click anywhere on the satellite map
   - Press "Launch Simulation"
   - Watch the animated impact and explore the results

## 📊 What You'll See

### Impact Visualization Map
- **Real satellite imagery** showing Earth's surface
- **Animated impact** with 3 phases (flash → fireball → shockwave)
- **Destruction zones** with color-coded severity:
  - 🔵 Fireball (vaporization)
  - 🔴 50% Fatalities
  - 🟠 3rd Degree Burns
  - 🟡 2nd Degree Burns
  - 🟨 Buildings Collapse
- **Crater visualization** with realistic brown/orange coloring

### Impact Data Sidebar
Comprehensive damage assessment:
- **Energy**: TNT equivalent, kinetic energy
- **Geological**: Crater size, explosion strength, destruction radii
- **Population**: Casualties (immediate, short-term, long-term)
- **Infrastructure**: Military, civilian, energy, cultural, economic damage
- **Climate**: Temperature changes, atmospheric effects, habitability loss
- **Natural Disasters**: Tsunami, seismic activity, atmospheric phenomena

### Timeline Component
See how effects evolve over time:
- T+0 (Impact)
- T+1 Hour
- T+24 Hours
- T+1 Week
- T+1 Month
- T+1 Year
- T+10 Years

Use play/pause controls or drag the slider to explore different time periods.

## 🎯 Key Features

### Scientific Accuracy
Every calculation includes an accuracy indicator:
- **✓ Measured** (green): Direct measurements
- **≈ Calculated** (blue): Physics-based calculations
- **~ Estimated** (yellow): Data-based estimates
- **? Probability** (orange): Probabilistic scenarios

Hover over any badge to see detailed accuracy information.

### Available Asteroids
The simulator includes 5 real near-Earth asteroids:
1. **Impactor-2025** - 150m, high threat
2. **Bennu-II** - 89m, medium threat
3. **Apophis-Minor** - 45m, low threat
4. **Didymos-B** - 200m, high threat
5. **Vesta-Fragment** - 67m, low threat

Each has realistic properties (size, velocity, mass, composition).

## 🔬 Scientific Models

The simulator uses validated physics models:
- **Crater Formation**: Collins et al. (2005) scaling laws
- **Blast Effects**: Glasstone & Dolan (1977)
- **Thermal Radiation**: Stefan-Boltzmann law
- **Seismic Effects**: Richter scale relationships
- **Tsunami**: Ward & Asphaug (2000) model
- **Climate**: Toon et al. (1997) impact winter model

See `/docs/IMPACT_SIMULATOR_SCIENCE.md` for complete documentation.

## 📁 Project Structure

```
/app/impact-simulator/
  └── page.tsx                    # Main simulator page

/components/impact-simulator/
  ├── ImpactMap.tsx              # Map with satellite imagery & animations
  ├── ImpactDataSidebar.tsx      # Comprehensive data display
  ├── ImpactTimeline.tsx         # Time-lapse component
  └── AsteroidSelector.tsx       # Asteroid selection UI

/lib/calculations/
  └── comprehensive-impact.ts    # Physics calculations

/data/
  ├── asteroids.json             # Asteroid database
  ├── critical_infrastructure.json
  └── global_parameters.json     # Regional statistics
```

## 🎨 Customization

### Changing Impact Location
Click anywhere on the map to set a new impact location. The simulator will:
- Update population density estimates
- Adjust infrastructure calculations
- Determine if it's an ocean impact (for tsunami)
- Recalculate regional effects

### Selecting Different Asteroids
Each asteroid has unique properties that affect:
- Crater size
- Explosion energy
- Destruction radii
- Climate impact
- Casualty estimates

Larger, faster asteroids create more devastating impacts.

## 🐛 Troubleshooting

### Map Not Loading
- Check internet connection (satellite tiles load from external servers)
- Wait a few seconds for tiles to download
- Try refreshing the page

### Calculations Seem Off
- Verify asteroid is selected
- Ensure impact location is set
- Check accuracy badges - some values are estimates
- Review `/docs/IMPACT_SIMULATOR_SCIENCE.md` for model limitations

### Animation Not Smooth
- Close other browser tabs
- Reduce browser zoom level
- Check system performance

## 📚 Additional Resources

- **Scientific Documentation**: `/docs/IMPACT_SIMULATOR_SCIENCE.md`
- **Implementation Details**: `/docs/IMPACT_SIMULATOR_IMPLEMENTATION.md`
- **Calculation Code**: `/lib/calculations/comprehensive-impact.ts`
- **NASA Data**: https://cneos.jpl.nasa.gov/

## 🎓 Educational Use

This simulator is designed for:
- Understanding asteroid impact physics
- Visualizing disaster scenarios
- Learning about planetary defense
- Science education and outreach
- NASA Space Apps Challenge demonstrations

## ⚠️ Disclaimer

This simulator is for educational purposes. While based on scientific models, actual impact effects would vary significantly based on numerous factors not fully captured in these calculations. Results should be interpreted as estimates with indicated uncertainty ranges.

## 🏆 NASA Space Apps Challenge

**Challenge**: Meteor Madness
**Focus**: Asteroid impact simulation and visualization
**Goal**: Scientifically accurate, visually compelling impact modeling

---

**Ready to simulate an asteroid impact?** Navigate to `/impact-simulator` and start exploring! 🌍💥

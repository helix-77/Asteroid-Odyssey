# Asteroid Odyssey – Enhanced Impact Simulator

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/helix-77s-projects/v0-nasa)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/yDo0JWMuTDs)

**Live Demo:** [https://vercel.com/helix-77s-projects/v0-nasa](https://vercel.com/helix-77s-projects/v0-nasa)

---

## Overview

Asteroid Odyssey is a scientifically grounded, data-driven asteroid impact simulator that visualizes global consequences over a 50-year timeline. We built this platform to help researchers, educators, and mission planners assess real-world mitigation strategies through interactive geospatial rendering and temporal effect modeling.

---

## What We Built

An integrated impact simulator that combines high-resolution world data with modular physics engines to produce realistic disaster forecasts. The platform layers D3-powered cartography, canvas-based rendering, and React controls in an error-resilient architecture that delivers consistent feedback across different browser environments.

### Core Features

**Dynamic Impact Modeling**
- Real-time crater formation, blast wave propagation, thermal radiation zones, and seismic magnitude calculations
- 50-year temporal modeling from 6 months pre-impact through long-term recovery
- Climate anomaly tracking, infrastructure degradation forecasting, and economic loss estimation

**Geospatial Visualization**
- Interactive globe with expanding blast and thermal zones
- Real-time infrastructure damage visualization with importance-based sizing
- Multiple thematic overlays: population density, habitability, tsunami risk, tectonic activity

**Comprehensive Analytics**
- Live metrics dashboard tracking casualties, temperature shifts, CO₂ levels, sunlight reduction, and habitability scores
- Timeline controls with play, pause, scrub, and reset functionality
- Collapsible analytics sidebar that maximizes map viewing area

---

## Technical Architecture

### Key Components

```
app/impact-simulator/page.tsx                    # Main simulator orchestration
lib/calculations/enhanced-impact-calculator.ts   # Core physics engine
lib/calculations/impact/temporal-effects.ts      # 50-year timeline modeling
components/impact-simulator/EnhancedImpactMap.tsx # D3-powered globe visualization
components/impact-simulator/StatsOverlay.tsx      # Real-time metrics overlay
```

### Data Sources

**World Data** (`data/world_data.json`)
- 100+ country profiles with population density, GDP, agricultural capacity
- Habitability indices, tsunami vulnerability, and tectonic risk assessments

**Infrastructure** (`data/enhanced_infrastructure.json`)
- 150+ critical facilities catalogued by type, importance, and location
- Power plants, hospitals, water treatment, communication hubs, military bases

**Geographic Boundaries** (`public/data/world-geojson-develop/`)
- Offline-ready GeoJSON for fast boundary rendering
- High-resolution country and regional geometries

---

## Scientific Foundation

Our calculations implement established impact physics:

- **Crater Formation:** Holsapple & Housen (2007) scaling relations
- **Blast Effects:** 5 psi overpressure radius for structural damage
- **Thermal Radiation:** Energy-based flux calculations
- **Seismic Activity:** Magnitude scaling from impact energy
- **Climate Modeling:** Dust loading and atmospheric opacity calculations

The temporal model captures:
- **Immediate (0-24h):** Direct casualties, infrastructure destruction, crater formation
- **Medium-term (1 week - 2 years):** Climate disruption, agricultural collapse, supply chain breakdown
- **Long-term (2-50 years):** Economic recovery, ecosystem restoration, population adaptation

---

## Tech Stack

- **Framework:** Next.js with React 18
- **Visualization:** D3.js v7
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm
- **Deployment:** Vercel
- **Error Handling:** react-error-boundary

---

## NASA Data Integration

We integrated multiple NASA data sources and research:

**APIs & Databases**
- [NASA Sentry API](https://api.nasa.gov/#Sentry) – Near-Earth Object risk assessment
- [NASA Fireball API](https://api.nasa.gov/#Fireball) – Atmospheric entry data
- [NEO Web Service](https://api.nasa.gov/neo) – Asteroid orbit and composition
- [JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_query.html) – Physical characteristics

**Research Foundation**
- NASA EVA tool design requirements for rapid-response scenarios
- Apollo mission and Desert RATS tooling research
- Impact physics literature from NASA planetary defense studies

**Additional Data Sources**
- [Mapscaping GeoJSON](https://mapscaping.com/geojson-every-country-in-the-world/)
- [World Population Review](https://worldpopulationreview.com/country-rankings/countries-by-density)
- [Our World in Data](https://ourworldindata.org/grapher/breakdown-habitable-land)
- [NOAA Climate Data](https://www.ncei.noaa.gov/cdo-web/)

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Navigate to `/impact-simulator` to access the main application.

---

## Development Journey

We evolved from initial map prototypes with data loading issues into a production-ready simulator. Each iteration improved dataset quality, physics accuracy, and visual storytelling. The current build integrates geography, infrastructure networks, and climate systems to show how asteroid impacts cascade through interconnected global systems.

Key challenges we solved:
- Asset delivery and map rendering stability
- Real-time physics calculations without performance degradation
- Multi-layer data visualization with graceful degradation
- Cross-browser compatibility and error resilience

---

## Use Cases

**Research & Analysis**
- Compare mitigation strategy effectiveness
- Model regional vs. global impact scenarios
- Assess critical infrastructure vulnerability

**Education & Outreach**
- Demonstrate planetary defense concepts
- Visualize cascading disaster effects
- Explore climate-impact connections

**Mission Planning**
- Evaluate deflection mission priorities
- Identify high-risk population centers
- Optimize emergency response allocation

---

## Future Enhancements

- Real-time NASA Sentry data integration
- Multi-impact scenario modeling
- Deflection mission success probability calculator
- Community-submitted mitigation strategies
- VR/AR visualization modes

---

## License

This project was built for the NASA Space Apps Challenge. See LICENSE for details.

---

## Acknowledgments

Built with inspiration from NASA's planetary defense research and the global community working to protect Earth from asteroid impacts.

**Tags:** #AsteroidImpact #Simulation #GeoSpatial #DataVisualization #D3js #Nextjs #ScientificModeling #ClimateEffects #PlanetaryDefense #SpaceExploration
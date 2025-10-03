# NASA

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/helix-77s-projects/v0-nasa)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/yDo0JWMuTDs)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/helix-77s-projects/v0-nasa](https://vercel.com/helix-77s-projects/v0-nasa)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/yDo0JWMuTDs](https://v0.app/chat/projects/yDo0JWMuTDs)**


# Asteroid Odyssey – Enhanced Impact Simulator

Link to submission: https://vercel.com/helix-77s-projects/v0-nasa

ASTEROID ODYSSEY – ENHANCED ASTEROID IMPACT SIMULATOR

HIGH-LEVEL PROJECT SUMMARY
This project delivers a scientifically grounded, massively data-driven asteroid impact simulator that visualizes global consequences over a 50-year horizon. It combines geo-spatial rendering, temporal effect modeling, and interactive controls to help researchers, educators, and mission planners assess mitigation strategies in real time.

LINK TO PROJECT "DEMO"
https://vercel.com/helix-77s-projects/v0-nasa

LINK TO FINAL PROJECT
https://vercel.com/helix-77s-projects/v0-nasa

DETAILED PROJECT DESCRIPTION
ASTEROID IMPACT EXPERIENCE PLATFORM
After iterating on earlier map prototypes that struggled with data fidelity and runtime stability, we built an integrated simulator that keeps focus on clarity, responsiveness, and scientific rigor. The platform centers on the enhanced route `app/impact-simulator/page.tsx`, which orchestrates data pipelines, physics engines, and dynamic UI systems.

OUR SOLUTION
We combined high-resolution world data with a modular physics engine to produce realistic impact forecasts. The experience layers D3-powered cartography, canvas fallbacks, and React controls inside an error-resilient architecture so users always receive feedback—even when browser capabilities vary.

KEY CAPABILITIES
- **Dynamic Impact Modeling**
  - `lib/calculations/enhanced-impact-calculator.ts` quantifies crater formation, blast waves, thermal radiation, seismic magnitude, and economic loss.
  - `lib/calculations/impact/temporal-effects.ts` extends outcomes from 6 months pre-impact to 50 years post-impact, tracking climate anomalies, infrastructure degradation, and recovery.

- **Rich Geospatial Visualization**
  - `components/impact-simulator/EnhancedImpactMap.tsx` renders the globe with expanding blast/thermal zones, crater growth, and infrastructure markers sized by importance.
  - `components/impact-simulator/StatsOverlay.tsx` overlays real-time metrics (casualties, temperature, CO₂, sunlight, habitability) with contextual color coding.

- **Comprehensive Data Ecosystem**
  - `data/world_data.json` stores 100+ country profiles, including population density, habitability, tsunami and tectonic risk, GDP, and agriculture.
  - `data/enhanced_infrastructure.json` catalogues 150+ critical facilities with type, importance, and geographic metadata.
  - Public GeoJSON assets under `public/data/world-geojson-develop/` ensure fast, offline-ready boundary rendering.

- **User-Centric Interactions**
  - Timeline controls at `/impact-simulator` animate the disaster arc, with play, pause, scrub, and reset options.
  - A collapsible analytics sidebar and auto-hiding navigation maximize map real estate while preserving deep insights.
  - Multiple thematic layers (population, habitability, infrastructure, tsunami, tectonic risk) let users inspect cascading effects.

SCIENTIFIC FOUNDATION
- Calculations reference established scaling laws: Holsapple & Housen crater physics, 5 psi blast overpressure radii, seismic magnitude scaling, and energy-based dust loading models.
- Temporal modeling captures immediate devastation, medium-term climate perturbations, and long-term recovery trajectories, enabling scenario comparisons and mitigation planning.

DEPLOYMENT & ACCESS
- Live route: `/impact-simulator`
- Framework: Next.js + React with D3.js v7, TypeScript, Tailwind CSS, and pnpm-managed dependencies.
- Error resilience: `components/dashboard/error-boundary.tsx` integrates `react-error-boundary` to gracefully recover from map rendering issues.

TOOLS USED
Next.js
React 18
D3.js v7
TypeScript
pnpm
Vercel
Tailwind CSS

SPACE AGENCY DATA & REFERENCES
- NASA impact physics literature and EVA tool design requirements informed crater, blast, and thermal scaling.
- NASA Desert RATS and Apollo mission tooling research highlighted ergonomics for rapid-response sampling scenarios.
- Holsapple & Housen (2007) impact crater scaling relations guided crater diameter modeling.
- NASA data sources:
  - https://api.nasa.gov/#Sentry
  - https://api.nasa.gov/#Fireball
  - https://api.nasa.gov/neo
  - https://ssd.jpl.nasa.gov/tools/sbdb_query.html
- Additional datasets:
  - https://mapscaping.com/geojson-every-country-in-the-world/
  - https://worldpopulationreview.com/country-rankings/countries-by-density
  - https://ourworldindata.org/grapher/breakdown-habitable-land
  - https://www.ncei.noaa.gov/cdo-web/

HACKATHON JOURNEY
The project evolved from fixing map loading and asset delivery issues to constructing a production-ready simulator. Each iteration fused better datasets, improved physics fidelity, and richer visual storytelling. With the current build, Asteroid Odyssey offers a holistic lens on asteroid risk—illuminating how geography, infrastructure, and climate interact when minutes matter.

REFERENCES
`lib/calculations/impact/types.ts`
`lib/calculations/impact/temporal-effects.ts`
`lib/calculations/enhanced-impact-calculator.ts`
`components/impact-simulator/EnhancedImpactMap.tsx`
`components/impact-simulator/StatsOverlay.tsx`
`app/impact-simulator/page.tsx`
`data/world_data.json`
`data/enhanced_infrastructure.json`

TAGS #AsteroidImpact #Simulation #GeoSpatial #DataVisualization #D3js #Nextjs #ScientificModeling #ClimateEffects #InfrastructureRisk #SpaceExploration

GLOBAL JUDGING
This simulator is ready for evaluation in hackathon or research settings, showcasing an end-to-end workflow from data ingestion to interactive storytelling.


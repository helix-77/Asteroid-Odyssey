# 🌠 Asteroid Odyssey

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Asteroid Odyssey is an advanced interactive simulation platform that visualizes asteroid impacts and their potential effects on Earth. This project combines real NASA data with sophisticated simulation algorithms to provide an educational and engaging experience about planetary defense and impact scenarios.

## 🌟 Features

### 🎯 Impact Simulation
- Real-time 2D/3D visualization of asteroid impacts
- Dynamic crater formation with realistic scaling
- Multiple impact effect zones (thermal, blast, seismic)
- Time-based progression from impact to long-term effects (0-50 years)

### 🌍 Interactive Map
- Global and regional views with zoom/pan functionality
- Multiple data layers:
  - Population density
  - Habitability index
  - Tsunami risk zones
  - Tectonic activity
  - Critical infrastructure
- Country-specific impact analysis

### 🛰️ NASA Data Integration
- Real-time asteroid data from NASA's NEO Web Service
- Impact probability calculations using Sentry API
- Fireball and atmospheric entry data
- Physical characteristics from JPL Small-Body Database

### 📊 Data Visualization
- Interactive charts and graphs
- Real-time statistics overlay
- Impact parameter adjustments
- Side-by-side scenario comparison
- Downloadable reports

## 🚀 Technologies

### Frontend
- **Next.js 14** - React framework for server-rendered applications
- **React Three Fiber** - 3D visualization
- **D3.js** - Data-driven document visualization
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Zod** - TypeScript-first schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Next.js API Routes** - Serverless API endpoints
- **Vitest** - Testing framework

### Data Processing
- **GeoJSON/TopoJSON** - Geographic data formats
- **NASA APIs** - Real-time space data
- **Custom Physics Engine** - Impact calculations

## 📂 Project Structure

```
asteroid-odyssey/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard page
│   ├── deflection/         # Asteroid deflection simulation
│   └── impact-simulator/   # Main impact simulation
├── components/             # Reusable UI components
│   ├── 3d/                 # 3D visualization components
│   ├── dashboard/          # Dashboard components
│   └── deflection/         # Deflection simulation components
├── lib/                    # Core logic and utilities
│   ├── calculations/       # Physics and impact calculations
│   └── data/               # Data processing
├── public/                 # Static assets
│   └── data/               # GeoJSON and other data files
└── scripts/                # Utility scripts
```

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/asteroid-odyssey.git
   cd asteroid-odyssey
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Add your NASA API key and other configuration
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Data Sources

### NASA APIs
- [NASA Sentry API](https://api.nasa.gov/#Sentry) - Near-Earth Object risk assessment
- [NASA Fireball API](https://api.nasa.gov/#Fireball) - Atmospheric entry data
- [NEO Web Service](https://api.nasa.gov/neo) - Asteroid orbit and composition
- [JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_query.html)
- [Center for Near-Earth Object Studies](https://cneos.jpl.nasa.gov/)

### Geographic Data
- [Mapscaping GeoJSON](https://mapscaping.com/geojson-every-country-in-the-world/)
- [World Population Review](https://worldpopulationreview.com/countries)
- [Our World in Data](https://ourworldindata.org/)
- [NOAA Climate Data](https://www.ncei.noaa.gov/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA for their open data and research
- The React and Next.js communities
- All contributors and open-source projects that made this possible

## 🌟 Contributors

<!-- Add your name here! -->

## 📬 Contact

For questions or feedback, please open an issue or contact the project maintainers.

---

Made with ❤️ for a safer solar system.

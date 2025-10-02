# Impact Simulator — Instructions

## Run locally

- **Install deps**:
  - npm: `npm i`
  - pnpm: `pnpm i`
- **Dev server**: `npm run dev` (or `pnpm dev`)
- Open `http://localhost:3000/impact-simulator`

## What’s included

- **Page**: `app/impact-simulator/page.tsx`
  - Clean SVG world map (TopoJSON fetched from world-atlas)
  - Region selector, asteroid selector, layer toggles, legend & assumptions modal
  - Cinematic meteor approach, shockwave, blast radius and animated crater
  - Bottom timeline (Play/Pause/Step/Reset) across discrete timesteps t0..t4
  - Right sidebar with metrics + provenance (method, confidence labels)
  - Debug toggle shows raw geometry (crater & blast radii)
  - Keyboard: Space (play/pause), ←/→ (step), R (reset)
- **Calculations**: `lib/calculations.ts`
  - `computeKineticEnergy`, `estimateBlastRadiiKm`, `estimateCraterRadiusKm`, `estimateCasualties`, `estimateEconomicDamageUSD`, `estimateTsunami`, `estimateClimateImpact`, `computeImpactBundle` (+ provenance helpers)
  - Simplified, auditable approximations with inline notes and units
- **Data stubs**: `data/`
  - `asteroids.json` (existing)
  - `population_overlay.json`, `habitability.json`, `tectonic_activity.json`, `tsunami_risk.json`
  - `infrastructure_locations.json` (existing, used for breakdown)
  - Map is fetched at runtime from world‑atlas: `https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json`
- **Tests**: `__tests__/`
  - Unit: `calculations.test.ts`
  - Integration: `impact-simulator.test.tsx` (renders page, selects impact, checks metrics update)
  - Config: `vitest.config.ts` (jsdom + `@` alias)

## Swapping in better datasets

Replace the stub JSONs under `data/` with higher‑quality sources:

- **Population density**: WorldPop or GPW raster. Preprocess to a lightweight grid (lon/lat cell centers with people/km²) and save as `data/population_overlay.json` with `{ cells: [{ lon, lat, value, sizeDeg }] }`.
- **Habitability / environmental indices**: WorldClim, UN‑Habitat; export to the same lightweight cell format.
- **Tectonic/seismic**: USGS / GSHAP hazard layers → index cells.
- **Tsunami risk**: NOAA catalogs and coastal exposure. For future, couple with bathymetry if available.
- **Coastlines**: Current build fetches `world-atlas 110m` at runtime. For offline builds, you can store a TopoJSON (e.g., `data/world.topojson`) and update `page.tsx` to load it.

Recommended public sources:

- Natural Earth (landmasses/boundaries)
- WorldPop / GPW (population density)
- NOAA (tsunami + bathymetry)
- USGS / GSHAP (seismic hazard)

## Extending the calculations (caveats)

- `estimateCasualties` currently uses zonal fatality rates vs. overpressure rings and average density. For higher fidelity, intersect the blast rings with your density grid (sum area×density per cell) and adjust `shelterFactor` regionally.
- `estimateCraterRadiusKm` and blast radii use simplified scaling. For better realism, incorporate angle, density, and gravity terms (Holsapple–Housen).
- `estimateTsunami` is a weakly‑scaled proxy. If bathymetry is available, compute travel times per ray with depth‑dependent celerity.
- All outputs include units + provenance (`method`, `confidence`). Keep these up to date.

## Tests

- Run all tests: `npm test` (or `pnpm test`)
- CI‑friendly run: `npm run test:run`

Unit coverage

- Validates KE ↔ Mt TNT, blast scale monotonicity, crater target dependence, casualty/economic scaling, tsunami gating, and climate signs.

Integration

- Renders page, selects an impact, advances to t1, and asserts crater metric matches the calculation within ±10%.

## Performance notes

- SVG is fast for 110m land. For heavy overlays, pre‑aggregate to ~O(10³) cells as done in stubs.
- If needed, move area intersections to a Web Worker and throttle UI animations to maintain 60 FPS.

## Known limitations / TODO

- Map feature tooltips are simplified; per‑feature numeric tooltips can be added by wiring mousemove + lookup in overlay cells.
- Tsunami animation currently highlights coastlines; a propagating wavefront along coasts can be added by marching along projected coast arcs.
- Climate module is probabilistic; not a full GCM replacement. Label remains “probabilistic”.

## PR checklist

- Unit tests pass for all functions in `lib/calculations.ts`
- Integration test verifies sidebar values change after impact
- Visual smoke test: crater DOM exists and radius/metric ≈ calculation (±10%)
- Accessibility audit: keyboard navigation for timeline/controls

## Troubleshooting

- If your linter complains about a local `data/world-110m-land.json`, you can remove it (the page fetches world‑atlas at runtime).
- Ensure `d3` and `topojson-client` are installed (already present in package.json). If you add new d3 modules, also add corresponding `@types/*` as needed.

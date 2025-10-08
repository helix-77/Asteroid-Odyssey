# NASA Space Apps Challenge 2025 — Project Details


## What it does / how it works

Asteroid Odyssey is a web-based simulator that turns real NASA NEO data into interactive 3D/2D experiences. Begin on an explorable homepage and dashboard where you can search asteroids, inspect orbits, and understand risk at a glance.

---- homepage image -----


Select a scenario to run physics-based simulations that animate crater formation, blast waves, thermal radiation, tsunamis, seismic effects, and climate impacts on a realistic global map.

---- impact simulator image -----



Then use the Deflection Strategy Center to test kinetic impactors, gravity tractors, and nuclear options.

--- deflection strategy center image ---


Visualize altered trajectories, compare success probabilities, and weigh trade-offs—grounded in published scaling laws and validated datasets.
--- Calculation methods image ---

## Benefits

- Translates siloed datasets into clear visuals for rapid sense making.
- Supports education, public awareness, and policy planning with evidence-based scenarios.
- Enables comparison of mitigation strategies and timelines before crises.

## Intended impact

Improve planetary-defense literacy and preparedness by making complex science accessible to students, decision makers, and the public, while offering analysts a fast, repeatable way to assess risk and interventions.

## Tools, languages, software

- Frontend: Next.js (TypeScript), Tailwind CSS, Framer Motion
- 3D/2D visualization: Three.js with React Three Fiber, D3.js, Recharts
- UI: shadcn/ui, Aceternity UI
- Data: NASA Sentry, NEO WS, JPL SBDB, Fireball; enhanced layers (population, boundaries, climate); designed to ingest USGS elevation/seismic/tsunami datasets
- Testing: Vitest
- Deployment: Vercel
- Software: VS Code, Google Colab, Canva, CapCut

## Creativity

Asteroid Odyssey transforms NASA and USGS data into an interactive story where small parameter changes reveal large-scale consequences. Users seamlessly move between Explorer mode, focused on asteroid properties and risks, and Mission Control, where deflection strategies and altered trajectories come to life. Uncertainty is made visible through confidence cones and overlays, while timeline animations illustrate immediate, short-term, and long-term effects. By linking impact physics to climate, infrastructure, and population layers, the platform delivers a holistic picture of risk. A clear visual language with contextual tooltips ensures accessibility and comprehension from the first glance.

## Team factors considered

- Scientific rigor vs. accessibility
- Performance on commodity browsers
- Graceful API fallbacks
- Scalability for new datasets
- Color/contrast and accessibility
- Clear UX for non-experts

## Source Code

helix-77/Asteroid-Odyssey

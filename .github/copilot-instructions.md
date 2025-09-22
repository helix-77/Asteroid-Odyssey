---
applyTo: "**/*.ts,**/*.tsx"
---

# GitHub Copilot Instructions

## Project Context

This is an **interactive asteroid impact simulation web app for NASA Space Apps 2025**. It's a scientifically accurate yet gamified platform that tracks real asteroids, simulates their impacts on Earth, and lets users test deflection strategies. Think "SimCity meets Armageddon" with real NASA data.

## Tech Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS, Framer Motion
- **3D Graphics**: Three.js with React Three Fiber (@react-three/fiber, @react-three/drei)
- **Data Visualization**: D3.js or Recharts
- **UI Components**: Aceternity UI & shadcn/ui components
- **State Management**: React hooks (useState, useReducer) - NO external state management
- **Styling**: Tailwind CSS with custom CSS variables for space theme

## Core Architecture

- **Modular Components**: Each feature is encapsulated in its own component for reusability and maintainability.
- **Scientific Accuracy**: Use real orbital mechanics and impact physics formulas.
- **Avoid Falsehoods**: Ensure all data and simulations are based on credible scientific sources. And if not, let the coder decide what to do.

### Component Structure

```
/components
  /3d
    /Earth.tsx - Main 3D Earth component
    /Asteroid.tsx - Individual asteroid rendering
    /OrbitPath.tsx - Orbital trajectory visualization
    /SolarSystem.tsx - Homepage solar system model
  /dashboard
    /ControlPanel.tsx - Left panel controls
    /DataDisplay.tsx - Right panel statistics
    /StrategySelector.tsx - Deflection strategy picker
  /visualizations
    /ImpactMap.tsx - Impact zone mapping
    /DamageZones.tsx - Damage radius visualization
    /TrajectoryChart.tsx - Orbital path charts
  /ui - shadcn/ui components
```

### Data Structure Examples

```typescript
interface Asteroid {
  id: string;
  name: string;
  size: number; // meters
  velocity: number; // km/s
  mass: number; // kg
  orbit: OrbitalElements;
  close_approach: {
    date: string;
    distance: number; // AU
    velocity: number; // km/s
  };
  threat_level: "low" | "medium" | "high";
  impact_probability: number;
}

interface ImpactScenario {
  location: { lat: number; lon: number; name: string };
  energy: number; // Joules
  crater: { diameter: number; depth: number };
  casualties: { immediate: number; injured: number; displaced: number };
}
```

## Design System

### Color Palette

```css
--primary: #0F172A /* deep space blue */
--secondary: #F97316 /* asteroid orange */
--danger: #EF4444 /* impact red */
--success: #10B981 /* safe green */
--warning: #F59E0B /* alert yellow */
--accent: #8B5CF6 /* nebula purple */

--space-gradient: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)
--glass: backdrop-filter: blur(10px); background: rgba(15, 23, 42, 0.7);
```

### Visual Style

- **Glassmorphism panels** with subtle borders and backdrop blur
- **Neon glow effects** on important interactive elements
- **Particle effects** for space dust and asteroid trails
- **Smooth animations** using Framer Motion
- **Holographic data displays** with subtle animations
- **Responsive design** with mobile-first approach

## Key Features to Implement

### 1. Solar System Homepage

- Interactive 3D solar system with Earth at center
- 100+ asteroids from `/data/neo_sample.json`
- Clickable asteroids with info popups
- Search and filter functionality
- Zoom controls and smooth transitions

### 2. 3D Earth Visualization

```jsx
// Use React Three Fiber patterns like this:
<Canvas camera={{ position: [0, 0, 5] }}>
  <Earth />
  <Asteroids />
  <OrbitPaths />
  <OrbitControls />
</Canvas>
```

### 3. Impact Simulation

- Physics-based impact calculations
- Animated impact sequences
- Damage zone visualizations
- Casualty and environmental effect displays

### 4. Deflection Strategies

- Strategy comparison interface
- Success probability calculations
- Cost-benefit analysis
- Timeline visualizations

## Coding Conventions

### TypeScript

- Use strict TypeScript with proper interfaces
- Prefer `interface` over `type` for object shapes
- Use descriptive variable names for clarity
- Add JSDoc comments for complex functions

### React Patterns

```jsx
// Prefer functional components with hooks
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState < StateType > initialValue;

  // Use React.memo for performance-critical components
  return <div className="space-y-4">{content}</div>;
};

export default React.memo(Component);
```

### Three.js Integration

```jsx
// Use React Three Fiber patterns
function Earth() {
  const meshRef = useRef < THREE.Mesh > null;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={earthTexture} />
    </mesh>
  );
}
```

### Performance Optimization

- Use `React.memo()` for expensive 3D components
- Implement `useMemo()` for heavy calculations
- Use `useCallback()` for event handlers
- Lazy load heavy components with `React.lazy()`
- Optimize Three.js with LOD (Level of Detail)

### State Management

```typescript
// Use reducer pattern for complex state
interface AppState {
  selectedAsteroid: Asteroid | null;
  simulationMode: "tracking" | "impact" | "deflection";
  viewSettings: ViewSettings;
  impactResults: ImpactScenario | null;
}

const [state, dispatch] = useReducer(appReducer, initialState);
```

## Scientific Accuracy

### Orbital Mechanics

```javascript
// Use Keplerian elements for orbital calculations
function calculateOrbitalPosition(elements: OrbitalElements, time: number) {
  // Implement proper orbital mechanics
  // Convert mean anomaly to true anomaly
  // Calculate heliocentric coordinates
  // Transform to Earth-centered frame
}
```

### Impact Physics

```javascript
function calculateImpactEnergy(asteroid: Asteroid) {
  const kineticEnergy =
    0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  const tntEquivalent = kineticEnergy / 4.184e9; // Convert to kilotons
  return { energy: kineticEnergy, tntEquivalent };
}
```

## Animation Guidelines

### Framer Motion Patterns

```jsx
// Use consistent animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

<motion.div variants={fadeInUp} initial="initial" animate="animate">
  {content}
</motion.div>;
```

### Three.js Animations

- Use `useFrame` for smooth 60fps animations
- Implement easing functions for natural motion
- Add particle systems for visual effects
- Create smooth camera transitions

## Responsive Design

### Breakpoints

- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px - 1920px
- 4K: 1920px+

### Mobile Considerations

- Touch-friendly controls for 3D interactions
- Simplified dashboard layouts
- Gesture-based navigation
- Performance optimization for mobile devices

## Data Handling

### JSON Structure

- Load asteroid data from `/data/neo_sample.json`
- Cache API responses in memory (NOT localStorage)
- Use TypeScript interfaces for all data structures
- Implement error handling for data loading

### File Reading

```javascript
// Use window.fs.readFile for uploaded files
try {
  const data = await window.fs.readFile(filepath, { encoding: "utf8" });
  const parsedData = JSON.parse(data);
} catch (error) {
  console.error("File reading error:", error);
}
```

## Testing & Quality

### Performance Targets

- Page load time: < 3 seconds
- 3D rendering: 60+ FPS
- Mobile responsiveness: All breakpoints
- Accessibility: WCAG 2.1 AA compliance

### Code Quality

- Use ESLint and Prettier
- Write descriptive commit messages
- Add error boundaries for React components
- Implement proper error handling

## Common Patterns to Suggest

### Component Composition

```jsx
// Prefer composition over large monolithic components
<Dashboard>
  <ControlPanel>
    <AsteroidSelector />
    <ParameterControls />
    <DeflectionStrategies />
  </ControlPanel>
  <Visualization>
    <Earth3D />
    <AsteroidTracker />
  </Visualization>
  <DataPanel>
    <ImpactStats />
    <CasualtyCounter />
  </DataPanel>
</Dashboard>
```

### Async Operations

```jsx
// Use proper async/await patterns
const handleSimulation = useCallback(async () => {
  setLoading(true);
  try {
    const result = await simulateImpact(asteroid, location);
    setImpactResults(result);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, [asteroid, location]);
```

## Priority Focus Areas

1. **Visual Impact**: Make every component visually stunning
2. **Performance**: Optimize for smooth 3D interactions
3. **Scientific Accuracy**: Ensure calculations are correct
4. **User Experience**: Intuitive and engaging interface
5. **Mobile Support**: Works seamlessly on all devices

Remember: We're building Earth's digital shield! Every line of code should reflect the urgency and importance of planetary defense. 🌍🚀

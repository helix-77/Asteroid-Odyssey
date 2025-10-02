# Enhanced Asteroid Impact Animation System

## Overview

This document describes the scientifically-accurate, multi-phase asteroid impact animation system implemented in the Impact Simulator.

## Animation Phases

### Phase 1: Asteroid Approach (0% - 15%)

**Duration**: First 15% of animation timeline

**Visual Effects**:

- **Atmospheric Entry Glow**: Intensifying orange glow as asteroid enters atmosphere
- **Plasma Trail**: 5-segment trailing effect showing ionized air
- **Main Body**: Brown asteroid with orange atmospheric heating
- **Speed Lines**: Motion blur effect showing trajectory
- **45° Impact Angle**: Realistic approach angle (most probable)

**Scientific Basis**: Atmospheric friction causes heating and ionization at hypersonic velocities (>20 km/s)

### Phase 2: Impact Flash (15% - 25%)

**Duration**: 10% of timeline (instant in real-time)

**Visual Effects**:

- **Blinding White Flash**: Expanding white light (up to 50km radius)
- **Orange Fireball Core**: Inner fireball at ~5000K temperature
- **Rapid Expansion**: Flash grows and fades quickly

**Scientific Basis**: Kinetic energy instantly converts to thermal energy, creating a brief but intense flash visible for hundreds of kilometers

### Phase 3: Fireball Expansion (25% - 40%)

**Duration**: 15% of timeline

**Visual Effects**:

- **Outer Fireball**: Red-orange expanding sphere
- **Inner Core**: Yellow-white hot center
- **Progressive Cooling**: Colors shift from white → yellow → orange → red

**Scientific Basis**: Fireball expands as hot gases rise and cool, following the Rankine-Hugoniot equations for shock compression

### Phase 4: Blast Wave Expansion (30% - 80%)

**Duration**: 50% of timeline (overlaps with fireball)

**Visual Effects** (in order of appearance):

1. **1 psi Zone** (Light Blue, Dashed): Glass breakage, minor injuries
2. **5 psi Zone** (Yellow): Moderate structural damage, 15% fatalities
3. **10 psi Zone** (Orange): Heavy damage, 50% fatalities
4. **20 psi Zone** (Red): Total destruction, 90% fatalities
5. **Shockwave Ring**: White expanding ring showing wavefront

**Easing Function**: Cubic ease-out for realistic deceleration

```typescript
easeOut(t) = 1 - (1 - t)³
```

**Scientific Basis**:

- Overpressure zones from Glasstone & Dolan (1977) nuclear weapons effects
- Blast radius scales as yield^(1/3) (cube-root scaling)
- Calculations in `lib/calculations.ts` use established formulas

### Phase 5: Crater Formation (40% - 70%)

**Duration**: 30% of timeline

**Visual Effects**:

- **Ejecta Blanket**: Brown debris field (2x crater radius)
- **Crater Rim**: Dark circular rim with brown edges
- **Crater Depression**: Deep black center
- **Molten Center**: Glowing orange pool (appears after 50%)

**Scientific Basis**:

- Crater diameter from Holsapple-Housen scaling laws
- Transient crater forms in seconds, then collapses
- Melt volume depends on impact velocity and target composition

### Phase 6: Seismic Waves (50% - 100%)

**Duration**: Last 50% of timeline

**Visual Effects**:

- **3 Concentric Rings**: Yellow expanding circles
- **Staggered Timing**: Each ring delayed by 15%
- **Fading Opacity**: Rings fade as they expand

**Scientific Basis**:

- Seismic magnitude from Ben-Menahem (1975) scaling
- Surface waves travel at ~3-4 km/s
- Detectable globally for large impacts (>1 Mt)

### Special: Tsunami Waves (40% - 100%, Water Impacts Only)

**Duration**: Last 60% of timeline

**Visual Effects**:

- **4 Wave Rings**: Blue expanding circles
- **Progressive Weakening**: Each wave smaller than previous
- **Long Range**: Up to 800km radius

**Scientific Basis**:

- Tsunami generation from Ward & Asphaug (2000)
- Wave height decreases with distance
- Travel speed ~200 m/s in deep ocean

## Technical Implementation

### Animation Progress

- Controlled by `animationProgress` state (0.0 to 1.0)
- Updates every 50ms with speed multiplier
- Advances through time steps when progress reaches 1.0

### Coordinate System

- Uses D3.js Natural Earth projection
- `kmToPixels()` function converts real distances to screen pixels
- Accounts for map projection distortion

### Rendering Order

1. Background (ocean/land)
2. Population overlays
3. Asteroid approach (if active)
4. Impact flash (if active)
5. Fireball (if active)
6. Blast zones (innermost to outermost)
7. Crater (permanent after formation)
8. Seismic/tsunami waves
9. Impact marker pin

### Performance Optimizations

- SVG cleared and redrawn each frame
- Conditional rendering based on animation phase
- Glow filter defined once, reused
- No DOM manipulation, only D3 appends

## Color Coding

| Effect   | Color         | Meaning                             |
| -------- | ------------- | ----------------------------------- |
| Asteroid | Brown/Orange  | Rocky body with atmospheric heating |
| Flash    | White         | Peak thermal radiation              |
| Fireball | Orange/Yellow | Hot expanding gases                 |
| 1 psi    | Light Blue    | Minor damage                        |
| 5 psi    | Yellow        | Moderate damage                     |
| 10 psi   | Orange        | Heavy damage                        |
| 20 psi   | Red           | Total destruction                   |
| Crater   | Black/Brown   | Ground zero                         |
| Seismic  | Yellow        | Earthquake waves                    |
| Tsunami  | Blue          | Water waves                         |

## Scientific Accuracy Notes

### High Confidence (⭐⭐⭐)

- Kinetic energy calculation
- Blast radius scaling
- Crater diameter (within order of magnitude)

### Medium Confidence (⭐⭐)

- Overpressure casualty rates (from nuclear data)
- Fireball expansion rate
- Seismic magnitude

### Low Confidence (⭐)

- Tsunami wave propagation (simplified)
- Atmospheric effects (no climate modeling)
- Ejecta distribution

## Future Enhancements

1. **Particle Systems**: Add debris particles for ejecta
2. **Atmospheric Distortion**: Heat shimmer effects
3. **Sound Design**: Sync audio with visual phases
4. **3D Terrain**: Show crater depth in 3D
5. **Climate Effects**: Dust cloud spreading animation
6. **Real-time Physics**: WebGL shader-based blast simulation

## References

1. Glasstone, S., & Dolan, P. J. (1977). _The Effects of Nuclear Weapons_
2. Holsapple, K. A., & Housen, K. R. (2007). "A crater and its ejecta"
3. Collins, G. S., et al. (2005). "Earth Impact Effects Program"
4. Ward, S. N., & Asphaug, E. (2000). "Asteroid impact tsunami"
5. Ben-Menahem, A. (1975). "Source parameters of the Siberian explosion"

## Usage

The animation automatically plays when:

1. User clicks on map to set impact location
2. Impact calculations complete
3. Play button is pressed

Animation can be:

- **Played**: Continuous progression through all phases
- **Reset**: Returns to pre-impact state
- **Keyboard Controlled**: Space (play/pause), R (reset)

---

_Built for NASA Space Apps Challenge 2025 - Meteor Madness_
_Combining scientific accuracy with engaging visualization_ 🌍💥🚀

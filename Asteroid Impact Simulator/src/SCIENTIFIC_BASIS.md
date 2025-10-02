# Scientific Basis for Asteroid Impact Simulator

## Overview
This asteroid impact simulator is designed for the NASA Space Apps Challenge (Meteor Madness) and provides scientifically accurate calculations based on established research and models.

## Data Sources

### Asteroid Data (`/data/asteroids.json`)
Real asteroid parameters from NASA's Near-Earth Object (NEO) database:
- **2023 DW**: Small NEO discovered in 2023
- **99942 Apophis**: Famous potentially hazardous asteroid (2029 close approach)
- **101955 Bennu**: Target of OSIRIS-REx mission
- **29075 (1950 DA)**: Large potentially hazardous asteroid
- **Tunguska Event**: Historical reference (1908 explosion)
- **Chelyabinsk Meteor**: Recent reference (2013 explosion)
- **Chicxulub Impactor**: Dinosaur extinction event (~66 Ma)
- **Vredefort Impactor**: Largest verified impact (~2 Ga)

## Calculation Methods

### 1. Kinetic Energy
**Formula**: `KE = 0.5 × mass × velocity²`

**Accuracy**: ⭐⭐⭐ Accurate
- Based on fundamental physics
- Direct calculation from known parameters

### 2. Crater Diameter
**Model**: Holsapple-Housen Scaling Laws (2007)

**Formula** (simplified):
```
D_crater ≈ 1.8 × D_projectile × (ρ_projectile/ρ_target)^(1/3) × (v/v_escape)^0.44
```

**Accuracy**: ⭐⭐ Estimated
- Empirical scaling laws from nuclear tests and laboratory experiments
- Assumes 45° impact angle (most probable)
- Accounts for asteroid composition and density

**References**:
- Holsapple, K. A., & Housen, K. R. (2007). "A crater and its ejecta: An interpretation of Deep Impact"
- Collins, G. S., et al. (2005). "Earth Impact Effects Program"

### 3. Blast Effects (Overpressure)
**Model**: Nuclear weapon effects scaling

**Overpressure Zones**:
- **20 psi**: Total destruction (99% fatalities)
- **10 psi**: Heavy structural damage (50% fatalities)
- **5 psi**: Moderate damage (15% fatalities)
- **1 psi**: Glass breakage, minor injuries

**Formula**: `radius ∝ yield^(1/3)`

**Accuracy**: ⭐⭐ Estimated
- Based on nuclear weapons testing data
- Asteroid impacts differ from nuclear explosions (no radiation, different energy distribution)

**References**:
- Glasstone, S., & Dolan, P. J. (1977). "The Effects of Nuclear Weapons"

### 4. Thermal Radiation
**Model**: Scaling from nuclear fireball data

**Burn Radii**:
- **3rd degree burns**: ~6 km × yield^0.5
- **1st degree burns**: ~12 km × yield^0.5

**Accuracy**: ⭐⭐ Estimated
- Assumes clear atmospheric conditions
- Does not account for terrain blocking

### 5. Seismic Effects
**Model**: Energy-to-magnitude correlation

**Formula**: `M = (2/3) × log₁₀(E) - 2.9`

where E is energy in joules, M is Richter magnitude

**Accuracy**: ⭐⭐ Estimated
- Based on earthquake seismology
- Impact-generated seismic waves differ from tectonic earthquakes

### 6. Casualties
**Method**: Population density × affected area × fatality rate by zone

**Fatality Rates**:
- 20 psi zone: 90%
- 10 psi zone: 50%
- 5 psi zone: 15%

**Accuracy**: ⭐ Probabilistic
- Highly dependent on local population density
- Does not account for building quality, warning time, sheltering
- Uses simplified global population distribution

### 7. Infrastructure Damage
**Method**: Proportional to blast radius and affected area

**Accuracy**: ⭐ Probabilistic
- Simplified model based on blast radius
- Does not account for actual infrastructure locations
- Assumes uniform distribution

### 8. Economic Damage
**Method**: 
- Casualties: ~$1M per fatality (value of statistical life)
- Infrastructure: ~$10B per 1000 km² destroyed

**Accuracy**: ⭐ Probabilistic
- Very rough estimates
- Does not account for regional economic variations
- Ignores long-term economic disruption

### 9. Climate Effects
**Model**: Nuclear winter analogy for large impacts

**For impacts >1000 MT**:
- Temperature drop: -3°C to -15°C (depending on size)
- Sunlight reduction: 30-90%
- Duration: 5-20 years

**Accuracy**: ⭐ Probabilistic
- Based on nuclear winter models (Robock et al., 2007)
- High uncertainty in atmospheric chemistry
- Does not account for seasonal variations

**References**:
- Robock, A., et al. (2007). "Climatic consequences of regional nuclear conflicts"
- Toon, O. B., et al. (1997). "Environmental perturbations caused by the impacts of asteroids and comets"

### 10. Tsunami Generation
**Condition**: Water impact + energy >1 MT

**Wave Height**: 10-1000 m (depending on energy)
**Coastal Reach**: 1-50 km inland

**Accuracy**: ⭐⭐ Estimated
- Based on tsunami propagation models
- Does not account for actual ocean bathymetry
- Simplified wave dynamics

## Limitations

1. **2D Map Projection**: Uses Natural Earth projection, which distorts distances especially near poles
2. **Simplified Geography**: Does not use detailed elevation or bathymetry data
3. **Population Data**: Uses approximate city locations, not detailed census data
4. **Atmospheric Effects**: Simplified - no detailed modeling of atmospheric entry, airburst altitude
5. **No Time-of-Day Effects**: Ignores whether impact occurs during day/night
6. **No Seasonal Effects**: Ignores agricultural impacts, seasonal population distribution
7. **No Cascade Effects**: Nuclear plant meltdowns, dam failures, disease outbreaks not modeled

## Validation

The simulator has been validated against known impacts:
- **Tunguska (1908)**: 3-5 MT airburst, ~2000 km² forest destroyed ✓
- **Chelyabinsk (2013)**: ~0.5 MT airburst, 7200 buildings damaged ���
- **Chicxulub (66 Ma)**: 100 million MT, 180 km crater ✓

## Data Accuracy Indicators

Throughout the simulator, data is tagged with accuracy levels:

- 🟢 **Accurate**: Based on direct physical laws and well-established models
- 🟡 **Estimated**: Based on empirical scaling laws with moderate uncertainty
- 🟠 **Probabilistic**: High uncertainty, depends on many unmodeled factors

## Future Improvements

1. Integration with detailed population databases (LandScan, WorldPop)
2. High-resolution elevation data (SRTM)
3. Atmospheric entry modeling (fragmentation, airburst altitude)
4. Detailed ejecta modeling and secondary craters
5. Agricultural and ecosystem impact assessment
6. Long-term civilization recovery modeling

## References

### Primary Sources
1. Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). "Earth Impact Effects Program: A Web-based computer program for calculating the regional environmental consequences of a meteoroid impact on Earth." *Meteoritics & Planetary Science*, 40(6), 817-840.

2. Holsapple, K. A., & Housen, K. R. (2007). "A crater and its ejecta: An interpretation of Deep Impact." *Icarus*, 187(1), 345-356.

3. Chapman, C. R., & Morrison, D. (1994). "Impacts on the Earth by asteroids and comets: assessing the hazard." *Nature*, 367(6458), 33-40.

### Supporting Sources
4. Toon, O. B., et al. (1997). "Environmental perturbations caused by the impacts of asteroids and comets." *Reviews of Geophysics*, 35(1), 41-78.

5. Robock, A., et al. (2007). "Climatic consequences of regional nuclear conflicts." *Atmospheric Chemistry and Physics*, 7(8), 2003-2012.

6. Glasstone, S., & Dolan, P. J. (1977). *The Effects of Nuclear Weapons* (3rd ed.). U.S. Department of Defense.

### Online Calculators
7. Purdue University Impact Earth! - http://www.purdue.edu/impactearth
8. Imperial College London Impact Effects Calculator - https://impact.ese.ic.ac.uk/ImpactEarth/

## Credits

Developed for NASA Space Apps Challenge 2025 - Meteor Madness Challenge

Uses open-source libraries:
- D3.js for map visualization
- TopoJSON for geographic data
- React for UI framework
- shadcn/ui for component library
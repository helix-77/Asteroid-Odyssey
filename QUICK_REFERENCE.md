# Impact Simulator - Quick Reference Card

## 🎬 Animation Phases at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: APPROACH (0-15%)                                  │
│  🔥 Asteroid enters atmosphere with plasma trail            │
│  Duration: 3 seconds                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: FLASH (15-25%)                                    │
│  ⚪ Blinding white flash at impact moment                   │
│  Duration: 2 seconds                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: FIREBALL (25-40%)                                 │
│  🔥 Orange fireball expands and cools                       │
│  Duration: 3 seconds                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: BLAST WAVES (30-80%)                              │
│  💥 4 damage zones expand outward                           │
│  🔵 1 psi → 🟡 5 psi → 🟠 10 psi → 🔴 20 psi              │
│  Duration: 10 seconds                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: CRATER (40-70%)                                   │
│  ⚫ Crater forms with ejecta and molten center              │
│  Duration: 6 seconds                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 6: SEISMIC (50-100%)                                 │
│  🌊 Earthquake waves spread globally                        │
│  Duration: 10 seconds                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Color Code

| Color     | Zone   | Damage            | Fatality Rate |
| --------- | ------ | ----------------- | ------------- |
| 🔴 Red    | 20 psi | Total destruction | 90%           |
| 🟠 Orange | 10 psi | Heavy damage      | 50%           |
| 🟡 Yellow | 5 psi  | Moderate damage   | 15%           |
| 🔵 Blue   | 1 psi  | Glass breakage    | 2%            |

## ⌨️ Keyboard Shortcuts

| Key     | Action               |
| ------- | -------------------- |
| `Space` | Play/Pause animation |
| `R`     | Reset simulation     |

## 🎮 Controls

```
┌──────────────────────────────────────┐
│  Asteroid: [Select ▼]               │
│  Region:   [Global ▼]                │
│                                      │
│  ▶️ Play    🔄 Reset                │
│                                      │
│  Layers: 👥 ⛰️ 🌊 ⚡                │
│                                      │
│  Help: ❓                            │
└──────────────────────────────────────┘
```

## 📏 Scale Examples

### Small Asteroid (100m, like Tunguska)

- Crater: ~2 km
- 20 psi: ~5 km
- 1 psi: ~20 km
- Casualties: ~10,000

### Medium Asteroid (500m, like Apophis)

- Crater: ~10 km
- 20 psi: ~25 km
- 1 psi: ~100 km
- Casualties: ~1,000,000

### Large Asteroid (1km)

- Crater: ~20 km
- 20 psi: ~50 km
- 1 psi: ~200 km
- Casualties: ~10,000,000

### Extinction Event (10km, like Chicxulub)

- Crater: ~180 km
- 20 psi: ~500 km
- 1 psi: ~2000 km
- Casualties: Global extinction

## 🌊 Water vs Land Impacts

### Land Impact

- ✅ Crater formation
- ✅ Blast waves
- ✅ Seismic waves
- ✅ Ejecta blanket
- ❌ No tsunami

### Water Impact

- ✅ Blast waves
- ✅ Seismic waves
- ✅ Tsunami waves (up to 800km)
- ⚠️ Smaller crater (water cushioning)
- ⚠️ Less ejecta

## 🔬 Scientific Accuracy

| Effect         | Confidence | Source            |
| -------------- | ---------- | ----------------- |
| Kinetic Energy | ⭐⭐⭐     | Physics 101       |
| Blast Radii    | ⭐⭐⭐     | Nuclear test data |
| Crater Size    | ⭐⭐       | Holsapple-Housen  |
| Casualties     | ⭐⭐       | Empirical scaling |
| Tsunami        | ⭐         | Simplified model  |

## 📱 Usage Tips

1. **Start Small**: Try Tunguska or Chelyabinsk first
2. **Compare Sizes**: Switch between asteroids to see scale
3. **Try Water**: Click on ocean for tsunami effects
4. **Watch Closely**: Each phase has unique details
5. **Use Help**: Hover over ❓ for instructions

## 🐛 Troubleshooting

| Issue                 | Solution                            |
| --------------------- | ----------------------------------- |
| Animation not playing | Click Play button or press Space    |
| No impact visible     | Click on map to set impact location |
| Slow performance      | Close other browser tabs            |
| Map not loading       | Check internet connection           |

## 📊 Performance

- **Frame Rate**: 60 FPS
- **Animation Length**: ~20 seconds per time step
- **Update Interval**: 50ms
- **Map Resolution**: 110m (medium detail)

## 🎯 Best Practices

1. ✅ Select asteroid first
2. ✅ Choose region for better view
3. ✅ Click on populated area to see casualties
4. ✅ Watch full animation before resetting
5. ✅ Try different impact locations

## 📚 Learn More

- `ANIMATION_SYSTEM.md` - Technical details
- `ANIMATION_TIMELINE.md` - Visual guide
- `SCIENTIFIC_BASIS.md` - Research references
- `IMPROVEMENTS_SUMMARY.md` - Complete overview

## 🚀 Quick Start

```
1. Open simulator
2. Select "Apophis" from dropdown
3. Click on New York City
4. Press Play
5. Watch the destruction unfold
```

## 💡 Did You Know?

- 🌍 Earth is hit by ~100 tons of space debris daily
- 🔥 Most burn up in atmosphere (shooting stars)
- 💥 Tunguska (1908) flattened 2000 km² of forest
- 🌊 Chicxulub (66 Ma) caused dinosaur extinction
- 🛡️ NASA tracks 30,000+ near-Earth objects

## 🏆 Challenge Goals

This simulator demonstrates:

- ✅ Scientific accuracy
- ✅ Educational value
- ✅ Visual excellence
- ✅ User experience
- ✅ Technical innovation

---

_Built for NASA Space Apps Challenge 2025_ 🌍💥🚀

**Quick. Simple. Accurate. Stunning.**

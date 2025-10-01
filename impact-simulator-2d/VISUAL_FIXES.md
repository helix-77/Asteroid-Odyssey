# Visual Fixes Applied

## Issues Identified
1. **Map cut off** - Half of the map was not visible
2. **White text** - All sidebar text was white on white background

## Fixes Applied

### 1. Map Container Sizing
**File**: `/app/impact-simulator/page.tsx`

**Changes**:
- Added `overflow-hidden` to map container
- Wrapped ImpactMap in proper sizing div
- Ensured full width/height propagation

```tsx
<div className="flex-1 relative bg-gray-200 overflow-hidden">
  <div className="w-full h-full">
    <ImpactMap ... />
  </div>
</div>
```

### 2. SVG Viewport Configuration
**File**: `/components/impact-simulator/ImpactMap.tsx`

**Changes**:
- Added `viewBox` attribute for proper scaling
- Added `preserveAspectRatio="xMidYMid meet"`
- Set `minHeight: 400px` to ensure visibility
- Added `block` display class

```tsx
<svg
  className="w-full h-full block"
  style={{ cursor: "crosshair", minHeight: "400px" }}
  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
  preserveAspectRatio="xMidYMid meet"
>
```

### 3. Text Color Fixes
**File**: `/components/impact-simulator/DataSidebar.tsx`

**Changes**: Updated all text colors from white/invisible to visible grays

- Headers: `text-gray-700` → `text-gray-800`
- Values: `font-medium` → `font-medium text-gray-900`
- Labels: `text-gray-600` (kept as is - already visible)

**Sections Updated**:
- Asteroid Information
- Impact Location
- Geological Impact
- Population Impact
- Economic Impact
- Climate Impact
- Infrastructure Damage
- Natural Disasters

## Result
- Map now displays fully visible with proper scaling
- All sidebar text is now legible with dark gray colors on white background
- Responsive design maintained across different screen sizes

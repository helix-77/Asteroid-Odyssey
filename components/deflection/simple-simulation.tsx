"use client"

import { useMemo } from "react"
import type { Asteroid, DeflectionStrategy } from "@/lib/types"

interface SimpleSimulationProps {
  asteroid: Asteroid
  strategy: DeflectionStrategy
  width?: number
  height?: number
}

// A clear, educational 2D diagram:
// - Earth on the right, Sun at center, asteroid approaches from left (curved path)
// - Intercept point marked; deflected path diverges visibly
export function SimpleSimulation({ asteroid, strategy, width = 720, height = 320 }: SimpleSimulationProps) {
  const view = useMemo(() => {
    const w = width
    const h = height

    // Layout anchors
    const sun = { x: w * 0.15, y: h * 0.5 }
    const earth = { x: w * 0.85, y: h * 0.5 }

    // Incoming curve (quadratic Bezier)
    const start = { x: w * 0.02, y: h * 0.35 }
    const control = { x: w * 0.48, y: h * 0.15 }
    const intercept = { x: w * 0.58, y: h * 0.42 }

    // Deflection magnitude based on deltaV (scaled for visibility)
    const dv = Math.max(0.15, Math.min(1.2, (strategy.requirements?.deltaV || 100) / 1200))
    const deflectControl = { x: intercept.x + w * 0.08, y: intercept.y - h * 0.18 * dv }
    const deflectEnd = { x: w * 0.98, y: h * (0.35 - 0.2 * dv) }

    const incomingPath = `M ${start.x},${start.y} Q ${control.x},${control.y} ${intercept.x},${intercept.y}`
    const deflectedPath = `M ${intercept.x},${intercept.y} Q ${deflectControl.x},${deflectControl.y} ${deflectEnd.x},${deflectEnd.y}`

    return { w, h, sun, earth, start, control, intercept, deflectControl, deflectEnd, incomingPath, deflectedPath }
  }, [width, height, asteroid, strategy])

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${view.w} ${view.h}`} className="w-full h-auto">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L7,3 z" fill="#10B981" />
          </marker>
        </defs>

        {/* Background grid (subtle) */}
        <rect x="0" y="0" width={view.w} height={view.h} fill="url(#bg)" fillOpacity="0" />

        {/* Sun */}
        <circle cx={view.sun.x} cy={view.sun.y} r="18" fill="#FDB813" fillOpacity="0.9" />
        <text x={view.sun.x} y={view.sun.y + 32} textAnchor="middle" fontSize="11" fill="#e9d5ff">Sun</text>

        {/* Earth */}
        <circle cx={view.earth.x} cy={view.earth.y} r="12" fill="#3B82F6" />
        <text x={view.earth.x} y={view.earth.y + 26} textAnchor="middle" fontSize="11" fill="#dbeafe">Earth</text>

        {/* Incoming asteroid path */}
        <path d={view.incomingPath} stroke="#ef4444" strokeWidth="3" fill="none" strokeOpacity="0.9" />
        {/* Deflected path */}
        <path d={view.deflectedPath} stroke="#10B981" strokeWidth="3" fill="none" markerEnd="url(#arrow)" />

        {/* Intercept point */}
        <circle cx={view.intercept.x} cy={view.intercept.y} r="6" fill="#8B5CF6" />
        <circle cx={view.intercept.x} cy={view.intercept.y} r="12" fill="none" stroke="#8B5CF6" strokeOpacity="0.6" />
        <text x={view.intercept.x + 8} y={view.intercept.y - 8} fontSize="11" fill="#c4b5fd">Intercept</text>

        {/* Labels */}
        <text x={view.start.x + 8} y={view.start.y - 10} fontSize="11" fill="#fecaca">Original path</text>
        <text x={view.deflectEnd.x - 140} y={view.deflectEnd.y - 10} fontSize="11" fill="#a7f3d0">Deflected path</text>

        {/* Strategy summary */}
        <g transform={`translate(${view.w * 0.02}, ${view.h * 0.78})`}>
          <rect width={view.w * 0.5} height="42" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
          <text x={12} y={18} fontSize="12" fill="#e9d5ff">{strategy.name}</text>
          <text x={12} y={34} fontSize="11" fill="#c4b5fd">ΔV {(strategy.requirements?.deltaV || 0)/1000} km/s · Lead {strategy.timeRequired}y · Base {(strategy.effectiveness*100).toFixed(0)}%</text>
        </g>
      </svg>
    </div>
  )
}

export default SimpleSimulation



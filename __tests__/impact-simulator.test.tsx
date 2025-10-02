import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import ImpactSimulatorPage from '@/app/impact-simulator/page'
import asteroids from '@/data/asteroids.json'
import { computeImpactBundle } from '@/lib/calculations'

// Minimal TopoJSON for land (empty geometry collection)
const topoStub = {
  type: 'Topology',
  objects: { land: { type: 'GeometryCollection', geometries: [] } },
  arcs: [],
}

describe('Impact Simulator page', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve(topoStub) } as any)))
  })
  afterEach(() => {
    vi.useRealTimers()
    ;(global.fetch as any).mockRestore?.()
  })

  it('renders, allows impact selection, and updates crater stat to expected value', async () => {
    render(<ImpactSimulatorPage />)

    // Wait for map to be present
    const svg = await screen.findByRole('img', { name: /Impact map/i })

    // Click roughly center of the SVG to set impact
    fireEvent.click(svg, { clientX: 512, clientY: 300 })

    // Scrub to t1 (impact)
    const sliders = screen.getAllByRole('slider')
    const timeline = sliders[0] as HTMLInputElement
    fireEvent.change(timeline, { target: { value: '1' } })

    // Crater SVG should exist
    await screen.findByTestId('crater')

    // Compute expected crater px radius (within ±10%)
    const asteroid = (asteroids as any).asteroids[0]
    const bundle = computeImpactBundle({
      massKg: asteroid.mass,
      velocityMps: asteroid.velocity * 1000, // km/s -> m/s
      target: 'water', // empty land stub -> water impact
      avgPopPerKm2: 300,
    })
    const craterKm = bundle.craterRadiusKm.value * 0.5 // stage at t1

    // Projection scale used by page fallback: width=1024, height=600, k=1
    const width = 1024
    const height = 600
    const scale = Math.min(width / (2 * Math.PI), height / Math.PI) * 200 * 1
    // Assert the crater stat is within ±10% of expected
    const craterStat = await screen.findByTestId('stat-Crater radius')
    const text = craterStat.textContent || ''
    const num = parseFloat(text.replace(/[^0-9.\-]/g, ''))
    const lower = craterKm * 0.9
    const upper = craterKm * 1.1
    expect(num).toBeGreaterThanOrEqual(lower)
    expect(num).toBeLessThanOrEqual(upper)

    // Also ensure kinetic energy stat is non-zero
    const energyStat = await screen.findByTestId('stat-Kinetic energy')
    expect(energyStat.textContent || '').toMatch(/[1-9]/)
  })
})

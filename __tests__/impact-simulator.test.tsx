import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import ImpactSimulatorPage from "@/app/impact-simulator/page";
import asteroids from "@/data/asteroids.json";
import { computeImpactBundle } from "@/lib/calculations";

// Minimal TopoJSON for land (empty geometry collection)
const topoStub = {
  type: "Topology",
  objects: {
    countries: { type: "GeometryCollection", geometries: [] },
    land: { type: "GeometryCollection", geometries: [] },
  },
  arcs: [],
};

describe("Impact Simulator page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ json: () => Promise.resolve(topoStub) } as any)
      )
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    (global.fetch as any).mockRestore?.();
  });

  it("renders, allows impact selection, and updates crater stat to expected value", async () => {
    render(<ImpactSimulatorPage />);

    // Wait for map to be present
    const svg = await screen.findByRole("img", { name: /Impact map/i });

    // Click roughly center of the SVG to set impact
    fireEvent.click(svg, { clientX: 512, clientY: 300 });

    // Wait for impact to be processed
    await waitFor(() => {
      expect(screen.getByTestId("stat-Kinetic energy")).toBeInTheDocument();
    });

    // Move to impact timestep (t1)
    const sliders = screen.getAllByRole("slider");
    const timeline = sliders[0] as HTMLInputElement;
    fireEvent.change(timeline, { target: { value: "1" } });

    // Wait for crater to appear
    await waitFor(() => {
      expect(screen.getByTestId("crater")).toBeInTheDocument();
    });

    // Compute expected crater radius (within ±10%)
    const asteroid = (asteroids as any).asteroids[0];
    const bundle = computeImpactBundle({
      massKg: asteroid.mass,
      velocityMps: asteroid.velocity * 1000, // km/s -> m/s
      target: "water", // empty land stub -> water impact
      avgPopPerKm2: 300,
    });
    const craterKm = bundle.craterRadiusKm.value * 0.5; // stage at t1

    // Assert the crater stat is within ±10% of expected
    const craterStat = screen.getByTestId("stat-Crater radius");
    const text = craterStat.textContent || "";
    const num = parseFloat(text.replace(/[^0-9.\-]/g, ""));
    const lower = craterKm * 0.9;
    const upper = craterKm * 1.1;
    expect(num).toBeGreaterThanOrEqual(lower);
    expect(num).toBeLessThanOrEqual(upper);

    // Also ensure kinetic energy stat is non-zero
    const energyStat = screen.getByTestId("stat-Kinetic energy");
    expect(energyStat.textContent || "").toMatch(/[1-9]/);
  });
});

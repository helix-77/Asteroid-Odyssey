import React, { useState } from "react";
import {
  renderMap,
  overlayCrater,
  overlayCasualties,
  overlayInfrastructure,
  overlayClimate,
  overlayDisaster,
} from "@/lib/utils/map";
import { Card } from "@/components/ui/card";

const REGIONS = ["Americas", "Asia", "Europe", "Australia"];
const FILTERS = ["casualties", "infrastructure", "climate", "disaster"];

const DUMMY_ASTEROID = { id: "test-1", name: "Test Asteroid" };

export default function ImpactSimulatorPage({
  selectedAsteroidId,
}: {
  selectedAsteroidId?: string;
}) {
  const [region, setRegion] = useState("Americas");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const asteroid = selectedAsteroidId ? DUMMY_ASTEROID : null;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        data-testid="impact-sidebar"
        className="w-64 p-4 bg-slate-900 text-white"
      >
        <Card>
          <div className="font-bold mb-2">Impact Data</div>
          <div>Asteroid: {asteroid ? asteroid.name : "None selected"}</div>
          <div>Region: {region}</div>
          <div>Filter: {activeFilter || "None"}</div>
        </Card>
      </aside>
      {/* Main Map */}
      <main className="flex-1 p-4">
        <div
          data-testid="impact-map"
          className="bg-slate-800 text-white rounded p-4 min-h-[300px]"
        >
          {region}
          {activeFilter && (
            <span>
              {" "}
              {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </span>
          )}
          {asteroid && <span> {asteroid.name}</span>}
        </div>
        <div className="mt-4 flex gap-2">
          <select
            data-testid="region-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="p-2 rounded"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              className="px-2 py-1 bg-slate-700 rounded"
              onClick={() => setActiveFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

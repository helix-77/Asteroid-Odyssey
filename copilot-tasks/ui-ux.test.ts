import React from "react";
// Test file for UI/UX behavior and controls
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ImpactSimulatorPage from "../components/simulation/impact-simulator-page";

describe("Impact Simulator UI/UX", () => {
  it("should render minimalistic layout with map and sidebar", () => {
    render(<ImpactSimulatorPage />);
    expect(screen.getByTestId("impact-map")).toBeInTheDocument();
    expect(screen.getByTestId("impact-sidebar")).toBeInTheDocument();
  });

  it("should allow region selection and update map", () => {
    render(<ImpactSimulatorPage />);
    const regionSelect = screen.getByTestId("region-select");
    fireEvent.change(regionSelect, { target: { value: "Asia" } });
    expect(screen.getByTestId("impact-map")).toHaveTextContent("Asia");
  });

  it("should filter overlays and update map", () => {
    render(<ImpactSimulatorPage />);
    const casualtiesToggle = screen.getByTestId("filter-casualties");
    fireEvent.click(casualtiesToggle);
    expect(screen.getByTestId("impact-map")).toHaveTextContent("Casualties");
  });

  it("should only show impact for selected asteroid", () => {
    render(<ImpactSimulatorPage selectedAsteroidId="test-1" />);
    expect(screen.getByTestId("impact-map")).toHaveTextContent("Test Asteroid");
  });
});

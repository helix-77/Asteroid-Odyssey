import { render, screen } from '@testing-library/react';
import CraterVisualization from '@/components/simulation/crater-visualization';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  Circle: ({ radius, pathOptions }: any) => (
    <div data-testid="circle" data-radius={radius} data-fill-color={pathOptions.fillColor} />
  ),
  Marker: ({ position, icon }: any) => (
    <div data-testid="marker" data-position={position.join(',')} />
  ),
}));

// Mock Leaflet
jest.mock('leaflet', () => ({
  divIcon: ({ html, iconSize }: any) => ({ html, iconSize }),
}));

describe('CraterVisualization', () => {
  const mockImpactLocation = { lat: 40.7128, lng: -74.006 };
  const mockCurrentTimeline = { time: 3600, craterRadius: 500, damageRadius: 5000 };
  const mockEnhancedResults = {
    geological: { craterDiameter: 2.5 }
  };
  const mockSimulationResults = {
    crater: { diameter: 2500 }
  };

  test('renders nothing when no timeline is provided', () => {
    const { container } = render(
      <CraterVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={null}
        enhancedResults={mockEnhancedResults}
        simulationResults={mockSimulationResults}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('renders crater visualization with proper scaling', () => {
    render(
      <CraterVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={mockCurrentTimeline}
        enhancedResults={mockEnhancedResults}
        simulationResults={mockSimulationResults}
      />
    );
    
    // Should render crater marker
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    
    // Should render multiple circles for crater, rim, and ejecta
    const circles = screen.getAllByTestId('circle');
    expect(circles).toHaveLength(3);
    
    // Check crater circle has correct properties
    const craterCircle = circles[0];
    expect(craterCircle).toHaveAttribute('data-fill-color', '#2F1B14');
  });

  test('displays crater information panel', () => {
    render(
      <CraterVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={mockCurrentTimeline}
        enhancedResults={mockEnhancedResults}
        simulationResults={mockSimulationResults}
      />
    );
    
    expect(screen.getByText('🕳️ IMPACT CRATER')).toBeInTheDocument();
    expect(screen.getByText('Diameter: 2.5 km')).toBeInTheDocument();
    expect(screen.getByText('Depth: 0.5 km')).toBeInTheDocument();
    expect(screen.getByText('Ejecta radius: 6.3 km')).toBeInTheDocument();
  });

  test('uses fallback crater size when enhanced results not available', () => {
    render(
      <CraterVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={mockCurrentTimeline}
        enhancedResults={null}
        simulationResults={mockSimulationResults}
      />
    );
    
    // Should still render crater visualization
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getAllByTestId('circle')).toHaveLength(3);
  });

  test('calculates correct crater radius from diameter', () => {
    render(
      <CraterVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={mockCurrentTimeline}
        enhancedResults={mockEnhancedResults}
        simulationResults={mockSimulationResults}
      />
    );
    
    const circles = screen.getAllByTestId('circle');
    const craterCircle = circles[0];
    
    // Crater radius should be half of diameter (2.5km) in meters = 1250m
    expect(craterCircle).toHaveAttribute('data-radius', '1250');
  });
});

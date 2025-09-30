import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImpactSimulator } from '@/components/simulation/impact-simulator';

// Mock the dynamic imports
jest.mock('next/dynamic', () => {
  return function dynamic(importFunc: any) {
    const Component = importFunc();
    return Component;
  };
});

// Mock Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Circle: () => <div data-testid="circle" />,
  useMapEvents: () => null,
  GeoJSON: () => <div data-testid="geojson" />,
  useMap: () => ({
    distance: jest.fn(() => 1000),
    fitBounds: jest.fn(),
    setMaxBounds: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ImpactSimulator', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        asteroids: [
          {
            id: 'test-1',
            name: 'Test Asteroid',
            size: 150,
            velocity: 20,
            mass: 1.5e10,
            composition: 'stony',
            threat_level: 'high',
            impact_probability: 0.001,
          }
        ],
        population_density_data: [],
        infrastructure_locations: [],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders impact simulator with main components', async () => {
    render(<ImpactSimulator />);
    
    expect(screen.getByText('Asteroid Impact Simulator')).toBeInTheDocument();
    expect(screen.getByText('Simulate and visualize asteroid impact effects on Earth')).toBeInTheDocument();
    expect(screen.getByText('Asteroid Selection')).toBeInTheDocument();
    expect(screen.getByText('Impact Parameters')).toBeInTheDocument();
    expect(screen.getByText('Impact Visualization')).toBeInTheDocument();
  });

  test('loads asteroid data on mount', async () => {
    render(<ImpactSimulator />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/data/asteroids.json');
      expect(fetch).toHaveBeenCalledWith('/data/population_density.json');
      expect(fetch).toHaveBeenCalledWith('/data/infrastructure_locations.json');
    });
  });

  test('displays asteroid selection dropdown when data is loaded', async () => {
    render(<ImpactSimulator />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Asteroid (HIGH) - 150m')).toBeInTheDocument();
    });
  });

  test('enables run simulation button when asteroid is selected', async () => {
    render(<ImpactSimulator />);
    
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'test-1' } });
    });

    const runButton = screen.getByText('Run Simulation');
    expect(runButton).not.toBeDisabled();
  });

  test('shows timeline controls after simulation runs', async () => {
    render(<ImpactSimulator />);
    
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'test-1' } });
    });

    const runButton = screen.getByText('Run Simulation');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('after impact')).toBeInTheDocument();
    });
  });

  test('updates impact parameters with sliders', () => {
    render(<ImpactSimulator />);
    
    const angleSlider = screen.getByLabelText(/Impact Angle/);
    const velocitySlider = screen.getByLabelText(/Impact Velocity/);
    
    expect(angleSlider).toBeInTheDocument();
    expect(velocitySlider).toBeInTheDocument();
  });

  test('displays filter options for visualization', () => {
    render(<ImpactSimulator />);
    
    expect(screen.getByText('Population Casualties')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure Damage')).toBeInTheDocument();
    expect(screen.getByText('Geological Destruction')).toBeInTheDocument();
    expect(screen.getByText('Climate Impact')).toBeInTheDocument();
  });
});

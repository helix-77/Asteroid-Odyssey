import { render, screen } from '@testing-library/react';
import TsunamiVisualization from '@/components/simulation/tsunami-visualization';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  Circle: ({ radius, pathOptions }: any) => (
    <div 
      data-testid="tsunami-circle" 
      data-radius={radius} 
      data-color={pathOptions.color}
      data-opacity={pathOptions.opacity}
    />
  ),
  useMap: () => ({
    distance: jest.fn(() => 1000),
  }),
}));

describe('TsunamiVisualization', () => {
  const mockImpactLocation = { lat: 35.6762, lng: 139.6503 }; // Tokyo (coastal)
  const mockEnhancedResults = { geological: { craterDiameter: 2.5 } };

  test('renders nothing when no timeline is provided', () => {
    const { container } = render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={null}
        currentTimeIndex={0}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing for early timeline (before tsunami formation)', () => {
    const earlyTimeline = { time: 1000, craterRadius: 500, damageRadius: 5000 }; // 16 minutes
    
    const { container } = render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={earlyTimeline}
        currentTimeIndex={5}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    expect(screen.queryByTestId('tsunami-circle')).not.toBeInTheDocument();
  });

  test('renders tsunami waves after sufficient time has passed', () => {
    const lateTimeline = { time: 7200, craterRadius: 500, damageRadius: 5000 }; // 2 hours
    
    render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={lateTimeline}
        currentTimeIndex={50}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    // Should render tsunami circles
    const tsunamiCircles = screen.getAllByTestId('tsunami-circle');
    expect(tsunamiCircles.length).toBeGreaterThan(0);
  });

  test('displays tsunami warning panel when waves are active', () => {
    const lateTimeline = { time: 7200, craterRadius: 500, damageRadius: 5000 }; // 2 hours
    
    render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={lateTimeline}
        currentTimeIndex={50}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    expect(screen.getByText('🌊 TSUNAMI WARNING')).toBeInTheDocument();
    expect(screen.getByText('Wave speed: ~800 km/h')).toBeInTheDocument();
    expect(screen.getByText(/Time since impact: \d+h/)).toBeInTheDocument();
  });

  test('calculates correct wave radius based on time and speed', () => {
    const timeline = { time: 3600, craterRadius: 500, damageRadius: 5000 }; // 1 hour
    
    render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={timeline}
        currentTimeIndex={30}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    const tsunamiCircles = screen.getAllByTestId('tsunami-circle');
    if (tsunamiCircles.length > 0) {
      const firstWave = tsunamiCircles[0];
      // 1 hour * 800 km/h = 800 km = 800,000 meters
      expect(firstWave).toHaveAttribute('data-radius', '800000');
    }
  });

  test('renders multiple wave fronts with decreasing opacity', () => {
    const timeline = { time: 10800, craterRadius: 500, damageRadius: 5000 }; // 3 hours
    
    render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={timeline}
        currentTimeIndex={70}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    const tsunamiCircles = screen.getAllByTestId('tsunami-circle');
    expect(tsunamiCircles.length).toBeGreaterThan(1);
    
    // First wave should have higher opacity than subsequent waves
    const firstWave = tsunamiCircles[0];
    const secondWave = tsunamiCircles[1];
    
    const firstOpacity = parseFloat(firstWave.getAttribute('data-opacity') || '0');
    const secondOpacity = parseFloat(secondWave.getAttribute('data-opacity') || '0');
    
    expect(firstOpacity).toBeGreaterThan(secondOpacity);
  });

  test('uses different colors for primary and secondary waves', () => {
    const timeline = { time: 7200, craterRadius: 500, damageRadius: 5000 }; // 2 hours
    
    render(
      <TsunamiVisualization
        impactLocation={mockImpactLocation}
        currentTimeline={timeline}
        currentTimeIndex={50}
        enhancedResults={mockEnhancedResults}
      />
    );
    
    const tsunamiCircles = screen.getAllByTestId('tsunami-circle');
    if (tsunamiCircles.length > 1) {
      const firstWave = tsunamiCircles[0];
      const secondWave = tsunamiCircles[1];
      
      expect(firstWave.getAttribute('data-color')).toBe('#0066CC');
      expect(secondWave.getAttribute('data-color')).toBe('#4A90E2');
    }
  });
});

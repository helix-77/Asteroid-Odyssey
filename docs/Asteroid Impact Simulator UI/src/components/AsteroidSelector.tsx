import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface Asteroid {
  id: string;
  name: string;
  diameter: number;
  mass: number;
  velocity: number;
  composition: string;
  density: number;
  description: string;
}

interface AsteroidSelectorProps {
  asteroids: Asteroid[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AsteroidSelector({ asteroids, selectedId, onSelect }: AsteroidSelectorProps) {
  const selectedAsteroid = asteroids.find(a => a.id === selectedId);

  const getSizeCategory = (diameter: number) => {
    if (diameter < 50) return { label: 'Very Small', color: 'bg-green-500' };
    if (diameter < 300) return { label: 'Small', color: 'bg-blue-500' };
    if (diameter < 1000) return { label: 'Medium', color: 'bg-yellow-500' };
    if (diameter < 5000) return { label: 'Large', color: 'bg-orange-500' };
    return { label: 'Extinction Event', color: 'bg-red-500' };
  };

  const getThreatLevel = (diameter: number) => {
    if (diameter < 50) return 'Low';
    if (diameter < 300) return 'Moderate';
    if (diameter < 1000) return 'High';
    if (diameter < 5000) return 'Severe';
    return 'Catastrophic';
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Asteroid</label>
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an asteroid" />
          </SelectTrigger>
          <SelectContent>
            {asteroids.map((asteroid) => {
              const sizeCategory = getSizeCategory(asteroid.diameter);
              return (
                <SelectItem key={asteroid.id} value={asteroid.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sizeCategory.color}`} />
                    <span>{asteroid.name}</span>
                    <span className="text-muted-foreground text-xs">({asteroid.diameter}m)</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedAsteroid && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{selectedAsteroid.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedAsteroid.description}</p>
              </div>
              <Badge variant="outline" className={getSizeCategory(selectedAsteroid.diameter).color}>
                {getThreatLevel(selectedAsteroid.diameter)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Diameter</div>
                <div className="font-medium">{selectedAsteroid.diameter.toLocaleString()} m</div>
              </div>
              <div>
                <div className="text-muted-foreground">Mass</div>
                <div className="font-medium">{(selectedAsteroid.mass / 1e9).toExponential(2)} × 10⁹ kg</div>
              </div>
              <div>
                <div className="text-muted-foreground">Velocity</div>
                <div className="font-medium">{(selectedAsteroid.velocity / 1000).toFixed(1)} km/s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Composition</div>
                <div className="font-medium capitalize">{selectedAsteroid.composition}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
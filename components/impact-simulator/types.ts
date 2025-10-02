import { type TargetType } from "@/lib/calculations";

export interface ImpactLocation {
  lat: number;
  lon: number;
  terrain: TargetType;
  populationDensity: number;
}

export interface SimulationState {
  selectedAsteroidId: string;
  impactLocation: ImpactLocation | null;
  isPlaying: boolean;
  timeStep: number; // 0-4 (pre-impact, impact, 1 day, 1 week, 1 year)
  playbackSpeed: number;
  activeLayer: string;
  selectedRegion: string;
}

export interface TimeStep {
  id: number;
  label: string;
  description: string;
}

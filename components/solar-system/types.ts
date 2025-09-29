export interface NEOData {
  name: string;
  neo_reference_id: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  est_diameter_min_m: number;
  est_diameter_max_m: number;
  closest_approach_date?: string | null;
  miss_distance_km?: string | null;
  relative_velocity_km_s?: string | null;
  orbiting_body?: string | null;
  [key: string]: any; // Allow additional properties
}

export interface OrbitPathProps {
  center: [number, number, number];
  radius: number;
  color?: string;
  opacity?: number;
  eccentricity?: number;
}

export interface AsteroidProps {
  data: NEOData;
  position: [number, number, number];
  scale?: number;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export interface ControlPanelProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onSort: (sortOption: SortOption) => void;
  onReset: () => void;
}

export interface FilterOptions {
  sizeRange: [number, number];
  hazardousOnly: boolean;
  approachDateRange?: [Date | null, Date | null];
}

export type SortOption = "size" | "date" | "distance" | "threat";

export interface InfoPanelProps {
  asteroid: NEOData | null;
  onClose: () => void;
}

export interface SceneControlsProps {
  autoRotate?: boolean;
  enableZoom?: boolean;
  maxDistance?: number;
  minDistance?: number;
}

export interface CameraConfig {
  position: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

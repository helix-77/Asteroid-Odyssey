import React from "react";

interface ImpactControlsProps {
  mapView: string;
  onMapViewChange: (view: any) => void;
  dataLayer: string;
  onDataLayerChange: (layer: any) => void;
}

export const ImpactControls: React.FC<ImpactControlsProps> = ({
  mapView,
  onMapViewChange,
  dataLayer,
  onDataLayerChange,
}) => {
  return (
    <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center gap-4">
      {/* Region Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600" style={{ color: '#4b5563' }}>Region:</label>
        <select
          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          style={{ color: '#000', backgroundColor: '#fff' }}
          value={mapView}
          onChange={(e) => onMapViewChange(e.target.value)}
        >
          <option value="global">Global View</option>
          <option value="northAmerica">North America</option>
          <option value="southAmerica">South America</option>
          <option value="europe">Europe</option>
          <option value="asia">Asia</option>
          <option value="africa">Africa</option>
          <option value="oceania">Oceania</option>
        </select>
      </div>

      {/* Data Layer Toggle */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600 mr-2" style={{ color: '#4b5563' }}>View:</span>
        {[
          { value: "population", label: "Population" },
          { value: "habitability", label: "Habitability" },
          { value: "infrastructure", label: "Infrastructure" },
          { value: "tsunami", label: "Tsunami Risk" },
          { value: "tectonic", label: "Tectonic Risk" },
        ].map((layer) => (
          <button
            key={layer.value}
            onClick={() => onDataLayerChange(layer.value)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              dataLayer === layer.value
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            style={dataLayer === layer.value ? { color: '#fff' } : { color: '#374151' }}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  );
};

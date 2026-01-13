'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { NeighborhoodData } from './MapView';
import 'leaflet/dist/leaflet.css';

interface NeighborhoodMapProps {
  geoJsonData: GeoJsonObject;
  neighborhoodData: Map<string, NeighborhoodData>;
  selectedNeighborhood: string | null;
  onNeighborhoodSelect: (neighborhood: string | null) => void;
}

function getNeighborhoodColor(count: number): string {
  if (count === 0) return '#f3f4f6'; // gray-100
  if (count <= 2) return '#dbeafe';  // blue-100
  if (count <= 5) return '#93c5fd';  // blue-300
  if (count <= 10) return '#3b82f6'; // blue-500
  return '#1e40af';                   // blue-800
}

export default function NeighborhoodMap({ geoJsonData, neighborhoodData, selectedNeighborhood, onNeighborhoodSelect }: NeighborhoodMapProps) {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={12}
      style={{ height: '600px', width: '100%' }}
      scrollWheelZoom={false}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <GeoJSON
        data={geoJsonData}
        style={(feature) => {
          const name = feature?.properties?.name || '';
          const data = neighborhoodData.get(name);
          const count = data?.counts.total || 0;
          const isSelected = name === selectedNeighborhood;

          return {
            fillColor: getNeighborhoodColor(count),
            fillOpacity: isSelected ? 1.0 : 0.7,
            color: isSelected ? '#1e40af' : '#374151', // blue-800 if selected, gray-700 otherwise
            weight: isSelected ? 3 : 1
          };
        }}
        onEachFeature={(feature, layer) => {
          const name = feature.properties?.name || '';
          const data = neighborhoodData.get(name);
          const isSelected = name === selectedNeighborhood;

          // Click handler
          layer.on({
            click: () => {
              if (isSelected) {
                onNeighborhoodSelect(null); // Deselect if already selected
              } else {
                onNeighborhoodSelect(name);
              }
            },
            mouseover: (e) => {
              if (!isSelected) {
                e.target.setStyle({ fillOpacity: 0.9, weight: 2 });
              }
              // Make cursor pointer
              e.target.getElement()?.style.setProperty('cursor', 'pointer');
            },
            mouseout: (e) => {
              if (!isSelected) {
                e.target.setStyle({ fillOpacity: 0.7, weight: 1 });
              }
            }
          });

          // Simple tooltip on hover
          const tooltipContent = data
            ? `<div class="font-mono text-xs"><strong>${name}</strong><br/>${data.counts.total} article${data.counts.total !== 1 ? 's' : ''}</div>`
            : `<div class="font-mono text-xs"><strong>${name}</strong><br/>No articles</div>`;

          layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: 'neighborhood-tooltip'
          });
        }}
      />
    </MapContainer>
  );
}

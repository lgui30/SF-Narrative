'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomSheet from '@/components/ui/BottomSheet';
import NeighborhoodCard from '@/components/ui/NeighborhoodCard';
import neighborhoodIdentities from '@/data/neighborhood-identities.json';

interface NeighborhoodIdentity {
  tagline: string;
  description: string;
}

const identities = neighborhoodIdentities as Record<string, NeighborhoodIdentity>;

interface NeighborhoodMapProps {
  geoJsonData: GeoJSON.GeoJsonObject;
  neighborhoodData: Map<string, { name: string; count: number }>;
  newsCountByNeighborhood?: Record<string, number>;
  selectedNeighborhood: string | null;
  onNeighborhoodSelect: (name: string) => void;
}

// Nature Distilled color scheme
function getColorByCount(count: number): string {
  if (count === 0) return '#E8E4E0'; // fog-gray
  if (count <= 2) return 'rgba(42, 127, 142, 0.4)'; // ocean-teal 40%
  if (count <= 5) return 'rgba(42, 127, 142, 0.7)'; // ocean-teal 70%
  return 'rgba(61, 107, 79, 0.8)'; // forest-green 80%
}

function getBorderColor(count: number, isSelected: boolean): string {
  if (isSelected) return '#C4704B'; // terracotta
  if (count > 0) return '#2A7F8E'; // ocean-teal
  return '#D1D5DB'; // light gray
}

export default function NeighborhoodMap({
  geoJsonData,
  neighborhoodData,
  newsCountByNeighborhood,
  selectedNeighborhood,
  onNeighborhoodSelect,
}: NeighborhoodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [bottomSheetNeighborhood, setBottomSheetNeighborhood] = useState<string | null>(null);

  // Track selected neighborhood in a ref for event handlers
  const selectedRef = useRef(selectedNeighborhood);
  selectedRef.current = selectedNeighborhood;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setIsReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update GeoJSON layer
  useEffect(() => {
    if (!mapRef.current || !isReady || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const name = feature?.properties?.name || '';
        const data = neighborhoodData.get(name);
        const count = data?.count || 0;
        const isSelected = name === selectedRef.current;

        return {
          fillColor: getColorByCount(count),
          fillOpacity: isSelected ? 0.9 : (count > 0 ? 0.7 : 0.3),
          color: getBorderColor(count, isSelected),
          weight: isSelected ? 3 : (count > 0 ? 2 : 1),
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature?.properties?.name || 'Unknown';
        const data = neighborhoodData.get(name);
        const count = data?.count || 0;

        layer.bindTooltip(
          `<div style="font-family: 'Inter', system-ui, sans-serif; font-size: 13px; padding: 2px;">
            <strong style="font-size: 14px;">${name}</strong>
            <br/>
            <span style="color: ${count > 0 ? '#2A7F8E' : '#9CA3AF'}; font-weight: 500;">
              ${count > 0 ? `${count} event${count !== 1 ? 's' : ''}` : 'No events'}
            </span>
          </div>`,
          {
            sticky: true,
            className: 'neighborhood-tooltip',
            direction: 'top',
            offset: [0, -10],
          }
        );

        layer.on('click', () => {
          onNeighborhoodSelect(name);
          setBottomSheetNeighborhood(name);
        });

        layer.on('mouseover', () => {
          (layer as L.Path).setStyle({
            weight: count > 0 ? 3 : 2,
            fillOpacity: count > 0 ? 0.85 : 0.4,
            color: '#C4704B',
          });
          const el = (layer as L.Path).getElement() as HTMLElement | null;
          if (el && count > 0) {
            el.style.setProperty('cursor', 'pointer');
          }
        });

        layer.on('mouseout', () => {
          geoJsonLayer.resetStyle(layer);
        });
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [geoJsonData, neighborhoodData, selectedNeighborhood, isReady, onNeighborhoodSelect]);

  // Update styles when selection changes
  useEffect(() => {
    if (!geoJsonLayerRef.current) return;

    geoJsonLayerRef.current.eachLayer((layer) => {
      const pathLayer = layer as L.Path & { feature?: GeoJSON.Feature };
      const feature = pathLayer.feature;
      const name = feature?.properties?.name || '';
      const data = neighborhoodData.get(name);
      const count = data?.count || 0;
      const isSelected = name === selectedNeighborhood;

      pathLayer.setStyle({
        fillColor: getColorByCount(count),
        fillOpacity: isSelected ? 0.9 : (count > 0 ? 0.7 : 0.3),
        color: getBorderColor(count, isSelected),
        weight: isSelected ? 3 : (count > 0 ? 2 : 1),
      });
    });
  }, [selectedNeighborhood, neighborhoodData]);

  // Compute counts for bottom sheet
  const sheetEventCount = bottomSheetNeighborhood
    ? (neighborhoodData.get(bottomSheetNeighborhood)?.count || 0)
    : 0;
  const sheetNewsCount = bottomSheetNeighborhood && newsCountByNeighborhood
    ? (newsCountByNeighborhood[bottomSheetNeighborhood] || 0)
    : 0;

  const sheetIdentity = bottomSheetNeighborhood
    ? (identities[bottomSheetNeighborhood] || {
        tagline: 'A San Francisco neighborhood.',
        description: 'Explore what\'s happening in this part of the city.',
      })
    : null;

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-lg shadow-lg p-3 text-xs z-[1000]">
        <p className="font-semibold mb-2 text-foreground">Events by Area</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(42, 127, 142, 0.4)' }} />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(42, 127, 142, 0.7)' }} />
            <span>3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(61, 107, 79, 0.8)' }} />
            <span>6+</span>
          </div>
        </div>
      </div>

      {/* Neighborhood BottomSheet */}
      {bottomSheetNeighborhood && sheetIdentity && (
        <BottomSheet
          isOpen={!!bottomSheetNeighborhood}
          onClose={() => setBottomSheetNeighborhood(null)}
          title={bottomSheetNeighborhood}
        >
          <NeighborhoodCard
            neighborhood={bottomSheetNeighborhood}
            identity={sheetIdentity}
            eventCount={sheetEventCount}
            newsCount={sheetNewsCount}
          />
        </BottomSheet>
      )}
    </div>
  );
}

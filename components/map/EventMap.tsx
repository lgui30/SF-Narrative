'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { Activity } from '@/lib/content-types';

interface EventMapProps {
  activities: Activity[];
  geoJsonData?: GeoJSON.GeoJsonObject;
  activeCategory: string;
  onActivitySelect: (activity: Activity) => void;
  selectedActivityId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  free: '#3D6B4F',
  food: '#C4704B',
  community: '#2A7F8E',
  nightlife: '#7C3AED',
  outdoor: '#059669',
  events: '#D97706',
};

function createEventIcon(category: string, isSelected: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[category] || '#2A7F8E';
  const size = isSelected ? 38 : 30;
  const border = isSelected ? '3px solid #C4704B' : '2.5px solid white';
  const shadow = isSelected
    ? '0 3px 10px rgba(0,0,0,0.35), 0 0 0 3px rgba(196,112,75,0.3)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: 'event-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      border: ${border};
      box-shadow: ${shadow};
      cursor: pointer;
      transition: transform 0.15s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function EventMap({
  activities,
  geoJsonData,
  activeCategory,
  onActivitySelect,
  selectedActivityId,
}: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const onActivitySelectRef = useRef(onActivitySelect);
  onActivitySelectRef.current = onActivitySelect;

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

  // Add GeoJSON neighborhood borders (subtle)
  useEffect(() => {
    if (!mapRef.current || !isReady || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: () => ({
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#D1D5DB',
        weight: 1,
        opacity: 0.5,
      }),
      interactive: false,
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [geoJsonData, isReady]);

  // Add/update markers when activities or filter changes
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    if (clusterRef.current) {
      mapRef.current.removeLayer(clusterRef.current);
    }
    markersMapRef.current.clear();

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (clusterObj) => {
        const count = clusterObj.getChildCount();
        let size = 'small';
        if (count >= 10) size = 'medium';
        if (count >= 30) size = 'large';
        return L.divIcon({
          html: `<div class="event-cluster event-cluster-${size}"><span>${count}</span></div>`,
          className: 'event-cluster-icon',
          iconSize: L.point(36, 36),
        });
      },
    });

    const filtered = activities.filter((a) => {
      if (!a.coordinates) return false;
      if (activeCategory === 'All' || activeCategory === 'all') return true;
      return a.category === activeCategory.toLowerCase();
    });

    for (const activity of filtered) {
      if (!activity.coordinates) continue;

      const marker = L.marker(
        [activity.coordinates.lat, activity.coordinates.lng],
        {
          icon: createEventIcon(activity.category, activity.id === selectedActivityId),
        }
      );

      marker.bindTooltip(activity.title, {
        direction: 'top',
        offset: [0, -14],
        className: 'event-tooltip',
      });

      marker.on('click', () => {
        onActivitySelectRef.current(activity);
        if (mapRef.current) {
          mapRef.current.flyTo(
            [activity.coordinates!.lat, activity.coordinates!.lng],
            15,
            { duration: 0.5 }
          );
        }
      });

      markersMapRef.current.set(activity.id, marker);
      cluster.addLayer(marker);
    }

    mapRef.current.addLayer(cluster);
    clusterRef.current = cluster;
  }, [activities, activeCategory, isReady, selectedActivityId]);

  // Fly to selected activity
  const flyToSelected = useCallback(
    (activityId: string | undefined) => {
      if (!activityId || !mapRef.current) return;
      const activity = activities.find((a) => a.id === activityId);
      if (activity?.coordinates) {
        mapRef.current.flyTo(
          [activity.coordinates.lat, activity.coordinates.lng],
          15,
          { duration: 0.5 }
        );
      }
    },
    [activities]
  );

  useEffect(() => {
    flyToSelected(selectedActivityId);
  }, [selectedActivityId, flyToSelected]);

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="h-full w-full" />

      {/* Collapsible legend */}
      <div className="absolute bottom-20 left-4 z-[1000]">
        {legendOpen ? (
          <div className="bg-card-bg/95 backdrop-blur-md rounded-lg shadow-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <p className="section-label">Legend</p>
              <button
                onClick={() => setLegendOpen(false)}
                className="text-text-muted hover:text-foreground text-sm leading-none"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize text-text-muted">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLegendOpen(true)}
            className="w-8 h-8 rounded-full bg-card-bg/95 backdrop-blur-md shadow-lg flex items-center justify-center text-text-muted hover:text-foreground text-sm font-serif italic"
          >
            i
          </button>
        )}
      </div>
    </div>
  );
}

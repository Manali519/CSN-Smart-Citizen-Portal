import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [19.8762, 75.3433]; // Chhatrapati Sambhajinagar [lat, lng]

export const STATUS_COLORS = {
  'Pending Review': '#f59e0b',
  'Suspected Fake': '#ef4444',
  Rejected: '#6b7280',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
  Closed: '#15803d',
  Reopened: '#a855f7',
};

export default function MapView({ markers = [], pin = null, onPick, height = 360 }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const pinLayerRef = useRef(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    const map = L.map(elRef.current).setView(DEFAULT_CENTER, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (e) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
    markerLayerRef.current = L.layerGroup().addTo(map);
    pinLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const layer = markerLayerRef.current;
    layer.clearLayers();
    markers.forEach((m) => {
      const color = STATUS_COLORS[m.status] || '#6b7280';
      const box = document.createElement('div');
      box.textContent = m.label || m.status; // textContent: user text is never parsed as HTML
      L.circleMarker([m.lat, m.lng], { radius: 8, color, fillColor: color, fillOpacity: 0.7 })
        .bindPopup(box)
        .addTo(layer);
    });
    if (markers.length) {
      mapRef.current.fitBounds(markers.map((m) => [m.lat, m.lng]), { padding: [30, 30], maxZoom: 16 });
    }
  }, [markers]);

  // The pin is redrawn without re-fitting the view, so picking does not make the map jump.
  useEffect(() => {
    const layer = pinLayerRef.current;
    layer.clearLayers();
    if (pin) {
      L.circleMarker([pin.lat, pin.lng], { radius: 10, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.8 }).addTo(layer);
    }
  }, [pin]);

  return (
    <div
      ref={elRef}
      style={{ height, width: '100%', borderRadius: 8, cursor: onPick ? 'crosshair' : undefined }}
    />
  );
}

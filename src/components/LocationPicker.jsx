'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:22px;height:22px;border-radius:999px 999px 999px 2px;transform:rotate(-45deg);background:#e8873d;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.28)"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22]
});

export default function LocationPicker({ coordinates, onChange }) {
  const position = coordinates?.length === 2 ? [coordinates[1], coordinates[0]] : [28.6139, 77.209];
  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-[#cbd8d3]">
      <MapContainer center={position} zoom={coordinates ? 16 : 11} className="h-full w-full" scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInteraction position={position} onChange={onChange} />
        {coordinates && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}

function MapInteraction({ position, onChange }) {
  const map = useMap();
  useEffect(() => { map.setView(position, Math.max(map.getZoom(), 15)); }, [map, position]);
  useMapEvents({ click(event) { onChange([event.latlng.lng, event.latlng.lat]); } });
  return null;
}

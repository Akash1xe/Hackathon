'use client';

import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:22px;height:22px;border-radius:999px 999px 999px 2px;transform:rotate(-45deg);background:#e8873d;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.28)"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22]
});

export default function ReportMap({ location }) {
  if (!location?.coordinates?.length) return null;
  const position = [location.coordinates[1], location.coordinates[0]];
  return <div className="h-72 overflow-hidden rounded-2xl border border-[#dce3df]"><MapContainer center={position} zoom={16} className="h-full w-full" scrollWheelZoom={false}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={position} icon={markerIcon} /></MapContainer></div>;
}

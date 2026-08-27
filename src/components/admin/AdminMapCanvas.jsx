'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from '@/components/StatusBadge';
import { categoryLabel } from '@/lib/constants';

const colors = { submitted: '#0284c7', in_review: '#d97706', assigned: '#7c3aed', in_progress: '#2563eb', resolved: '#059669', rejected: '#e11d48' };

export default function AdminMapCanvas({ reports }) {
  const positions = reports.filter((report) => report.location?.coordinates?.length === 2);
  return <MapContainer center={[28.6139, 77.209]} zoom={11} className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitReports reports={positions} />{positions.map((report) => { const position = [report.location.coordinates[1], report.location.coordinates[0]]; const color = colors[report.status] || '#0b6b58'; const icon = L.divIcon({ className: '', html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></span>`, iconSize:[18,18], iconAnchor:[9,9] }); return <Marker key={report.id} position={position} icon={icon}><Popup minWidth={230}><div className="p-1"><p className="text-xs font-bold uppercase text-slate-500">{categoryLabel(report.category)}</p><p className="mt-1 font-extrabold text-slate-900">{report.title}</p><p className="mt-1 text-xs text-slate-600">{report.location.address}</p><div className="mt-3 flex items-center justify-between"><StatusBadge status={report.status} /><Link href={`/admin/reports?open=${report.id}`} className="text-xs font-extrabold text-emerald-700">Manage</Link></div></div></Popup></Marker>; })}</MapContainer>;
}

function FitReports({ reports }) {
  const map = useMap();
  useEffect(() => { if (!reports.length) return; const bounds = L.latLngBounds(reports.map((report) => [report.location.coordinates[1], report.location.coordinates[0]])); map.fitBounds(bounds, { padding: [35,35], maxZoom: 15 }); }, [map, reports]);
  return null;
}

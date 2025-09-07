// File: c:\hackathon\src\components\admin\MapComponent.jsx
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Status color mapping
const statusColors = {
  submitted: '#3b82f6', // blue
  in_review: '#f59e0b', // amber
  assigned: '#8b5cf6', // purple
  in_progress: '#6366f1', // indigo
  resolved: '#10b981', // green
  rejected: '#ef4444', // red
};

// Fix Leaflet's icon issue with webpack
const fixLeafletIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Custom marker based on status
const createCustomMarker = (status, isMain = false) => {
  const size = isMain ? 32 : 24;
  const borderWidth = isMain ? 3 : 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${statusColors[status] || '#6b7280'}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: ${borderWidth}px solid white;
      ${isMain ? 'box-shadow: 0 0 0 2px rgba(0,0,0,0.2);' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

export default function MapComponent({ mainReport, nearbyReports, loading }) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);
  
  if (!mainReport || !mainReport.location || !mainReport.location.coordinates) {
    return <div className="h-full bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">No location data</p>
    </div>;
  }
  
  const [lng, lat] = mainReport.location.coordinates;
  const position = [lat, lng];
  
  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Main report marker */}
      <Marker 
        position={position} 
        icon={createCustomMarker(mainReport.status, true)}
      >
        <Popup>
          <div className="max-w-xs">
            <h3 className="font-medium">{mainReport.title}</h3>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">
                {mainReport.category}
              </span>
              <span 
                className="px-2 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: statusColors[mainReport.status] || '#6b7280' }}
              >
                {mainReport.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {mainReport.location.address}
            </p>
          </div>
        </Popup>
      </Marker>
      
      {/* Area circle */}
      <Circle 
        center={position} 
        radius={300} 
        pathOptions={{ 
          color: statusColors[mainReport.status] || '#6b7280', 
          fillOpacity: 0.1,
          weight: 1
        }} 
      />
      
      {/* Nearby reports */}
      {!loading && nearbyReports && nearbyReports.map(report => {
        if (!report.location || !report.location.coordinates) return null;
        
        const [nLng, nLat] = report.location.coordinates;
        
        return (
          <Marker 
            key={report._id} 
            position={[nLat, nLng]} 
            icon={createCustomMarker(report.status)}
          >
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-medium">{report.title}</h3>
                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {report.category}
                  </span>
                  <span 
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: statusColors[report.status] || '#6b7280' }}
                  >
                    {report.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {report.location.address}
                </p>
                <a 
                  href={`/admin/reports/${report._id}`}
                  className="mt-2 block px-3 py-1 bg-indigo-600 text-white text-xs rounded text-center hover:bg-indigo-700"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
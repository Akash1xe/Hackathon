// File: c:\hackathon\src\components\ReportMap.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

export default function ReportMap({ reports, height = '500px', center = [20.5937, 78.9629], zoom = 5 }) {
  const mapRef = useRef(null);

  // Ensure reports is an array
  const validReports = Array.isArray(reports) ? reports : [];

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }} 
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validReports.map(report => (
          <Marker 
            key={report._id} 
            position={[
              report.location.coordinates[1], 
              report.location.coordinates[0]
            ]}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{report.title}</h3>
                <p className="text-sm">{report.description.substring(0, 100)}...</p>
                <p className="text-xs mt-2">
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                    {formatStatus(report.status)}
                  </span>
                </p>
                <a 
                  href={`/reports/${report._id}`} 
                  className="text-blue-500 hover:underline text-sm block mt-2"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusColor(status) {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'in_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
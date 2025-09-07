// File: c:\hackathon\src\components\admin\ReportDetailMap.jsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MapContainer to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function ReportDetailMap({ report }) {
  const [nearbyReports, setNearbyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchNearbyReports() {
      if (!report || !report.location || !report.location.coordinates) {
        setLoading(false);
        return;
      }
      
      try {
        const [lng, lat] = report.location.coordinates;
        const response = await fetch(`/api/admin/nearby-reports?lng=${lng}&lat=${lat}&distance=1000`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch nearby reports');
        }
        
        const data = await response.json();
        
        // Filter out the current report
        const filtered = data.reports.filter(r => r._id !== report._id);
        setNearbyReports(filtered);
      } catch (error) {
        console.error('Error fetching nearby reports:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNearbyReports();
  }, [report]);
  
  if (!report || !report.location || !report.location.coordinates) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-800">No location data available for this report</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Report Location</h3>
      
      <div className="h-[300px] mb-4 rounded-md overflow-hidden">
        <MapComponent 
          mainReport={report}
          nearbyReports={nearbyReports}
          loading={loading}
        />
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium mb-1">Address</h4>
        <p className="text-gray-700">{report.location.address}</p>
      </div>
      
      {nearbyReports.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Nearby Reports ({nearbyReports.length})</h4>
          <div className="max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {nearbyReports.map(nearby => (
                <li key={nearby._id} className="p-2 border rounded-md hover:bg-gray-50">
                  <a 
                    href={`/admin/reports/${nearby._id}`}
                    className="block"
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium text-indigo-600">{nearby.title}</h5>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        nearby.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        nearby.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {nearby.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{nearby.category}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
// File: c:\hackathon\src\components\admin\AdminMapView.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Fix Leaflet icon issues with Next.js
const fixLeafletIcon = () => {
  // Fix leaflet's default icon path issues with webpack
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Status color mapping
const statusColors = {
  submitted: '#3b82f6', // blue
  in_review: '#f59e0b', // amber
  assigned: '#8b5cf6', // purple
  in_progress: '#6366f1', // indigo
  resolved: '#10b981', // green
  rejected: '#ef4444', // red
};

// Custom marker based on status
const createCustomMarker = (status) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${statusColors[status] || '#6b7280'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map position updater component
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function AdminMapView({ filters }) {
  const [reports, setReports] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedReport, setSelectedReport] = useState(null);
  const mapRef = useRef(null);
  
  // Fix Leaflet icon on client-side only
  useEffect(() => {
    fixLeafletIcon();
  }, []);
  
  // Client-side only heatmap rendering
  useEffect(() => {
    // Function to get the current map instance
    const getMap = () => {
      return mapRef.current ? mapRef.current : null;
    };
    
    let heatmapLayer = null;
    
    async function setupHeatmap() {
      const map = getMap();
      if (filters.mapType === 'heatmap' && heatmapData.length > 0 && map) {
        try {
          // First ensure we have the leaflet-heat plugin
          if (!L.heatLayer) {
            // Load the leaflet.heat.js plugin if not available
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
            script.async = true;
            
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
              document.body.appendChild(script);
            });
          }
          
          // Use Leaflet's native heat layer implementation
          if (typeof L.heatLayer === 'function') {
            const map = getMap();
            if (!map) return;
            
            // Remove any existing heatmap layer
            if (heatmapLayer && map.hasLayer(heatmapLayer)) {
              map.removeLayer(heatmapLayer);
            }
            
            // Create heatmap points array
            const points = heatmapData.map(point => [
              point.lat,
              point.lng,
              point.weight || 1 // Use weight if available, or default to 1
            ]);
            
            // Create and add the heat layer
            heatmapLayer = L.heatLayer(points, {
              radius: 25,
              blur: 15,
              maxZoom: 17,
              gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
            }).addTo(map);
            
            console.log('Heatmap created with', points.length, 'points');
          } else {
            console.error('L.heatLayer is not available');
            setError('Heatmap visualization is not available');
          }
        } catch (err) {
          console.error('Failed to create heatmap:', err);
          setError('Heatmap visualization is not available');
        }
      }
    }
    
    if (typeof window !== 'undefined' && filters.mapType === 'heatmap') {
      setupHeatmap();
    }
    
    // Cleanup function
    return () => {
      const map = getMap();
      if (heatmapLayer && map && map.hasLayer(heatmapLayer)) {
        map.removeLayer(heatmapLayer);
      }
    };
  }, [filters.mapType, heatmapData]);
  
  // Fetch reports based on filters
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // If we're requesting heatmap but we're in SSR, bail early
        if (filters.mapType === 'heatmap' && typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const { status, category, days, mapType } = filters;
        
        // Build query params
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (days) params.append('days', days);
        
        // Different endpoints based on display type
        let url = '/api/admin/map-data';
        let data;
        
        if (mapType === 'clusters') {
          url = '/api/admin/map-clusters';
          
          // Add zoom parameter for clustering
          if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom();
            params.append('zoom', currentZoom);
          }
          
          const response = await fetch(`${url}?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch cluster data');
          }
          
          data = await response.json();
          setClusters(data.clusters || []);
        } 
        else if (mapType === 'heatmap') {
          url = '/api/admin/map-heatmap';
          
          // Add priority weight parameter
          params.append('priorityWeight', 'true');
          
          const response = await fetch(`${url}?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch heatmap data');
          }
          
          data = await response.json();
          setHeatmapData(data.heatmapData || []);
        } 
        else {
          // Regular markers
          const response = await fetch(`${url}?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch map data');
          }
          
          data = await response.json();
          setReports(data.mapData || []);
          
          // If we have reports, center map on the first one
          if (data.mapData && data.mapData.length > 0) {
            const [lng, lat] = data.mapData[0].location.coordinates;
            setMapCenter([lat, lng]);
          }
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [filters]);
  
  // Handle report click
  const handleReportClick = (report) => {
    setSelectedReport(report);
    
    // Center map on selected report
    const [lng, lat] = report.location.coordinates;
    setMapCenter([lat, lng]);
    setMapZoom(16);
  };
  
  return (
    <div className="h-full">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
          <div className="text-gray-500">Loading map data...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center">
          <div className="text-red-500 p-4 bg-red-50 rounded-md max-w-md">
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
            {filters.mapType === 'heatmap' && (
              <button 
                className="mt-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded"
                onClick={() => {
                  setError(null);
                  // Switch to markers view as fallback
                  const newFilters = {...filters, mapType: 'markers'};
                  // Update parent component with new filter value
                  if (typeof filters.onChange === 'function') {
                    filters.onChange(newFilters);
                  }
                }}
              >
                Switch to Markers View
              </button>
            )}
          </div>
        </div>
      )}
      
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* Render different visualizations based on selected map type */}
        {filters.mapType === 'markers' && reports.map(report => (
          <Marker 
            key={report.id}
            position={[report.location.coordinates[1], report.location.coordinates[0]]}
            icon={createCustomMarker(report.status)}
            eventHandlers={{
              click: () => handleReportClick(report)
            }}
          >
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-medium text-lg">{report.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description.substring(0, 100)}...</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    {report.category}
                  </span>
                  <span 
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: statusColors[report.status] || '#6b7280' }}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {report.location.address}
                </div>
                <button
                  className="mt-3 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  onClick={() => window.open(`/admin/reports/${report.id}`, '_blank')}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {filters.mapType === 'clusters' && (
          <MarkerClusterGroup>
            {clusters.map(cluster => (
              <Marker
                key={cluster.cellId}
                position={[cluster.coordinates[1], cluster.coordinates[0]]}
                icon={L.divIcon({
                  className: 'custom-cluster-marker',
                  html: `<div class="flex items-center justify-center bg-indigo-600 text-white rounded-full" style="width: ${30 + Math.min(cluster.count * 3, 30)}px; height: ${30 + Math.min(cluster.count * 3, 30)}px;">
                          <span class="text-xs font-bold">${cluster.count}</span>
                        </div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                })}
              >
                <Popup>
                  <div className="max-w-xs">
                    <h3 className="font-medium">Cluster of {cluster.count} reports</h3>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium">Status breakdown:</h4>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {Object.entries(cluster.statusCounts || {}).map(([status, count]) => (
                          <div key={status} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: statusColors[status] || '#6b7280' }}
                            ></div>
                            <span className="text-xs">{status}: {count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      className="mt-3 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                      onClick={() => {
                        // Zoom in to this cluster
                        setMapCenter([cluster.coordinates[1], cluster.coordinates[0]]);
                        setMapZoom(mapZoom + 2);
                      }}
                    >
                      Zoom In
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
        
        {/* Heatmap layer is added programmatically via useEffect */}
        {filters.mapType === 'heatmap' && heatmapData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <p className="text-gray-600">No data available for heatmap</p>
          </div>
        )}
        
        {/* Show circle around selected report */}
        {selectedReport && (
          <Circle
            center={[selectedReport.location.coordinates[1], selectedReport.location.coordinates[0]]}
            radius={200}
            pathOptions={{ color: statusColors[selectedReport.status] || '#6b7280', fillOpacity: 0.1 }}
          />
        )}
      </MapContainer>
      
      {/* Report details sidebar if a report is selected */}
      {selectedReport && (
        <div className="absolute top-4 right-4 w-72 bg-white rounded-lg shadow-lg p-4 z-10">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSelectedReport(null)}
          >
            &times;
          </button>
          
          <h3 className="font-medium text-lg mb-2">{selectedReport.title}</h3>
          
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
              {selectedReport.category}
            </span>
            <span 
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: statusColors[selectedReport.status] || '#6b7280' }}
            >
              {selectedReport.status}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
              {selectedReport.priority}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {selectedReport.description}
          </p>
          
          <div className="text-xs text-gray-500 mb-3">
            <p><strong>Location:</strong> {selectedReport.location.address}</p>
            <p><strong>Reported:</strong> {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
            {selectedReport.submittedBy && (
              <p><strong>Submitted by:</strong> {selectedReport.submittedBy.name}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <a
              href={`/admin/reports/${selectedReport.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded text-center hover:bg-indigo-700"
            >
              View Details
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.location.coordinates[1]},${selectedReport.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded text-center hover:bg-gray-200"
            >
              Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
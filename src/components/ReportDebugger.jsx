'use client';

import { useState, useEffect } from 'react';

export default function ReportDebugger({ reportId, apiUrlBase }) {
  const [debugInfo, setDebugInfo] = useState({
    isLoading: true,
    apiUrl: '',
    directApiResponse: null,
    error: null
  });

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Test direct API call
        const url = `${apiUrlBase || ''}/api/reports/${reportId}`;
        setDebugInfo(prev => ({ ...prev, apiUrl: url }));
        
        const response = await fetch(url);
        const data = await response.json();
        
        setDebugInfo(prev => ({
          ...prev,
          isLoading: false,
          directApiResponse: data
        }));
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    };

    fetchDebugInfo();
  }, [reportId, apiUrlBase]);

  if (debugInfo.isLoading) {
    return <div className="p-4 bg-gray-100 rounded-md mt-4">Loading debug info...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md mt-4 text-sm">
      <h3 className="font-bold mb-2">Debug Information</h3>
      <div className="mb-2">
        <strong>API URL:</strong> {debugInfo.apiUrl}
      </div>
      
      {debugInfo.error ? (
        <div className="text-red-600">
          <strong>Error:</strong> {debugInfo.error}
        </div>
      ) : (
        <div>
          <strong>API Response:</strong>
          <pre className="bg-white p-2 rounded overflow-auto max-h-40 mt-1">
            {JSON.stringify(debugInfo.directApiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

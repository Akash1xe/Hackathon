// File: c:\hackathon\src\components\ReportStats.jsx
'use client';

import { useState, useEffect } from 'react';

export default function ReportStats({ userId }) {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to fetch reports');
        
        const data = await res.json();
        
        // Calculate stats
        const reports = data.reports;
        const total = reports.length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const inProgress = reports.filter(r => 
          ['assigned', 'in_progress', 'in_review'].includes(r.status)
        ).length;
        
        setStats({ total, resolved, inProgress });
      } catch (err) {
        console.error('Error fetching report stats:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <>
        <StatCard title="Loading..." value="..." />
        <StatCard title="Loading..." value="..." />
        <StatCard title="Loading..." value="..." />
      </>
    );
  }
  
  return (
    <>
      <StatCard 
        title="Total Reports" 
        value={stats.total} 
        color="bg-blue-500" 
      />
      <StatCard 
        title="In Progress" 
        value={stats.inProgress} 
        color="bg-yellow-500" 
      />
      <StatCard 
        title="Resolved" 
        value={stats.resolved} 
        color="bg-green-500" 
      />
    </>
  );
}

function StatCard({ title, value, color = "bg-indigo-500" }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`w-12 h-12 rounded-full ${color} text-white flex items-center justify-center mb-4`}>
        <span className="text-xl font-bold">{value}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    </div>
  );
}
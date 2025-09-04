// File: c:\hackathon\src\components\AdminStats.jsx
'use client';

import { useState, useEffect } from 'react';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        
        if (!res.ok) {
          throw new Error('Failed to fetch admin statistics');
        }
        
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill().map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>Error loading admin statistics: {error}</p>
      </div>
    );
  }
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Reports"
        value={stats.totalReports}
        icon="📊"
        color="bg-blue-500"
      />
      <StatCard
        title="Open Reports"
        value={(stats.statusCounts.submitted || 0) + 
               (stats.statusCounts.in_review || 0) + 
               (stats.statusCounts.assigned || 0) + 
               (stats.statusCounts.in_progress || 0)}
        icon="🔍"
        color="bg-yellow-500"
      />
      <StatCard
        title="Resolved Reports"
        value={stats.statusCounts.resolved || 0}
        icon="✅"
        color="bg-green-500"
      />
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon="👥"
        color="bg-purple-500"
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-full`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
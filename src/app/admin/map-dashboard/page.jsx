// File: c:\hackathon\src\app\admin\map-dashboard\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdminMapStats from '@/components/admin/AdminMapStats';
import AdminMapFilters from '@/components/admin/AdminMapFilters';

// Import map component dynamically to avoid SSR issues with map libraries
const AdminMapView = dynamic(() => import('@/components/admin/AdminMapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function AdminMapDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    days: 30,
    mapType: 'markers', // markers, clusters, heatmap
  });
  
  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/Login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchStats();
  }, [status, session, router]);
  
  // Fetch stats for dashboard
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/map-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch map statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching map statistics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }
  
  if (!session || session.user.role !== 'admin') {
    return null; // Router will redirect
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Map Dashboard</h1>
          <p className="mt-1 text-gray-500">View and manage reports geographically</p>
        </div>
        
        {/* Stats cards */}
        <AdminMapStats stats={stats} loading={loading} />
        
        {/* Map container with filters */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <AdminMapFilters filters={filters} onChange={handleFilterChange} />
          </div>
          
          <div className="h-[600px] relative">
            <AdminMapView filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
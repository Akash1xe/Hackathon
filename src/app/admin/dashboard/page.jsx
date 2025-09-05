// File: c:\hackathon\src\app\admin\dashboard\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0
  });

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // You would implement this API endpoint
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Total Reports</h2>
          <p className="text-4xl font-bold text-indigo-600">{stats.totalReports}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Resolved Reports</h2>
          <p className="text-4xl font-bold text-green-600">{stats.resolvedReports}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Pending Reports</h2>
          <p className="text-4xl font-bold text-yellow-600">{stats.pendingReports}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link href="/admin/reports" className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50">
              <h3 className="text-lg font-medium">Manage Reports</h3>
              <p className="text-gray-500">View and manage user reports</p>
            </Link>
            
            <Link href="/admin/users" className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50">
              <h3 className="text-lg font-medium">Manage Users</h3>
              <p className="text-gray-500">View and manage system users</p>
            </Link>
            
            <Link href="/admin/send-notification" className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50">
              <h3 className="text-lg font-medium">Send Notifications</h3>
              <p className="text-gray-500">Send notifications to users</p>
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-500">
            Recent activity will be displayed here. This section would typically show 
            recent reports, user registrations, or system events.
          </p>
        </div>
      </div>
    </div>
  );
}
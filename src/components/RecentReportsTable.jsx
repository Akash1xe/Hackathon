// File: c:\hackathon\src\components\RecentReportsTable.jsx
'use client';

import { useState, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import Link from 'next/link';

export default function RecentReportsTable() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports?limit=10');
        
        if (!res.ok) {
          throw new Error('Failed to fetch reports');
        }
        
        const data = await res.json();
        setReports(data.reports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReports();
  }, []);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {Array(5).fill().map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  if (reports.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-500">No reports found</div>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{report.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                  {formatStatus(report.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{formatCategory(report.category)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{report.submittedBy.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistance(new Date(report.createdAt), new Date(), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link href={`/reports/${report._id}`} className="text-indigo-600 hover:text-indigo-900">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCategory(category) {
  return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
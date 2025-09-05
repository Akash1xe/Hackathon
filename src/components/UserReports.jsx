// File: c:\hackathon\src\components\UserReports.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';

export default function UserReports({ userId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to fetch reports');
        
        const data = await res.json();
        setReports(data.reports);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReports();
  }, []);
  
  if (loading) return <div className="text-center py-4">Loading your reports...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;
  if (reports.length === 0) return <div className="text-gray-500 py-4">You haven't submitted any reports yet.</div>;
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
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
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {report.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistance(new Date(report.createdAt), new Date(), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link href={`/reports/${report._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                  View
                </Link>
                {report.status !== 'resolved' && report.status !== 'rejected' && (
                  <Link href={`/dashboard/edit/${report._id}`} className="text-yellow-600 hover:text-yellow-900">
                    Edit
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
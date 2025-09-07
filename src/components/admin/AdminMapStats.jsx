// File: c:\hackathon\src\components\admin\AdminMapStats.jsx
import { useState } from 'react';
import { 
  ChartBarIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function AdminMapStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-yellow-800">No statistics available</p>
      </div>
    );
  }
  
  const { total, byStatus, byCategory, byPriority } = stats;
  
  // Calculate percentages for active reports
  const totalActive = total - (byStatus.resolved || 0) - (byStatus.rejected || 0);
  const activePercent = total > 0 ? Math.round((totalActive / total) * 100) : 0;
  
  // Calculate percentages for resolved reports
  const resolvedPercent = total > 0 ? Math.round(((byStatus.resolved || 0) / total) * 100) : 0;
  
  // Calculate percentages for high priority reports
  const highPriorityCount = (byPriority.high || 0) + (byPriority.urgent || 0);
  const highPriorityPercent = total > 0 ? Math.round((highPriorityCount / total) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex items-center">
          <ChartBarIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Total Reports</h3>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex items-center">
          <ClockIcon className="h-8 w-8 text-yellow-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Active Reports</h3>
            <p className="text-2xl font-bold">{totalActive} <span className="text-sm text-gray-500">({activePercent}%)</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Resolved</h3>
            <p className="text-2xl font-bold">{byStatus.resolved || 0} <span className="text-sm text-gray-500">({resolvedPercent}%)</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">High Priority</h3>
            <p className="text-2xl font-bold">{highPriorityCount} <span className="text-sm text-gray-500">({highPriorityPercent}%)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
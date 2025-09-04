// File: c:\hackathon\src\components\StatusUpdateForm.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StatusUpdateForm({ reportId, currentStatus, isAdmin }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Define available status options based on current status and user role
  const getStatusOptions = () => {
    switch (currentStatus) {
      case 'submitted':
        return isAdmin 
          ? ['submitted', 'in_review', 'assigned', 'rejected'] 
          : ['submitted'];
      case 'in_review':
        return isAdmin 
          ? ['in_review', 'assigned', 'rejected'] 
          : ['in_review'];
      case 'assigned':
        return isAdmin 
          ? ['assigned', 'in_progress', 'rejected'] 
          : ['assigned'];
      case 'in_progress':
        return isAdmin 
          ? ['in_progress', 'resolved', 'rejected'] 
          : ['in_progress'];
      default:
        return [currentStatus];
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (status === currentStatus && !comment) {
      return; // No changes to submit
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          statusComment: comment
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      
      // Refresh the page to show the updated status
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          disabled={!isAdmin}
        >
          {getStatusOptions().map((option) => (
            <option key={option} value={option}>
              {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add a comment about this status update"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || (status === currentStatus && !comment)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </form>
  );
}
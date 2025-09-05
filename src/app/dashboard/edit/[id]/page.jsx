// File: c:\hackathon\src\app\dashboard\edit\[id]\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [report, setReport] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/Login');
      return;
    }
    
    fetchReport();
  }, [session, status, reportId, router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/${reportId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Report not found');
          return;
        }
        throw new Error('Failed to fetch report');
      }
      
      const reportData = await response.json();
      setReport(reportData);
      
      // Check if user can edit this report
      const canEdit = session.user.role === 'admin' || session.user.id === reportData.submittedBy._id;
      
      if (!canEdit) {
        setError('You do not have permission to edit this report');
        return;
      }
      
      // Populate form with current data
      setFormData({
        title: reportData.title || '',
        description: reportData.description || '',
        category: reportData.category || '',
        location: reportData.location || '',
        priority: reportData.priority || 'medium'
      });
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear messages when form changes
    if (success) setSuccess('');
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare update data
      const updateData = { ...formData };
      
      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key];
        }
      });
      
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update report');
      }
      
      setSuccess('Report updated successfully!');
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error updating report:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load the report</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Report</h1>
          <Link href="/dashboard" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p>{success}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of the issue"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the issue"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  <option value="pothole">Pothole</option>
                  <option value="streetlight">Streetlight</option>
                  <option value="water_leak">Water Leak</option>
                  <option value="garbage">Garbage Collection</option>
                  <option value="graffiti">Graffiti</option>
                  <option value="noise">Noise Complaint</option>
                  <option value="traffic">Traffic Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.location}
                onChange={handleChange}
                placeholder="Street address or landmark"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
// File: c:\hackathon\src\app\admin\send-notification\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AdminSendNotificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  
  const [formData, setFormData] = useState({
    recipientType: 'user',
    recipientId: '',
    recipientEmail: '',
    role: 'citizen',
    title: '',
    message: '',
    type: 'admin_alert',
    relatedReportId: ''
  });

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch users and reports for dropdowns
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersResponse = await fetch('/api/admin/users?limit=100');
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsers(userData.users);
        }
        
        // Fetch reports
        const reportsResponse = await fetch('/api/admin/reports?limit=100');
        if (reportsResponse.ok) {
          const reportData = await reportsResponse.json();
          setReports(reportData.reports);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load users or reports');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session, status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear success and error messages when form changes
    if (success) setSuccess(false);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendingNotification(true);
    setError('');
    setSuccess(false);
    
    try {
      // Prepare data for sending
      const dataToSend = { ...formData };
      
      // Remove unnecessary fields based on recipient type
      if (formData.recipientType === 'user') {
        delete dataToSend.role;
      } else if (formData.recipientType === 'role' || formData.recipientType === 'all') {
        delete dataToSend.recipientId;
        delete dataToSend.recipientEmail;
      }
      
      // Only include relatedReportId if it's provided
      if (!formData.relatedReportId) {
        delete dataToSend.relatedReportId;
      }
      
      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }
      
      setSuccess(`Successfully sent ${data.count} notification(s)`);
      
      // Reset form
      setFormData({
        recipientType: 'user',
        recipientId: '',
        recipientEmail: '',
        role: 'citizen',
        title: '',
        message: '',
        type: 'admin_alert',
        relatedReportId: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingNotification(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Send Notifications</h1>
        <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="recipient-user"
                  name="recipientType"
                  value="user"
                  checked={formData.recipientType === 'user'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="recipient-user" className="ml-2 block text-sm text-gray-900">
                  Specific User
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="recipient-role"
                  name="recipientType"
                  value="role"
                  checked={formData.recipientType === 'role'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="recipient-role" className="ml-2 block text-sm text-gray-900">
                  All Users with Role
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="recipient-all"
                  name="recipientType"
                  value="all"
                  checked={formData.recipientType === 'all'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="recipient-all" className="ml-2 block text-sm text-gray-900">
                  All Users
                </label>
              </div>
            </div>
          </div>
          
          {formData.recipientType === 'user' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  id="recipientId"
                  name="recipientId"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  value={formData.recipientId}
                  onChange={handleChange}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Email
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  name="recipientEmail"
                  placeholder="user@example.com"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
          
          {formData.recipientType === 'role' && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <select
                id="role"
                name="role"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="citizen">Citizen</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Type
            </label>
            <select
              id="type"
              name="type"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="admin_alert">Admin Alert</option>
              <option value="report_status_change">Report Status Change</option>
              <option value="report_resolved">Report Resolved</option>
              <option value="comment_added">Comment Added</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="relatedReportId" className="block text-sm font-medium text-gray-700 mb-1">
              Related Report (Optional)
            </label>
            <select
              id="relatedReportId"
              name="relatedReportId"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              value={formData.relatedReportId}
              onChange={handleChange}
            >
              <option value="">None</option>
              {reports.map(report => (
                <option key={report._id} value={report._id}>
                  {report.title} - {report.status}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="Enter notification title"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows="4"
              placeholder="Enter notification message"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={sendingNotification}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {sendingNotification ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
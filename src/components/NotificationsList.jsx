// File: c:\hackathon\src\components\NotificationsList.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsList({ initialNotifications, pagination, unreadCount: initialUnreadCount }) {
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount || 0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', {
        method: 'PATCH'
      });
      
      if (!res.ok) {
        throw new Error('Failed to mark all as read');
      }
      
      // Update UI
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true })
      });
      
      if (!res.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update UI
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update UI
      const deletedNotification = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(notification => notification._id !== id));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.relatedReport) {
      router.push(`/reports/${notification.relatedReport._id}`);
    }
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    router.push(`/notifications?${params.toString()}`);
  };
  
  return (
    <div>
      {unreadCount > 0 && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex justify-end">
          <button 
            onClick={markAllAsRead}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loading ? 'Marking all as read...' : 'Mark all as read'}
          </button>
        </div>
      )}
      
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          You have no notifications.
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`relative border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
            >
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getNotificationTypeStyle(notification.type).bgColor}`}>
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {(notification.relatedReport || notification.relatedDepartment) && (
                      <div className="mt-2 text-xs">
                        {notification.relatedReport && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                            Report: {notification.relatedReport.title || notification.relatedReport}
                          </span>
                        )}
                        {notification.relatedDepartment && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Dept: {notification.relatedDepartment.name || notification.relatedDepartment}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0 h-3 w-3 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteNotification(notification._id)}
                className="absolute top-6 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Delete notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> notifications
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // Calculate page numbers to show (current page and 4 surrounding pages)
                const pageNum = i + Math.max(1, Math.min(pagination.page - 2, pagination.pages - 4));
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === pagination.page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationTypeStyle(type) {
  switch (type) {
    case 'report_status_change':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      };
    case 'report_assigned':
      return {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
      };
    case 'report_resolved':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      };
    case 'comment_added':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      };
    case 'admin_alert':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
      };
  }
}

function getNotificationTypeIcon(type) {
  const style = getNotificationTypeStyle(type);
  
  switch (type) {
    case 'report_status_change':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    case 'report_assigned':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      );
    case 'report_resolved':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'comment_added':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      );
    case 'admin_alert':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.textColor}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      );
  }
}
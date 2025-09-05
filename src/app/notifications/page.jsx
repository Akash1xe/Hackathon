// File: c:\hackathon\src\app\notifications\page.jsx
import { getServerSession } from '@/lib/getServerSession';
import { redirect } from 'next/navigation';
import NotificationsList from '@/components/NotificationsList';
import Link from 'next/link';

async function getNotifications(page = 1, limit = 20) {
  try {
    // Use the getApiUrl utility to ensure proper URL construction
    const { getApiUrl } = await import('@/lib/apiUtils');
    const url = getApiUrl(`/api/notifications?page=${page}&limit=${limit}`);
    
    // Make the API request
    const res = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 } // Ensure fresh data on each request
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch notifications: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { 
      notifications: [], 
      unreadCount: 0,
      pagination: { total: 0, page: 1, limit, pages: 0 }
    };
  }
}

export default async function NotificationsPage({ searchParams }) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  const page = parseInt(searchParams?.page || '1');
  const { notifications, unreadCount, pagination } = await getNotifications(page);
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Your Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h2>
        </div>
        
        <NotificationsList 
          initialNotifications={notifications} 
          pagination={pagination} 
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
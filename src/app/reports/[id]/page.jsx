// File: c:\hackathon\src\app\reports\[id]\page.jsx
import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/getServerSession';
import ReportDetails from '@/components/ReportDetails';
import StatusUpdateForm from '@/components/StatusUpdateForm';
import Link from 'next/link';

async function getReport(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${id}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch report');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

export default async function ReportPage({ params }) {
  const session = await getServerSession();
  const report = await getReport(params.id);
  
  if (!report) {
    notFound();
  }
  
  const isAdmin = session?.user?.role === 'admin';
  const isOwner = session?.user?.id === report.submittedBy._id;
  const canEdit = isAdmin || isOwner;
  
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Report Details</h1>
          <div className="flex space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
            {canEdit && report.status !== 'resolved' && report.status !== 'rejected' && (
              <Link 
                href={`/reports/${report._id}/edit`}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Edit Report
              </Link>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <ReportDetails report={report} />
          
          {(isAdmin || isOwner) && report.status !== 'resolved' && report.status !== 'rejected' && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <StatusUpdateForm reportId={report._id} currentStatus={report.status} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
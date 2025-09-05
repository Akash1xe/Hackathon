// File: c:\hackathon\src\app\dashboard\page.jsx
import { getServerSession } from '@/lib/getServerSession';
import { redirect } from 'next/navigation';
import UserReports from '@/components/UserReports';
import ReportStats from '@/components/ReportStats';
import CreateReportButton from '@/components/CreateReportButton';

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/Login');
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreateReportButton />
      </div>
      
      <div className="mb-8">
        <p className="text-xl mb-4">Welcome, {session.user.name}!</p>
        <p className="text-gray-600">Account type: {session.user.role}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ReportStats userId={session.user.id} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Reports</h2>
        <UserReports userId={session.user.id} />
      </div>
    </div>
  );
}
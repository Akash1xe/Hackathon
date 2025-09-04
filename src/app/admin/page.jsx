// File: c:\hackathon\src\app\admin\page.jsx
import { getServerSession } from '@/lib/getServerSession';
import { redirect } from 'next/navigation';
import AdminStats from '@/components/AdminStats';
import RecentReportsTable from '@/components/RecentReportsTable';
import DepartmentList from '@/components/DepartmentList';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link 
          href="/admin/departments/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Department
        </Link>
      </div>
      
      <AdminStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Reports</h2>
            </div>
            <RecentReportsTable />
          </div>
        </div>
        
        <div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Departments</h2>
            </div>
            <DepartmentList />
          </div>
        </div>
      </div>
    </div>
  );
}
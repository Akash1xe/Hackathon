// File: c:\hackathon\src\app\dashboard\page.jsx
import { getServerSession } from '@/lib/getServerSession';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>You are logged in as: {session.user.role}</p>
    </div>
  );
}
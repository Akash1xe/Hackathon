import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardOverview from '@/components/DashboardOverview';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard');
  if (session.user.role === 'admin') redirect('/admin');
  return <DashboardOverview user={session.user} />;
}

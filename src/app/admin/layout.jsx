import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'admin') redirect('/dashboard');
  return <AdminShell user={session.user}>{children}</AdminShell>;
}

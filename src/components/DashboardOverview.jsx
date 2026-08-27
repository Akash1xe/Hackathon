'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import ReportCard from './ReportCard';

export default function DashboardOverview({ user }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reports?mine=true&limit=50').then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setReports(result.reports || []);
      setStats(result.summary || { total: result.pagination?.total || 0, open: 0, resolved: 0 });
    }).catch((requestError) => setError(requestError.message || 'Unable to load reports.')).finally(() => setLoading(false));
  }, []);

  return (
    <main className="site-shell py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Citizen dashboard</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Good to see you, {user.name?.split(' ')[0]}.</h1><p className="mt-2 text-[#627570]">Track your reports and see where city action stands.</p></div><Link href="/reports/new" className="button-primary"><PlusIcon className="h-4 w-4" />Report a new issue</Link></div>
      <section className="mt-8 grid gap-3 sm:grid-cols-3">{[[DocumentTextIcon,'All reports',stats.total],[ClockIcon,'Open cases',stats.open],[CheckCircleIcon,'Resolved',stats.resolved]].map(([Icon,label,value]) => <article key={label} className="surface flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ef] text-[#0b6b58]"><Icon className="h-5 w-5" /></span><div><strong className="block text-2xl font-black">{loading ? '—' : value}</strong><span className="text-sm font-semibold text-[#6b7d79]">{label}</span></div></article>)}</section>
      <section className="mt-10"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-black tracking-[-.03em]">Your recent reports</h2><p className="mt-1 text-sm text-[#627570]">Open a case to see its full timeline.</p></div>{reports.length > 3 && <Link href="/#issues" className="hidden items-center gap-1 text-sm font-bold text-[#0b6b58] sm:flex">Explore city reports <ArrowRightIcon className="h-4 w-4" /></Link>}</div>
        {error ? <div className="surface p-8 text-rose-700">{error}</div> : loading ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />)}</div> : reports.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reports.slice(0, 6).map((report) => <ReportCard key={report._id} report={report} />)}</div> : <div className="surface p-10 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f3ef] text-[#0b6b58]"><DocumentTextIcon className="h-7 w-7" /></span><h3 className="mt-4 text-xl font-black">No reports yet</h3><p className="mx-auto mt-2 max-w-md text-[#627570]">When you notice a civic issue, submit it here and follow every update from this dashboard.</p><Link href="/reports/new" className="button-primary mt-5">Create your first report</Link></div>}
      </section>
    </main>
  );
}

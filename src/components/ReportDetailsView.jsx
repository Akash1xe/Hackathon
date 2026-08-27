'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BuildingOffice2Icon, CalendarDaysIcon, MapPinIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { categoryLabel, statusLabel } from '@/lib/constants';
import CategoryIcon from './CategoryIcon';
import StatusBadge from './StatusBadge';

const ReportMap = dynamic(() => import('./ReportMap'), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-[#e7eeeb]" /> });

export default function ReportDetailsView({ id }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setReport(result); }).catch((requestError) => setError(requestError.message || 'Unable to load report.'));
  }, [id]);

  const timeline = useMemo(() => [...(report?.statusHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), [report]);
  if (error) return <main className="site-shell py-16"><div className="surface p-10 text-center"><h1 className="text-2xl font-black">Report unavailable</h1><p className="mt-2 text-rose-700">{error}</p><Link href="/#issues" className="button-secondary mt-6">Browse reports</Link></div></main>;
  if (!report) return <main className="site-shell py-12"><div className="h-[520px] animate-pulse rounded-3xl bg-white" /></main>;

  const editable = Boolean(report.viewer?.canEdit);

  async function removeReport() {
    if (!window.confirm('Remove this report from the civic register?')) return;
    setDeleting(true);
    const response = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (response.ok) { router.push('/dashboard'); router.refresh(); } else { setError(result.error); setDeleting(false); }
  }

  return (
    <main className="site-shell py-8 sm:py-12">
      <Link href="/#issues" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#54706a] hover:text-[#0b6b58]"><ArrowLeftIcon className="h-4 w-4" />Back to civic register</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <article className="surface p-5 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f3ef] text-[#0b6b58]"><CategoryIcon category={report.category} className="h-6 w-6" /></span><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#71827e]">{categoryLabel(report.category)} · {report.referenceId || `SAM-${report._id.slice(-6).toUpperCase()}`}</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">{report.title}</h1></div></div><StatusBadge status={report.status} /></div>
            <p className="mt-7 whitespace-pre-wrap text-base leading-8 text-[#516b65]">{report.description}</p>
            <div className="mt-7 grid gap-3 border-t border-[#e5eae8] pt-6 text-sm text-[#627570] sm:grid-cols-2"><p className="flex items-center gap-2"><MapPinIcon className="h-5 w-5 text-[#0b6b58]" />{report.location?.address}</p><p className="flex items-center gap-2"><CalendarDaysIcon className="h-5 w-5 text-[#0b6b58]" />Reported {format(new Date(report.createdAt), 'dd MMM yyyy, h:mm a')}</p></div>
            {report.images?.length > 0 && <div className="mt-7 grid gap-3 sm:grid-cols-2">{report.images.map((image, index) => <a key={image} href={image} target="_blank" rel="noreferrer" className="focus-ring overflow-hidden rounded-2xl border border-[#dce3df]"><img src={image} alt={`Issue evidence ${index + 1}`} className="aspect-[4/3] h-full w-full object-cover transition duration-300 hover:scale-[1.02]" /></a>)}</div>}
          </article>
          <section className="surface p-5 sm:p-7"><div className="mb-5"><p className="eyebrow">Verified location</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Where this issue was reported</h2></div><ReportMap location={report.location} /></section>
        </div>

        <aside className="space-y-5">
          {(editable || session?.user?.role === 'admin') && <div className="surface flex gap-2 p-3">{editable && <><Link href={`/reports/${id}/edit`} className="button-secondary flex-1"><PencilSquareIcon className="h-4 w-4" />Edit</Link><button onClick={removeReport} disabled={deleting} className="button-secondary text-rose-700"><TrashIcon className="h-4 w-4" /><span className="sr-only">Delete report</span></button></>}{session?.user?.role === 'admin' && <Link href={`/admin/reports?open=${id}`} className="button-primary flex-1">Manage case</Link>}</div>}
          <section className="surface p-6"><p className="eyebrow">Case timeline</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Progress history</h2><div className="mt-6">{timeline.map((entry, index) => <div key={`${entry.status}-${entry.timestamp}-${index}`} className="grid grid-cols-[24px_1fr] gap-3"><div className="flex flex-col items-center"><span className="mt-1.5 h-3 w-3 rounded-full bg-[#0b6b58] ring-4 ring-[#e8f3ef]" />{index < timeline.length - 1 && <span className="min-h-16 w-px flex-1 bg-[#cbd8d3]" />}</div><div className="pb-6"><p className="font-extrabold">{statusLabel(entry.status)}</p><p className="mt-1 text-sm leading-5 text-[#627570]">{entry.comment || 'Case status updated.'}</p><p className="mt-2 text-xs font-semibold text-[#879490]">{format(new Date(entry.timestamp), 'dd MMM yyyy, h:mm a')}</p></div></div>)}</div></section>
          <section className="surface p-6"><p className="eyebrow">Ownership</p><div className="mt-4 space-y-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#81908d]">Reported by</p><p className="mt-1 font-extrabold">{report.submittedBy?.name || 'Citizen'}</p></div><div className="border-t border-[#e5eae8] pt-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#81908d]"><BuildingOffice2Icon className="h-4 w-4" />Responsible department</p><p className="mt-1 font-extrabold">{report.assignedTo?.department?.name || 'Awaiting assignment'}</p></div></div></section>
        </aside>
      </div>
    </main>
  );
}

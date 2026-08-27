'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES, REPORT_STATUSES } from '@/lib/constants';

const AdminMapCanvas = dynamic(() => import('./AdminMapCanvas'), { ssr: false, loading: () => <div className="h-full animate-pulse bg-[#e7eeeb]" /> });

export default function AdminMapWorkspace() {
  const [filters, setFilters] = useState({ status: '', category: '', days: '90' });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { const params = new URLSearchParams(filters); setLoading(true); setError(''); fetch(`/api/admin/map-data?${params}`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setReports(result.mapData || []); }).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [filters]);
  const counts = useMemo(() => ({ total: reports.length, urgent: reports.filter((item) => item.priority === 'urgent').length, unresolved: reports.filter((item) => !['resolved','rejected'].includes(item.status)).length }), [reports]);
  return <main className="p-4 sm:p-7 lg:p-10"><div className="mx-auto max-w-[1500px]"><div><p className="eyebrow">Geographic operations</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">City issue map</h1><p className="mt-2 text-[#627570]">Find clusters, urgent cases, and service gaps across the city.</p></div><section className="mt-7 grid gap-3 sm:grid-cols-3">{[['Visible cases',counts.total],['Unresolved',counts.unresolved],['Urgent',counts.urgent]].map(([label,value]) => <div key={label} className="surface flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ef] text-[#0b6b58]"><MapPinIcon className="h-5 w-5" /></span><div><strong className="block text-2xl font-black">{loading ? '—' : value}</strong><span className="text-sm font-semibold text-[#6b7d79]">{label}</span></div></div>)}</section><div className="surface mt-5 overflow-hidden"><div className="grid gap-3 border-b border-[#dce3df] p-4 sm:grid-cols-3"><select className="field" value={filters.status} onChange={(e) => setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{REPORT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select className="field" value={filters.category} onChange={(e) => setFilters({...filters,category:e.target.value})}><option value="">All categories</option>{REPORT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select className="field" value={filters.days} onChange={(e) => setFilters({...filters,days:e.target.value})}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option><option value="0">All time</option></select></div>{error ? <div className="grid h-[620px] place-items-center p-8 text-rose-700">{error}</div> : <div className="h-[620px]"><AdminMapCanvas reports={reports} /></div>}</div></div></main>;
}

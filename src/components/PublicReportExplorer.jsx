'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES, REPORT_STATUSES } from '@/lib/constants';
import ReportCard from './ReportCard';

const emptyStats = { totalReports: 0, resolvedReports: 0, activeReports: 0, departments: 0 };

export default function PublicReportExplorer() {
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ reports: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/stats').then((response) => response.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '6' });
      Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
      try {
        const response = await fetch(`/api/reports?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load reports.');
        setData(result);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, filters.search ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, page]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  return (
    <section id="issues" className="site-shell scroll-mt-28 py-16 sm:py-20">
      <div className="mb-9 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="eyebrow">Live civic register</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">See what your city is working on.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-[#627570]">Search public reports, follow their progress, and avoid submitting duplicate issues.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['Reported', stats.totalReports], ['Active', stats.activeReports], ['Resolved', stats.resolvedReports], ['Departments', stats.departments]].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#dce3df] bg-white px-4 py-3 text-center"><strong className="block text-xl text-[#0b6b58]">{value}</strong><span className="text-[.7rem] font-bold uppercase tracking-wider text-[#71827e]">{label}</span></div>
          ))}
        </div>
      </div>

      <div className="surface mb-7 grid gap-3 p-3 sm:grid-cols-[1fr_210px_190px]">
        <label className="relative"><span className="sr-only">Search issues</span><MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-[#758783]" /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} className="field pl-11" placeholder="Search by issue, place, or reference" /></label>
        <label><span className="sr-only">Category</span><select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} className="field"><option value="">All categories</option>{REPORT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span className="sr-only">Status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="field"><option value="">All statuses</option>{REPORT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>

      {error ? <div className="surface p-8 text-center text-rose-700">{error}</div> : loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl border border-[#dce3df] bg-white/70" />)}</div>
      ) : data.reports.length ? (
        <><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.reports.map((report) => <ReportCard key={report._id} report={report} />)}</div><div className="mt-8 flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="button-secondary disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm font-bold text-[#627570]">Page {data.pagination.page} of {data.pagination.pages}</span><button disabled={page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)} className="button-secondary disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></>
      ) : <div className="surface p-12 text-center"><h3 className="text-xl font-bold">No matching reports</h3><p className="mt-2 text-[#627570]">Try a broader search or clear one of the filters.</p></div>}
    </section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES, REPORT_PRIORITIES, REPORT_STATUSES, categoryLabel } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';

export default function AdminReportsWorkspace() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    Object.entries(filters).forEach(([key,value]) => value && params.set(key,value));
    try { const response = await fetch(`/api/admin/reports?${params}`); const result = await response.json(); if (!response.ok) throw new Error(result.error); setReports(result.reports); setPagination(result.pagination); }
    catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { const timer = setTimeout(loadReports, filters.search ? 250 : 0); return () => clearTimeout(timer); }, [loadReports, filters.search]);
  useEffect(() => { const queryId = new URLSearchParams(window.location.search).get('open'); if (queryId) setOpenId(queryId); }, []);
  const updateFilter = (key,value) => { setFilters((current) => ({...current,[key]:value})); setPage(1); };
  const toggle = (id) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });

  async function batchUpdate(status) {
    if (!status || !selected.size) return;
    const response = await fetch('/api/admin/batch-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportIds: [...selected], updateData: { status }, comment: 'Status updated from case queue' }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error);
    setSelected(new Set());
    loadReports();
  }

  return (
    <main className="p-4 sm:p-7 lg:p-10"><div className="mx-auto max-w-[1500px]"><div><p className="eyebrow">Case management</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Civic response queue</h1><p className="mt-2 text-[#627570]">Review evidence, set priority, assign departments, and publish progress.</p></div>
      <div className="surface mt-7 grid gap-3 p-3 md:grid-cols-[1fr_190px_210px]"><label className="relative"><MagnifyingGlassIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-[#7a8a87]" /><input className="field pl-11" placeholder="Search title, address, or reference" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} /></label><select className="field" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option>{REPORT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select className="field" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}><option value="">All categories</option>{REPORT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      {selected.size > 0 && <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#12322f] p-4 text-white sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold">{selected.size} case{selected.size > 1 ? 's' : ''} selected</p><div className="flex gap-2"><select id="batch-status" className="field min-w-44 border-white/20 bg-white text-[#12322f]" defaultValue=""><option value="">Choose new status</option>{REPORT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button onClick={() => batchUpdate(document.getElementById('batch-status').value)} className="rounded-xl bg-[#e8873d] px-4 py-2.5 text-sm font-extrabold">Apply</button></div></div>}
      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}
      <section className="surface mt-5 overflow-hidden"><div className="hidden grid-cols-[44px_1.5fr_.75fr_.75fr_.6fr] gap-4 border-b border-[#dce3df] bg-[#f7faf8] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-[#71827e] md:grid"><span></span><span>Issue</span><span>Category</span><span>Status</span><span>Priority</span></div>
        {loading ? <div className="space-y-1 p-3">{Array.from({length:8}).map((_,i) => <div key={i} className="h-18 animate-pulse rounded-xl bg-[#f0f3f1]" />)}</div> : reports.length ? <div className="divide-y divide-[#edf0ee]">{reports.map((report) => <div key={report._id} className="grid cursor-pointer gap-3 p-5 transition hover:bg-[#f7faf8] md:grid-cols-[44px_1.5fr_.75fr_.75fr_.6fr] md:items-center md:gap-4" onClick={() => setOpenId(report._id)}><div onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.has(report._id)} onChange={() => toggle(report._id)} className="h-4 w-4 accent-[#0b6b58]" aria-label={`Select ${report.title}`} /></div><div><p className="font-extrabold">{report.title}</p><p className="mt-1 truncate text-xs font-semibold text-[#71827e]">{report.referenceId || report._id.slice(-8)} · {report.location?.address}</p></div><p className="text-sm font-semibold text-[#5f716e]">{categoryLabel(report.category)}</p><div><StatusBadge status={report.status} /></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${report.priority === 'urgent' ? 'bg-rose-100 text-rose-700' : report.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{report.priority}</span></div>)}</div> : <div className="p-12 text-center"><h2 className="text-xl font-black">No matching cases</h2><p className="mt-2 text-[#627570]">Adjust the filters to see more reports.</p></div>}
      </section>
      <div className="mt-6 flex items-center justify-center gap-3"><button className="button-secondary disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-sm font-bold text-[#627570]">Page {pagination.page} of {pagination.pages} · {pagination.total} cases</span><button className="button-secondary disabled:opacity-40" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button></div>
      {openId && <CasePanel id={openId} onClose={() => setOpenId(null)} onUpdated={loadReports} />}
    </div></main>
  );
}

function CasePanel({ id, onClose, onUpdated }) {
  const [report, setReport] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ status: '', priority: '', departmentId: '', comment: '', resolutionNote: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([fetch(`/api/admin/reports/${id}`).then((r) => r.json()), fetch('/api/departments').then((r) => r.json())]).then(([caseData, departmentData]) => { if (caseData.error) throw new Error(caseData.error); setReport(caseData); setDepartments(departmentData); setForm({ status: caseData.status, priority: caseData.priority, departmentId: caseData.assignedTo?.department?._id || '', comment: '', resolutionNote: caseData.resolutionNote || '' }); }).catch((err) => setError(err.message)); }, [id]);
  async function save(event) { event.preventDefault(); setSaving(true); setError(''); const response = await fetch(`/api/admin/reports/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) setError(result.error); else { setReport(result.report); setForm({ status: result.report.status, priority: result.report.priority, departmentId: result.report.assignedTo?.department?._id || '', comment: '', resolutionNote: result.report.resolutionNote || '' }); onUpdated(); } setSaving(false); }
  return <div className="fixed inset-0 z-[70] flex justify-end bg-[#12322f]/45 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="h-full w-full max-w-xl overflow-y-auto bg-[#f7f6f1] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dce3df] bg-white/95 p-4 backdrop-blur"><div><p className="text-xs font-extrabold uppercase tracking-wider text-[#71827e]">Case workspace</p><p className="font-black">{report?.referenceId || id.slice(-8).toUpperCase()}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d5dfdb]" aria-label="Close case"><XMarkIcon className="h-5 w-5" /></button></div>{error && <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}{!report ? <div className="m-5 h-96 animate-pulse rounded-2xl bg-white" /> : <div className="space-y-5 p-5"><section className="surface p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#71827e]">{categoryLabel(report.category)}</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{report.title}</h2></div><StatusBadge status={report.status} /></div><p className="mt-4 text-sm leading-6 text-[#627570]">{report.description}</p><p className="mt-4 text-sm font-semibold">{report.location?.address}</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e5eae8] pt-4 text-sm"><div><span className="block text-xs font-bold uppercase text-[#81908d]">Citizen</span><strong className="mt-1 block">{report.submittedBy?.name}</strong><span className="text-xs text-[#627570]">{report.submittedBy?.email}</span></div><div><span className="block text-xs font-bold uppercase text-[#81908d]">Created</span><strong className="mt-1 block">{new Date(report.createdAt).toLocaleDateString()}</strong></div></div><Link href={`/reports/${report._id}`} target="_blank" className="button-secondary mt-5 w-full">Open public case</Link></section><form onSubmit={save} className="surface space-y-5 p-5"><div><p className="eyebrow">Publish an update</p><h3 className="mt-2 text-xl font-black">Case action</h3></div><label className="block"><span className="mb-2 block text-sm font-bold">Status</span><select className="field" value={form.status} onChange={(event) => setForm({...form,status:event.target.value})}>{REPORT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold">Priority</span><select className="field capitalize" value={form.priority} onChange={(event) => setForm({...form,priority:event.target.value})}>{REPORT_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold">Responsible department</span><select className="field" value={form.departmentId} onChange={(event) => setForm({...form,departmentId:event.target.value})}><option value="">Awaiting assignment</option>{departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold">Public progress note</span><textarea className="field min-h-24" value={form.comment} onChange={(event) => setForm({...form,comment:event.target.value})} placeholder="Explain what changed and what happens next." /></label>{form.status === 'resolved' && <label className="block"><span className="mb-2 block text-sm font-bold">Resolution note</span><textarea className="field min-h-24" value={form.resolutionNote} onChange={(event) => setForm({...form,resolutionNote:event.target.value})} placeholder="Describe the completed work." /></label>}<button disabled={saving} className="button-primary w-full py-3.5 disabled:opacity-60">{saving ? 'Publishing update…' : 'Publish case update'}</button></form></div>}</aside></div>;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArchiveBoxIcon, BuildingOffice2Icon, PencilSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES } from '@/lib/constants';

const blank = { name: '', description: '', categories: [], contactEmail: '', contactPhone: '' };

export default function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/departments');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDepartments(result);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to load departments.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm(blank);
    setEditingId(null);
  }

  function edit(department) {
    setEditingId(department._id);
    setForm({
      name: department.name || '',
      description: department.description || '',
      categories: department.categories || [],
      contactEmail: department.contactEmail || '',
      contactPhone: department.contactPhone || ''
    });
    setMessage({ type: '', text: '' });
  }

  function toggleCategory(value) {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((item) => item !== value)
        : [...current.categories, value]
    }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await fetch(editingId ? `/api/departments/${editingId}` : '/api/departments', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage({ type: 'success', text: editingId ? 'Department updated successfully.' : 'Department created successfully.' });
      resetForm();
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to save department.' });
    } finally {
      setSaving(false);
    }
  }

  async function archive(department) {
    if (!window.confirm(`Archive ${department.name}? Existing cases keep their assignment.`)) return;
    try {
      const response = await fetch(`/api/departments/${department._id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (editingId === department._id) resetForm();
      setMessage({ type: 'success', text: 'Department archived.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to archive department.' });
    }
  }

  return (
    <main className="p-4 sm:p-7 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div><p className="eyebrow">Service directory</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">City departments</h1><p className="mt-2 text-[#627570]">Connect issue categories to accountable response teams.</p></div>
        {message.text && <div role="status" className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.text}</div>}
        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="surface overflow-hidden">
            <div className="border-b border-[#e5eae8] p-5"><h2 className="text-xl font-black">Active departments</h2><p className="mt-1 text-sm text-[#627570]">{departments.length} teams are available for assignment.</p></div>
            {loading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-[#f0f3f1]" />)}</div> : departments.length ? (
              <div className="divide-y divide-[#edf0ee]">{departments.map((department) => (
                <article key={department._id} className="flex gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ef] text-[#0b6b58]"><BuildingOffice2Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><h3 className="font-extrabold">{department.name}</h3><p className="mt-1 text-sm leading-6 text-[#627570]">{department.description || 'No description added.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{department.categories?.map((category) => <span key={category} className="rounded-full bg-[#f0f4f2] px-2.5 py-1 text-xs font-bold text-[#5c716c]">{REPORT_CATEGORIES.find((item) => item.value === category)?.label}</span>)}</div><p className="mt-3 text-xs font-semibold text-[#71827e]">{department.contactEmail || 'No email'}{department.contactPhone ? ` · ${department.contactPhone}` : ''}</p></div>
                  <div className="flex shrink-0 gap-1"><button onClick={() => edit(department)} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce3df] hover:bg-[#f2faf7]" aria-label={`Edit ${department.name}`}><PencilSquareIcon className="h-4 w-4" /></button><button onClick={() => archive(department)} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce3df] text-rose-700 hover:bg-rose-50" aria-label={`Archive ${department.name}`}><ArchiveBoxIcon className="h-4 w-4" /></button></div>
                </article>
              ))}</div>
            ) : <div className="p-10 text-center text-[#627570]">No departments have been added yet.</div>}
          </section>

          <form onSubmit={save} className="surface h-fit space-y-5 p-6 xl:sticky xl:top-7">
            <div className="flex items-start justify-between"><div><p className="eyebrow">{editingId ? 'Edit response team' : 'Add response team'}</p><h2 className="mt-2 text-2xl font-black">{editingId ? 'Department details' : 'New department'}</h2></div>{editingId && <button type="button" onClick={resetForm} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce3df]" aria-label="Cancel editing"><XMarkIcon className="h-4 w-4" /></button>}</div>
            <label className="block"><span className="mb-2 block text-sm font-bold">Department name</span><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Road Maintenance Division" required /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold">Description</span><textarea className="field min-h-24" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What this team is responsible for" /></label>
            <div><span className="mb-2 block text-sm font-bold">Handled categories</span><div className="grid gap-2 sm:grid-cols-2">{REPORT_CATEGORIES.map((category) => <label key={category.value} className={`cursor-pointer rounded-xl border p-3 text-xs font-bold ${form.categories.includes(category.value) ? 'border-[#0b6b58] bg-[#e8f3ef] text-[#0b6b58]' : 'border-[#dce3df] bg-white text-[#627570]'}`}><input type="checkbox" className="sr-only" checked={form.categories.includes(category.value)} onChange={() => toggleCategory(category.value)} />{category.label}</label>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold">Email</span><input className="field" type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="team@city.gov" /></label><label><span className="mb-2 block text-sm font-bold">Phone</span><input className="field" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="Contact number" /></label></div>
            <button disabled={saving} className="button-primary w-full disabled:opacity-60"><PlusIcon className="h-4 w-4" />{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create department'}</button>
          </form>
        </div>
      </div>
    </main>
  );
}

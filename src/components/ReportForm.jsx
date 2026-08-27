'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CameraIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES } from '@/lib/constants';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-[#e7eeeb]" /> });
const initial = { title: '', description: '', category: '', images: [], location: { type: 'Point', coordinates: null, address: '' } };

export default function ReportForm({ report }) {
  const router = useRouter();
  const [form, setForm] = useState(report ? { title: report.title, description: report.description, category: report.category, images: report.images || [], location: report.location } : initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  async function reverseLookup(coordinates) {
    try {
      const [lng, lat] = coordinates;
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const result = await response.json();
      if (result.address) setForm((current) => ({ ...current, location: { type: 'Point', coordinates, address: result.address } }));
    } catch {}
  }

  function setCoordinates(coordinates) {
    setForm((current) => ({ ...current, location: { ...current.location, type: 'Point', coordinates } }));
    reverseLookup(coordinates);
  }

  function useCurrentLocation() {
    setMessage('');
    if (!navigator.geolocation) return setMessage('Location is not available in this browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setCoordinates([coords.longitude, coords.latitude]); setLocating(false); },
      () => { setMessage('We could not access your location. Select the point on the map instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function upload(event) {
    const files = Array.from(event.target.files || []).slice(0, 4 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    setMessage('');
    try {
      const uploaded = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed.');
        uploaded.push(result.url);
      }
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded].slice(0, 4) }));
    } catch (error) { setMessage(error.message); } finally { setUploading(false); event.target.value = ''; }
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const response = await fetch(report ? `/api/reports/${report._id}` : '/api/reports', { method: report ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.details || {}); throw new Error(result.error || 'Unable to save report.'); }
      router.push(`/reports/${result._id || report._id}`);
      router.refresh();
    } catch (error) { setMessage(error.message); } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section className="surface space-y-6 p-5 sm:p-7">
        <div><p className="eyebrow">Issue details</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">What needs attention?</h2></div>
        {message && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</div>}
        <label className="block"><span className="mb-2 block text-sm font-bold">Short title</span><input className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Large pothole near the school entrance" maxLength={120} required />{errors.title && <Error text={errors.title} />}</label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Category</span><select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">Select the closest category</option>{REPORT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select>{errors.category && <Error text={errors.category} />}</label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Description</span><textarea className="field min-h-36 resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Explain what happened, how long it has been present, and why it is unsafe or disruptive." maxLength={2000} required />{errors.description && <Error text={errors.description} />}<span className="mt-1 block text-right text-xs font-semibold text-[#81908d]">{form.description.length}/2000</span></label>
        <div><div className="flex items-center justify-between gap-3"><div><span className="block text-sm font-bold">Photo evidence</span><span className="mt-1 block text-xs text-[#71827e]">JPEG, PNG, or WebP · up to 4 images</span></div><label className="button-secondary cursor-pointer"><CameraIcon className="h-4 w-4" />{uploading ? 'Uploading…' : 'Add photos'}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={uploading || form.images.length >= 4} /></label></div>{form.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{form.images.map((image) => <div key={image} className="relative aspect-square overflow-hidden rounded-xl border border-[#dce3df]"><img src={image} alt="Uploaded civic issue evidence" className="h-full w-full object-cover" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((item) => item !== image) })} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white" aria-label="Remove image"><XMarkIcon className="h-4 w-4" /></button></div>)}</div>}</div>
      </section>

      <section className="surface h-fit space-y-5 p-5 sm:p-7 lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Exact location</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Pin it on the map</h2></div><button type="button" onClick={useCurrentLocation} className="button-secondary shrink-0"><MapPinIcon className="h-4 w-4" />{locating ? 'Locating…' : 'Use my location'}</button></div>
        <p className="text-sm leading-6 text-[#627570]">Tap the map where the issue is located, then confirm the address below.</p>
        <LocationPicker coordinates={form.location?.coordinates} onChange={setCoordinates} />
        <label className="block"><span className="mb-2 block text-sm font-bold">Address or landmark</span><textarea className="field min-h-24 resize-y" value={form.location?.address || ''} onChange={(event) => setForm({ ...form, location: { ...form.location, address: event.target.value } })} placeholder="Street, sector, nearby landmark, city" required />{errors.location && <Error text={errors.location} />}</label>
        <button disabled={submitting || uploading} className="button-primary w-full py-3.5 disabled:opacity-60">{submitting ? 'Saving report…' : report ? 'Save report changes' : 'Submit civic report'}</button>
        <p className="text-center text-xs leading-5 text-[#71827e]">Your report will be visible in the public civic register. Your email and phone are never shown publicly.</p>
      </section>
    </form>
  );
}

function Error({ text }) { return <span className="mt-1.5 block text-xs font-semibold text-rose-700">{text}</span>; }

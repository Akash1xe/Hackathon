'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CameraIcon, ExclamationTriangleIcon, MapPinIcon, SparklesIcon, UserGroupIcon, WrenchScrewdriverIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { REPORT_CATEGORIES } from '@/lib/constants';
import VoiceReportInput from './VoiceReportInput';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-[#e7eeeb]" /> });
const initial = { title: '', description: '', category: '', images: [], assetId: '', voice: null, evidenceAnalysis: null, location: { type: 'Point', coordinates: null, address: '' } };

export default function ReportForm({ report, assetCode = '' }) {
  const router = useRouter();
  const [form, setForm] = useState(report ? { title: report.title, description: report.description, category: report.category, images: report.images || [], assetId: report.asset?._id || '', voice: report.voice || null, evidenceAnalysis: report.evidenceAnalysis || null, location: report.location } : initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const coordinates = form.location?.coordinates;
    if (!form.category || !Array.isArray(coordinates) || coordinates.length !== 2) { setDuplicates([]); return; }
    const [lng, lat] = coordinates;
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), distance: '150', category: form.category, limit: '5' });
    const assetParams = new URLSearchParams({ lat: String(lat), lng: String(lng), distance: '1000' });
    Promise.all([
      fetch(`/api/reports/nearby?${params}`).then((response) => response.json()),
      fetch(`/api/assets?${assetParams}`).then((response) => response.json())
    ]).then(([nearby, assetData]) => {
      setDuplicates((nearby.reports || []).filter((item) => item._id !== report?._id));
      setAssets(assetData.assets || []);
    }).catch(() => {});
  }, [form.category, form.location?.coordinates, report?._id]);

  useEffect(() => {
    if (!assetCode || report) return;
    fetch(`/api/assets/${encodeURIComponent(assetCode)}`).then((response) => response.json()).then((asset) => {
      if (asset.error) return;
      const categoryMap = { streetlight: 'streetlight', road: 'pothole', water: 'water_leak', waste: 'trash', public_property: 'graffiti' };
      setAssets((current) => current.some((item) => item._id === asset._id) ? current : [asset, ...current]);
      setForm((current) => ({ ...current, assetId: asset._id, category: categoryMap[asset.type] || current.category, location: asset.location }));
    }).catch(() => {});
  }, [assetCode, report]);

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
      if (uploaded[0] && form.category) await analyzeEvidence(uploaded[0]);
    } catch (error) { setMessage(error.message); } finally { setUploading(false); event.target.value = ''; }
  }

  async function analyzeEvidence(imageUrl = form.images[0]) {
    if (!imageUrl || !form.category) return;
    setAnalyzing(true);
    setMessage('');
    try {
      const response = await fetch('/api/evidence/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl, category: form.category }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Evidence analysis failed.');
      setForm((current) => ({ ...current, evidenceAnalysis: result }));
      if (result.warning) setMessage(result.warning);
    } catch (error) { setMessage(error.message); } finally { setAnalyzing(false); }
  }

  function useVoice({ transcript, language }) {
    const lowered = transcript.toLowerCase();
    const category = /pothole|gaddha|गड्ढ|road/.test(lowered) ? 'pothole' : /garbage|trash|waste|कचरा/.test(lowered) ? 'trash' : /water|leak|पानी/.test(lowered) ? 'water_leak' : /light|lamp|बत्ती/.test(lowered) ? 'streetlight' : form.category;
    setForm((current) => ({ ...current, description: current.description ? `${current.description} ${transcript}` : transcript, title: current.title || transcript.slice(0, 90), category, voice: { transcript, language } }));
  }

  function selectAsset(assetId) {
    const asset = assets.find((item) => item._id === assetId);
    if (!asset) return setForm((current) => ({ ...current, assetId: '' }));
    const categoryMap = { streetlight: 'streetlight', road: 'pothole', water: 'water_leak', waste: 'trash', public_property: 'graffiti' };
    setForm((current) => ({ ...current, assetId, category: categoryMap[asset.type] || current.category, location: asset.location }));
  }

  async function confirmDuplicate(duplicate) {
    setMessage('');
    const response = await fetch(`/api/reports/${duplicate._id}/impact`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || 'Unable to confirm this issue.');
    router.push(`/reports/${duplicate._id}`);
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
        <VoiceReportInput onTranscript={useVoice} />
        <div><div className="flex items-center justify-between gap-3"><div><span className="block text-sm font-bold">Photo evidence</span><span className="mt-1 block text-xs text-[#71827e]">JPEG, PNG, or WebP · up to 4 images</span></div><label className="button-secondary cursor-pointer"><CameraIcon className="h-4 w-4" />{uploading ? 'Uploading…' : 'Add photos'}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={uploading || form.images.length >= 4} /></label></div>{form.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{form.images.map((image) => <div key={image} className="relative aspect-square overflow-hidden rounded-xl border border-[#dce3df]"><img src={image} alt="Uploaded civic issue evidence" className="h-full w-full object-cover" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((item) => item !== image) })} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white" aria-label="Remove image"><XMarkIcon className="h-4 w-4" /></button></div>)}</div>}{form.images.length > 0 && <button type="button" onClick={() => analyzeEvidence()} disabled={analyzing || !form.category} className="button-secondary mt-3 w-full disabled:opacity-50"><SparklesIcon className="h-4 w-4" />{analyzing ? 'Running local AI analysis…' : 'Analyze evidence with AI'}</button>}{form.evidenceAnalysis && <div className={`mt-3 rounded-xl border p-4 text-sm ${form.evidenceAnalysis.categoryMatch ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex items-center justify-between"><strong>{form.evidenceAnalysis.status === 'ai_verified' ? 'AI verified' : form.evidenceAnalysis.status === 'suspicious' ? 'Suspicious evidence' : 'Needs human review'}</strong><span className="font-black">{form.evidenceAnalysis.score}/100</span></div><p className="mt-2">Suggested category: <strong>{REPORT_CATEGORIES.find((item) => item.value === form.evidenceAnalysis.suggestedCategory)?.label || 'Other'}</strong></p><p className="mt-1 text-xs">Advisory only · administrators make the final decision · {form.evidenceAnalysis.model}</p></div>}</div>
      </section>

      <section className="surface h-fit space-y-5 p-5 sm:p-7 lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Exact location</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Pin it on the map</h2></div><button type="button" onClick={useCurrentLocation} className="button-secondary shrink-0"><MapPinIcon className="h-4 w-4" />{locating ? 'Locating…' : 'Use my location'}</button></div>
        <p className="text-sm leading-6 text-[#627570]">Tap the map where the issue is located, then confirm the address below.</p>
        {assets.length > 0 && <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold"><WrenchScrewdriverIcon className="h-4 w-4" />Nearby public asset (optional)</span><select className="field" value={form.assetId} onChange={(event) => selectAsset(event.target.value)}><option value="">No specific asset</option>{assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.assetCode} · {asset.name}</option>)}</select></label>}
        <LocationPicker coordinates={form.location?.coordinates} onChange={setCoordinates} />
        <label className="block"><span className="mb-2 block text-sm font-bold">Address or landmark</span><textarea className="field min-h-24 resize-y" value={form.location?.address || ''} onChange={(event) => setForm({ ...form, location: { ...form.location, address: event.target.value } })} placeholder="Street, sector, nearby landmark, city" required />{errors.location && <Error text={errors.location} />}</label>
        {duplicates.length > 0 && !report && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 font-extrabold text-amber-900"><ExclamationTriangleIcon className="h-5 w-5" />Similar issue nearby</p><div className="mt-3 space-y-2">{duplicates.slice(0,3).map((duplicate) => <div key={duplicate._id} className="rounded-xl bg-white p-3"><p className="text-sm font-extrabold">{duplicate.title}</p><p className="mt-1 text-xs text-[#627570]">{duplicate.distanceMeters}m away · {duplicate.impactCount} citizens affected · {duplicate.status.replaceAll('_',' ')}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => confirmDuplicate(duplicate)} className="inline-flex items-center gap-1 rounded-lg bg-[#0b6b58] px-3 py-2 text-xs font-extrabold text-white"><UserGroupIcon className="h-4 w-4" />This affects me too</button><button type="button" onClick={() => router.push(`/reports/${duplicate._id}`)} className="rounded-lg border border-[#dce3df] px-3 py-2 text-xs font-bold">View</button></div></div>)}</div><p className="mt-3 text-xs font-semibold text-amber-800">You can still submit a separate report if this is a different problem.</p></div>}
        <button disabled={submitting || uploading || analyzing} className="button-primary w-full py-3.5 disabled:opacity-60">{submitting ? 'Saving report…' : report ? 'Save report changes' : 'Submit civic report'}</button>
        <p className="text-center text-xs leading-5 text-[#71827e]">Your report will be visible in the public civic register. Your email and phone are never shown publicly.</p>
      </section>
    </form>
  );
}

function Error({ text }) { return <span className="mt-1.5 block text-xs font-semibold text-rose-700">{text}</span>; }

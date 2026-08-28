'use client';

import { useState } from 'react';
import { ArrowPathIcon, CheckBadgeIcon, ClockIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function CivicProofPanel({ report, onReload }) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const active = !['resolved', 'citizen_confirmed', 'rejected'].includes(report.status);
  const dueAt = report.sla?.dueAt ? new Date(report.sla.dueAt) : null;
  const remainingMs = dueAt ? dueAt.getTime() - Date.now() : null;
  const slaProgress = dueAt && report.createdAt ? Math.min(100, Math.max(0, ((Date.now() - new Date(report.createdAt).getTime()) / (dueAt.getTime() - new Date(report.createdAt).getTime())) * 100)) : 0;

  async function request(url, options = {}) {
    setBusy(url); setMessage('');
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to complete this action.');
      setMessage(result.message || 'Thank you. Your input is now part of the public proof chain.');
      await onReload();
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  }

  function verify(verdict) {
    if (!navigator.geolocation) return setMessage('Location access is required for nearby community verification.');
    setBusy('location');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => request(`/api/reports/${report._id}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verdict, coordinates: [coords.longitude, coords.latitude] }) }),
      () => { setBusy(''); setMessage('Allow location access to verify an issue within 1 km.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function submitFeedback(resolved) {
    return request(`/api/reports/${report._id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, resolved, comment: feedbackComment }) });
  }

  const steps = [
    ['Citizen evidence', Boolean(report.images?.length), `${report.images?.length || 0} photo${report.images?.length === 1 ? '' : 's'} + GPS`],
    ['AI validation', Boolean(report.evidenceAnalysis?.analyzedAt), report.evidenceAnalysis?.analyzedAt ? `${report.evidenceAnalysis.score}/100 · ${report.evidenceAnalysis.status.replaceAll('_',' ')}` : 'Awaiting analysis'],
    ['Community validation', Object.values(report.communityCounts || {}).some(Boolean), `${report.communityCounts?.still_exists || 0} nearby confirmations`],
    ['Department acknowledgement', Boolean(report.assignedTo?.department), report.assignedTo?.department?.name || report.routing?.suggestedDepartment?.name || 'Routing pending'],
    ['SLA commitment', Boolean(dueAt), dueAt ? dueAt.toLocaleString() : 'Not assigned'],
    ['After-photo proof', Boolean(report.resolutionEvidence?.images?.length), report.resolutionEvidence?.images?.length ? `${report.resolutionEvidence.aiImprovementScore || 0}% visual improvement` : 'Awaiting department proof'],
    ['Citizen confirmation', Boolean(report.citizenFeedback?.submittedAt), report.citizenFeedback?.submittedAt ? `${report.citizenFeedback.rating}/5 · ${report.citizenFeedback.resolved ? 'confirmed' : 'disputed'}` : 'Awaiting citizen']
  ];

  return <div className="space-y-5">
    <section className="surface p-6"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Samvid proof chain</p><h2 className="mt-2 text-2xl font-black">Proof integrity</h2></div><div className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#bce3d9] bg-[#e8f3ef] text-lg font-black text-[#0b6b58]">{report.trust?.proofIntegrity || 0}%</div></div><div className="mt-6 space-y-3">{steps.map(([label,complete,detail]) => <div key={label} className="flex gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${complete ? 'bg-[#0b6b58] text-white' : 'border border-[#cbd8d3] bg-white text-[#879490]'}`}>{complete ? <CheckBadgeIcon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><div><p className="text-sm font-extrabold">{label}</p><p className="text-xs text-[#627570]">{detail}</p></div></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f7faf8] p-3 text-center"><strong className="block text-xl text-[#0b6b58]">{report.trust?.issueScore || 0}</strong><span className="text-[.68rem] font-bold uppercase text-[#71827e]">Issue trust</span></div><div className="rounded-xl bg-[#f7faf8] p-3 text-center"><strong className="block text-xl text-[#0b6b58]">{report.trust?.resolutionScore || 0}</strong><span className="text-[.68rem] font-bold uppercase text-[#71827e]">Resolution trust</span></div></div></section>

    {dueAt && active && <section className={`surface p-6 ${report.sla?.breachedAt ? 'border-rose-300' : ''}`}><div className="flex items-center justify-between"><p className="flex items-center gap-2 font-extrabold"><ClockIcon className="h-5 w-5 text-[#0b6b58]" />Service-level commitment</p><span className={`text-xs font-black uppercase ${remainingMs < 0 ? 'text-rose-700' : 'text-[#0b6b58]'}`}>{remainingMs < 0 ? 'SLA breached' : `${Math.ceil(remainingMs / 3_600_000)}h remaining`}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eeeb]"><div className={`h-full rounded-full ${remainingMs < 0 ? 'bg-rose-600' : 'bg-[#0b6b58]'}`} style={{ width: `${slaProgress}%` }} /></div><p className="mt-3 text-xs text-[#627570]">Target: {report.sla.targetHours} hours · Due {dueAt.toLocaleString()}{report.sla?.escalationLevel ? ' · Escalated to supervisor' : ''}</p></section>}

    {active && !report.viewer?.isOwner && <section className="surface p-6"><p className="eyebrow">Community impact</p><h2 className="mt-2 text-xl font-black">Does this affect you too?</h2><p className="mt-2 text-sm text-[#627570]">Aggregate demand without creating duplicate complaints.</p><button disabled={report.viewer?.hasConfirmedImpact || busy} onClick={() => request(`/api/reports/${report._id}/impact`, { method: 'POST' })} className="button-primary mt-4 w-full disabled:opacity-50"><UserGroupIcon className="h-4 w-4" />{report.viewer?.hasConfirmedImpact ? 'Impact confirmed' : `This affects me too · ${report.impactCount || 0}`}</button></section>}

    {active && <section className="surface p-6"><p className="eyebrow">Nearby verification</p><h2 className="mt-2 text-xl font-black">Can you confirm this issue?</h2><p className="mt-2 text-sm text-[#627570]">Verification requires your current location within 1 km.</p><div className="mt-4 grid gap-2"><button disabled={Boolean(busy)} onClick={() => verify('still_exists')} className="button-secondary justify-between">Still exists <span>{report.communityCounts?.still_exists || 0}</span></button><button disabled={Boolean(busy)} onClick={() => verify('no_longer_exists')} className="button-secondary justify-between">No longer exists <span>{report.communityCounts?.no_longer_exists || 0}</span></button><button disabled={Boolean(busy)} onClick={() => verify('incorrect')} className="button-secondary justify-between text-rose-700">Incorrect report <span>{report.communityCounts?.incorrect || 0}</span></button></div></section>}

    {report.viewer?.canReviewResolution && <section className="surface p-6"><p className="eyebrow">Citizen resolution check</p><h2 className="mt-2 text-xl font-black">Was this fixed properly?</h2><div className="mt-4"><label className="text-sm font-bold">Rating</label><div className="mt-2 flex gap-2">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className={`grid h-10 w-10 place-items-center rounded-xl border font-black ${rating === value ? 'border-[#0b6b58] bg-[#e8f3ef] text-[#0b6b58]' : 'border-[#dce3df] bg-white'}`}>{value}</button>)}</div></div><textarea className="field mt-4 min-h-24" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Tell the city what you observed." /><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={Boolean(busy)} onClick={() => submitFeedback(true)} className="button-primary">Yes, resolved</button><button disabled={Boolean(busy)} onClick={() => submitFeedback(false)} className="button-secondary text-rose-700">No, dispute</button></div></section>}

    {report.viewer?.canAppeal && <section className="surface border-amber-200 p-6"><p className="flex items-center gap-2 font-extrabold text-amber-900"><ExclamationTriangleIcon className="h-5 w-5" />Appeal this resolution</p><p className="mt-2 text-sm text-[#627570]">Explain why the issue remains unresolved. A supervisor will review and may reopen the case.</p><textarea className="field mt-4 min-h-28" value={appealReason} onChange={(event) => setAppealReason(event.target.value)} placeholder="The issue is still present because…" /><button disabled={Boolean(busy) || appealReason.length < 20} onClick={() => request(`/api/reports/${report._id}/appeal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: appealReason }) })} className="button-primary mt-3 w-full disabled:opacity-50"><ArrowPathIcon className="h-4 w-4" />Submit appeal</button></section>}

    {message && <div role="status" className="rounded-xl border border-[#dce3df] bg-white p-4 text-sm font-semibold text-[#54706a]">{busy === 'location' ? 'Checking your distance…' : message}</div>}
  </div>;
}

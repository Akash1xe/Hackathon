import { statusLabel } from '@/lib/constants';

const styles = {
  submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  in_review: 'border-amber-200 bg-amber-50 text-amber-800',
  assigned: 'border-violet-200 bg-violet-50 text-violet-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  citizen_confirmed: 'border-teal-200 bg-teal-50 text-teal-800',
  disputed: 'border-rose-200 bg-rose-50 text-rose-700',
  reopened: 'border-orange-200 bg-orange-50 text-orange-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700'
};

export default function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{statusLabel(status)}</span>;
}

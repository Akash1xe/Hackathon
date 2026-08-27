import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { categoryLabel } from '@/lib/constants';
import CategoryIcon from './CategoryIcon';
import StatusBadge from './StatusBadge';

export default function ReportCard({ report }) {
  return (
    <Link href={`/reports/${report._id}`} className="focus-ring group flex h-full flex-col rounded-2xl border border-[#dce3df] bg-white p-5 shadow-[0_12px_30px_rgba(18,50,47,.04)] transition hover:-translate-y-1 hover:border-[#9fc5ba] hover:shadow-[0_18px_36px_rgba(18,50,47,.09)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ef] text-[#0b6b58]"><CategoryIcon category={report.category} /></span>
        <StatusBadge status={report.status} />
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-[#6c817c]">{categoryLabel(report.category)} · {report.referenceId || 'SAMVID'}</p>
      <h3 className="text-lg font-extrabold tracking-[-.02em] text-[#12322f] group-hover:text-[#0b6b58]">{report.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#627570]">{report.description}</p>
      <div className="mt-auto pt-5">
        <p className="flex items-center gap-1.5 truncate text-sm text-[#627570]"><MapPinIcon className="h-4 w-4 shrink-0" />{report.location?.address}</p>
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0ee] pt-4 text-xs font-semibold text-[#7a8a87]">
          <span>{report.submittedBy?.name || 'Citizen report'}</span>
          <span>{report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Recently'}</span>
        </div>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuildingOffice2Icon, MapPinIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import dbConnect from '@/lib/dbConnect';
import PublicAsset from '@/model/PublicAsset';
import Report from '@/model/Report';
import StatusBadge from '@/components/StatusBadge';

export default async function AssetPage({ params }) {
  const { code } = await params;
  await dbConnect();
  const asset = await PublicAsset.findOne({ assetCode: decodeURIComponent(code).toUpperCase(), status: { $ne: 'retired' } }).populate('department', 'name').lean();
  if (!asset) notFound();
  const reports = await Report.find({ asset: asset._id, deletedAt: { $exists: false } }).select('title status referenceId createdAt').sort({ createdAt: -1 }).limit(8).lean();
  return <main className="site-shell py-10 sm:py-14"><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="space-y-6"><section className="surface p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f3ef] text-[#0b6b58]"><WrenchScrewdriverIcon className="h-6 w-6" /></span><p className="eyebrow mt-6">Registered public asset</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em]">{asset.name}</h1><p className="mt-3 text-lg font-extrabold text-[#0b6b58]">{asset.assetCode}</p><div className="mt-6 space-y-3 text-sm text-[#627570]"><p className="flex items-center gap-2"><MapPinIcon className="h-5 w-5" />{asset.location.address}</p><p className="flex items-center gap-2"><BuildingOffice2Icon className="h-5 w-5" />{asset.department?.name || 'Department not assigned'}</p></div><Link href={`/reports/new?asset=${encodeURIComponent(asset.assetCode)}`} className="button-primary mt-7">Report a problem with this asset</Link></section><section className="surface overflow-hidden"><div className="border-b border-[#dce3df] p-5"><h2 className="text-xl font-black">Complaint history</h2><p className="mt-1 text-sm text-[#627570]">{reports.length} recent cases linked to this asset.</p></div>{reports.length ? <div className="divide-y divide-[#edf0ee]">{reports.map((report) => <Link key={report._id} href={`/reports/${report._id}`} className="flex items-center justify-between gap-3 p-5 hover:bg-[#f7faf8]"><div><p className="font-extrabold">{report.title}</p><p className="mt-1 text-xs text-[#71827e]">{report.referenceId}</p></div><StatusBadge status={report.status} /></Link>)}</div> : <p className="p-8 text-center text-[#627570]">No reports are linked to this asset yet.</p>}</section></div><aside className="surface h-fit p-6 text-center"><p className="eyebrow">Scan to report</p><img src={`/api/assets/${encodeURIComponent(asset.assetCode)}/qr`} alt={`QR code for ${asset.assetCode}`} className="mx-auto mt-4 w-64 rounded-2xl border border-[#dce3df] bg-white p-3" /><p className="mt-3 text-sm text-[#627570]">Place this QR code on the physical asset for one-tap reporting.</p></aside></div></main>;
}

import ReportForm from '@/components/ReportForm';

export const metadata = { title: 'Report an issue' };

export default async function NewReportPage({ searchParams }) {
  const query = await searchParams;
  return <main className="site-shell py-10 sm:py-14"><div className="mb-8 max-w-2xl"><p className="eyebrow">New civic report</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Show the city exactly what needs attention.</h1><p className="mt-3 leading-7 text-[#627570]">Clear evidence and an accurate location help the right department act faster.</p></div><ReportForm assetCode={query?.asset || ''} /></main>;
}

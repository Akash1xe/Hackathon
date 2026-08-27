import ReportDetailsView from '@/components/ReportDetailsView';

export const metadata = { title: 'Civic report' };

export default async function ReportPage({ params }) {
  const { id } = await params;
  return <ReportDetailsView id={id} />;
}

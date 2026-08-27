import EditReportPage from '@/components/EditReportPage';

export const metadata = { title: 'Edit report' };

export default async function EditPage({ params }) {
  const { id } = await params;
  return <main className="site-shell py-10 sm:py-14"><div className="mb-8"><p className="eyebrow">Update your report</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Add clearer civic evidence.</h1></div><EditReportPage id={id} /></main>;
}

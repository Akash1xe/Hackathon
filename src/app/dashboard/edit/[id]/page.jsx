import { redirect } from 'next/navigation';

export default async function LegacyEditPage({ params }) {
  const { id } = await params;
  redirect(`/reports/${id}/edit`);
}

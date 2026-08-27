'use client';

import { useEffect, useState } from 'react';
import ReportForm from './ReportForm';

export default function EditReportPage({ id }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch(`/api/reports/${id}`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setReport(result); }).catch((err) => setError(err.message)); }, [id]);
  if (error) return <div className="surface p-8 text-rose-700">{error}</div>;
  if (!report) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  return <ReportForm report={report} />;
}

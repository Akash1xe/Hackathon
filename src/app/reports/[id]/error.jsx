'use client';

import Link from 'next/link';

export default function ReportError({ reset }) {
  return (
    <main className="site-shell grid min-h-[60vh] place-items-center py-12">
      <section className="surface max-w-xl p-8 text-center sm:p-10">
        <p className="eyebrow">Case unavailable</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">We could not load this report.</h1>
        <p className="mt-3 leading-7 text-[#627570]">The report may have been removed, or the service may be temporarily unavailable.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="button-primary">Try again</button>
          <Link href="/#issues" className="button-secondary">Browse civic reports</Link>
        </div>
      </section>
    </main>
  );
}

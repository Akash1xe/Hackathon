import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="site-shell grid min-h-[65vh] place-items-center py-12">
      <section className="surface max-w-xl p-8 text-center sm:p-12">
        <p className="eyebrow">404 · Page not found</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.045em]">This route does not lead to a civic case.</h1>
        <p className="mt-4 leading-7 text-[#627570]">Return to the public register to explore active issues, or report something that needs attention.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/#issues" className="button-primary">Explore reports</Link><Link href="/reports/new" className="button-secondary">Report an issue</Link></div>
      </section>
    </main>
  );
}

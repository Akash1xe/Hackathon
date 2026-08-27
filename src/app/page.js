import Link from 'next/link';
import { ArrowRightIcon, CheckCircleIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import PublicReportExplorer from '@/components/PublicReportExplorer';

export default function Home() {
  return (
    <main>
      <section className="site-shell grid min-h-[610px] items-center gap-10 py-14 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
        <div>
          <p className="eyebrow">Report clearly. Resolve publicly.</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">A direct line between <span className="text-[#0b6b58]">citizens</span> and city action.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5f716e]">Samvid turns local problems into trackable civic work. Pin the location, share evidence, and follow every status change until resolution.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/reports/new" className="button-primary focus-ring px-5 py-3.5">Report a civic issue <ArrowRightIcon className="h-4 w-4" /></Link><Link href="#issues" className="button-secondary focus-ring px-5 py-3.5">Explore public reports</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#60736f]"><span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-[#0b6b58]" />Location verified</span><span className="flex items-center gap-2"><ShieldCheckIcon className="h-5 w-5 text-[#0b6b58]" />Transparent tracking</span></div>
        </div>
        <div className="dot-grid relative rounded-[2rem] border border-[#cfdcd7] bg-[#eaf3ef] p-5 sm:p-8">
          <div className="surface relative overflow-hidden p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#71827e]">Sample issue journey</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Unsafe road surface</h2></div><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">In progress</span></div>
            <p className="mt-3 flex items-center gap-2 text-sm text-[#627570]"><MapPinIcon className="h-4 w-4" />Sector 62, Noida</p>
            <div className="mt-7 space-y-0">
              {[['Report received','Citizen shared details and location'],['Reviewed','Priority and department confirmed'],['Work started','Roads team is handling the issue'],['Resolved','Evidence and resolution note published']].map(([title, text], index) => (
                <div key={title} className="grid grid-cols-[28px_1fr] gap-3"><div className="flex flex-col items-center"><span className={`mt-1 h-3 w-3 rounded-full ${index < 3 ? 'bg-[#0b6b58]' : 'border-2 border-[#aebdb8] bg-white'}`} />{index < 3 && <span className="h-14 w-px bg-[#bdd4cd]" />}</div><div className="pb-5"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-[#6d7f7b]">{text}</p></div></div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-4 -left-3 rounded-xl bg-[#e8873d] px-4 py-3 text-sm font-extrabold text-white shadow-lg sm:-left-5">Every update stays visible</div>
        </div>
      </section>

      <PublicReportExplorer />

      <section id="how-it-works" className="scroll-mt-28 border-y border-[#dce3df] bg-white/70 py-20">
        <div className="site-shell"><div className="max-w-2xl"><p className="eyebrow">One accountable workflow</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">From street-level evidence to verified resolution.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[['01','Report precisely','Add a clear description, category, photos, and an exact map location.'],['02','Track responsibility','The city reviews, prioritizes, and assigns the report to the right department.'],['03','Close the loop','Citizens receive notifications as the report moves through every stage.']].map(([number,title,text]) => <article key={number} className="surface p-6"><span className="text-sm font-black text-[#e8873d]">{number}</span><h3 className="mt-6 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-[#627570]">{text}</p></article>)}</div></div>
      </section>
      <footer className="site-shell flex flex-col gap-3 py-10 text-sm text-[#6d7f7b] sm:flex-row sm:items-center sm:justify-between"><p className="font-bold text-[#12322f]">SAMVID · City action network</p><p>Built for transparent, accountable civic service.</p></footer>
    </main>
  );
}

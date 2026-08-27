import Link from 'next/link';

export default function BrandMark({ compact = false }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2.5 rounded-lg" aria-label="Samvid home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b6b58] text-white shadow-sm" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
          <path d="m8.8 10.3 2.1 2.1 4.4-4.5" />
        </svg>
      </span>
      {!compact && (
        <span>
          <span className="block text-[1.05rem] font-black tracking-[-.03em] text-[#12322f]">SAMVID</span>
          <span className="block text-[.61rem] font-bold uppercase tracking-[.18em] text-[#6d7f7b]">City action network</span>
        </span>
      )}
    </Link>
  );
}

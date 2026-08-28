'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BellAlertIcon, BuildingOffice2Icon, ChartBarSquareIcon, ClipboardDocumentListIcon, MapIcon, WrenchScrewdriverIcon, XMarkIcon, Bars3Icon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import BrandMark from '@/components/BrandMark';

const items = [
  { href: '/admin', label: 'Overview', icon: ChartBarSquareIcon, exact: true },
  { href: '/admin/reports', label: 'Case management', icon: ClipboardDocumentListIcon },
  { href: '/admin/map-dashboard', label: 'City map', icon: MapIcon },
  { href: '/admin/departments', label: 'Departments', icon: BuildingOffice2Icon },
  { href: '/admin/assets', label: 'Public assets', icon: WrenchScrewdriverIcon },
  { href: '/admin/send-notification', label: 'Public notices', icon: BellAlertIcon }
];

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f3f5f2] lg:grid lg:grid-cols-[270px_1fr]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#dce3df] bg-white px-4 lg:hidden"><BrandMark /><button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d5dfdb]" aria-label="Open admin navigation"><Bars3Icon className="h-5 w-5" /></button></header>
      {open && <button className="fixed inset-0 z-40 bg-[#12322f]/45 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] -translate-x-full flex-col bg-[#12322f] p-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : ''}`}>
        <div className="flex items-center justify-between [&_span]:text-white"><BrandMark /><button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 lg:hidden"><XMarkIcon className="h-5 w-5" /></button></div>
        <div className="mt-9 rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#9fcfc2]">Administrator</p><p className="mt-2 font-extrabold">{user.name}</p><p className="mt-1 truncate text-xs text-[#b8cbc6]">{user.email}</p></div>
        <nav className="mt-7 space-y-1.5" aria-label="Administration">{items.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${active ? 'bg-[#e8873d] text-white shadow-lg' : 'text-[#c9d8d4] hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5" />{label}</Link>; })}</nav>
        <div className="mt-auto space-y-2"><Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-[#c9d8d4] hover:bg-white/10 hover:text-white">View public site</Link><button onClick={() => signOut({ callbackUrl: '/' })} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-[#c9d8d4] hover:bg-white/10 hover:text-white"><ArrowRightStartOnRectangleIcon className="h-5 w-5" />Sign out</button></div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

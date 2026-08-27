'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Bars3Icon, BellIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import BrandMark from './BrandMark';

const publicLinks = [{ href: '/#issues', label: 'Explore issues' }, { href: '/#how-it-works', label: 'How it works' }];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hidden = pathname.startsWith('/admin');
  if (hidden) return null;

  const dashboardHref = session?.user?.role === 'admin' ? '/admin' : '/dashboard';
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#dce3df]/90 bg-[#f7f6f1]/90 backdrop-blur-xl">
      <div className="site-shell flex h-[72px] items-center justify-between gap-4">
        <BrandMark />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {publicLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm font-semibold text-[#526965] hover:text-[#0b6b58]">{link.label}</Link>)}
          {session && <Link href={dashboardHref} className="text-sm font-semibold text-[#526965] hover:text-[#0b6b58]">Dashboard</Link>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {status === 'loading' ? <div className="h-10 w-28 animate-pulse rounded-xl bg-[#e2e8e5]" /> : session ? (
            <>
              <Link href="/notifications" className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#d5dfdb] bg-white text-[#425b56]" aria-label="Notifications"><BellIcon className="h-5 w-5" /></Link>
              <Link href="/reports/new" className="button-primary focus-ring"><PlusIcon className="h-4 w-4" />Report issue</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="button-secondary focus-ring">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="button-secondary focus-ring">Sign in</Link>
              <Link href="/register" className="button-primary focus-ring">Create account</Link>
            </>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#d5dfdb] bg-white md:hidden" aria-label="Toggle menu" aria-expanded={open}>
          {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[#dce3df] bg-[#f7f6f1] md:hidden">
          <nav className="site-shell flex flex-col gap-2 py-4" aria-label="Mobile navigation">
            {publicLinks.map((link) => <Link key={link.href} href={link.href} onClick={close} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-white">{link.label}</Link>)}
            {session ? (
              <>
                <Link href={dashboardHref} onClick={close} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-white">Dashboard</Link>
                <Link href="/notifications" onClick={close} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-white">Notifications</Link>
                <Link href="/reports/new" onClick={close} className="button-primary mt-2">Report an issue</Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="button-secondary">Sign out</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2"><Link href="/login" onClick={close} className="button-secondary">Sign in</Link><Link href="/register" onClick={close} className="button-primary">Join Samvid</Link></div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LoginForm({ callbackUrl = '/dashboard' }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { ...form, redirect: false });
    if (result?.error) {
      setError('The email or password is incorrect.');
      setLoading(false);
      return;
    }
    const destination = callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : '/dashboard';
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      <label className="block"><span className="mb-2 block text-sm font-bold">Email address</span><input className="field" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
      <label className="block"><span className="mb-2 block text-sm font-bold">Password</span><input className="field" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" /></label>
      <button disabled={loading} className="button-primary focus-ring w-full py-3.5 disabled:opacity-60">{loading ? 'Signing in…' : <>Sign in securely <ArrowRightIcon className="h-4 w-4" /></>}</button>
      <p className="text-center text-sm text-[#627570]">New to Samvid? <Link href="/register" className="font-extrabold text-[#0b6b58] hover:underline">Create a citizen account</Link></p>
    </form>
  );
}

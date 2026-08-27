'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    if (form.password !== form.confirmPassword) return setFieldErrors({ confirmPassword: 'Passwords do not match.' });
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to create account.');
        setFieldErrors(result.details || {});
        return;
      }
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  const field = (name, label, type, placeholder, autoComplete) => (
    <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><input className="field" type={type} placeholder={placeholder} autoComplete={autoComplete} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required={name !== 'phone'} />{fieldErrors[name] && <span className="mt-1.5 block text-xs font-semibold text-rose-700">{fieldErrors[name]}</span>}</label>
  );

  return (
    <main className="site-shell grid min-h-[calc(100vh-72px)] items-center gap-10 py-10 lg:grid-cols-[.85fr_1.15fr]">
      <section className="hidden lg:block"><p className="eyebrow">Join your city network</p><h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-[-.05em]">Your voice becomes a trackable public action.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-[#627570]">Create one secure account to report issues, receive status notifications, and keep a history of every case you submit.</p><div className="mt-8 space-y-3">{['Submit location-based civic reports','Receive clear status notifications','Access your complete report history'].map((item) => <p key={item} className="flex items-center gap-3 font-bold"><CheckCircleIcon className="h-5 w-5 text-[#0b6b58]" />{item}</p>)}</div></section>
      <section className="surface p-6 sm:p-9"><p className="eyebrow">Citizen registration</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Create your account</h2><form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:col-span-2">{error}</div>}{field('name','Full name','text','Akash Shrivastav','name')}{field('email','Email address','email','you@example.com','email')}{field('phone','Phone (optional)','tel','+91 98765 43210','tel')}{field('password','Password','password','At least 8 characters','new-password')}{field('confirmPassword','Confirm password','password','Repeat your password','new-password')}<div className="sm:col-span-2"><button disabled={loading} className="button-primary w-full py-3.5 disabled:opacity-60">{loading ? 'Creating account…' : 'Create citizen account'}</button><p className="mt-4 text-center text-sm text-[#627570]">Already registered? <Link href="/login" className="font-extrabold text-[#0b6b58] hover:underline">Sign in</Link></p></div></form></section>
    </main>
  );
}

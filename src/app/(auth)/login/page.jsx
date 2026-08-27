import BrandMark from '@/components/BrandMark';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }) {
  const query = await searchParams;
  return (
    <main className="site-shell grid min-h-[calc(100vh-72px)] place-items-center py-10">
      <div className="surface grid w-full max-w-4xl overflow-hidden lg:grid-cols-[.9fr_1.1fr]">
        <aside className="dot-grid hidden bg-[#0b6b58] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="[&_span]:text-white"><BrandMark /></div>
          <div><p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#bee5d9]">Your civic workspace</p><h2 className="mt-4 text-4xl font-black leading-tight tracking-[-.04em]">Follow the work your report starts.</h2><p className="mt-4 leading-7 text-[#d9eee8]">Return to your dashboard, review updates, and keep every civic case in one place.</p></div>
          <p className="text-sm font-semibold text-[#bee5d9]">Clear reports · Visible progress · Better streets</p>
        </aside>
        <section className="p-6 sm:p-10 lg:p-12"><p className="eyebrow">Welcome back</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em]">Sign in to Samvid</h1><p className="mt-3 text-[#627570]">Use the account connected to your civic reports.</p><LoginForm callbackUrl={query?.callbackUrl || '/dashboard'} /></section>
      </div>
    </main>
  );
}

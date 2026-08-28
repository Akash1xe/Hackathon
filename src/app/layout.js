import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from './providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: { default: 'Samvid — City Action Network', template: '%s · Samvid' },
  description: 'Report local civic issues, track public action, and follow each case through resolution.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthProvider><Navbar />{children}</AuthProvider><Analytics /></body></html>;
}

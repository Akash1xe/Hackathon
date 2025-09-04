// File: c:\hackathon\src\app\layout.js
import { AuthProvider } from './providers';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Civic Issue Reporting Platform',
  description: 'Report and track local civic issues in your community',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
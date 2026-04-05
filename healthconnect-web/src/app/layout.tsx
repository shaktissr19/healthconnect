// src/app/layout.tsx — Root Layout
// ─────────────────────────────────────────────────────────────────────────────
// CHANGE: Added SessionTimeoutManager — auto-logout after 15min inactivity
//   Warning shown at 10min, hard logout at 15min, all pages, authenticated only
// ─────────────────────────────────────────────────────────────────────────────
import type { Metadata, Viewport } from 'next';
import { Poppins, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import SessionTimeoutManager from '@/components/SessionTimeoutManager';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400','500','600','700','800'],
  variable: '--font-heading',
  display: 'swap',
});
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400','500','600','700'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'HealthConnect India — Unified Healthcare Platform',
  description: "India's unified healthcare platform for patients, doctors, and hospitals.",
  keywords: 'healthcare, doctors, hospitals, telemedicine, India, health records',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HealthConnect India',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${nunito.variable}`}>
      <body>
        {/* Session timeout — 10min warning, 15min auto-logout, all pages */}
        <SessionTimeoutManager />

        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#182840',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-body)',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}

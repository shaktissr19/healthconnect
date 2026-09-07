// src/app/layout.tsx — Root Layout
import type { Metadata, Viewport } from 'next';
import './globals.css';
import './patient-platform-polish.css';
import { Toaster } from 'react-hot-toast';
import SessionTimeoutManager from '@/components/SessionTimeoutManager';
import AuthTransportBootstrap from '@/components/AuthTransportBootstrap';
import GlobalRoleBridge from '@/components/GlobalRoleBridge';

const SITE_URL = 'https://healthconnect.sbs';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#075B57',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HealthConnect India — Unified Healthcare Platform',
    template: '%s | HealthConnect India',
  },
  description: "India's connected healthcare platform for patients, doctors, hospitals, health communities and everyday health information.",
  applicationName: 'HealthConnect India',
  keywords: [
    'healthcare India',
    'find doctors',
    'find hospitals',
    'health records',
    'health communities',
    'appointments',
    'telemedicine',
    'patient health platform',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'HealthConnect India',
    title: 'HealthConnect India — Unified Healthcare Platform',
    description: 'Find care, organise your health journey, connect with health communities and stay informed — all in one HealthConnect experience.',
    images: [
      {
        url: '/images/hero-photo.png',
        alt: 'HealthConnect India healthcare platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealthConnect India — Unified Healthcare Platform',
    description: 'Connected healthcare for patients, doctors, hospitals and health communities in India.',
    images: ['/images/hero-photo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
    <html lang="en-IN">
      <body>
        <AuthTransportBootstrap />
        <GlobalRoleBridge />
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
            error: { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}

import type { MetadataRoute } from 'next';

const SITE_URL='https://healthconnect.sbs';

export default function robots():MetadataRoute.Robots{
  return {
    rules:[
      {
        userAgent:'*',
        allow:'/',
        disallow:[
          '/dashboard',
          '/dashboard/',
          '/doctor-dashboard',
          '/doctor-dashboard/',
          '/hospital-dashboard',
          '/hospital-dashboard/',
          '/admin-dashboard',
          '/admin-dashboard/',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap:`${SITE_URL}/sitemap.xml`,
    host:SITE_URL,
  };
}

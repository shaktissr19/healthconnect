import type { MetadataRoute } from 'next';

const SITE_URL='https://healthconnect.sbs';

export default function sitemap():MetadataRoute.Sitemap{
  const now=new Date();
  const routes=[
    {path:'/',priority:1,changeFrequency:'weekly' as const},
    {path:'/doctors',priority:.9,changeFrequency:'daily' as const},
    {path:'/hospitals',priority:.9,changeFrequency:'daily' as const},
    {path:'/communities',priority:.85,changeFrequency:'daily' as const},
    {path:'/learn',priority:.85,changeFrequency:'weekly' as const},
    {path:'/about',priority:.5,changeFrequency:'monthly' as const},
    {path:'/contact',priority:.4,changeFrequency:'monthly' as const},
    {path:'/privacy',priority:.3,changeFrequency:'yearly' as const},
    {path:'/terms',priority:.3,changeFrequency:'yearly' as const},
    {path:'/data-privacy',priority:.3,changeFrequency:'yearly' as const},
  ];

  return routes.map(route=>({
    url:`${SITE_URL}${route.path}`,
    lastModified:now,
    changeFrequency:route.changeFrequency,
    priority:route.priority,
  }));
}

// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Pages to exclude from the sitemap (noindex pages + utility routes)
const EXCLUDE = [
  'https://upcomingbrand.com/privacy-policy/',
  'https://upcomingbrand.com/terms-and-conditions/',
  'https://upcomingbrand.com/accessibility/',
  'https://upcomingbrand.com/careers/',
  'https://upcomingbrand.com/values/',
  'https://upcomingbrand.com/team/',
  'https://upcomingbrand.com/book-a-discovery-call/',
  'https://upcomingbrand.com/tools/',
  'https://upcomingbrand.com/thank-you/',
];

// Blog posts are noindex too (replaced by service/industry/location pages)
const BLOG_NOINDEX_RE = /^https:\/\/upcomingbrand\.com\/blog\/[^/]+\/?$/;

// https://astro.build/config
export default defineConfig({
  site: 'https://upcomingbrand.com',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => {
        if (EXCLUDE.includes(page)) return false;
        if (BLOG_NOINDEX_RE.test(page)) return false;
        return true;
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});

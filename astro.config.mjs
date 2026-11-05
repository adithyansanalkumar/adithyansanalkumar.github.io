import { defineConfig } from 'astro/config';

// SITE_URL is set by the GitHub Actions workflow (https://<owner>.github.io).
// It is only used for absolute URLs (canonical, Open Graph / LinkedIn preview).
export default defineConfig({
  site: process.env.SITE_URL || 'https://adithyansanalkumar.github.io',
  base: '/',
  trailingSlash: 'ignore',
});

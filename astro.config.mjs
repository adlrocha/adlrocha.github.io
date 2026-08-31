// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://adlrocha.com',
  output: 'static',
  // Dev server is reachable from other machines on the tailnet/LAN
  // (e.g. http://lily:8080) — allow those Host headers through Vite's check.
  server: {
    allowedHosts: ['lily', '.ts.net']
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});

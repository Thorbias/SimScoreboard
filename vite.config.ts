import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// The privacy promise (game files never leave the browser) is enforced with a
// Content-Security-Policy. GitHub Pages cannot set headers, so it goes into a
// meta tag. It is injected only into the build: the dev server needs inline
// scripts and a websocket for hot reload.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig({
  // Relative base: the site is served from a sub-path on GitHub Pages.
  base: './',
  plugins: [react(), contentSecurityPolicy()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

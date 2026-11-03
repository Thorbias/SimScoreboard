import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// The privacy promise (game files never leave the browser) is enforced with a
// Content-Security-Policy. GitHub Pages cannot set headers, so it goes into a
// meta tag. It is injected only into the build: the dev server needs inline
// scripts and a websocket for hot reload.
// Scripts stay limited to the site itself. Only a site that is set up for Google
// Drive (ADR-0009) also admits Google's sign-in script.
const buildCsp = (drive: boolean) =>
  [
    "default-src 'self'",
    drive
      ? "script-src 'self' https://accounts.google.com"
      : "script-src 'self'",
    drive
      ? "style-src 'self' 'unsafe-inline' https://accounts.google.com"
      : "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    // https: lets a league be loaded from an address (ADR-0009).
    "connect-src 'self' https:",
    drive ? 'frame-src https://accounts.google.com' : "frame-src 'none'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');

const contentSecurityPolicy = (csp: string): Plugin => ({
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const drive = Boolean(env.VITE_GOOGLE_CLIENT_ID && env.VITE_GOOGLE_API_KEY);
  return {
    // Relative base: the site is served from a sub-path on GitHub Pages.
    base: './',
    plugins: [react(), contentSecurityPolicy(buildCsp(drive))],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Basic service worker registration for offline support
// Service worker: register only in production. In development, unregister
// any existing workers to avoid stale cached story files.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // During development, remove any existing service workers so the
      // dev server always serves the latest files.
      if (import.meta.env.DEV) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        return;
      }

      // Only register the service worker in production builds.
      if (import.meta.env.PROD) {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.warn('Service worker registration failed:', err));
      }
    } catch (err) {
      console.warn('Service worker handling failed:', err);
    }
  });
}

import { defineConfig } from 'vite';

export default defineConfig({
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    // Quick Tunnel forwards the public hostname to the local preview server.
    allowedHosts: ['.trycloudflare.com'],
  },
});

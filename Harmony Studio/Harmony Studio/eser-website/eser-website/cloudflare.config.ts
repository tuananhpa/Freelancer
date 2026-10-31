import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
  accountId: '70e2d94c24874f1ce5ea0a85777b52a2',
  worker: {
    name: 'eser-demo',
    entrypoint: './worker.mjs',
    compatibilityDate: '2026-10-16',
    assets: { runWorkerFirst: ['/', '/index.html', '/api/*', '/uploads/*'] },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ id: 'd026c4de-6e45-4e23-a7f5-1e8f7f730ef6', name: 'eser-demo' }),
    },
  },
});

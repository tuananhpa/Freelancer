import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vite dùng BASE_URL cho đường dẫn ứng dụng; contract test dùng nó cho địa chỉ API.
    env: { BASE_URL: process.env.BASE_URL || 'http://localhost:8787' },
    // Mọi file gọi chung một wrangler dev → chạy lần lượt cho khỏi quá tải/timeout
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

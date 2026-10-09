import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hytalesVideoPlugin } from "./scripts/hytales-video-plugin";
export default defineConfig({
  plugins: [react(), hytalesVideoPlugin()],
  server: { port: 5173 },
  preview: {
    port: 4173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
  build: { target: "es2022" },
});

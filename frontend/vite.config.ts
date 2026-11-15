import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT ?? 8443),
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:8765",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT ?? 8443),
  },
});

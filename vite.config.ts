import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": { target: "http://localhost:3000", changeOrigin: true },
      "/calculate": { target: "http://localhost:3000", changeOrigin: true },
      "/calculations/run": { target: "http://localhost:3000", changeOrigin: true },
      "/cases": { target: "http://localhost:3000", changeOrigin: true },
      "/report": { target: "http://localhost:3000", changeOrigin: true },
      "/validate": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});

import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

function stripOrigin(proxy: Parameters<NonNullable<ProxyOptions["configure"]>>[0]) {
  proxy.on("proxyReq", (proxyReq) => {
    proxyReq.removeHeader("origin");
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/auth": { target: "http://localhost:3000", changeOrigin: true, configure: stripOrigin },
      "/calculations": { target: "http://localhost:3000", changeOrigin: true, configure: stripOrigin },
      "/cases": { target: "http://localhost:3000", changeOrigin: true, configure: stripOrigin },
      "/calculate": { target: "http://localhost:3000", changeOrigin: true, configure: stripOrigin },
      "/report": { target: "http://localhost:3000", changeOrigin: true, configure: stripOrigin },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@generated": path.resolve(import.meta.dirname, "./src/generated"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://api:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});

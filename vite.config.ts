import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ── Production build hardening ────────────────────────────────────────────
  build: {
    // Never emit source maps in production — keeps JS unreadable in DevTools
    sourcemap: false,
    rollupOptions: {
      output: {
        // Hash-only filenames → route names like "kundli", "admin", "auth"
        // no longer appear as readable chunk names in DevTools Sources panel
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash][extname]",
        manualChunks(id: string) {

          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) {
            return "vendor";
          }
        },
      },
    },
  },


  server: {
    proxy: {
      "/api": {
        target: "http://13.60.205.210:8000",
        changeOrigin: true,
      },
    },
  },
});

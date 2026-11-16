import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/ — set VITE_BASE=/ulduz/ there; "/" everywhere else.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": r("./supabase/functions/_shared"),
      "@": r("./src"),
      // Edge functions (Deno) import npm packages with the npm: specifier; map it for the browser build.
      "npm:astronomy-engine@2.1.19": "astronomy-engine",
    },
  },
  test: { environment: "node" },
  build: { chunkSizeWarningLimit: 700 },
});

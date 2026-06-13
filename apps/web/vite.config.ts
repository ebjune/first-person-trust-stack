import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@fpndtg/brand-config": path.resolve(
        __dirname,
        "../../packages/brand-config/src/index.ts",
      ),
      "@fpndtg/adapters-vti": path.resolve(
        __dirname,
        "../../packages/adapters-vti/src/index.ts",
      ),
    },
  },
});

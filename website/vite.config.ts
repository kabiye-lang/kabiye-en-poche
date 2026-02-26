import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [basicSsl(), react({
    babel: {
      plugins: ["babel-plugin-react-compiler"],
    },
  }), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // port: 3000,
  },
  build: {
    outDir: "dist",
  },
});
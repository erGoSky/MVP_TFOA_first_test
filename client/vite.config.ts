import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: "info",
  server: {
    proxy: {
      "/state": "http://localhost:3000",
      "/simulation": "http://localhost:3000",
      "/save": "http://localhost:3000",
      "/load": "http://localhost:3000",
      "/saves": "http://localhost:3000",
      "/world": "http://localhost:3000",
      "/entity": "http://localhost:3000",
    },
  },
});

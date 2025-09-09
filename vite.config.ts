import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Baca config dari stagewise.json
let stagewiseConfig = { appPort: 8080 };
try {
  const raw = fs.readFileSync(path.resolve(__dirname, "stagewise.json"), "utf-8");
  stagewiseConfig = JSON.parse(raw);
} catch (e) {
  // fallback ke default jika gagal
}
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: stagewiseConfig.appPort || 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

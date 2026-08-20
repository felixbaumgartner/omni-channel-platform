import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Booking Pages serves artifacts under /{owner}/{name}/, where Vite's default
// absolute "/assets/..." would resolve to the host root. BPAGES_BASE pins the
// exact prefix instead of using "./", because a relative base only resolves
// correctly while the document URL keeps its trailing slash.
export default defineConfig({
  plugins: [react()],
  base: process.env.BPAGES_BASE || "/",
  server: { port: 5182 },
});

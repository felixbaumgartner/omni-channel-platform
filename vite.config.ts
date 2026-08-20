import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BPAGES=1 emits relative asset paths ("./assets/...") so the bundle works when
// served from a subpath. Booking Pages serves artifacts under /{owner}/{name}/,
// where the default absolute "/assets/..." would resolve to the host root.
export default defineConfig({
  plugins: [react()],
  base: process.env.BPAGES ? "./" : "/",
  server: { port: 5182 },
});

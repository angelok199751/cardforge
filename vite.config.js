import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Relative base so the built app works when hosted at a sub-path
// (e.g. https://username.github.io/cardforge/) as well as at a domain root
// (Vercel, Netlify). No server, no API routes — fully static output in /dist.
export default defineConfig({
    plugins: [react()],
    base: "./",
    build: {
        outDir: "dist",
    },
});

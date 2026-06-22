import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "PhysioFlow — Practice Management",
        short_name: "PhysioFlow",
        description:
          "Manage availability, bookings, patient records, sessions, exercise plans and payments from one place.",
        theme_color: "#0f766e",
        background_color: "#f0fdfa",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Pull our push / notification-click handlers into the generated SW.
        importScripts: ["push-sw.js"],
      },
      // Register the service worker in dev too, so notifications can be tested
      // with `npm run dev` (not just a production build).
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
});

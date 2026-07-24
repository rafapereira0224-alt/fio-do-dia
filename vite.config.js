import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/fio-do-dia/", // Essencial para o GitHub Pages reconhecer os caminhos
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "masked-icon.svg",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: {
        name: "Fio do Dia",
        short_name: "FioDoDia",
        description: "Caderno de produção diária para costura",
        theme_color: "#f4efe6",
        background_color: "#f4efe6",
        display: "standalone",
        start_url: "/fio-do-dia/",
        scope: "/fio-do-dia/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});

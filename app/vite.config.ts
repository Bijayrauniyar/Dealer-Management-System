import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import {
  BRAND_HTML_TITLE,
  BRAND_THEME_COLOR,
  PWA_DESCRIPTION,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_SHORT_NAME,
} from "./vite.brand";

function injectBrandIntoHtml(): Plugin {
  return {
    name: "inject-brand-html",
    transformIndexHtml(html) {
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${BRAND_HTML_TITLE}</title>`)
        .replace(
          /name="theme-color" content="[^"]*"/,
          `name="theme-color" content="${BRAND_THEME_COLOR}"`,
        );
    },
  };
}

export default defineConfig({
  plugins: [
    injectBrandIntoHtml(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: PRODUCT_DISPLAY_NAME,
        short_name: PRODUCT_SHORT_NAME,
        description: PWA_DESCRIPTION,
        theme_color: BRAND_THEME_COLOR,
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

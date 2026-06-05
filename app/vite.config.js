import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { BRAND_HTML_TITLE, BRAND_THEME_COLOR, PWA_DESCRIPTION, PRODUCT_DISPLAY_NAME, PRODUCT_SHORT_NAME, } from "./vite.brand";
function injectBrandIntoHtml() {
    return {
        name: "inject-brand-html",
        transformIndexHtml: function (html) {
            return html
                .replace(/<title>[^<]*<\/title>/, "<title>".concat(BRAND_HTML_TITLE, "</title>"))
                .replace(/name="theme-color" content="[^"]*"/, "name=\"theme-color\" content=\"".concat(BRAND_THEME_COLOR, "\""));
        },
    };
}
export default defineConfig({
    plugins: [
        injectBrandIntoHtml(),
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icons/icon.png", "icons/icon-192.png"],
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
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon.png",
                        sizes: "512x512",
                        type: "image/png",
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

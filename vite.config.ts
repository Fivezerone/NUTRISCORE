import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Resolve the legacy figma:asset/* import scheme from the original Make export.
function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/shared/assets", filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [figmaAssetResolver(), react(), tailwindcss()],

  assetsInclude: ["**/*.svg", "**/*.csv"],

  build: {
    // Write directly to /dist — Chrome loads the extension from here.
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        // ── Three browser-UI entry points ──────────────────────────────────
        // Each gets its own HTML shell + JS bundle so Chrome can load them
        // as independent extension pages.
        popup:     path.resolve(__dirname, "src/popup/index.html"),
        dashboard: path.resolve(__dirname, "src/dashboard/index.html"),

        // ── Content script ─────────────────────────────────────────────────
        // NOT an HTML entry — this is a plain JS bundle injected into Jumia
        // pages by the browser. It carries React (tree-shaken) and the badge
        // component, but no full-page shell.
        "content-script/index": path.resolve(
          __dirname,
          "src/content-script/index.tsx"
        ),

        // ── Background service worker ──────────────────────────────────────
        "background/service-worker": path.resolve(
          __dirname,
          "src/background/service-worker.ts"
        ),
      },

      output: {
        // Keep filenames predictable so manifest.json can reference them
        // without needing runtime hash-to-filename lookups.
        entryFileNames: (chunk) => {
          // HTML-entry JS gets the same flat name Vite would normally assign.
          // SW and content-script get their exact manifest paths.
          if (
            chunk.name === "background/service-worker" ||
            chunk.name === "content-script/index"
          ) {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        // Widget CSS is extracted as a named chunk so the Shadow DOM can
        // reference it via chrome.runtime.getURL("assets/widget.css").
        assetFileNames: (asset) => {
          if (asset.name?.endsWith(".css")) return "assets/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  // Allow popup and dashboard HTML to be served from their own subdirectory
  // in dev mode without referencing the root.
  root: "src",
  publicDir: path.resolve(__dirname, "public"),
});

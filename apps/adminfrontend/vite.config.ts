import corePackage from "../../packages/energy-core/package.json" with { type: "json" };
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import path from "path";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string;
  dependencies: Record<string, string>;
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    __FRONTEND_VERSION__: JSON.stringify(pkg.version),
    __CORE_VERSION__: JSON.stringify(
      corePackage.version,
    ),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeToken: "layout",
      indexToken: "page",
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

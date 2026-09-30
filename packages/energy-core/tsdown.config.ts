import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts", "src/generator.ts", "src/bin/generate-det-building-energy-profile.ts"],
    outDir: "dist",
    publint: true,
    platform: "neutral",
    exports: false,
    sourcemap: true,
    deps: {
        neverBundle: [],
    },
    format: {
        esm: {
            target: ["es2015"]
        },
        cjs: {
            target: ["node20"]
        }
    }
});

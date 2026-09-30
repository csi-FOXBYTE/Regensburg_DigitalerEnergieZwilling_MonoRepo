import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { resolve } from "node:path";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/root-path": resolve(import.meta.dirname),
      "boundaries/elements": [
        { type: "components", pattern: "**/components/**" },
        { type: "hooks", pattern: "**/hooks/**" },
        { type: "lib", pattern: "**/lib/**" },
        { type: "features", pattern: "**/features/**" },
        { type: "routes", pattern: "**/routes/**" },
      ],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: ["components", "hooks", "lib"], disallow: ["features"] },
            {
              from: ["components", "hooks", "lib", "features", "routes"],
              disallow: ["routes"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.gen.*"],
    rules: {
      "boundaries/element-types": "off",
    },
  },
]);

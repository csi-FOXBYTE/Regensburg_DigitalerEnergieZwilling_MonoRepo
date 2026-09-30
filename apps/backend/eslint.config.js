import oxlint from "eslint-plugin-oxlint";
import eslint from "@eslint/js";

export default [
  {
    ignores: [
      ".build/**",
      ".dev/**",
      ".dist/**",
      "build/**",
      "src/@internals/**",
    ],
  },
  {
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  eslint.configs.recommended,
  ...oxlint.configs["flat/all"],
];

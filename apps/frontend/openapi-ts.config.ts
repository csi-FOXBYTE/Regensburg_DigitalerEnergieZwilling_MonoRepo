import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:5000/docs/json",
  output: "src/api",
  plugins: ["@tanstack/react-query"],
});

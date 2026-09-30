import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: process.env.OPENAPI_URL ?? "http://apisix:9080/docs/json",
    output: {
      target: "./src/api/api.gen.ts",
      client: "fetch",
      mode: "single",
      clean: true,
      prettier: true,
      baseUrl: "",
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "src/lib/apiClient.ts",
          name: "apiClient",
        },
      },
    },
  },
});

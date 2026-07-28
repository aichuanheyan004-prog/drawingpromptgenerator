import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  }
});

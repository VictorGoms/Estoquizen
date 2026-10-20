import { defineConfig } from "vitest/config";
import path from "node:path";

/* Testes das regras puras de src/lib (npm test). O atalho "@/" é o mesmo do tsconfig. */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    include: [
      "src/tests/**/*.test.ts",
    ],

    globalSetup: [
        "./src/tests/setup/global.mts",
      ],

    setupFiles: [
      "./src/tests/setup/database.ts",
    ],

    /*
     * Os testes compartilham uma única instância
     * do MongoDB em memória.
     */
    fileParallelism: false,

    testTimeout: 30_000,
    hookTimeout: 120_000,
    teardownTimeout: 30_000,

    clearMocks: true,
    restoreMocks: true,

    env: {
      NODE_ENV: "test",

      JWT_SECRET:
        "radaraprende-test-secret-with-more-than-32-characters",

      JWT_EXPIRES_IN: "1d",

      /*
       * Valor de segurança para módulos que validam
       * as variáveis antes do setup do banco.
       */
      MONGODB_URI:
        "mongodb://127.0.0.1:27017/radaraprende-test",
    },

    coverage: {
      provider: "v8",

      reporter: [
        "text",
        "text-summary",
        "html",
        "json",
      ],

      reportsDirectory: "./coverage",

      include: [
        "src/**/*.ts",
      ],

      exclude: [
        "src/tests/**",
        "src/database/seeds/**",
        "src/server.ts",
      ],
    },
  },
});
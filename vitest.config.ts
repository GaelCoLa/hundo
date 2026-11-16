// Configuración de Vitest: el corredor de pruebas unitarias.
// Probamos lógica pura (escala, validaciones), así que alcanza con entorno "node".
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

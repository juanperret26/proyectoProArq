import { defineConfig } from "@playwright/test";

const PORT = 3000;

/**
 * Pruebas de punta a punta de los flujos públicos. Usan el Chrome instalado
 * (no descargan navegadores) y reutilizan el servidor de desarrollo si ya corre.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // El servidor de desarrollo compila cada página la primera vez: pocos trabajadores y esperas más largas.
  workers: 2,
  retries: 1,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

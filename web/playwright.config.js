import { defineConfig } from "@playwright/test";
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL,
    headless: true,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [{ name: "v8wb_workspace_tour", value: "done" }],
        },
      ],
    },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1050 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  reporter: "list",
});

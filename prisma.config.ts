import "dotenv/config";
import { defineConfig } from "prisma/config";

// Load .env.local for local development (overrides .env)
import { config } from "dotenv";
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});

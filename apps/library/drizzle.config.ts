import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite", // "mysql" | "sqlite" | "postgresql"
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./sqlite.db",
  },
});

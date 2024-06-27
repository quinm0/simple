import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey(),
  title: text("name"),
  releaseYear: integer("release_year"),
});

export type MovieInsert = typeof movies.$inferInsert;
export type MovieSelect = typeof movies.$inferSelect;

export const mediaDirectories = sqliteTable("media_directories", {
  id: integer("id").primaryKey(),
  path: text("path"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
  lastScannedAt: integer("last_scanned_at"),
  scanFrequency: integer("scan_frequency"),
});

export type MediaDirectoryInsert = typeof mediaDirectories.$inferInsert;
export type MediaDirectorySelect = typeof mediaDirectories.$inferSelect;

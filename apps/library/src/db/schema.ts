import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey(),
  title: text("name"),
  releaseYear: integer("release_year"),
});

export type MovieInsert = typeof movies.$inferInsert;
export type MovieSelect = typeof movies.$inferSelect;
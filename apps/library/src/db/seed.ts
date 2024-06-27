import { sql } from 'drizzle-orm';
import { db } from "./db";
import * as schema from "./schema";

const devMovies: schema.MovieInsert[] = [
  {
    id: 1,
    title: "The Matrix",
    releaseYear: 1999,
  },
  {
    id: 2,
    title: "The Matrix Reloaded",
    releaseYear: 2003,
  },
  {
    id: 3,
    title: "The Matrix Revolutions",
    releaseYear: 2003,
  },
  {
    id: 4,
    title: "Nemo",
    releaseYear: 2003,
  },
]

await db.insert(schema.movies).values(devMovies).onConflictDoUpdate({
  target: [schema.movies.id],
  set: {
    title: sql`excluded.name`,
    releaseYear: sql`excluded.release_year`
  },
});

console.log(`Seeding complete.`);
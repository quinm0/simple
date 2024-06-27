import type { ListMediaDirectoriesJob, ListMediaDirectoriesJobResult } from 'types';
import { db } from '../db/db';
import type { HandlerFunction } from 'jobmanager';
import { mediaDirectories } from '../db/schema';

export const listMediaDirectoriesHandler: HandlerFunction<ListMediaDirectoriesJob, ListMediaDirectoriesJobResult> = async (job) => {
  const result = await db.select().from(mediaDirectories);
  const directories = result.map(directory => ({
    id: directory.id,
    path: directory.path || '',
  }));
  return {
    directories,
  };
};
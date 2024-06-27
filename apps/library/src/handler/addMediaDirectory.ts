import { Job } from 'bullmq';
import { type AddMediaDirectoryJob, type AddMediaDirectoryJobResult } from 'types';
import { stat } from 'fs/promises';
import type { HandlerFunction } from 'jobmanager';
import { db } from '../db/db';
import { mediaDirectories } from '../db/schema';
import { eq } from 'drizzle-orm';

export const addMediaDirectoryHandler: HandlerFunction<AddMediaDirectoryJob, AddMediaDirectoryJobResult> = async (job: Job<AddMediaDirectoryJob>) => {

  // check if path is already in the database
  const existingDirectory = await db.select().from(mediaDirectories).where(eq(mediaDirectories.path, job.data.path));
  if (existingDirectory) {
    return {
      success: true,
      directoryId: existingDirectory[0].id,
    };
  }

  // check if path is a directory
  const isDirectory = (await stat(job.data.path)).isDirectory();
  if (!isDirectory) {
    return {
      success: false,
      error: 'Path is not a directory',
    };
  }

  // insert the path into the database
  await db.insert(mediaDirectories).values({
    path: job.data.path,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastScannedAt: -1,
    scanFrequency: -1,
  });

  const newDirectory = await db.select().from(mediaDirectories).where(eq(mediaDirectories.path, job.data.path));

  return {
    success: true,
    directoryId: newDirectory[0].id,
  };
};

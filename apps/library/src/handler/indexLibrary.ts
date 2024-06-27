import { Job } from 'bullmq';
import { type IndexLibraryJob, type LibraryJobResult } from 'types';
import { readdir } from 'fs/promises';
import { runtime } from '..';
import type { Handler } from 'jobruntime';

export const indexLibraryHandler: Handler<IndexLibraryJob, LibraryJobResult> = async (job: Job<IndexLibraryJob>) => {
  console.log(`Indexing library at path: ${job.data.directoryPath}`);
  
  // Introduce a random failure 1/5 times
  if (Math.random() < 0.2) {
    throw new Error('Random failure occurred while indexing the library');
  }

  const files = await readdir(job.data.directoryPath);
  console.log(`Found ${files.length} files in the directory`);
  
};

export async function addIndexLibraryJob(directoryPath: string) {
  await runtime.fireJob({
    type: 'index',
    directoryPath,
  });
}
